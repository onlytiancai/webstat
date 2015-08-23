数据库

    CREATE DATABASE `webstat` DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci;

    CREATE TABLE `event_stats` (
    `appid` int(11) NOT NULL default '0',
    `name` varchar(32) NOT NULL default '',
    `total` int(11) NOT NULL default '0',
    `count` int(11) NOT NULL default '0',
    `created_at` datetime default NULL,
    PRIMARY KEY (`created_at`,`appid`)
    );

    insert into event_stats(appid, name, total, count, created_at)
    values(0, 'button_click', 1, 1, now())
    on duplicate key update total=total+1, count=count+1;

时间归一化成5分钟粒度
    
    x = 18
    x - (x % 5) // 15
    x = 14
    x - (x % 5) // 10
    
容量预估

假设有1000个用户，每个用户200个指标，5分钟粒度保留1天，1小时粒度保留30天，1天粒度保留3年

1分钟粒度：(60 / 5) * 24 * 200 * 1000 = 5.74亿
1小时粒度：24 * 30 * 200 * 1000 = 1.44亿
1天粒度：365 * 3 * 200 * 1000 = 2.19亿 
共：5.74 + 1.44 + 2.19 = 9.37亿 

如果一条记录100字节(名称32，日期8，appid 4，值4，次数4)，约需93G磁盘存储

设置环境

    export NODE_ENV=production

redis队列设计

key `webstat:events`为一个list，item格式是`appid/name/created_at/value`, 
web应用处理用户请求，用户请求来了直接向`webstat:events`里lpush数据，
然后有个独立的worker进程，不断去`webstat:events`里rpop数据，每100条数据一批，
合并相同的"appid,name,created_at"的value，然后写库, 如果rpop数据为空，
则sleep 10秒。

如果worker取出100条数据后，自己挂了，那么丢100条数据，不管了。

    LPUSH webstat:events "0/btn_click/2015-01-01/15"
    LPUSH webstat:events "0/btn_click/2015-01-01/15"
    LRANGE webstat:events 1 10


### 产品借鉴

mixpanel: profile, event, notification

### 相关链接

- 格式化JS的node模块：https://www.npmjs.com/package/js-beautify
- 格式化JS的VIM插件： https://github.com/maksimr/vim-jsbeautify
- 日志模块：https://github.com/winstonjs/winston
- 配置模块: https://www.npmjs.com/package/config
- 时间模块：http://momentjs.cn/
- 单元测试入门：https://cnodejs.org/topic/516526766d38277306c7d277
- mysql upsert: http://stackoverflow.com/questions/4205181/insert-into-a-mysql-table-or-update-if-exists 
- 用Nodejs连接MySQL: http://blog.fens.me/nodejs-mysql-intro/

- 统计云服务：https://mixpanel.com/help/reference/javascript
