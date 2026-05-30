/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Layers, 
  MoreVertical, 
  Database, 
  Users, 
  Check, 
  Trash2,
  Lock
} from 'lucide-react';
import { User } from '../../types';

interface WorkspacesViewProps {
  user: User;
  selectedWorkspace: string;
  setSelectedWorkspace: (name: string) => void;
  showNotification: (msg: string) => void;
}

interface WorkspaceItem {
  id: string;
  name: string;
  collectionsCount: number;
  apisCount: number;
  lastUpdated: string;
  avatarSeed: string[];
}

export default function WorkspacesView({ 
  user, 
  selectedWorkspace, 
  setSelectedWorkspace,
  showNotification 
}: WorkspacesViewProps) {

  // Load and seed default workspace variables securely via state
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>(() => {
    const cached = localStorage.getItem('protosync_workspaces_list_v2');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        // fall back
      }
    }
    
    return [
      {
        id: 'ws-default',
        name: user.workspaceName || 'My Workspace',
        collectionsCount: 0,
        apisCount: 0,
        lastUpdated: 'Just now',
        avatarSeed: [user.fullName ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase() : 'ME']
      }
    ];
  });

  const [creatorModalOpen, setCreatorModalOpen] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [newColCount, setNewColCount] = useState('3');
  const [newApiCount, setNewApiCount] = useState('10');

  // Sync state changes to LocalStorage instantly
  useEffect(() => {
    localStorage.setItem('protosync_workspaces_list_v2', JSON.stringify(workspaces));
    
    // Auto sync selected workspace value to current list if not exists
    const match = workspaces.some(w => w.name === selectedWorkspace);
    if (!match && workspaces.length > 0) {
      setSelectedWorkspace(workspaces[0].name);
    }
  }, [workspaces]);

  const handleCreateWorkspaceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim()) return;

    const exists = workspaces.some(w => w.name.toLowerCase() === newWsName.trim().toLowerCase());
    if (exists) {
      showNotification('Workspace already exists inside active cluster schema.');
      return;
    }

    const newWs: WorkspaceItem = {
      id: 'ws-' + Math.random().toString(36).substring(4, 9),
      name: newWsName.trim(),
      collectionsCount: parseInt(newColCount) || 0,
      apisCount: parseInt(newApiCount) || 0,
      lastUpdated: 'Just now',
      avatarSeed: ['AS', 'JD']
    };

    setWorkspaces(prev => [...prev, newWs]);
    setSelectedWorkspace(newWs.name);
    setNewWsName('');
    setCreatorModalOpen(false);
    showNotification(`Successfully provisioned namespace: "${newWs.name}"`);
  };

  const toggleWorkspaceStatus = (id: string, name: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setWorkspaces(prev => prev.map(w => {
      if (w.id === id) {
        const nextStatus = w.status === 'inactive' ? 'active' : 'inactive';
        showNotification(`Workspace "${name}" is now ${nextStatus === 'inactive' ? 'INACTIVE & SUSPENDED' : 'FULLY ACTIVE'}`);
        return { ...w, status: nextStatus };
      }
      return w;
    }));
  };

  const handleDeleteWorkspace = (id: string, name: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Avoid switching trigger
    
    if (workspaces.length <= 1) {
      showNotification('Cannot purge the final workspace context.');
      return;
    }

    const filtered = workspaces.filter(w => w.id !== id);
    setWorkspaces(filtered);
    
    if (selectedWorkspace === name) {
      setSelectedWorkspace(filtered[0].name);
    }
    showNotification(`Safely deleted workspace metadata: "${name}"`);
  };

  return (
    <div className="space-y-5 animate-fadeIn font-sans p-1 max-w-[1550px] mx-auto select-none relative">
      
      {/* 1. TOP HEADER PANEL */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-zinc-900">
        <div>
          <h1 className="text-xl font-bold font-display text-white tracking-tight">All Workspaces</h1>
          <p className="text-zinc-500 text-xs mt-0.5">Manage and collaborate in your workspaces.</p>
        </div>

        <button
          onClick={() => setCreatorModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-[#6D4AFF] to-[#8B5CF6] hover:from-[#8B5CF6] hover:to-[#a78bfa] text-white font-bold text-[11px] rounded-lg tracking-wide transition-all shadow-[0_0_15px_rgba(109,74,255,0.25)] hover:shadow-[0_0_20px_rgba(139,92,246,0.45)] cursor-pointer active:scale-[0.98]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ New Workspace</span>
        </button>
      </div>

      {/* 2. DENSE WORKSPACE GRID (3 COLUMNS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {workspaces.map((ws) => {
          const isActive = selectedWorkspace === ws.name;
          const isInactive = ws.status === 'inactive';
          return (
            <div
              key={ws.id}
              onClick={() => {
                if (isInactive) {
                  showNotification(`Cannot switch to "${ws.name}". This workspace is suspended (Stopped).`);
                  return;
                }
                setSelectedWorkspace(ws.name);
                showNotification(`Switched database tenant context to "${ws.name}"`);
              }}
              className={`h-[220px] rounded-2xl p-5 bg-gradient-to-b from-[#0b0c16] to-[#04050d] border flex flex-col justify-between shadow-[0_4px_30px_rgba(0,0,0,0.5)] cursor-pointer backdrop-blur-md relative overflow-hidden group select-none transition-all duration-300 ${
                isActive 
                  ? 'border-[#6D4AFF] shadow-[0_0_25px_rgba(109,74,255,0.15)] ring-1 ring-[#6D4AFF]/50'
                  : 'border-[#141830] hover:border-[#8B5CF6]/40 hover:shadow-[0_0_20px_rgba(139,92,246,0.1)] hover:-translate-y-0.5'
              }`}
            >
              {/* Inactive Suspension Overlay */}
              {isInactive && (
                <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-20 flex flex-col items-center justify-center p-4 text-center space-y-2 animate-fadeIn rounded-2xl">
                  <Lock className="w-6 h-6 text-purple-500 animate-pulse" />
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase font-display tracking-wider">WORKSPACE INACTIVE</h4>
                    <p className="text-[10px] text-zinc-500 mt-1 max-w-[190px] mx-auto leading-normal">
                      Inactive status: Members lose access. Restricting workspace cache operations.
                    </p>
                  </div>
                  <button
                    onClick={(e) => toggleWorkspaceStatus(ws.id, ws.name, e)}
                    className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-[9px] rounded-lg tracking-wide transition-all uppercase cursor-pointer"
                  >
                    Restore workloads
                  </button>
                </div>
              )}

              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/[0.01] rounded-full blur-2xl pointer-events-none transition-opacity group-hover:bg-purple-500/[0.04]" />

              {/* Top Row: Title & Options */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`p-1.5 rounded-lg border shrink-0 transition-colors ${
                    isActive ? 'bg-[#6D4AFF]/10 border-[#6D4AFF]/20 text-purple-400' : 'bg-zinc-950/40 border-zinc-900 text-zinc-500'
                  }`}>
                    <Database className="w-4 h-4 shrink-0" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors truncate font-display">
                      {ws.name}
                    </h3>
                    <p className="text-[10px] text-zinc-500 font-mono mt-0.5 uppercase tracking-wider font-semibold">Active Tenant ID</p>
                  </div>
                </div>

                {/* Switch indicator, stop workloads option, or delete trash bin */}
                <div className="flex items-center gap-2 shrink-0 z-10">
                  <button
                    onClick={(e) => toggleWorkspaceStatus(ws.id, ws.name, e)}
                    className="p-1 px-1.5 text-[8.5px] font-mono rounded bg-zinc-950 border border-white/5 hover:border-purple-500/20 font-bold transition-all text-purple-400 hover:text-purple-300"
                    title={isInactive ? "Resume workloads" : "Stop workloads"}
                  >
                    {isInactive ? "✓ RESUME" : "🛑 STOP"}
                  </button>
                  {isActive ? (
                    <span className="text-[8px] font-mono font-black text-purple-300 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded uppercase flex items-center gap-1 shadow-sm leading-none h-5">
                      <Check className="w-3.5 h-3.5 text-purple-400" /> ACTIVE
                    </span>
                  ) : (
                    <button
                      onClick={(e) => handleDeleteWorkspace(ws.id, ws.name, e)}
                      className="p-1 text-zinc-600 hover:text-red-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 rounded-lg transition-colors cursor-pointer select-none"
                      title="Deallocate workspace metadata"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Middle Row: Collections count & APIs count */}
              <div className="py-2.5">
                <div className="flex items-center gap-4 text-xs font-semibold text-zinc-400">
                  <div className="space-y-0.5">
                    <span className="block text-lg font-bold text-white font-display tracking-tight leading-tight">{ws.collectionsCount}</span>
                    <span className="text-[10px] text-zinc-500">Collections</span>
                  </div>
                  <span className="text-zinc-800 text-lg">|</span>
                  <div className="space-y-0.5">
                    <span className="block text-lg font-bold text-white font-display tracking-tight leading-tight">{ws.apisCount}</span>
                    <span className="text-[10px] text-zinc-500">API endpoints</span>
                  </div>
                </div>
              </div>

              {/* Bottom Row: Team overlapping avatars & Updated indicator */}
              <div className="flex items-center justify-between border-t border-zinc-900/60 pt-3 select-none">
                {/* Overlapping circle design layout initials */}
                <div className="flex items-center gap-1">
                  <div className="flex -space-x-2.5 overflow-hidden">
                    {ws.avatarSeed.map((ini, index) => (
                      <div 
                        key={ini + index}
                        className={`inline-block h-6 w-6 rounded-full border border-[#04050d] text-[9px] font-extrabold flex items-center justify-center font-mono uppercase bg-gradient-to-br transition-all duration-300 text-purple-200 ${
                          index % 2 === 0 ? 'from-[#6D4AFF] to-[#8B5CF6]' : 'from-indigo-600 to-sky-500'
                        }`}
                      >
                        {ini}
                      </div>
                    ))}
                    {/* Glowing +5 badges */}
                    <div className="inline-block h-6 w-6 rounded-full border border-[#04050d] bg-[#141830] text-[8px] font-bold font-mono text-[#8792c2] flex items-center justify-center">
                      +5
                    </div>
                  </div>
                  <span className="text-[9.5px] text-zinc-500 font-sans ml-1 select-none">Team members</span>
                </div>

                <span className="text-[10px] text-zinc-600 font-mono flex items-center gap-1 select-none">
                  Updated {ws.lastUpdated}
                </span>
              </div>

            </div>
          );
        })}

        {/* 3. DASHED CREATE WORKSPACE CARD BUTTON */}
        <div
          onClick={() => setCreatorModalOpen(true)}
          className="h-[220px] rounded-2xl border-2 border-dashed border-[#1e2447] bg-black/10 hover:bg-[#6D4AFF]/5 hover:border-purple-500/50 flex flex-col items-center justify-center gap-2 cursor-pointer shadow-lg group select-none transition-all duration-300 text-center p-5 hover:shadow-[0_0_20px_rgba(109,74,255,0.1)] active:scale-[0.99]"
        >
          <div className="p-3 rounded-full bg-[#6D4AFF]/10 text-[#6D4AFF] group-hover:bg-[#6D4AFF]/20 group-hover:text-[#8B5CF6] transition-all group-hover:scale-110 shadow-inner">
            <Plus className="w-5 h-5 shrink-0" />
          </div>
          <p className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors tracking-wide font-display mt-1">
            + Create Workspace
          </p>
          <p className="text-[10px] text-zinc-500 max-w-[190px] mx-auto. leading-relaxed">
            De-allocate and spawn new database schemas for your team.
          </p>
        </div>
      </div>

      {/* 4. MODAL CREATOR DIALOG OVERLAY */}
      {creatorModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0b0c16]/95 border border-[#1e2447] rounded-3xl p-6 max-w-md w-full shadow-2xl relative font-sans animate-zoomIn space-y-4">
            
            <div className="space-y-1">
              <h2 className="text-base font-bold text-white tracking-tight font-display mb-1">Create New Workspace</h2>
              <p className="text-zinc-500 text-xs">Provision a secure isolated tenant schema inside our primary PostgreSQL clusters.</p>
            </div>

            <form onSubmit={handleCreateWorkspaceSubmit} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-zinc-500 font-mono">Workspace Schema Title</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Core Billing Engine"
                  value={newWsName}
                  onChange={(e) => setNewWsName(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#6D4AFF] font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pb-1">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-zinc-500 font-mono">Default Collections</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 5"
                    value={newColCount}
                    onChange={(e) => setNewColCount(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-zinc-300 font-mono focus:outline-none focus:border-[#6D4AFF]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-zinc-500 font-mono">Mock APIs</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 15"
                    value={newApiCount}
                    onChange={(e) => setNewApiCount(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-zinc-300 font-mono focus:outline-none focus:border-[#6D4AFF]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-900 select-none">
                <button
                  type="button"
                  onClick={() => setCreatorModalOpen(false)}
                  className="px-4 py-2 hover:bg-white/5 border border-transparent rounded-xl text-xs font-bold text-zinc-400 hover:text-white cursor-pointer select-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl text-xs font-bold text-white shadow-lg cursor-pointer"
                >
                  Confirm Provision
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
