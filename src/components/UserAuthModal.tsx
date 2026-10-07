'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, User, Mail, Sparkles, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { CloudUser } from '@/lib/userDb';

interface UserAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: Partial<CloudUser>) => void;
  initialMode?: 'signin' | 'signup';
}

export function UserAuthModal({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = 'signin',
}: UserAuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: username.trim(),
            email: email.trim(),
            name: name.trim() || username.trim(),
            password,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to register account');
        }

        onAuthSuccess(data.user);
        onClose();
      } else {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: username.trim(),
            password,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Invalid credentials');
        }

        onAuthSuccess(data.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 10 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          className="relative w-full max-w-md rounded-3xl glass-panel p-6 sm:p-7 z-10 border border-white/[0.1] shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-400" />
                <span>{mode === 'signup' ? 'Create CloudDrive Account' : 'Sign in to CloudDrive'}</span>
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                {mode === 'signup'
                  ? 'Get your personal cloud vault & direct CDN links'
                  : 'Access your private drive and upload media'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex rounded-xl bg-white/[0.03] p-1 border border-white/[0.06] mt-5 mb-5">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError(null);
              }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === 'signin'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
              }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === 'signup'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 flex items-start gap-2 text-xs text-red-300"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                {mode === 'signup' ? 'Choose Username' : 'Username or Email'}
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-2.5 w-4 h-4 text-neutral-500" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={mode === 'signup' ? 'e.g. john_doe' : 'Enter username or email'}
                  className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-sky-500/50 focus:outline-none rounded-xl pl-10 pr-3 py-2 text-xs text-white placeholder:text-neutral-500 transition-colors"
                />
              </div>
            </div>

            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-2.5 w-4 h-4 text-neutral-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-sky-500/50 focus:outline-none rounded-xl pl-10 pr-3 py-2 text-xs text-white placeholder:text-neutral-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Full Name <span className="text-neutral-500 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your display name"
                    className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-sky-500/50 focus:outline-none rounded-xl px-3 py-2 text-xs text-white placeholder:text-neutral-500 transition-colors"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-2.5 w-4 h-4 text-neutral-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-sky-500/50 focus:outline-none rounded-xl pl-10 pr-3 py-2 text-xs text-white placeholder:text-neutral-500 transition-colors"
                />
              </div>
              {mode === 'signup' && (
                <p className="text-[10px] text-neutral-500 mt-1">Must be at least 6 characters.</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 disabled:opacity-60 transition-all cursor-pointer"
            >
              {loading ? (
                <span>Processing...</span>
              ) : (
                <>
                  <span>{mode === 'signup' ? 'Create Cloud Vault' : 'Sign In'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <div className="mt-5 pt-3 border-t border-white/[0.05] text-center">
            <p className="text-[11px] text-neutral-500">
              Distributed encrypted user ledger &bull; Kolkata &bull; Israel &bull; US Nodes
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
