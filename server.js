const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

// ذخیره کاربران آنلاین
const onlineUsers = new Map();

io.on('connection', (socket) => {
    console.log('کاربر متصل شد:', socket.id);

    // ثبت نام کاربر
    socket.on('user-login', (username) => {
        onlineUsers.set(socket.id, { username, socketId: socket.id });
        const allUsernames = Array.from(onlineUsers.values()).map(u => u.username);
        io.emit('online-users', allUsernames);
        console.log(`${username} وارد چت شد`);
    });

    // پیام خصوصی
    socket.on('private-message', (data) => {
        const sender = onlineUsers.get(socket.id);
        if (!sender) return;
        
        // پیدا کردن کاربر مقصد
        let targetSocketId = null;
        for (const [id, user] of onlineUsers.entries()) {
            if (user.username === data.to) {
                targetSocketId = id;
                break;
            }
        }
        
        if (targetSocketId) {
            // ارسال به مقصد
            io.to(targetSocketId).emit('new-message', {
                from: sender.username,
                text: data.message.text,
                time: data.message.time,
                isPrivate: true
            });
            // ارسال به خود فرستنده
            socket.emit('new-message', {
                from: sender.username,
                text: data.message.text,
                time: data.message.time,
                isOwn: true
            });
            console.log(`پیام از ${sender.username} به ${data.to}: ${data.message.text}`);
        } else {
            socket.emit('error-message', `کاربر ${data.to} آنلاین نیست!`);
        }
    });

    // پیام گروهی
    socket.on('group-message', (message) => {
        const sender = onlineUsers.get(socket.id);
        if (!sender) return;
        socket.broadcast.emit('new-group-message', {
            from: sender.username,
            text: message.text,
            time: message.time
        });
        socket.emit('new-group-message', {
            from: sender.username,
            text: message.text,
            time: message.time,
            isOwn: true
        });
    });

    // قطع ارتباط
    socket.on('disconnect', () => {
        const user = onlineUsers.get(socket.id);
        if (user) {
            onlineUsers.delete(socket.id);
            const allUsernames = Array.from(onlineUsers.values()).map(u => u.username);
            io.emit('online-users', allUsernames);
            console.log(`${user.username} خارج شد`);
        }
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`✅ سرور چت روشن شد!`);
    console.log(`👉 برای استفاده: http://localhost:3000/chat.html`);
});


// اضافه کن به server.js

// ذخیره کاربران آنلاین (با نام کاربری از users.csv)
const onlineUsers = new Map();

// ارسال لیست کاربران آنلاین به همه
function broadcastOnlineUsers() {
    const allUsernames = Array.from(onlineUsers.values()).map(u => u.username);
    io.emit('online-users', allUsernames);
}