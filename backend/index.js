const express = require('express');
const app = express();
const http = require('http');
const {Server}= require('socket.io');
const cors = require("cors");
app.use(cors());

const server = http.createServer(app);

let storeData = [];

const io = new Server(server, {
    cors: {
        origin: '*'
    }
});

io.on("connection",(socket)=>{
    console.log('User Connected', socket.id);

    socket.on('join_room', (data)=>{
        socket.join(data.room);
        socket.to(data.room).emit("newperson",data);
        let newData = {...data,id:socket.id};
        storeData.push(newData);
    })

    socket.on("send_message", (data)=>{
        socket.to(data.room).emit("receive_message",data)
    })

    socket.on('disconnect', ()=>{
        const userId = socket.id;
        let time = new Date().toLocaleTimeString('en-US');
        const findUser = storeData.filter((ele)=> ele.id===userId);
        socket.to(findUser[0]?.room).emit('left_room',{...findUser[0],time});
        storeData = storeData.filter(ele=> ele.id!== userId);

    })
})

const PORT = process.env.PORT || 5000;
server.listen(PORT,()=>{
    console.log('Server is running');
})
