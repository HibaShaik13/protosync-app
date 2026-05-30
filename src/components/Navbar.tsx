/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Sun, 
  Moon, 
  Bell, 
  ChevronDown, 
  LogOut, 
  Sparkles,
  Database,
  UserCheck
} from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  user: User;
  onLogout: () => void;
  selectedWorkspace: string;
  setSelectedWorkspace: (name: string) => void;
  onNewRequestTrigger: () => void;
}

export default function Navbar({ 
  user, 
  onLogout, 
  selectedWorkspace, 
  setSelectedWorkspace,
  onNewRequestTrigger 
}: NavbarProps) {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const cached = localStorage.getItem('protosync_theme');
    if (cached === 'light') {
      document.body.classList.add('light');
      return 'light';
    } else {
      document.body.classList.remove('light');
      return 'dark';
    }
  });

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('protosync_theme', next);
    if (next === 'light') {
      document.body.classList.add('light');
    } else {
      document.body.classList.remove('light');
    }
  };

  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [searchVal, setSearchVal] = useState('');

  const notifications = [
    { id: 'n1', text: 'Gateway deployment node "us-east-1" is healthy', isNew: true },
    { id: 'n2', text: 'Auth API spec synced automatically to postgres cluster', isNew: true },
    { id: 'n3', text: 'Upgrade to Enterprise workspace to unlock limitless sockets', isNew: false }
  ];

  return (
    <header className="h-[64px] border-b border-[#1a1f38] bg-[#070913]/85 backdrop-blur-xl px-5 flex items-center justify-between sticky top-0 z-30 w-full select-none">
      
      {/* 1. LEFT CONTROLS: Workspace switcher dropdown & "+ New" trigger */}
      <div className="flex items-center gap-3">
        
        {/* Workspace select box wrapper */}
        <div className="flex items-center gap-2 bg-[#0e1124] border border-[#1e244d] rounded-xl px-3 py-1.5 focus-within:border-purple-500/50 transition-all cursor-pointer">
          <Database className="w-3.5 h-3.5 text-purple-400" />
          <select
            value={selectedWorkspace}
            onChange={(e) => setSelectedWorkspace(e.target.value)}
            className="bg-transparent text-xs font-semibold text-zinc-200 focus:outline-none focus:ring-0 cursor-pointer p-0 border-0 font-sans"
          >
            <option value="My Workspace" className="bg-[#090b16] text-zinc-300">My Workspace</option>
            <option value="Production API Gateway" className="bg-[#090b16] text-zinc-300">Production API Gateway</option>
            <option value="Staging Environment" className="bg-[#090b16] text-zinc-300">Staging Environment</option>
            <option value="SaaS Partner Sanboxes" className="bg-[#090b16] text-zinc-300">SaaS Partner Sandboxes</option>
          </select>
        </div>

        {/* New trigger */}
        <button
          onClick={onNewRequestTrigger}
          className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 hover:border-purple-400 text-xs font-bold text-white tracking-wide rounded-xl border border-purple-500 shadow-md shadow-purple-900/10 cursor-pointer transition-all active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" /> <span>New</span>
        </button>

      </div>

      {/* 2. CENTER CONTROLS: High-density API Search Bar */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="Search collections or endpoints (Ctrl+K)"
            className="w-full bg-black/40 border border-white/5 pl-9 pr-6 py-2 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/40 focus:ring-1 focus:ring-purple-500/10 transition-colors font-sans"
          />
        </div>
      </div>

      {/* 3. RIGHT CONTROLS: Theme selector, bell alerts, profile card */}
      <div className="flex items-center gap-3">
        
        {/* Toggle Theme buttons */}
        <button
          onClick={toggleTheme}
          className="p-2 bg-[#0e1124] hover:bg-[#1a1f3d] border border-white/5 rounded-xl text-[#53629e] hover:text-white transition-all cursor-pointer"
          title="Toggle system theme"
        >
          {theme === 'dark' ? <Moon className="w-4 h-4 text-purple-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
        </button>

        {/* Dynamic notifications dropdown block */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotificationDropdown(!showNotificationDropdown);
              setShowUserDropdown(false);
            }}
            className={`p-2 bg-[#0e1124] hover:bg-[#1a1f3d] border border-white/5 rounded-xl text-[#53629e] hover:text-white transition-all cursor-pointer relative ${
              showNotificationDropdown ? 'text-white border-purple-500/30' : ''
            }`}
          >
            <Bell className="w-4 h-4 text-zinc-400" />
            
            {/* Notifications Count badge */}
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-purple-600 text-[8px] font-black text-white flex items-center justify-center rounded-full leading-none border border-[#070913]">
              3
            </span>
          </button>

          {showNotificationDropdown && (
            <div className="absolute right-0 mt-2.5 w-72 bg-[#0a0c1a]/95 border border-[#1b2247] rounded-2xl shadow-2xl p-4 overflow-hidden z-50 backdrop-blur-3xl animate-fadeIn">
              <div className="flex justify-between items-center pb-2 border-b border-white/5 mb-3">
                <span className="text-[10px] font-mono font-bold text-zinc-500 tracking-wider">WORKSPACE ALERTS (3)</span>
                <span className="text-[8px] font-mono text-purple-400 cursor-pointer font-bold">CLEAR ALL</span>
              </div>
              
              <div className="space-y-2.5 max-h-[220px] overflow-y-auto">
                {notifications.map((item) => (
                  <div key={item.id} className="p-2 rounded-xl bg-black/40 border border-white/5 hover:bg-white/[0.01] transition-all flex gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${item.isNew ? 'bg-purple-400' : 'bg-zinc-600'}`} />
                    <span className="text-[11px] font-sans text-zinc-300 leading-tight">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Vertical Separator */}
        <div className="w-[1px] h-5 bg-[#1a1f38]" />

        {/* User initials with logout dropdown and hover effects */}
        <div className="relative">
          <button
            onClick={() => {
              setShowUserDropdown(!showUserDropdown);
              setShowNotificationDropdown(false);
            }}
            className="flex items-center gap-2.5 hover:opacity-90 cursor-pointer p-1 rounded-xl focus:outline-none font-sans"
          >
            <div className="w-7 h-7 bg-indigo-600 font-extrabold text-xs text-white flex items-center justify-center rounded-full shadow-md shadow-indigo-900/20 select-none">
              AD
            </div>
            
            <div className="hidden lg:block text-left leading-none tracking-tight">
              <div className="font-semibold text-xs text-zinc-100 uppercase">{user.fullName}</div>
              <span className="text-[9px] font-mono text-purple-400 font-bold leading-none">Admin</span>
            </div>
            
            <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 transition-transform duration-200 ${
              showUserDropdown ? 'rotate-185' : ''
            }`} />
          </button>

          {showUserDropdown && (
            <div className="absolute right-0 mt-2.5 w-48 bg-[#0a0c1a]/95 border border-[#1b2247] rounded-xl shadow-2xl overflow-hidden z-50 backdrop-blur-3xl animate-fadeIn font-sans">
              
              {/* Profile Details header */}
              <div className="px-4 py-3 bg-black/40 border-b border-white/5 text-[11px]">
                <p className="text-zinc-400 truncate">Account Active</p>
                <p className="font-semibold text-white truncate text-[10px] text-purple-400 select-all font-mono">{user.email}</p>
              </div>

              {/* Action options */}
              <div className="p-1 space-y-0.5">
                <button
                  onClick={() => alert(`Organization profile sync established under Subdomain: ${user.workspaceName}.protosync.dev`)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs text-zinc-300 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5 text-purple-400" />
                  Organization Policy
                </button>
                
                <button
                  onClick={onLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>

            </div>
          )}
        </div>

      </div>

    </header>
  );
}
