console.log("screen.js开始了"); //控制台提示开始此js

let socket; // 初始化 WebSocket 连接
let localVideo = document.getElementById('localVideo');  // 获取html的本地视频元素
let remoteVideo = document.getElementById('remoteVideo');  // 获取远程视频元素

console.log(ip, port, turnPort, turnUser, turnPassword);  //控制台输出服务器参数，确保数值传输成功

// 创建 RTCPeerConnection 对象，设置 TURN 服务器
let pc = new RTCPeerConnection({
    iceServers: [
        {
            urls: `turn:${ip}:${turnPort}`, //turn服务器地址
            username: `${turnUser}`,  // turn服务器用户名
            credential: `${turnPassword}`  // turn服务器密码
        }
    ]
});
console.log('设置turn服务器'); //控制台输出turn服务器设置成功提示

let myIdentity = '';  //初始化用户身份（发起者/接收者）
let roomName = '123';  // 初始化房间名
let resolution; //分辨率
let frameRate; //帧率
let bitrate; //初始化码率

// 选择身份
function selectRole(role) {
    myIdentity = role; //设置身份
    document.getElementById('identitySelector').style.display = 'none';  // 隐藏身份选择按钮

    if (myIdentity === 'sender') {
        document.getElementById('settingsModal').style.display = 'flex';  // 显示屏幕分享规格设置窗口
        console.log('选择了发起者'); //控制台提示选择发起者
    } else {
        console.log('选择了接收者'); //控制台提示选择接收者
        startReceivingScreen();  // 接收者开始接收屏幕
    }
}

// 确认设置并开始屏幕共享
function confirmSettings() {
    resolution = document.getElementById('resolutionSelect').value.split('x'); //将分辨率用x分开，长和宽存进数组内
    frameRate = parseInt(document.getElementById('frameRateSelect').value); //存放帧率
    bitrate = parseInt(document.getElementById('bitrateSelect').value); //存放码率

    console.log(resolution, frameRate, bitrate); //控制台输出规格设置参数，确保数值传输成功
    document.getElementById('settingsModal').style.display = 'none';  // 隐藏设置面板
    startScreenSharing();  // 发起者开始共享屏幕
}

// 连接 WebSocket 服务器
socket = new WebSocket(`ws://${ip}:${port}/ws/room/`);  // WebSocket 地址

// WebSocket 连接成功
socket.onopen = function () {
    console.log('已连接到服务器');

    if (myIdentity === 'sender') {
        socket.send(JSON.stringify({
            type: 'create',
            room_name: roomName  // 发起创建房间请求
        }));
    } else if (myIdentity === 'receiver') {
        socket.send(JSON.stringify({
            type: 'join',
            room_name: roomName  // 接收者加入房间
        }));
    }
};

// 处理来自服务器的消息
socket.onmessage = function (e) {
    const data = JSON.parse(e.data);

    if (data.type === 'offer') {
        // 接收到 offer，设置远程描述并创建 answer
        pc.setRemoteDescription(new RTCSessionDescription(data.offer)).then(() => {
            return pc.createAnswer();
        }).then(answer => {
            return pc.setLocalDescription(answer);
        }).then(() => {
            socket.send(JSON.stringify({
                type: 'answer',
                answer: pc.localDescription,
                room_name: roomName  // 发送 answer 到服务器
            }));
        });
    } else if (data.type === 'answer') {
        // 接收到 answer，设置远程描述
        pc.setRemoteDescription(new RTCSessionDescription(data.answer));
    } else if (data.type === 'ice') {
        // 处理 ICE 候选者
        pc.addIceCandidate(new RTCIceCandidate(data.ice));
    }
};

// 开始共享屏幕（发起者）
async function startScreenSharing() {
    try {
        // 获取显示器屏幕流
        const stream = await navigator.mediaDevices.getDisplayMedia({
            video: {
                width: { ideal: parseInt(resolution[0]) },  // 设置宽度为 ideal 的值
                height: { ideal: parseInt(resolution[1]) },  // 设置高度为 ideal 的值
                frameRate: { ideal: frameRate },  // 设置帧率为 ideal 的值
                facingMode: 'user'  // 可选：指定摄像头或屏幕方向
            }
        });

        // 将本地视频流添加到页面
        localVideo.srcObject = stream;

        // 将屏幕流添加到 WebRTC 连接中
        stream.getTracks().forEach(track => pc.addTrack(track, stream));

        // 设置视频编码参数，限制带宽
        const sender = pc.getSenders().find(sender => sender.track.kind === 'video');
        if (sender) {
            const parameters = sender.getParameters();
            parameters.encodings[0].maxBitrate = bitrate;  // 设置最大比特率
            sender.setParameters(parameters);
        }

        // 创建 offer 并发送到服务器
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.send(JSON.stringify({
            type: 'offer',
            offer: pc.localDescription,
            room_name: roomName  // 发送 offer 到服务器
        }));
        console.log('视频发送成功');
    } catch (err) {
        console.error('Error starting screen sharing:', err);
    }
}

// 开始接收屏幕（接收者）
function startReceivingScreen() {
    pc.ontrack = function (event) {
        remoteVideo.srcObject = event.streams[0];  // 显示接收到的屏幕流
        console.log('开始接收');
    };

    // 创建 offer 并发送到服务器（接收者也需要发起）
    pc.createOffer().then(offer => {
        return pc.setLocalDescription(offer);
    }).then(() => {
        socket.send(JSON.stringify({
            type: 'offer',
            offer: pc.localDescription,
            room_name: roomName  // 发送 offer 到服务器
        }));
    }).catch(error => {
        console.error('Error starting to receive screen:', error);
    });
}

// 处理 ICE 候选者
pc.onicecandidate = function (event) {
    console.log('处理 ICE 候选者');
    if (event.candidate) {
        socket.send(JSON.stringify({
            type: 'ice',
            ice: event.candidate,
            room_name: roomName  // 发送 ICE 候选者到服务器
        }));
    }
};

// 切换全屏模式
function toggleFullScreen() {
    if (remoteVideo.requestFullscreen) {
        remoteVideo.requestFullscreen();  // 支持全屏的浏览器
    } else if (remoteVideo.mozRequestFullScreen) {
        remoteVideo.mozRequestFullScreen();  // Firefox
    } else if (remoteVideo.webkitRequestFullscreen) {
        remoteVideo.webkitRequestFullscreen();  // Chrome, Safari
    } else if (remoteVideo.msRequestFullscreen) {
        remoteVideo.msRequestFullscreen();  // IE/Edge
    }
}
