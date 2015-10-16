// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('../..')(server);
var port = process.env.PORT || 3000;

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(__dirname + '/public'));

// Chatroom

// usernames which are currently connected to the chat
var usernames = {};
var numUsers = 0;
var room_number = 0;

io.on('connection', function (socket) {
  var addedUser = false;
  var referer_url = socket.handshake.headers.referer;

  var room_code = socket.handshake.headers.referer.substr(socket.handshake.headers.referer.length - 3);
  
  console.log("referer_url: ", referer_url);
  console.log("room_code: " , room_code);

  // when the client emits 'new message', this listens and executes
  socket.on('new message', function (data) {
    // we tell the client to execute 'new message'
    console.log("ip: ", socket.handshake.headers.referer);

    var x = socket.handshake.headers.referer.substr(socket.handshake.headers.referer.length - 3);
    console.log("x: " , x);

    socket.broadcast.to(socket.handshake.headers.referer.substr(socket.handshake.headers.referer.length - 3)).emit('new message', {
      username: socket.username,
      message: data
    });
  });

  // when the client emits 'add user', this listens and executes
  socket.on('add user', function (username) {
    socket.leave(socket.id);
    console.log("url: ", socket.handshake.headers.referer);
    var room_by_url = socket.handshake.headers.referer;

    var last_three_chars = room_by_url.substr(room_by_url.length - 3);
    console.log("last 3: ", last_three_chars);

    socket.join(last_three_chars);

    // we store the username in the socket session for this client
    socket.username = username;
    // add the client's username to the global list
    usernames[username] = username;
    ++numUsers;
    addedUser = true;
    socket.emit('login', {
      numUsers: numUsers
    });
    // echo globally (all clients) that a person has connected
    socket.broadcast.to(socket.handshake.headers.referer.substr(socket.handshake.headers.referer.length - 3)).emit('user joined', {
      username: socket.username,
      numUsers: numUsers
    });

    console.log('id: ', socket.id);
    //console.log("room: ", socket.rooms);
    console.log('rooms: ', socket.adapter.rooms);
    //console.log("url: ",socket.handshake.headers.referer);
  });

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', function () {
    socket.broadcast.to(socket.handshake.headers.referer.substr(socket.handshake.headers.referer.length - 3)).emit('typing', {
      username: socket.username
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', function () {
    socket.broadcast.to(socket.handshake.headers.referer.substr(socket.handshake.headers.referer.length - 3)).emit('stop typing', {
      username: socket.username
    });
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', function () {
    // remove the username from global usernames list
    if (addedUser) {
      delete usernames[socket.username];
      --numUsers;

      // echo globally that this client has left
      socket.broadcast.to(socket.handshake.headers.referer.substr(socket.handshake.headers.referer.length - 3)).emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });
    }


    //console.log("socket before leaving: ",  socket);
    socket.leave();
  });
  //console.log(socket);
});
