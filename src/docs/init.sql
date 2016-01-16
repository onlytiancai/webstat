CREATE DATABASE `webstat` DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci;

CREATE TABLE `events` (
    `id` int(11) NOT NULL auto_increment,
    `app_id` varchar(64) NOT NULL,
    `user_id` varchar(64) NOT NULL,
    `event_name` varchar(64) NOT NULL,
    `event_value` varchar(64) NOT NULL default '',
    `properties` text,
    `event_time` datetime default NULL,
    PRIMARY KEY (`id`),
    KEY (`app_id`),
    KEY (`user_id`),
    KEY (`event_name`),
    KEY (`event_time`)
);
