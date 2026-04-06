import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signUp, signIn } from '../firebase.js';
import { useAuth } from '../AuthProvider.jsx';

export default function LoginPage() {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  if (!loading && user) {
    navigate('/');
  }

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      if (isSignup) {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
      navigate('/');
    } catch (err) {
      setError(err.message || 'Authentication failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-md p-6 bg-white rounded-xl shadow-md">
        <h2 className="text-2xl font-bold mb-4">{isSignup ? 'Sign up' : 'Sign in'}</h2>
        {error && <div className="mb-3 text-sm text-rose-600">{error}</div>}
        <form onSubmit={submit} className="space-y-3">
          <input
            className="w-full border rounded-md px-3 py-2"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
          />
          <input
            className="w-full border rounded-md px-3 py-2"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
          />
          <div className="flex items-center justify-between">
            <button className="bg-indigo-600 text-white px-4 py-2 rounded-md" type="submit">
              {isSignup ? 'Create account' : 'Sign in'}
            </button>
            <button
              type="button"
              onClick={() => setIsSignup(!isSignup)}
              className="text-sm text-slate-600 hover:underline"
            >
              {isSignup ? 'Already have an account?' : 'Create account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
