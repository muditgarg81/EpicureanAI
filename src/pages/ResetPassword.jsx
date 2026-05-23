import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleReset = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setMessage('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      
      setSuccess(true);
      setMessage('Password updated successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (error) {
      setMessage(error.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-container-margin bg-background">
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-container/20 rounded-full blur-[100px]"></div>
        <div className="absolute top-1/2 -left-48 w-[500px] h-[500px] bg-secondary-container/10 rounded-full blur-[120px]"></div>
      </div>

      <main className="w-full max-w-md glass-panel p-xl rounded-3xl shadow-xl space-y-lg">
        <div className="text-center space-y-base">
          <h1 className="font-display-md text-display-md text-on-background">New Password</h1>
          <p className="font-body-md text-on-surface-variant">Enter your new secure password below.</p>
        </div>

        <form onSubmit={handleReset} className="flex flex-col gap-4">
          <div className="space-y-xs">
            <label className="font-label-md text-on-background ml-2">New Password</label>
            <input 
              type="password" 
              placeholder="Min 6 characters" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl px-6 py-3 bg-surface-container border-none ring-1 ring-outline-variant focus:ring-2 focus:ring-primary outline-none transition-all"
              required
              minLength={6}
            />
          </div>

          <div className="space-y-xs">
            <label className="font-label-md text-on-background ml-2">Confirm Password</label>
            <input 
              type="password" 
              placeholder="Repeat new password" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-2xl px-6 py-3 bg-surface-container border-none ring-1 ring-outline-variant focus:ring-2 focus:ring-primary outline-none transition-all"
              required
              minLength={6}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading || success}
            className="w-full h-14 bg-primary text-on-primary rounded-full font-label-md shadow-lg active:scale-95 transition-all disabled:opacity-70 mt-4"
          >
            {loading ? 'Updating...' : (success ? 'Updated!' : 'Update Password')}
          </button>
        </form>

        {message && (
          <p className={`text-center font-label-sm p-3 rounded-xl ${success ? 'bg-primary/10 text-primary' : 'bg-error/10 text-error'} animate-fade-in`}>
            {message}
          </p>
        )}
      </main>
    </div>
  );
};

export default ResetPassword;
