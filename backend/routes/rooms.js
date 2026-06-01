const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const User = require('../models/User');

// Middleware to check auth
const requireAuth = (req, res, next) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
  next();
};

// Generate 6-char random code
const generateCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

// Create a room
router.post('/create', requireAuth, async (req, res) => {
  try {
    const { name } = req.body;
    let code = generateCode();
    
    // Ensure uniqueness
    while (await Room.findOne({ code })) {
      code = generateCode();
    }
    
    const room = new Room({
      code,
      name: name || 'New Chat Room',
      owner: req.session.userId,
      members: [req.session.userId]
    });
    
    await room.save();
    res.json({ room });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get room details by code
router.get('/code/:code', requireAuth, async (req, res) => {
  try {
    const room = await Room.findOne({ code: req.params.code }).populate('members', 'name email').populate('owner', 'name email');
    if (!room) return res.status(404).json({ error: 'Room not found' });
    res.json({ room });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Join a room via code
router.post('/join', requireAuth, async (req, res) => {
  try {
    const { code } = req.body;
    const room = await Room.findOne({ code });
    if (!room) return res.status(404).json({ error: 'Room not found' });
    
    if (!room.members.includes(req.session.userId)) {
      room.members.push(req.session.userId);
      await room.save();
    }
    
    res.json({ room });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's rooms
router.get('/my-rooms', requireAuth, async (req, res) => {
  try {
    const rooms = await Room.find({ members: req.session.userId }).populate('owner', 'name');
    res.json({ rooms });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get room messages
router.get('/:roomId/messages', requireAuth, async (req, res) => {
  try {
    const Message = require('../models/Message');
    const messages = await Message.find({ room: req.params.roomId }).populate('sender', 'name email').sort({ timestamp: 1 });
    res.json({ messages });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
