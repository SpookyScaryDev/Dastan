const express = require('express');
const https = require('https');
const app = express();


fs = require('fs');

const options = {
    key: fs.readFileSync('ssl/server.key'),
    cert: fs.readFileSync('ssl/server.pem'),
    ca: fs.readFileSync('ssl/ca.crt')
};
     
const server = https.createServer(options, app);

app.use(express.static(__dirname + "/"));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/home.html');
});

app.get('/game', (req, res) => {
    res.sendFile(__dirname + '/game.html');
});

app.get('/otb', (req, res) => {
    res.sendFile(__dirname + '/otb.html');
});

require('./scripts/socket.js')(server);

server.listen(443);
 
