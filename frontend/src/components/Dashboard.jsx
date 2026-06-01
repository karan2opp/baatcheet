import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Users, LogOut, MessageSquare } from 'lucide-react';

export default function Dashboard() {
  const { user, logout } = useContext(AuthContext);
  const [rooms, setRooms] = useState([]);
  const [joinCode, setJoinCode] = useState('');
  const [newRoomName, setNewRoomName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/rooms/my-rooms`);
      setRooms(res.data.rooms);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!newRoomName) return;
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/rooms/create`, { name: newRoomName });
      navigate(`/room/${res.data.room.code}`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    if (!joinCode) return;
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/rooms/join`, { code: joinCode.toUpperCase() });
      navigate(`/room/${res.data.room.code}`);
    } catch (err) {
      alert('Room not found');
    }
  };

  return (
    <div className="container animate-fade-in">
      <div className="flex justify-between items-center mb-4">
        <h2>Welcome, {user.name}</h2>
        <button className="danger" onClick={logout}><LogOut size={16} /> Logout</button>
      </div>
      
      <div className="flex gap-4" style={{ flexWrap: 'wrap' }}>
        <div className="card flex-1 min-w-[300px]">
          <h3><Plus size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }} /> Create Room</h3>
          <form onSubmit={handleCreateRoom} className="mt-4 flex flex-col">
            <input 
              type="text" 
              placeholder="Room Name" 
              value={newRoomName} 
              onChange={e => setNewRoomName(e.target.value)} 
            />
            <button type="submit">Create New Room</button>
          </form>
        </div>
        
        <div className="card flex-1 min-w-[300px]">
          <h3><Users size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }} /> Join Room</h3>
          <form onSubmit={handleJoinRoom} className="mt-4 flex flex-col">
            <input 
              type="text" 
              placeholder="Enter 6-digit Code" 
              value={joinCode} 
              onChange={e => setJoinCode(e.target.value)} 
            />
            <button type="submit">Join Existing Room</button>
          </form>
        </div>
      </div>
      
      <div className="card mt-4">
        <h3><MessageSquare size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }} /> My Rooms</h3>
        <div className="mt-4 flex flex-col gap-2">
          {rooms.length === 0 && <p className="text-sm">No rooms joined yet.</p>}
          {rooms.map(room => (
            <div key={room._id} className="flex justify-between items-center" style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-dark)' }}>
              <div>
                <strong>{room.name}</strong>
                <div className="text-sm">Code: {room.code}</div>
              </div>
              <Link to={`/room/${room.code}`}>
                <button>Enter Room</button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
