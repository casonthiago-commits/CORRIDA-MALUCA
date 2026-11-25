const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server);
app.use(express.static('public'));
let salas = {};
function novaSala(){ return { jogadores:{}, jogando:false, vencedor:null } }
io.on('connection', socket=>{
  socket.on('entrar', ({codigo,nome,emoji})=>{
    if(!salas[codigo]) salas[codigo]=novaSala();
    let s=salas[codigo];
    if(Object.keys(s.jogadores).length>=20){ socket.emit('cheia'); return; }
    s.jogadores[socket.id]={ nome, emoji:emoji||'🏎️', x:20, y:50+Object.keys(s.jogadores).length*22 };
    socket.join(codigo); socket.data.codigo=codigo;
    io.to(codigo).emit('estado', s);
  });
  socket.on('correr', ()=>{
    let s=salas[socket.data.codigo]; if(!s || !s.jogando) return;
    let j=s.jogadores[socket.id]; if(!j) return;
    // 70% anda normal, 15% turbo, 15% bomba
    let sorte=Math.random();
    if(sorte<0.15) j.x+=45; // TURBO 🚀
    else if(sorte<0.30) j.x=Math.max(20,j.x-30); // BOMBA 💣
    else j.x+=12+Math.random()*15;
    if(j.x>=760 && !s.vencedor){ s.vencedor=j.nome+' '+j.emoji; s.jogando=false; }
    io.to(socket.data.codigo).emit('estado', s);
  });
  socket.on('comecar', ()=>{
    let s=salas[socket.data.codigo]; if(!s) return;
    s.jogando=true; s.vencedor=null;
    Object.values(s.jogadores).forEach(j=>j.x=20);
    io.to(socket.data.codigo).emit('estado', s);
  });
  socket.on('disconnect', ()=>{
    let s=salas[socket.data.codigo]; if(s) delete s.jogadores[socket.id];
  });
});
server.listen(process.env.PORT||3000);
