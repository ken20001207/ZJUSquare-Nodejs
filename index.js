var mysql = require('mysql');

var conn = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '123456',
    database: 'zju'
});

conn.connect(function (err) {
    if (err) {
        console.log("\x1b[31m%s\x1b[0m", '[严重] 数据库连线失败，请检查配置');
        console.log("\x1b[31m%s\x1b[0m", '[严重] 错误内容：' + err.message);
        console.log("\x1b[31m%s\x1b[0m", '[严重] 服务器初始化失败，即将关闭 ...');
        server.close();
    } else
        console.log("\x1b[32m%s\x1b[0m", '[信息] 数据库连线成功。');

});

// 引入 express 套件
var express = require("express");
var app = express();

var bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// 引入 session 模块
var session = require('express-session');
var cookieParser = require('cookie-parser');

app.use(cookieParser());

var MemoryStore = session.MemoryStore;
app.use(session({
    name: 'app.sid',
    secret: "1234567890QWERTY",
    resave: true,
    store: new MemoryStore(),
    saveUninitialized: true
}));

// 信息接口
app.post('/getdata', function (req, res) {

    conn.query("SELECT * FROM `users` WHERE `id`='" + req.body.id + "';", function (err, result) {

        if (err) {
            res.write("资料库连线失败");
            res.end();
        } else if (result.length == 0) {
            res.write("请重新登入");
            res.end();
        } else {
            if (req.body.data == "user_name")
                res.write(result[0].name);
            if (req.body.data == "gender")
                res.write(result[0].gender);
            if (req.body.data == "schoolnumber")
                res.write(result[0].schoolnumber);
            if (req.body.data == "id")
                res.write(result[0].id);
            if (req.body.data == "email")
                res.write(result[0].email);
            if (req.body.data == "pwd")
                res.write(result[0].pwd);
            if (req.body.data == "pwd_md5")
                res.write(result[0].pwd_md5);
            res.end();
        }
    });

});

// 登录接口
app.post('/login', function (req, res) {

    conn.query("SELECT * FROM `users` WHERE `id`='" + req.body.id + "' AND `pwd_md5`='" + req.body.pwd_md5 + "';", function (err, result) {

        if (err) {
            res.write("0:dbconnecterror");
            res.end();
        } else if (result.length == 0) {
            res.write("0:nouserfound");
            res.end();
        } else {

            conn.query("SELECT * FROM `users` WHERE `id`='" + req.body.id + "';", function (err, result) {

                if (err)
                    console.log("\x1b[31m", '[严重] 自数据库获取使用者资料数据时发生未预期的错误');


                res.write(req.body.id);
                req.session.user = req.body.id;
                req.session.user_name = result[0].name;
                req.session.schoolnumber = result[0].schoolnumber;
                req.session.gender = result[0].gender;
                req.session.email = result[0].email;
                req.session.pwd = result[0].pwd;
                req.session.pwd_md5 = result[0].pwd_md5;
                req.session.user_id = result[0].id;
                res.end();

            });
        }
    });
});

// 登出接口
app.post('/logout', function (req, res) {
    console.log("\x1b[33m%s\x1b[0m", "[信息] 使用者 " + req.session.user_name + "（" + req.session.user_id + "） 登出了聊天广场服务");
    req.session.destroy();
    res.write("1");
    res.end();
});


app.set('view engine', 'ejs');

// 取得聊天记录
app.post('/getchat', function (req, res) {
    conn.query("SELECT * FROM `message` WHERE `channel`='" + req.body.channel + "' ORDER BY `time`;", function (err, result) {

        if (err)
            console.log("\x1b[31m%s\x1b[0m", '[严重] 自资料库取得聊天记录时发生未预期的错误');

        Object.keys(result).forEach(function (key) {
            var row = result[key];
            res.write("<div style=\"margin-left: 30px\"><p style=\"padding:5px 15px 5px 15px;display: inline-block; background-color:white; border-radius:20px; max-width: 60%\"><a style=\"font-size:6px; color:gray\">" + row.name + " - " + row.time + " </a> <br> " + row.msg + "</p></div>");
        });
        res.end();
    });
});

// 取得聊天室列表
app.post('/getchannellist', function (req, res) {
    conn.query("SELECT DISTINCT `channel` FROM `message`", function (err, result) {

        if (err)
            console.log("\x1b[31m%s\x1b[0m", '[严重] 自资料库取得聊天频道列表时发生未预期的错误');


        if (req.body.channel == "聊天大广场") {
            res.write("<tr><td><h3 id=\"聊天大广场\" onclick=\"changechannel('聊天大广场')\" style=\"margin: 20px; font-size: 20px; cursor: pointer;color:brown;\">聊天大广场</h3></td></tr>");
        } else {
            res.write("<tr><td><h3 id=\"聊天大广场\" onclick=\"changechannel('聊天大广场')\" style=\"margin: 20px; font-size: 20px; cursor: pointer;\">聊天大广场</h3></td></tr>");
        }

        Object.keys(result).forEach(function (key) {
            var row = result[key];
            if (row.channel != "聊天大广场") {
                if (row.channel == req.body.channel) {
                    res.write("<tr><td><h3 id=\"" + row.channel + "\" onclick=\"changechannel('" + row.channel + "')\" style=\"margin: 20px; font-size: 20px; color:brown; cursor: pointer;\">" + row.channel + "</h3></td></tr>");
                } else {
                    res.write("<tr><td><h3 id=\"" + row.channel + "\" onclick=\"changechannel('" + row.channel + "')\" style=\"margin: 20px; font-size: 20px; cursor: pointer;\">" + row.channel + "</h3></td></tr>");
                }
            }
        });
        res.write("<tr><td><h3 id=\"newchannel\" onclick=\"newchannel()\" style=\"margin: 20px; font-size: 20px; cursor: pointer;color:gray;\">+ 创建新对话包厢</h3></td></tr>");
        res.end();
    });
});

// 发送讯息
app.post("/sendmsg", function (req, res) {
    conn.query("INSERT INTO `message` (`name`,`channel`,`msg`,`time`) VALUES ('" + req.body.msg_name + "','" + req.body.msg_channel + "','" + req.body.msg + "','" + getDateTime() + "');", function () {
        res.write("1");
        res.end();
    });
});

// 回传静态配置文件
app.use(express.static('static'));

// 显示网站画面
app.get("/", function (req, res) {

    if (req.session.user) {
        console.log("\x1b[33m%s\x1b[0m", "[信息] 使用者 " + req.session.user_name + "（" + req.session.user_id + "） 登入了聊天广场服务");
        res.render("mainpage", {
            islogin: true,
            id: req.session.user_id,
            name: req.session.user_name,
            schoolnumber: req.session.schoolnumber,
            gender: req.session.gender,
            email: req.session.email,
            pwd: req.session.pwd,
            pwd_md5: req.session.pwd_md5
        });
        if (req.cookies.keeplogin != "true") {
            req.session.destroy();
        }
    } else {
        res.render("mainpage", { islogin: false });
    }
});

// 注册账号
app.post("/register", function (req, res) {

    conn.query("SELECT * FROM `users` WHERE `id`='" + req.body.reg_id + "';", function (err, result) {
        if (err) {
            res.write("0:dbconnecterror");
            res.end();
            return;
        } else if (result.length != 0) {
            res.write("0:invalid_id");
            res.end();
            return;
        } else {
            conn.query("SELECT * FROM `users` WHERE `schoolnumber`='" + req.body.reg_schoolnumber + "';", function (err, result) {
                if (err) {
                    res.write("0:dbconnecterror");
                    res.end();
                    return;
                } else if (result.length != 0) {
                    res.write("0:invalid_sn");
                    res.end();
                    return;
                } else {
                    console.log("\x1b[32m%s\x1b[0m", "[信息] 新使用者 " + req.body.reg_name + "（" + req.body.reg_id + "） 注册了聊天广场服务");
                    conn.query("INSERT INTO `users` (`name`,`schoolnumber`,`email`,`gender`,`id`,`pwd`,`pwd_md5`) VALUES ('" + req.body.reg_name + "','" + req.body.reg_schoolnumber + "', '" + req.body.reg_email + "', '" + req.body.reg_gender + "','" + req.body.reg_id + "', '" + req.body.reg_pwd + "', '" + req.body.reg_pwd_md5 + "');");
                    res.write("1");
                    res.end();
                }
            });
        }
    });
});

// 建立连线服务器
var server = app.listen(80, function () {
    console.log("\x1b[32m%s\x1b[0m", "[信息] 浙江大学聊天广场服务现已开放连线于 http://localhost/ ");
});

// 用于取得当前时间的 function
function getDateTime() {

    var date = new Date();

    var hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;

    var min = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;

    var sec = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;

    var year = date.getFullYear();

    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;

    var day = date.getDate();
    day = (day < 10 ? "0" : "") + day;

    return year + ":" + month + ":" + day + ":" + hour + ":" + min + ":" + sec;

}