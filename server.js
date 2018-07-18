const express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    bcrypt = require('bcryptjs');

var saltRounds = bcrypt.genSaltSync(10);

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

    socket.on('new user', function (data) {
        db.query('SELECT * FROM users', function(err, res) {
            if (err) throw err;

            if (!data.user) {
                io.sockets.emit('error', {msg: "Unavailable username"});
            }
            else if (!data.pass) {
                io.sockets.emit('error', {msg: "Enter password"});
            }
            else {
                var userArray = [];
                Object.keys(res).forEach((key) => {
                    userArray.push(res[key].username);
                });
                socket.username = data.user;
                socket.password = data.pass;
                let index = userArray.indexOf(data.user);
                if (index === -1) {
                    io.sockets.emit('user', {user: socket.username});
                    usernames.push(socket.username);
                    updateUsernames();
                    socket.broadcast.emit('new message', {msg: "joined", user: socket.username});

                    bcrypt.hash(socket.password, saltRounds, function (err, hash) {
                        if (err) throw err;
                        db.query('INSERT INTO users (username, password) VALUES (?, ?)', [socket.username, hash]);
                    });
                }
                else {
                    bcrypt.compare(socket.password, res[index].password)
                        .then( (res) => {
                         if(res) {
                             io.sockets.emit('user', {user: socket.username});
                             usernames.push(socket.username);
                             updateUsernames();
                             socket.broadcast.emit('new message', {msg: "joined", user: socket.username});
                         }
                         else {
                             io.sockets.emit('error', {msg: "Wrong password"});
                         }
                    });
                }
            }
        });
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
    });

});