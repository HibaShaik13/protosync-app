/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Terminal, 
  Database, 
  Layers, 
  Zap, 
  History, 
  FileText, 
  Globe, 
  Activity, 
  Settings, 
  Users, 
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { User } from '../types';

export type SidebarTab = 
  | 'dashboard' 
  | 'workspaces' 
  | 'collections' 
  | 'apitester' 
  | 'history' 
  | 'documentation' 
  | 'analytics' 
  | 'settings' 
  | 'team';

interface SidebarProps {
  activeTab: SidebarTab;
  setActiveTab: (tab: SidebarTab) => void;
  user: User;
  onLogout: () => void;
  requestsCount: number;
}

export default function Sidebar({ activeTab, setActiveTab, user, onLogout, requestsCount }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Layers },
    { id: 'workspaces', label: 'Workspaces', icon: Database },
    { id: 'collections', label: 'Collections', icon: Globe },
    { id: 'apitester', label: 'API Tester', icon: Zap },
    { id: 'history', label: 'History', icon: History },
    { id: 'documentation', label: 'Documentation', icon: FileText },
    { id: 'analytics', label: 'Analytics', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'team', label: 'Team', icon: Users },
  ] as const;

  const quotaRatio = Math.min(100, Math.round((requestsCount / 20000) * 100));

  return (
    <aside className="w-[245px] shrink-0 border-r border-[#1a1f38] bg-[#070913] h-screen flex flex-col justify-between sticky top-0 font-sans select-none z-40">
      
      {/* Top Section - Brand Identification */}
      <div className="p-5 border-b border-[#0d1123] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Zap className="w-4 h-4 text-white animate-pulse" />
          </div>
          <span className="font-display font-black text-sm tracking-widest text-white uppercase bg-gradient-to-r from-white to-zinc-400 bg-clip-text">
            PROTOSYNC
          </span>
        </div>
        <span className="text-[9px] font-mono text-[#4e5a94] bg-[#4e5a94]/10 border border-[#4e5a94]/20 px-1.5 py-0.5 rounded uppercase font-bold">
          v1.4
        </span>
      </div>

      {/* Center Section - Scrollable Navigation Menu Triggers */}
      <div className="flex-1 overflow-y-auto pt-4 px-3 space-y-1 scrollbar-none">
        <div className="px-2 pb-1.5 text-[10px] font-mono text-zinc-500 tracking-wider uppercase font-extrabold">
          DEVELOPER WORKSPACE
        </div>
        
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              id={`sidebar-item-${item.id}`}
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 outline-none select-none relative group cursor-pointer ${
                isActive 
                  ? 'bg-purple-950/20 border border-purple-500/30 text-white shadow-[0_0_15px_rgba(147,51,234,0.15)] font-bold' 
                  : 'text-[#8792c2] hover:bg-white/[0.02] hover:text-white border border-transparent'
              }`}
            >
              <IconComponent className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${
                isActive ? 'text-purple-400' : 'text-[#53629e]'
              }`} />
              <span className="truncate flex-1 text-left">{item.label}</span>
              
              {/* Highlight Neon bar indicator */}
              {isActive && (
                <span className="absolute right-2.5 w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_#a855f7]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Section - Plan Stats & User Card */}
      <div className="p-4 border-t border-[#0d1123] space-y-3 shrink-0">
        
        {/* Pro Plan Indicator Widget */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-b from-[#101429] to-[#0a0c1a] border border-[#1e2447] relative overflow-hidden">
          <div className="absolute right-[-15px] top-[-15px] w-14 h-14 bg-purple-500/5 rounded-full blur-xl pointer-events-none" />
          
          <div className="flex items-center justify-between text-[10px] font-mono font-bold text-purple-300 leading-none mb-2">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-spin" /> PRO PLAN
            </span>
            <span>{quotaRatio}% USE</span>
          </div>

          <div className="h-1 text-zinc-800 bg-zinc-900 rounded-full overflow-hidden mb-2.5">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500 rounded-full" 
              style={{ width: `${quotaRatio}%` }} 
            />
          </div>

          <div className="flex items-center justify-between gap-2.5">
            <span className="text-[9px] text-[#5561a3] font-mono whitespace-nowrap">
              {requestsCount.toLocaleString()} / 20k Calls
            </span>
            <button
              onClick={() => alert(`Simulated Plan Upgrade Interface. Workspace quota extended indefinitely!`)}
              className="px-2 py-1 bg-purple-600 hover:bg-purple-500 text-[8px] font-bold text-white tracking-widest uppercase rounded cursor-pointer leading-none transition-colors border border-purple-500"
            >
              UPGRADE
            </button>
          </div>
        </div>

        {/* User Workspace Profile metadata */}
        <div className="flex items-center justify-between text-[11px] font-sans text-zinc-500 bg-black/20 p-2 rounded-xl border border-white/5">
          <div className="flex items-center gap-2 truncate">
            <div className="w-6.5 h-6.5 rounded-full bg-purple-600/25 border border-purple-500/30 font-bold text-[10px] text-purple-300 flex items-center justify-center uppercase select-none font-mono tracking-tight shrink-0">
              {user.fullName.substring(0, 2)}
            </div>
            <div className="truncate leading-none">
              <div id="username-display" className="font-semibold text-zinc-300 truncate leading-tight">{user.fullName}</div>
              <span className="text-[8px] font-mono text-[#4a589e]">ADMIN</span>
            </div>
          </div>
          
          {/* Status glow indicators */}
          <div className="flex items-center gap-1 shrink-0 ml-1.5" title="Connected to cloud master node">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block align-middle animate-pulse" />
            <span className="text-[8px] font-mono font-bold text-emerald-400">ONLINE</span>
          </div>
        </div>

      </div>

    </aside>
  );
}
