import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, User, LogOut, LogIn } from 'lucide-react';
import { useApp } from '../context/AppContext';

const ProfileModal = ({ onClose }) => {
  const { userProfile, setUserProfile } = useApp();
  const [form, setForm] = useState({ ...userProfile });

  const handleSave = () => {
    setUserProfile({ ...form, isAuthenticated: true });
    onClose();
  };

  const handleSignOut = () => {
    setUserProfile({ name: '', age: '', level: 'undergraduate', isAuthenticated: false });
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        className="notion-card w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="profile-avatar" style={{ width: 48, height: 48, fontSize: '1.2rem' }}>
              {form.name ? form.name[0].toUpperCase() : <User size={20} />}
            </div>
            <div>
              <h3 className="font-heading text-lg">{form.name || 'Your Profile'}</h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{form.level}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }} className="hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Name</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Your full name"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Age</label>
            <input
              type="number"
              value={form.age}
              onChange={e => setForm(f => ({ ...f, age: e.target.value }))}
              placeholder="Your age"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Education Level</label>
            <select
              value={form.level}
              onChange={e => setForm(f => ({ ...f, level: e.target.value }))}
              className="w-full"
            >
              <option value="high school">High School</option>
              <option value="undergraduate">Undergraduate</option>
              <option value="postgraduate">Postgraduate</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button className="notion-button flex-1" onClick={handleSave}>
            <LogIn size={16} />
            Save Profile
          </button>
          {userProfile.isAuthenticated && (
            <button
              onClick={handleSignOut}
              className="notion-small-button"
              style={{ borderColor: 'var(--error)', color: 'var(--error)' }}
            >
              <LogOut size={14} />
              Sign Out
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ProfileModal;
