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


测试环境启动：

    supervisor app.js

正式环境运行：

    export NODE_ENV=production
    forever start app.js


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


使用express路由

    app.get('/add_event/:appid([0-9]+)/:name([0-9a-zA-Z_-]+)/:value([0-9]+)', function(req, res){                                            
    curl localhost:1337/add_event/100/btn_click/100

nginx配置

    server {
        listen       80;
        server_name  webstat.ihuhao.com;

        location / {
            proxy_pass   http://127.0.0.1:8004;
            proxy_set_header    Host             $host;
            proxy_set_header    X-Real-IP        $remote_addr;
            proxy_set_header    X-Forwarded-For  $proxy_add_x_forwarded_for;
        }


        location /static/ {
            alias /root/src/webstat/src/static/;
            expires 1h;
        }
    }


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
- 进程管理：https://github.com/petruisfan/node-supervisor https://github.com/foreverjs/forever  https://github.com/Unitech/PM2
- jshint vim: https://github.com/Shutnik/jshint2.vim

- 统计云服务：https://mixpanel.com/help/reference/javascript

### require
async moment config winston mocha express

### 新表结构

    events
        - app_id
        - distinct_id 
        - event_name
        - created_on
        - properties // json, key: value

    event_names:
        - app_id
        - event_name

    properties
        - app_id
        - event_name
        - property_name

    property_values
        - app_id
        - event_name
        - property_name
        - value

示例：

    获取某时段某事件的次数
    select count(*) from events where app_id = ? and created_on >= ? 
        and created_on <= ?

    获取某时段某事件的人数 
    select count(distinct(distinct_id)) from events where app_id = ? 
        and created_on >= ? and created_on <= ?

    获得不同城市的访客3月份的下载量
    events = select properties from events where app_id = ? 
        and created_on >= ? and created_on <= ?
    
    cities = defaultdict(int)
    for event in events:
        if 'city' in  event.properties:
            city = event.properties['city']
            cities[city] += 1

    return cities 

    获得不同城市的访客3月份里每天的下载量
    // not imp

    获得访客3月份下载资源消耗的总积分
    events = select properties from events where app_id = ? 
        and created_on >= ? and created_on <= ?
    
    type = 'sum'
    metrics = 'score' 
    ret = 0

    for event in events:
        if metrics in  event.properties and isdigit(event.properties[metrics]):
            value = int(event.properties[metrics])
            ret += value

    return ret

    获得北、上、广、深的用户3月份的总计下载量
     events = select properties from events where app_id = ? 
        and created_on >= ? and created_on <= ?
   
    where = "city in ('a', 'a', 'c')
    ret = 0

    for event in events:
        if 'city' in  event.properties:
            city = event.properties['city']
            if city in (a, b, c):
                ret += 1

    return ret


    获取某app_id的事件列表
    select event_name from event_names where app_id = ?

    获取某app_id某事件的属性列表
    select property_name from properties where app_id = ? and event_name = ?

    获取某app_id某事件的某属性的值列表 
    select value from property_values where app_id = ? and event_name = ? and 
        property_name = ?

    收集事件
    app_id, event_name, properties, created_on = inputs()

    if not exists_event_name(app_id, event_name):
        add_event_name(app_id, event_name)

    for key, value in properties:
        if not exists_property(app_id, event_name, key):
            add_property_name(app_id, event_name, key)
        if not exists_property_value(app_id, event_name, key, value):
            add_property_value(app_id, event_name, key, value)

    add_event(app_id, event_name, properties, created_on)

### 参考项目
测试，覆盖率
https://github.com/expressjs/cookie-parser
mocha --reporter spec --bail --check-leaks test/

== todo
- 防止单IP请求量过大
- 防止单请求返回过大数据
- 存储层单点
- 计算单元如何利用多核
