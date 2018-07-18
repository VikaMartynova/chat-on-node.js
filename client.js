
$(function () {

    var socket = io.connect();
    var $messageForm = $('#messageForm');
    var $message = $('#message');
    var $chat = $('#chatWindow');
    var $messages = $('#messages');

    var $userNameForm = $('#userNameForm');
    var $username = $('#username');
    var $password = $('#password');
    var $users = $('#users');
    var $error = $('#error');

    $userNameForm.submit(function (e) {
        e.preventDefault();
        socket.emit('new user', {
            user: $username.val(),
            pass: $password.val()
        });
    });

    socket.on('user', function(data) {
        $('#nameWrapper').hide();
        $('#mainWrapper').show();
    });

    socket.on('error', function(data){
        $username.val('');
        $password.val('');
        $error.html(data.msg);
    });

    $username.focus(function () {
        $error.html('');
    });

    socket.on('users', function (data) {
        var content = '';
        for (let i = 0; i < data.length; i++){
            content += '<li>' + data[i] + '</li>';
        }
        $users.html(content);
    });

    $messageForm.submit(function (e) {
        e.preventDefault();
        if ($message.val()) {
            socket.emit('send message', $message.val());
        }
        $message.val('');
    });

    socket.on('new message', function (data) {
        $messages.append('<strong>' + data.user + '</strong>: ' + data.msg + '<br>');
    })

});