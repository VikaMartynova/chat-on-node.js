const express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    bcrypt = require('bcryptjs');
    // passport = require('passport'),
    // LocalStrategy = require('passport-local').Strategy,
    // session = require('express-session'),
    // mysqlStore = require('express-mysql-session')(session),
    // mongoose = require('mongoose'),
    // bodyParser = require('body-parser'),
    // cookieParser = require('cookie-parser');
var mysql = require('mysql');

var db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'db_chat'
});

// app.use(session({
//     store: new RedisStore({
//         url:  process.env.REDIS_STORE_URI
//     }),
//     secret: process.env.REDIS_STORE_SECRET,
//     resave: false,
//     saveUninitialized: false
// }));
// app.use(passport.initialize());
// app.use(passport.session());

var usernames = [];

process.on(`uncaughtException`, console.error);

app.set('port', 3000);

server.listen(app.get('port'));

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.use(express.static(__dirname));

io.sockets.on('connection', function (socket) {
    console.log('Socket connected');

    socket.on('new user', function (data, callback) {
        if (usernames.indexOf(data.user) !== -1 || !data.user || !data.pass) {
            callback(false);
        }
        else {
            callback(true);
            socket.username = data.user;
            socket.password = data.pass;
            usernames.push(socket.username);
            updateUsernames();
            socket.broadcast.emit('new message', {msg: "joined", user: socket.username});
            bcrypt.hash(socket.password, saltRounds, function(err, hash){
                if (err) throw err;
                db.query('INSERT INTO users (username, password) VALUES (?, ?)', [socket.username, hash] );
            });

        }
    });

    function updateUsernames() {
        io.sockets.emit('users', usernames);
    }

    socket.on('send message', function (data) {
        io.sockets.emit('new message', {msg: data, user: socket.username});
    });

    socket.on('disconnect', function() {
        if (!socket.username){
            return;
        }
        io.sockets.emit('new message', {msg: "leaved the chat", user: socket.username});
        usernames.splice(usernames.indexOf(socket.username), 1);
        updateUsernames();
        db.query('DELETE FROM users WHERE username = ?', socket.username);
    });

});