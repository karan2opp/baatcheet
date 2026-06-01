const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const cors = require('cors');
const session = require('express-session');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);

// Cors configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());

// Session middleware
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'baatcheet_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
  }
});
app.use(sessionMiddleware);

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');

app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);

// Socket.io Setup
const io = new Server(server, {
  cors: corsOptions
});

// Share session with socket.io
io.engine.use(sessionMiddleware);

const Message = require('./models/Message');
const Room = require('./models/Room');

io.on('connection', (socket) => {
  const session = socket.request.session;

  socket.on('join_room', async ({ roomCode }) => {
    socket.join(roomCode);
    console.log(`User ${session.userId} joined room ${roomCode}`);
  });

  socket.on('leave_room', ({ roomCode }) => {
    socket.leave(roomCode);
  });

  socket.on('send_message', async (data) => {
    const { roomCode, content, roomId } = data;
    if (!session.userId) return;

    try {
      const message = new Message({
        room: roomId,
        sender: session.userId,
        content
      });
      await message.save();

      const populatedMessage = await message.populate('sender', 'name email');

      io.to(roomCode).emit('receive_message', populatedMessage);
    } catch (err) {
      console.error('Error saving message:', err);
    }
  });

  socket.on('remove_user', async ({ roomCode, userId, roomId }) => {
    // Basic implementation of removing user
    try {
      const room = await Room.findById(roomId);
      if (room && room.owner.toString() === session.userId) {
        room.members = room.members.filter(id => id.toString() !== userId);
        await room.save();
        io.to(roomCode).emit('user_removed', { userId });
      }
    } catch (err) {
      console.error(err);
    }
  });

  socket.on('delete_room', async ({ roomCode, roomId }) => {
    try {
      const room = await Room.findById(roomId);
      if (room && room.owner.toString() === session.userId) {
        await Room.findByIdAndDelete(roomId);
        await Message.deleteMany({ room: roomId });
        io.to(roomCode).emit('room_deleted');
      }
    } catch (err) {
      console.error(err);
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
