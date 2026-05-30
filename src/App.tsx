/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Terminal, Info, X } from 'lucide-react';
import GridBackground from './components/GridBackground';
import HeroSection from './components/HeroSection';
import AuthForm from './components/AuthForm';
import DashboardDemo from './components/DashboardDemo';
import { AuthMode, User } from './types';

export default function App() {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [user, setUser] = useState<User | null>(null);
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  // Synchronize dynamic initial theme preference
  useEffect(() => {
    const cached = localStorage.getItem('protosync_theme');
    if (cached === 'light') {
      document.body.classList.add('light');
    } else {
      document.body.classList.remove('light');
    }
  }, []);

  // Read stored session cache if it exists
  useEffect(() => {
    const saved = localStorage.getItem('protosync_user_token');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUser(parsed);
        triggerToast(`Welcome back, ${parsed.fullName}! Active workspace loaded.`, 'success');
      } catch (e) {
        localStorage.removeItem('protosync_user_token');
      }
    } else {
      // Trigger a warm initial developer onboarding banner
      setTimeout(() => {
        triggerToast('Ready to launch. Use simulated or social login to start API sandboxing!', 'info');
      }, 1000);
    }
  }, []);

  const triggerToast = (text: string, type: 'success' | 'info' = 'success') => {
    setNotification({ text, type });
  };

  // Close toast automatically
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleAuthSuccess = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    localStorage.setItem('protosync_user_token', JSON.stringify(authenticatedUser));
    triggerToast(`Workspace established! Hello ${authenticatedUser.fullName}.`, 'success');
  };

  const handleLogout = () => {
    // 6. Logout: Clear JWT, Clear Local Storage, Clear all cached metrics/variables
    localStorage.removeItem('protosync_user_token');
    localStorage.removeItem('protosync_cached_cols');
    localStorage.removeItem('protosync_cached_envs');
    localStorage.removeItem('protosync_cached_history');
    localStorage.removeItem('protosync_workspaces_list_v2');
    localStorage.removeItem('protosync_team_seats');
    
    // Completely purge all local storage keys to prevent trace leaks
    try {
      localStorage.clear();
    } catch (e) {
      console.error("Local storage purge failed:", e);
    }

    setUser(null);
    triggerToast('Securely disconnected from ProtoSync cluster gateway node and caches purged.', 'info');
  };

  return (
    <div className="min-h-screen relative flex flex-col justify-between text-zinc-100 selection:bg-purple-500/30 selection:text-white">
      {/* Dynamic Cyberpunk backgrounds */}
      <GridBackground />

      {/* Dynamic Visual Toast Notifications overlay */}
      <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4">
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="glass-card border border-purple-500/20 bg-slate-950/85 backdrop-blur-xl rounded-xl p-3.5 shadow-xl flex items-start gap-3 relative"
            >
              <div className="p-1 rounded bg-purple-500/10 text-purple-400 shrink-0 mt-0.5">
                {notification.type === 'success' ? <Sparkles className="w-4 h-4" /> : <Info className="w-4 h-4 text-cyan-400" />}
              </div>
              <div className="flex-1 pr-6">
                <p className="font-mono text-[10px] uppercase font-bold text-zinc-500">SYSTEM NOTIFICATION</p>
                <p className="text-[11px] text-zinc-200 mt-1 font-sans font-medium">{notification.text}</p>
              </div>
              <button 
                onClick={() => setNotification(null)}
                className="absolute right-2 top-2 p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Core Viewport Container */}
      <main className={`flex-1 flex ${user ? 'items-stretch p-0 m-0 w-full overflow-hidden' : 'items-center justify-center p-4 sm:p-6 md:p-10'}`}>
        <AnimatePresence mode="wait">
          {!user ? (
            /* AUTHENTICATION VIEW */
            <motion.div
              key="auth-view"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 min-h-[580px] rounded-3xl overflow-hidden glass-card border border-white/5 shadow-3xl bg-black/25 relative"
            >
              {/* Scanline atmospheric visual filter */}
              <div className="absolute inset-0 scanline pointer-events-none opacity-[0.2]" />

              {/* LEFT SIDE HERO PANEL - Column Range 7 */}
              <div className="hidden lg:block lg:col-span-7 bg-gradient-to-br from-purple-950/20 via-black/10 to-transparent border-r border-white/5 relative">
                {/* Visual neon glowing light behind illustrations */}
                <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-purple-600/5 rounded-full blur-[100px] pointer-events-none" />
                <HeroSection />
              </div>

              {/* RIGHT SIDE FORM PANEL - Column Range 5 */}
              <div className="lg:col-span-5 flex flex-col justify-center py-10 relative">
                
                {/* Mobile display logo and caption */}
                <div className="lg:hidden text-center px-6 mb-2">
                  <h1 className="font-display text-4xl font-extrabold tracking-tight text-white leading-[1.15]">
                    Build, Test & Scale <br />
                    <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                      APIs Faster
                    </span>
                  </h1>
                  <p className="text-zinc-400 text-xs mt-2.5 max-w-xs mx-auto">
                    Modern API collaboration platform for developer teams.
                  </p>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={authMode}
                    initial={{ opacity: 0, x: authMode === 'login' ? 30 : -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: authMode === 'login' ? -30 : 30 }}
                    transition={{ type: "tween", duration: 0.35 }}
                  >
                    <AuthForm 
                      onSuccess={handleAuthSuccess}
                      currentMode={authMode}
                      onModeChange={setAuthMode}
                    />
                  </motion.div>
                </AnimatePresence>

              </div>

            </motion.div>
          ) : (
            /* PREMIUM LIVE SAAS DASHBOARD INTERACTIVE PLAYGROUND VIEW */
            <motion.div
              key="dashboard-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full"
            >
              <DashboardDemo user={user} onLogout={handleLogout} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Cybernetic Footer bar */}
      {!user && (
        <footer className="py-4 border-t border-white/5 bg-black/20 text-center text-[10px] text-zinc-500 font-mono tracking-wider relative z-30">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <span>PROTOSYNC DISTRIBUTED NETWORK CLUSTER INC • ALL RIGHTS SECURED</span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1"><Terminal className="w-3 h-3 text-purple-500" /> CLUSTER STATUS: RESPONSIVE</span>
              <span className="text-zinc-600">UTC: 2026-05-26 09:13</span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
