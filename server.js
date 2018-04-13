const fs = require('fs');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

writeStream = fs.createWriteStream('./tim.mp3');

app.get('/', function(req, res) {
    
    res.send('<h1>SalesPhD Test App</h1>');
});

http.listen(3000, function() {
    
    console.log('listening on *:3000');
    
});

io.on('connection', function(socket){
    console.log('user connected');
    
    socket.on('audio', function(msg) {
	console.log('Audio: ' + msg['content'].length);
	writeStream.write(msg['content']);
	
    });
    
    socket.on('disconnect', function(){
	console.log('user disconnected');
    });
    
});


