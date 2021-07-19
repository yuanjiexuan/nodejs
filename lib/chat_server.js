var socketio = require('socket.io');
var io;
var guestNumber = 1;
var nickNames = {};
var namesUsed = [];
var currentRoom = {};

// 启动Socket.IO服务器
exports.listen = function (server) { 
    // 启动Socket,IO服务器，允许它搭载在已有的Http服务器上
    io = socketio.listen(server);
    io.set('log level', 1);
    io.sockets.on('connection', function (socket){ 
        guestNumber = assignGuestName(socket, guestNumber, nickNames, namesUsed);
        // 在用户链接上来时把他放入聊天室Lobby里
        joinRoom(socket, 'Lobby');
        handleMessageBroadcasting(socket, nickNames);
        handleNameChangeAttempts(socket, nickNames, namesUsed);
        handleRoomJoining(socket);
        socket.on('rooms',function(){
            socket.emit('rooms', io.socket.manager, rooms);
        });
        handleClientDisconnection(socket, nickNames, namesUsed)
     })
 }
function assignGuestName(socket, guestNumber, nickNames, namesUsed) {
    var name = "Guset" + guestNumber;
    nickNames[socket.id] = name;
    socket.emit('nameResult', {
        success:true,
        name: name
    });
    namesUsed.push(name);
    return guestNumber + 1;
}

function joinRoom(socket, room) {
    socket.join(room);
    currentRoom[socket.id] = room;
    socket.emit('joinResult', {room: room});
    socket.broadcase.to(room).emit('message', {
        text: nickNamse[socket.id] + 'hse joined' + room + '.'
    });
    var userInRoom = io.sockets.clients(room);
    if(usersInRoom.length > 1) {
        var userInRoomSummary = 'Users currently i ' + room + ':';
        for(var index in usersInRoom) {
            var userSocketId = userInRoom[index].id;
            if(userSocketId != socket.id) {
                if(index> 0){
                    userInRoomSummary += ',';
                }
            usersInRoomSummary += nickNames[userSocketId];    
            }
        }
    userInRoomSummary += '.';
    socket.emit('message', {text: userInRoomSummary});  
    }
}

function handleNameChangeAttempts(socket, inckNames, namesUsed) {
    socket.on('nameAttempt',function (name) { 
        if(name.indexOf('Guest') == 0){
            socket.emit('nameResult', {
                success: false,
                message: 'Name cannot begin width "Guest".'
            })
        }else {
            if(namesUsed.indexOf(name) == -1){
                var previousName = nickNames[socket.id];
                var previousNameIndex = namesUsed.indexOf(previousName);
                namesUsed.push(name);
                nickNames[socket.id] = name;
                delete namesUsed[previousNameIndex];
                socket.emit('nameResult', {
                    success: true,
                    name: name
                });
                socket.broadcase.to(currentRoom[socket.id]).emit('message',{
                    text: previousName + 'is now known as' + name + '.'
                });
            } else {
                socket.emit('nameResult', {
                    success: false,
                    message: 'That name is already in use.'
                })
            }
        }
     })
}
function handleMessageBroadcasting(socket) { 
    socket.on('message', function (message) { 
        socket.broadcase.to(message.room).emit('message', {
            text: nickNames[socket.id] + ': ' + message.text
        });
     })
}

// 创建房间
function handleRoomJoining(socket){
    socket.on('join',function (room) { 
        socket.leave(currentRoom[socket.id]);
        joinRoom(socket,room.newRoom);
     })
}

// 用户断开链接
function handleClientDisconnection(socket) {
    socket.on('disconnect',function(){
        var nameIndex = namesUsed.indexOf(nickNames[socket.id]);
        delete namesUsed[nameIndex];
        delete nickNames[socket.id]
    })
}



