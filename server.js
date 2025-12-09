require('dotenv').config()
const express = require("express");
const cors = require('cors');
const connectDB = require("./config/db");
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const userRoutes = require('./routes/userRoutes');
const communityRoutes = require('./routes/communityRoutes');
const commentRoutes = require('./routes/CommentRoutes');
const messageRoutes = require('./routes/messageRoutes');

const app = express();

app.use(cors());
app.use(express.json());

connectDB();

app.use('/api/auth',authRoutes);
app.use('/api/posts',postRoutes);
app.use('/api/user',userRoutes);
app.use('/api/communities', communityRoutes);
app.use('/api', commentRoutes);
app.use('/api/messages', messageRoutes);

app.get('/',(req,res)=> res.send("Wellness api running"));

app.use((err,req,res,next)=>{
    console.error(err);
    res.status(err.status || 500).json({
        error:err.message || "Internal Server error"
    });
});

const PORT = process.env.PORT || 3000;

//socket
const http = require('http');
const server = http.createServer(app);

const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: '*' 
  }
});

app.locals.io = io;

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);
  socket.on('joinConversation', (conversationId) => {
    if (conversationId) {
      socket.join(String(conversationId));
      socket.emit('joinedConversation', { conversationId });
    }
  });
  socket.on('leaveConversation', (conversationId) => {
    if (conversationId) socket.leave(String(conversationId));
  });

  socket.on('sendMessage', async (payload) => {
    const { conversationId, message } = payload || {};
    if (conversationId && message) {
      io.to(String(conversationId)).emit('newMessage', { conversationId, message });
    }
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected', socket.id);
  });
});
server.listen(PORT, () => {
    console.log(`Server listening on PORT ${PORT} (with Socket.IO)`);
});
