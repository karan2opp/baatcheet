import React, { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, name);
      navigate('/');
    } catch (err) {
      setError('Login failed. Please try again.');
    }
  };

  return (
    <div className="container flex items-center justify-center min-h-screen">
      <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '400px' }}>
        <div className="flex flex-col items-center mb-4">
          <MessageSquare size={48} color="var(--accent)" />
          <h1 className="mt-4 text-center">BaatCheet</h1>
          <p className="text-sm">Join the conversation</p>
        </div>
        
        {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{error}</div>}
        
        <form onSubmit={handleSubmit} className="flex flex-col">
          <input
            type="text"
            placeholder="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit">Enter</button>
        </form>
      </div>
    </div>
  );
}
