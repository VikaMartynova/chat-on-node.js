// const calc = require('./calc');
// const array = [2, 4, 5, 7, 9];
//
// const result = calc.sum(array);
// console.log(`result is ${result}`);
// module.exports.res = result;

const http = require('http');
// const express = require('express');
const port = 3000;
const url = require('url');
var fs = require('fs');
var path = require('path');

var ROOT = __dirname + "/app/";
// const app = express();
//
// app.get('/', (req, res) => res.send('Hello'));

const server = new http.Server();

server.on( 'request', function(req, res) {
    let info = '';
    if (req.url === '/') {
        fs.readFile('./index.html', function (err, info) {
            if (err) {
                console.error(err);
                res.statusCode = 500;
                res.end("Error on server!");
            }
            res.end(info);
        });

    }
    else {
        res.statusCode = 404;
        console.error("Not found!");
    }
});
server.listen(3000);

function senFileSafe(filePath, res) {
    try {
        filePath = decodeURIComponent(filePath);
    }
    catch (e) {
        res.statusCode = 400;
        res.end("Bad Request!");
        return;
    }
    if (~filePath.indexOf('\0')) {
        res.statusCode = 400;
        res.end("Bad Request!");
        return;
    }
    filePath = path.normalize(path.join(ROOT, filePath));

    if (filePath.indexOf(ROOT) != 0) {
        res.statusCode = 404;
        res.end('Not Found!');
        return;
    }
    fs.stat(filePath, function (err, stats) {
        if (err || !stats.isFile()) {
            res.statusCode = 404;
            res.end('Not Found!');
            return;
        }
        sendFile(filePath, res);
    })

}