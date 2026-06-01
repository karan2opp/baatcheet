import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { AuthContext } from '../contexts/AuthContext';
import { Send, Users, ArrowLeft, Trash2, UserX } from 'lucide-react';

export default function ChatRoom() {
  const { code } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchRoomDetails();
    
    // Connect Socket
    const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      withCredentials: true
    });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      newSocket.emit('join_room', { roomCode: code });
    });

    newSocket.on('receive_message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    newSocket.on('user_removed', ({ userId }) => {
      if (userId === user._id) {
        alert('You were removed from this room.');
        navigate('/');
      } else {
        fetchRoomDetails();
      }
    });

    newSocket.on('room_deleted', () => {
      alert('This room has been deleted by the owner.');
      navigate('/');
    });

    return () => {
      newSocket.emit('leave_room', { roomCode: code });
      newSocket.disconnect();
    };
  }, [code, navigate, user._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchRoomDetails = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/rooms/code/${code}`);
      setRoom(res.data.room);
      
      const msgRes = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/rooms/${res.data.room._id}/messages`);
      setMessages(msgRes.data.messages);
    } catch (err) {
      alert('Room not found or access denied');
      navigate('/');
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket || !room) return;

    socket.emit('send_message', {
      roomCode: code,
      roomId: room._id,
      content: newMessage
    });
    setNewMessage('');
  };

  const removeUser = (userId) => {
    if (window.confirm('Remove this user?')) {
      socket.emit('remove_user', { roomCode: code, roomId: room._id, userId });
    }
  };

  const deleteRoom = () => {
    if (window.confirm('Delete this room entirely?')) {
      socket.emit('delete_room', { roomCode: code, roomId: room._id });
    }
  };

  if (!room) return <div className="container">Loading...</div>;

  const isOwner = room.owner._id === user._id;

  return (
    <div className="container animate-fade-in" style={{ padding: '1rem' }}>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/')} style={{ padding: '0.5rem', background: 'var(--bg-card)' }}>
            <ArrowLeft size={20} />
          </button>
          <h2>{room.name}</h2>
          <span className="text-sm" style={{ background: 'var(--bg-card)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>Code: {room.code}</span>
        </div>
        {isOwner && (
          <button className="danger" onClick={deleteRoom}>
            <Trash2 size={16} /> Delete Room
          </button>
        )}
      </div>

      <div className="chat-container">
        <div className="chat-sidebar hide-on-mobile">
          <h3><Users size={18} style={{ verticalAlign: 'middle' }} /> Members ({room.members.length})</h3>
          <div className="mt-4 flex flex-col gap-2">
            {room.members.map(member => (
              <div key={member._id} className="flex justify-between items-center" style={{ fontSize: '0.875rem', padding: '0.5rem', background: 'var(--bg-dark)', borderRadius: '4px' }}>
                <span>{member.name} {member._id === room.owner._id ? '(Owner)' : ''} {member._id === user._id ? '(You)' : ''}</span>
                {isOwner && member._id !== user._id && (
                  <button onClick={() => removeUser(member._id)} className="danger" style={{ padding: '0.25rem' }}>
                    <UserX size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="chat-main">
          <div className="messages-area">
            {messages.length === 0 && <div className="text-sm" style={{ textAlign: 'center', marginTop: 'auto', marginBottom: 'auto' }}>No messages yet. Say hello!</div>}
            {messages.map((msg, i) => {
              const isOwn = msg.sender._id === user._id;
              return (
                <div key={i} className={`message-bubble ${isOwn ? 'own' : ''}`}>
                  {!isOwn && <div className="sender">{msg.sender.name}</div>}
                  <div>{msg.content}</div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
          
          <form onSubmit={handleSendMessage} className="chat-input-area">
            <input 
              type="text" 
              placeholder="Type a message..." 
              value={newMessage} 
              onChange={e => setNewMessage(e.target.value)} 
              style={{ flex: 1 }}
            />
            <button type="submit" style={{ padding: '0.75rem' }}><Send size={20} /></button>
          </form>
        </div>
      </div>
    </div>
  );
}
