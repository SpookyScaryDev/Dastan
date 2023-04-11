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
 
app.set('view engine', 'pug')
 
app.use(express.static(__dirname + "/"));

app.get('/', (req, res) => {
  res.render('home', { title: 'Home' });
});

app.get('/game', (req, res) => {
  res.render('game', { title: 'Game' });
});

app.get('/otb', (req, res) => {
  res.render('otb', { title: 'Over The Board' });
});

require('./scripts/socket.js')(server);

server.listen(443);
 
