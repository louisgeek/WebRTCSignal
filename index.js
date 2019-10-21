var app = require('express')();
// var http = require('http').Server(app);
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3001;
//
//map key-value 【 just object 】
// var userMap = {};
//{roomId,roomUser}
var mRoomUserMap = {};

//打印 html content
app.get('/', function (req, res) {
    var ip = req.connection.remoteAddress;
    res.send('<h1>Signal Running on ' + ip + ':' + port + '</h1>');
    // res.sendFile(__dirname + '/index.html');
});

io.on('connection', function (socket) {
    //====================== API 说明 ===================
    // 发送给所有人 io.sockets.emit('hi', 'everyone');
    // 发送给所有人【简写】 io.emit('hi', 'everyone'); // short form

    // 广播 发给除了自己以外的其他所有人 socket.broadcast.emit('xxx', xxxJson);
    // 发送给别人 socket.to(socketId).emit('xxx', xxxJson);
    // 发送给指定房间别人 io.to(roomId).emit('xxx', xxxJson);
    // socket.broadcast.to(id).emit('my message', msg);
    // 如果没有指定加入room 默认加入以自己socket.id为名的room
    // to和in 为同义词
    console.log(socket.id + 'connected');
    //===============  videoChatModelJson ================
    socket.on("videoChatInvite", function (videoChatModelJson, callback) {
        var videoChatModel = JSON.parse(videoChatModelJson);
        var inviteVideoChatUserModel = videoChatModel.inviteVideoChatUserModel;
        var otherUserModel = videoChatModel.otherUserModel;
        if (otherUserModel) {
            var socketId = otherUserModel.socketId;
            //通知对方客户端
            socket.to(socketId).emit('videoChatInvite', videoChatModelJson);
            if (inviteVideoChatUserModel) {
                console.log(inviteVideoChatUserModel.userName + ' videoChatInvite ' + otherUserModel.userName);
            }
        }
    });
    socket.on("videoChatCancel", function (videoChatModelJson, callback) {
        var videoChatModel = JSON.parse(videoChatModelJson);
        var inviteVideoChatUserModel = videoChatModel.inviteVideoChatUserModel;
        var otherUserModel = videoChatModel.otherUserModel;
        if (otherUserModel) {
            var socketId = otherUserModel.socketId;
            //通知对方客户端
            socket.to(socketId).emit('videoChatCancel', videoChatModelJson);
            if (inviteVideoChatUserModel) {
                console.log(inviteVideoChatUserModel.userName + ' videoChatCancel ' + otherUserModel.userName);
            }
        }
    });
    //
    socket.on("videoChatAgree", function (videoChatModelJson, callback) {
        var videoChatModel = JSON.parse(videoChatModelJson);
        var inviteVideoChatUserModel = videoChatModel.inviteVideoChatUserModel;
        var otherUserModel = videoChatModel.otherUserModel;
        if (inviteVideoChatUserModel) {
            var socketId = inviteVideoChatUserModel.socketId;
            //通知对方客户端
            socket.to(socketId).emit('videoChatAgree', videoChatModelJson);
            if (otherUserModel) {
                console.log(otherUserModel.userName + ' videoChatAgree ' + inviteVideoChatUserModel.userName);
            }
        }
    });
    socket.on("videoChatReject", function (videoChatModelJson, callback) {
        var videoChatModel = JSON.parse(videoChatModelJson);
        var inviteVideoChatUserModel = videoChatModel.inviteVideoChatUserModel;
        var otherUserModel = videoChatModel.otherUserModel;
        if (inviteVideoChatUserModel) {
            var socketId = inviteVideoChatUserModel.socketId;
            //通知对方客户端
            socket.to(socketId).emit('videoChatReject', videoChatModelJson);
            if (otherUserModel) {
                console.log(otherUserModel.userName + ' videoChatReject ' + inviteVideoChatUserModel.userName);
            }
        }
    });
    //===============  videoChatSdpInfoModelJson ================
    //1v1
    socket.on('offer', function (videoChatSdpInfoModelJson) {
        var videoChatSdpInfoModel = JSON.parse(videoChatSdpInfoModelJson);
        var fromUserModel = videoChatSdpInfoModel.fromUserModel;
        var toUserModel = videoChatSdpInfoModel.toUserModel;
        var socketId = toUserModel.socketId;
        //通知对方客户端
        socket.to(socketId).emit('offer', videoChatSdpInfoModelJson);
        console.log(fromUserModel.userName + ' offer ' + toUserModel.userName);
    });
    //1v1
    socket.on('answer', function (videoChatSdpInfoModelJson) {
        var videoChatSdpInfoModel = JSON.parse(videoChatSdpInfoModelJson);
        var fromUserModel = videoChatSdpInfoModel.fromUserModel;
        var toUserModel = videoChatSdpInfoModel.toUserModel;
        var socketId = toUserModel.socketId;
        //通知对方客户端
        socket.to(socketId).emit('answer', videoChatSdpInfoModelJson);
        console.log(fromUserModel.userName + ' answer ' + toUserModel.userName);
    });
    //===============  videoChatInfoModelJson ================
    //1v1
    socket.on('candidate', function (videoChatInfoModelJson) {
            var videoChatInfoModel = JSON.parse(videoChatInfoModelJson);
            var fromUserModel = videoChatInfoModel.fromUserModel;
            var toUserModel = videoChatInfoModel.toUserModel;
            var socketId = toUserModel.socketId;
            //通知对方客户端
            socket.to(socketId).emit('candidate', videoChatInfoModelJson);
            console.log(fromUserModel.userName + ' candidate ' + toUserModel.userName + ' ' + videoChatInfoModel.sdp);
        }
    );
    //===============   chatInfoModelJson ================
    socket.on('userChat', function (chatInfoModelJson) {
        var chatInfoModel = JSON.parse(chatInfoModelJson);
        var fromUserModel = chatInfoModel.fromUserModel;
        var toUserModel = chatInfoModel.toUserModel;
        var chatInfo = chatInfoModel.chatInfo;
        if (toUserModel) {
            var socketId = toUserModel.socketId;
            //通知对方客户端
            socket.to(socketId).emit('userChat', chatInfoModelJson);
            if (fromUserModel) {
                console.log(fromUserModel.userName + ' userChat userName ' + toUserModel.userName + ' ' + chatInfo);
            }
        }
    });
    //===================
    //===================
    //主动登录 user & room
    socket.on('userLogin', function (userModelJson, roomModelJson, callback) {
        console.log(socket.id + ' userLogin');
        if (callback) {
            //返回socketId
            callback(socket.id);
        }
        var userModel = JSON.parse(userModelJson);
        var roomModel = JSON.parse(roomModelJson);
        //赋值
        userModel.socketId = socket.id;
        var roomId = roomModel.roomId;
        socket.join(roomId);    // 加入房间
        // console.log(userModel.userName + ' 加入房间 ' + roomModel.roomName);
        //广播给其他人
        //socket.broadcast.emit('userLogin', userJson);
        //广播给房间内其他人
        socket.broadcast.to(roomId).emit('userLogin', userModel);

        // roomModelJson = JSON.stringify(userModel);
        //roomUser is {roomModel,userModelMap}
        var roomUser = mRoomUserMap[roomId];
        if (!roomUser) {
            console.log(userModel.userName + ' 第一次登录房间 ' + roomModel.roomName);
            //第一次登录该房间 需要初始化
            roomUser = {};
            roomUser.roomModel = roomModel;
            roomUser.userModelMap = {};
            //save
            mRoomUserMap[roomId] = roomUser;
        }
        var userModelMap = roomUser.userModelMap;
        userModelMap[socket.id] = userModel;
        //发送给所有人
        //io.emit('userChange', userMap);
        //发送给房间内所有人
        io.to(roomId).emit('roomUserChange', userModelMap);
        console.log('-- roomUserChange userLogin userModelMap json ' + JSON.stringify(userModelMap) + ' --');
    });
//主动退出登录
    socket.on('userLogout', function (userModelJson, roomModelJson) {
        console.log(socket.id + ' userLogout');
        var userModel = JSON.parse(userModelJson);
        var roomModel = JSON.parse(roomModelJson);
        var roomId = roomModel.roomId;
        socket.leave(roomId);
        console.log(userModel.userName + ' 离开房间 ' + roomModel.roomName);
        //广播给其他人
        //socket.broadcast.emit('userLogout', userJson);
        //广播给房间内其他人
        socket.broadcast.to(roomId).emit('userLogout', userModel);
        var roomUser = mRoomUserMap[roomId];
        if (!roomUser) {
            console.log('roomUser is null ' + roomUser);
            return
        }
        var userModelMap = roomUser.userModelMap;
        if (!userModelMap) {
            console.log('userModelMap is null ' + userModelMap);
            return
        }
        delete userModelMap[socket.id];
        socket.broadcast.emit('userLogout', userModel);
        //发送给所有人
        //io.emit('userChange', userMap);
        //发送给房间内所有人
        io.to(roomId).emit('roomUserChange', userModelMap);
        console.log('-- roomUserChange userLogout userModelMap json ' + JSON.stringify(userModelMap) + ' --');
    });
//===========================================
    socket.on('disconnect', function () {
        console.log(socket.id + ' disconnect');
        //移除断线客户端的用户信息 处理部分设备未正常退出的情况
        for (var key in mRoomUserMap) {
            var roomId = key;
            var roomUser = mRoomUserMap[roomId];
            if (!roomUser) {
                console.log('roomUser is null ' + roomUser);
                continue;
            }
            //

            var userModelMap = roomUser.userModelMap;
            if (!userModelMap) {
                console.log('userModelMap is null ' + userModelMap);
                continue;
            }
            delete userModelMap[socket.id];
            //发送给所有人
            //io.emit('userChange', userMap);
            //发送给房间内所有人
            io.to(roomId).emit('roomUserChange', userModelMap);
            console.log('-- roomUserChange disconnect userModelMap json ' + JSON.stringify(userModelMap) + ' --');


        }


    });
    socket.on('message', function (options) {
        io.emit('message', options);
    });
});
//不指定 hostname  req.connection.remoteAddress 获取到 ::ffff:192.168.0.111
/*http.listen(port, function () {
   console.log('listening on ' + port);
});*/
//指定 hostname  req.connection.remoteAddress 获取到 192.168.0.111
http.listen(port, '0.0.0.0', function () {
    console.log('listening on ' + port);
});
