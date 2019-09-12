// 切换聊天频道
function changechannel(newchannel) {
    $("#" + channel).css("color", "black");
    channel = newchannel;
    $("#" + channel).css("color", "brown");
    update_chat();
    $("#channel_title").html("<h2>" + channel + "</h2>");
}

// 更新对话内容
function update_chat() {
    $.ajax({
        type: "POST",
        url: 'getchat',
        data: {
            channel: channel
        },
        success: function(data) {
            $('#chatdiv').html(data);
            $("#channel_title").html("<h2>" + channel + "</h2>");
            $("#chatdiv").animate({
                scrollTop: $("#chatdiv").height() * 10
            }, 1000);
        }
    });
}

// 建立新对话包厢
function newchannel() {
    var channelname = prompt("新对话包厢名称：");
    if (channelname.length < 3) {
        alert("名字太短了！至少三个字吧");
        return;
    }
    $.ajax({
        type: "POST",
        url: 'sendmsg',
        data: { msg: "大家好，我建立了这个新的包厢！", msg_name: user_name, msg_channel: channelname, },
        success: function(data) {

            if (data === '0:dbconnecterror') {

                // 资料库连线失败
                alert("连线至资料库时发生问题");

            } else if (data == '1') {

                changechannel(channelname);
                update_chat();

            } else {

                // 例外错误
                alert("系统发生例外错误");

            }
        }
    });
}

// 更新聊天频道列表
function update_channellist() {
    $.ajax({
        type: "POST",
        url: 'getchannellist',
        data: {
            channel: channel
        },
        success: function(data) {
            $('#channelist').html(data);
            $('#channelist_phone').html(data);
        }
    });
}

// 登入事件处理
$(document).ready(function() {
    $('#loginform').submit(function(e) {

        $('#pwd_md5').val(md5($('#pwd').val()));

        e.preventDefault();
        $.ajax({
            type: "POST",
            url: 'login',
            data: $(this).serialize(),
            success: function(data) {

                if (data === '0:dbconnecterror') {

                    // 资料库连线失败
                    alert("连线至资料库时发生问题");

                } else if (data === '0:nouserfound') {

                    // 账号或密码错误
                    alert("账号或密码错误");

                } else if (data == $('#id').val()) {

                    // 登入成功

                    // 用 cookie 储存是否要保持登入
                    if ($('#keeplogin').prop("checked")) document.cookie = "keeplogin=true ";
                    else document.cookie = "keeplogin=false ";

                    // 完成登入后用动画变更版面配置

                    $('#login').fadeOut(400);
                    $('#chat').delay(400).fadeIn(400);
                    $('#profile').delay(800).fadeIn(400);

                    // 1.5 秒后重新整理页面
                    setTimeout(location.reload.bind(location), 1200);

                } else {

                    // 例外错误
                    alert("系统发生例外错误");

                }
            }
        });

    });
});

// 隐藏密码
function hidepwd() {
    $('#fakepwd').css("display", "contents");
    $('#realpwd').css("display", "none");
}

// 显示密码
function showpwd() {
    $('#fakepwd').css("display", "none");
    $('#realpwd').css("display", "contents");
    alert("本网站的登入系统采用 md5 加密演算法来保障您的密码不被窃取，但为了符合面试要求，这里仍有使用明文方式储存您的密码。");
}

// 登出事件处理
function logout() {
    $.ajax({
        type: "POST",
        url: '/logout',
        data: {},
        success: function(data) {
            $('#profile').fadeOut(400);
            $('#chat').fadeOut(400);
            $('#chatlist_phone').fadeOut(400);
            $('#login').delay(400).fadeIn(400);
        }
    });
}

// 开启注册页面
function open_reg() {
    $('#login').fadeOut(400);
    $('#register').delay(400).fadeIn(400);
}

// 开启登入页面
function open_login() {
    $('#register').fadeOut(400);
    $('#login').delay(400).fadeIn(400);
}

// 发送讯息事件
$(document).ready(function() {
    $('#chatform').submit(function(e) {
        e.preventDefault();

        $('#msg_name').val(user_name);

        $('#msg_channel').val(channel);

        $.ajax({
            type: "POST",
            url: 'sendmsg',
            data: $(this).serialize(),
            success: function(data) {

                if (data === '0:dbconnecterror') {

                    // 资料库连线失败
                    alert("连线至资料库时发生问题");

                } else if (data == '1') {

                    $('#msg').val("");
                    update_chat();

                } else {

                    // 例外错误
                    alert("系统发生例外错误");

                }
            }
        });

    });
});

// 注册事件处理
$(document).ready(function() {
    $('#registerform').submit(function(e) {

        e.preventDefault();

        $('#reg_pwd_md5').val(md5($('#reg_pwd').val()));

        if ($('#reg_pwd').val() != $('#reg_checkpwd').val()) {
            alert("两次密码输入不一致！");
            return;
        }

        $.ajax({
            type: "POST",
            url: 'register',
            data: $(this).serialize(),
            success: function(data) {

                if (data === '0:dbconnecterror') {

                    // 资料库连线失败
                    alert("连线至资料库时发生问题");

                } else if (data === '0:invalid_id') {

                    // 使用者名称已被注册
                    alert("该使用者名称已被注册");

                } else if (data === '0:invalid_sn') {

                    // 学号已被注册
                    alert("该学号已被注册");

                } else if (data == 1) {

                    // 注册成功
                    alert("注册成功！");

                    // 用动画变更版面配置，切换为登入页面
                    $('#register').fadeOut(400);
                    $('#login').delay(400).fadeIn(400);

                } else {

                    // 例外错误
                    alert("系统发生例外错误");

                }
            }
        });

    });
});