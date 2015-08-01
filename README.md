数据库

    CREATE DATABASE `webstat` DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci;

    CREATE TABLE `event_stats` (
    `appid` int(11) NOT NULL default '0',
    `name` varchar(32) NOT NULL default '',
    `total` int(11) NOT NULL default '0',
    `count` int(11) NOT NULL default '0',
    `created_at` datetime default NULL,
    PRIMARY KEY (`created_at`),
    KEY event_stats_appid(`appid`)
    );

    insert into event_stats(appid, name, total, count, created_at) values(0, 'button_click', 1, 1, now());

时间归一化成5分钟粒度
    
    x = 18
    x - (x % 5) // 15
    x = 14
    x - (x % 5) // 10
    



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

- 统计云服务：https://mixpanel.com/help/reference/javascript
