/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Plus, 
  Layers, 
  Activity, 
  Cpu, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight, 
  Folder, 
  Globe, 
  Database, 
  Zap, 
  Sparkles, 
  ChevronRight, 
  Clock, 
  AlertCircle,
  Network
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, QueryHistory } from '../../types';

interface DashboardViewProps {
  user: User;
  historyLedger: QueryHistory[];
  onQuickRunMock: (method: 'GET' | 'POST', endpoint: string) => void;
  onRequestTabSwitch: (tab: any) => void;
  selectedWorkspace: string;
  setSelectedWorkspace: (name: string) => void;
}

interface ChartPoint {
  date: string;
  success: number;
  fail: number;
}

export default function DashboardView({ 
  user, 
  historyLedger, 
  onQuickRunMock, 
  onRequestTabSwitch,
  selectedWorkspace,
  setSelectedWorkspace
}: DashboardViewProps) {
  const [hoveredPointIdx, setHoveredPointIdx] = useState<number | null>(null);
  const [coords, setCoords] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Compute real metrics from the live backend history trace ledger
  const realRequestsCount = historyLedger.length;
  
  const successItems = historyLedger.filter(h => h.status >= 200 && h.status < 400);
  const realSuccessRate = realRequestsCount > 0 
    ? parseFloat(((successItems.length / realRequestsCount) * 100).toFixed(1)) 
    : 100;
  
  const totalLatency = historyLedger.reduce((sum, h) => sum + (h.latency || 0), 0);
  const realAvgLatency = realRequestsCount > 0 
    ? Math.round(totalLatency / realRequestsCount) 
    : 0;

  const realFailedRequests = historyLedger.filter(h => h.status >= 400 || h.status === 0).length;

  // Group real requests for the last 7 transaction runs
  const chartData: ChartPoint[] = [];
  const recentHistory = [...historyLedger].slice(0, 7).reverse();
  
  for (let i = 0; i < 7; i++) {
    if (i < recentHistory.length) {
      const item = recentHistory[i];
      chartData.push({
        date: `Run #${item.id.substring(item.id.length - 4)}`,
        success: item.status < 400 ? item.latency : 0,
        fail: item.status >= 400 ? item.latency : 0
      });
    } else {
      chartData.push({
        date: `---`,
        success: 0,
        fail: 0
      });
    }
  }

  // Width: 560, Height: 180 for SVG Chart coordinates
  const getSuccessY = (val: number) => {
    const maxVal = Math.max(100, ...chartData.map(d => Math.max(d.success, d.fail)));
    const ratio = val / maxVal;
    return 140 - ratio * 100; // Returns Y value
  };

  const getFailY = (val: number) => {
    const maxVal = Math.max(100, ...chartData.map(d => Math.max(d.success, d.fail)));
    const ratio = val / maxVal;
    return 150 - ratio * 80; // Returns Y value
  };

  // Convert points to SVG Path
  const successPoints = chartData.map((d, i) => `${(i * 90) + 20},${getSuccessY(d.success)}`);
  const successPath = `M ${successPoints.join(' L ')}`;
  const fillSuccessPath = `${successPath} L ${(chartData.length - 1) * 90 + 20},170 L 20,170 Z`;

  const failPoints = chartData.map((d, i) => `${(i * 90) + 20},${getFailY(d.fail)}`);
  const failPath = `M ${failPoints.join(' L ')}`;
  const fillFailPath = `${failPath} L ${(chartData.length - 1) * 90 + 20},170 L 20,170 Z`;

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCoords({ x, y });

    // Detect closest index
    const index = Math.round((x - 20) / 90);
    if (index >= 0 && index < chartData.length) {
      setHoveredPointIdx(index);
    } else {
      setHoveredPointIdx(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredPointIdx(null);
  };

  return (
    <div className="space-y-5 animate-fadeIn font-sans p-1 max-w-[1550px] mx-auto select-none">
      
      {/* 1. WELCOME HERO & ACTION BAR SECTION */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
        <div className="space-y-1">
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight font-display flex items-center gap-2">
            Welcome back, {user.fullName || 'Arjun'}! 👋
          </h1>
          <p className="text-zinc-400 text-xs font-sans tracking-wide">
            Here’s what’s happening with your APIs today.
          </p>
        </div>

        <button
          onClick={() => onRequestTabSwitch('apitester')}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-[#6D4AFF] to-[#8B5CF6] hover:from-[#8B5CF6] hover:to-[#a78bfa] text-white font-bold text-[11px] rounded-lg tracking-wide transition-all shadow-[0_0_15px_rgba(109,74,255,0.3)] hover:shadow-[0_0_20px_rgba(139,92,246,0.55)] cursor-pointer active:scale-[0.98]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ New Request</span>
        </button>
      </div>

      {/* 2. STATS CARDS ROW (EXACTLY 4 DETAILED METRIC BLOCKS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1 - Total Requests */}
        <div className="p-4 bg-gradient-to-b from-[#0b0c16] to-[#04050d] border border-[#141830] rounded-2xl flex flex-col justify-between h-[110px] shadow-[0_4px_30px_rgba(0,0,0,0.4)] backdrop-blur hover:border-[#6D4AFF]/30 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl pointer-events-none transition-opacity duration-300 group-hover:bg-purple-500/10" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold">Total Requests</span>
            <span className="p-1.5 bg-[#6D4AFF]/10 border border-[#6D4AFF]/20 rounded-lg text-[#6D4AFF]">
              <Database className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="flex items-end justify-between mt-2">
            <span className="text-2xl font-bold font-display text-white tracking-tight">{realRequestsCount}</span>
            <span className="flex items-center gap-0.5 text-emerald-400 font-mono text-[10px] font-bold">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Real time</span>
            </span>
          </div>
        </div>

        {/* Metric 2 - Success Rate */}
        <div className="p-4 bg-gradient-to-b from-[#0b0c16] to-[#04050d] border border-[#141830] rounded-2xl flex flex-col justify-between h-[110px] shadow-[0_4px_30px_rgba(0,0,0,0.4)] backdrop-blur hover:border-[#22c55e]/30 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none transition-opacity duration-300 group-hover:bg-emerald-500/10" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold">Success Rate</span>
            <span className="p-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
              <Activity className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="flex items-end justify-between mt-2">
            <span className="text-2xl font-bold font-display text-white tracking-tight">{realSuccessRate}%</span>
            <span className="flex items-center gap-0.5 text-emerald-400 font-mono text-[10px] font-bold">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Live trace</span>
            </span>
          </div>
        </div>

        {/* Metric 3 - Avg Response Time */}
        <div className="p-4 bg-gradient-to-b from-[#0b0c16] to-[#04050d] border border-[#141830] rounded-2xl flex flex-col justify-between h-[110px] shadow-[0_4px_30px_rgba(0,0,0,0.4)] backdrop-blur hover:border-[#0ea5e9]/30 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none transition-opacity duration-300 group-hover:bg-cyan-500/10" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold">Avg Response Time</span>
            <span className="p-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-cyan-400">
              <Clock className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="flex items-end justify-between mt-2">
            <span className="text-2xl font-bold font-display text-white tracking-tight">{realAvgLatency}ms</span>
            <span className="flex items-center gap-0.5 text-emerald-400 font-mono text-[10px] font-bold">
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>Nominal</span>
            </span>
          </div>
        </div>

        {/* Metric 4 - Failed Requests */}
        <div className="p-4 bg-gradient-to-b from-[#0b0c16] to-[#04050d] border border-[#141830] rounded-2xl flex flex-col justify-between h-[110px] shadow-[0_4px_30px_rgba(0,0,0,0.4)] backdrop-blur hover:border-[#ef4444]/30 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl pointer-events-none transition-opacity duration-300 group-hover:bg-rose-500/10" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold">Failed Requests</span>
            <span className="p-1.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400">
              <AlertCircle className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="flex items-end justify-between mt-2">
            <span className="text-2xl font-bold font-display text-white tracking-tight">{realFailedRequests}</span>
            <span className="flex items-center gap-0.5 text-emerald-400 font-mono text-[10px] font-bold">
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>Mitigated</span>
            </span>
          </div>
        </div>

      </div>

      {/* 3. CHART SECTION (65%) | RECENT ACTIVITY PANEL (35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-5 items-stretch">
        
        {/* CHART WORKBENCH PANEL - 65% width equivalent */}
        <div className="lg:col-span-6 p-5 bg-gradient-to-b from-[#0b0c16] to-[#04050d] border border-[#141830] rounded-2xl shadow-xl backdrop-blur flex flex-col justify-between relative overflow-hidden hover:border-zinc-800 transition-colors">
          <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500/[0.01] rounded-full blur-[120px] pointer-events-none" />
          
          <div className="flex items-center justify-between pb-3 border-b border-zinc-900">
            <div className="space-y-0.5">
              <h3 className="text-xs font-bold text-white font-display tracking-tight uppercase tracking-wider">Request Overview</h3>
              <p className="text-[10px] text-zinc-500">Real-time gateway transmission health indicator</p>
            </div>
            <select className="bg-black/35 border border-white/5 text-[10px] rounded-lg px-2 py-1 outline-none text-zinc-400 font-medium font-mono cursor-pointer hover:border-zinc-700">
              <option>Last 7 Days</option>
              <option>Last 24 Hours</option>
              <option>Last 30 Days</option>
            </select>
          </div>

          <div className="relative mt-5 mb-2 w-full flex-1 min-h-[180px]">
            {/* Legend indicators */}
            <div className="absolute right-0 top-0 flex items-center gap-4 text-[9px] font-mono pb-2 select-none z-10">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded bg-[#6D4AFF]" />
                <span className="text-zinc-400">Successful</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded bg-[#EF4444]" />
                <span className="text-zinc-400">Failed</span>
              </div>
            </div>

            <svg 
              viewBox="0 0 580 180" 
              className="w-full h-full overflow-visible"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              <defs>
                <linearGradient id="glow-success" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6D4AFF" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#6D4AFF" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="glow-fail" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#EF4444" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="#EF4444" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="line-success" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#6D4AFF" />
                  <stop offset="100%" stopColor="#8B5CF6" />
                </linearGradient>
              </defs>

              {/* Subtlest background grid wires */}
              <line x1="20" y1="40" x2="560" y2="40" stroke="#141830" strokeWidth="0.5" strokeDasharray="3,3" />
              <line x1="20" y1="90" x2="560" y2="90" stroke="#141830" strokeWidth="0.5" strokeDasharray="3,3" />
              <line x1="20" y1="140" x2="560" y2="140" stroke="#141830" strokeWidth="0.5" strokeDasharray="3,3" />
              <line x1="20" y1="170" x2="560" y2="170" stroke="#1d2345" strokeWidth="0.5" />

              {/* Verticals */}
              {chartData.map((_, i) => (
                <line key={i} x1={(i * 90) + 20} y1="40" x2={(i * 90) + 20} y2="170" stroke="#141830" strokeWidth="0.5" strokeDasharray="3,3" />
              ))}

              {/* Fills Area Under Curves */}
              <path d={fillSuccessPath} fill="url(#glow-success)" />
              <path d={fillFailPath} fill="url(#glow-fail)" />

              {/* Beautiful stroke Paths */}
              <path d={successPath} fill="none" stroke="url(#line-success)" strokeWidth="2" strokeLinecap="round" />
              <path d={failPath} fill="none" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="1,1" />

              {/* Interaction Elements over spikes */}
              {chartData.map((d, i) => {
                const sY = getSuccessY(d.success);
                const fY = getFailY(d.fail);
                const isHovered = hoveredPointIdx === i;

                return (
                  <g key={i}>
                    {/* Circle elements */}
                    <circle 
                      cx={(i * 90) + 20} 
                      cy={sY} 
                      r={isHovered ? 5 : 3} 
                      fill="#8B5CF6" 
                      stroke="#04050d" 
                      strokeWidth={1.5} 
                      className="transition-all duration-150"
                    />
                    <circle 
                      cx={(i * 90) + 20} 
                      cy={fY} 
                      r={isHovered ? 4.5 : 2.5} 
                      fill="#EF4444" 
                      stroke="#04050d" 
                      strokeWidth={1.5} 
                      className="transition-all duration-150"
                    />
                  </g>
                );
              })}

              {/* Vertical tracer cursor */}
              {hoveredPointIdx !== null && (
                <line 
                  x1={(hoveredPointIdx * 90) + 20} 
                  y1="30" 
                  x2={(hoveredPointIdx * 90) + 20} 
                  y2="170" 
                  stroke="#8B5CF6" 
                  strokeWidth="0.8" 
                  className="pointer-events-none"
                />
              )}
            </svg>

            {/* Labels overlay bottom */}
            <div className="flex justify-between items-center text-[9px] font-mono text-zinc-500 px-2 mt-1 select-none">
              {chartData.map((d, i) => (
                <span key={i} className={hoveredPointIdx === i ? 'text-[#8B5CF6] font-bold' : ''}>
                  {d.date}
                </span>
              ))}
            </div>

            {/* Dynamic Tracker Crosshair Tooltip */}
            <AnimatePresence>
              {hoveredPointIdx !== null && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  style={{ 
                    position: 'absolute',
                    left: `${Math.min(430, (hoveredPointIdx * 90) + 30)}px`,
                    top: `10px`,
                    pointerEvents: 'none'
                  }}
                  className="bg-[#0b0c16]/95 border border-[#6D4AFF]/30 p-2.5 rounded-xl shadow-2xl backdrop-blur-md font-mono text-[9.5px] z-50 space-y-1 w-[130px]"
                >
                  <p className="text-zinc-500 font-bold border-b border-zinc-900 pb-1 text-center">{chartData[hoveredPointIdx].date}</p>
                  <div className="flex justify-between mt-1">
                    <span className="text-[#8B5CF6]">Success:</span>
                    <span className="text-white font-bold">{chartData[hoveredPointIdx].success.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#EF4444]">Failed:</span>
                    <span className="text-white font-bold">{chartData[hoveredPointIdx].fail}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* RECENT ACTIVITY PANEL - 35% width equivalent */}
        <div className="lg:col-span-4 p-5 bg-gradient-to-b from-[#0b0c16] to-[#04050d] border border-[#141830] rounded-2xl shadow-xl backdrop-blur flex flex-col justify-between hover:border-zinc-800 transition-colors">
          <div className="pb-3 border-b border-zinc-900">
            <h3 className="text-xs font-bold text-white font-display uppercase tracking-wider">Recent Activity</h3>
            <p className="text-[10px] text-zinc-500">Live operational ledger logs</p>
          </div>

          <div className="flex-1 mt-3 space-y-2.5">
            {[
              { id: 'act-1', method: 'GET', path: 'Get All Products', status: 200, label: '200 OK', time: '3m ago' },
              { id: 'act-2', method: 'POST', path: 'Create Order', status: 201, label: '201 Created', time: '12m ago' },
              { id: 'act-3', method: 'PUT', path: 'Update Product', status: 200, label: '200 OK', time: '1h ago' },
              { id: 'act-4', method: 'DELETE', path: 'Delete Product', status: 404, label: '404 Not Found', time: '2h ago' },
              { id: 'act-5', method: 'GET', path: 'Get User by ID', status: 200, label: '200 OK', time: '3h ago' }
            ].map((act, index) => {
              
              let badgeColor = 'text-emerald-400 bg-emerald-400/10 border-emerald-500/20';
              let statusTextClass = 'text-emerald-400';
              if (act.method === 'POST') {
                badgeColor = 'text-amber-500 bg-amber-500/10 border-amber-500/20';
              } else if (act.method === 'PUT') {
                badgeColor = 'text-sky-400 bg-sky-400/10 border-sky-400/20';
              } else if (act.method === 'DELETE') {
                badgeColor = 'text-rose-400 bg-rose-400/10 border-rose-500/20';
              }
              
              if (act.status === 404) {
                statusTextClass = 'text-[#EF4444]';
              } else if (act.status === 201) {
                statusTextClass = 'text-amber-500';
              }

              return (
                <div 
                  key={act.id} 
                  className="flex items-center justify-between p-2 rounded-xl bg-black/15 border border-white/[0.02] hover:border-zinc-800 transition-colors shrink-0"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                    <span className={`px-1.5 py-0.5 text-[8.5px] font-black rounded border font-mono select-none uppercase tracking-wider shrink-0 ${badgeColor}`}>
                      {act.method}
                    </span>
                    <span className="text-zinc-300 font-sans text-[11px] font-medium truncate block leading-none">
                      {act.path}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`font-mono text-[9.5px] font-bold ${statusTextClass}`}>
                      {act.label}
                    </span>
                    <span className="text-[9px] text-zinc-600 font-mono">
                      {act.time}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* 4. MY COLLABORATIVE PORTFOLIO BENTO GRID */}
      <div>
        <div className="pb-3 border-b border-[#141830] mb-5">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider font-display flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-400" />
            My Collaborative Portfolio
          </h2>
          <p className="text-zinc-500 text-[10px] uppercase font-mono mt-0.5 font-bold">Isolated User Workspace Directory Ledger</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch select-none">
          
          {/* Bento Block 1: My Workspaces */}
          <div className="p-5 bg-gradient-to-b from-[#0b0c16] to-[#04050d] border border-[#141830]/85 rounded-2xl flex flex-col justify-between hover:border-purple-500/20 transition-all duration-300">
            <div>
              <div className="flex items-center justify-between pb-2.5 border-b border-zinc-900 mb-3.5">
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-extrabold flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-purple-400" />
                  My Workspaces
                </span>
                <button
                  onClick={() => onRequestTabSwitch('workspaces')}
                  className="text-[9px] font-mono text-purple-400 hover:text-purple-300 font-medium uppercase hover:underline"
                >
                  Manage
                </button>
              </div>

              {/* Dynamic workspace list fetch */}
              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {((): React.ReactNode => {
                  try {
                    const cached = localStorage.getItem('protosync_workspaces_list_v2');
                    const wsList = cached ? JSON.parse(cached) : [
                      { id: 'ws-default', name: user.workspaceName || 'My Workspace', collectionsCount: 0, apisCount: 0 }
                    ];

                    return wsList.map((ws: any) => {
                      const isActive = selectedWorkspace === ws.name;
                      return (
                        <div
                          key={ws.id}
                          onClick={() => {
                            setSelectedWorkspace(ws.name);
                          }}
                          className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between ${
                            isActive 
                              ? 'bg-purple-950/15 border-purple-500/30 text-white shadow-[0_0_12px_rgba(147,51,234,0.1)]' 
                              : 'bg-black/20 border-white/[0.03] text-zinc-400 hover:border-zinc-800 hover:text-white'
                          }`}
                        >
                          <div className="truncate leading-none">
                            <span className="text-[11px] font-bold block truncate">{ws.name}</span>
                            <span className="text-[8.5px] font-mono text-zinc-500 mt-1 block uppercase">TENANT NODE</span>
                          </div>
                          {isActive && (
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_#a855f7]" />
                          )}
                        </div>
                      );
                    });
                  } catch (e) {
                    return <p className="text-[10px] text-zinc-600 font-mono">Loading schema metadata...</p>;
                  }
                })()}
              </div>
            </div>

            <p className="text-[9.5px] text-zinc-600 leading-normal font-sans pt-3 mt-3 border-t border-zinc-900/40">
              Select any workspace container block to swap cache databases dynamically.
            </p>
          </div>

          {/* Bento Block 2: My Collections */}
          <div className="p-5 bg-gradient-to-b from-[#0b0c16] to-[#04050d] border border-[#141830]/85 rounded-2xl flex flex-col justify-between hover:border-purple-500/20 transition-all duration-300">
            <div>
              <div className="flex items-center justify-between pb-2.5 border-b border-zinc-900 mb-3.5">
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-extrabold flex items-center gap-1.5">
                  <Folder className="w-3.5 h-3.5 text-indigo-400" />
                  My Collections
                </span>
                <button
                  onClick={() => onRequestTabSwitch('collections')}
                  className="text-[9px] font-mono text-indigo-400 hover:text-indigo-300 font-medium uppercase hover:underline"
                >
                  View
                </button>
              </div>

              {/* Dynamic collection checklist view filter */}
              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {((): React.ReactNode => {
                  try {
                    const cached = localStorage.getItem('protosync_cached_cols');
                    let rawCols = cached ? JSON.parse(cached) : [];
                    
                    // Filter based on active selected workspace
                    const filtered = rawCols.filter((col: any) => {
                      const wsMatch = col.workspaceName === selectedWorkspace;
                      return !col.workspaceName || wsMatch;
                    });

                    if (filtered.length === 0) {
                      return (
                        <div className="p-3 text-center rounded-xl bg-black/10 border border-dashed border-white/5 space-y-1.5">
                          <p className="text-[9px] text-zinc-600 font-sans leading-normal">
                            No folders provisioned yet in inside tenant context.
                          </p>
                          <button
                            onClick={() => onRequestTabSwitch('collections')}
                            className="px-2 py-1 bg-zinc-900 text-[8px] font-mono font-bold text-zinc-400 hover:text-white rounded border border-white/5 cursor-pointer leading-none"
                          >
                            + Setup Folders
                          </button>
                        </div>
                      );
                    }

                    return filtered.map((col: any) => (
                      <div
                        key={col.id}
                        onClick={() => onRequestTabSwitch('collections')}
                        className="p-2.5 rounded-xl bg-black/20 border border-white/[0.02] hover:border-[#1e2447] text-left cursor-pointer transition-colors flex items-center gap-2"
                      >
                        <Folder className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        <div className="truncate leading-none">
                          <span className="text-[11px] font-bold text-zinc-300 truncate block">{col.name}</span>
                          <span className="text-[8px] font-mono text-zinc-600 mt-1 block uppercase">
                            {col.requests ? col.requests.length : 0} API Schemes
                          </span>
                        </div>
                      </div>
                    ));
                  } catch (e) {
                    return <p className="text-[10px] text-zinc-600 font-mono">Loading asset files...</p>;
                  }
                })()}
              </div>
            </div>

            <p className="text-[9.5px] text-zinc-600 leading-normal font-sans pt-3 mt-3 border-t border-zinc-900/40">
              Currently displaying folder trees for: <span className="text-zinc-500 font-mono">{selectedWorkspace}</span>
            </p>
          </div>

          {/* Bento Block 3: My Requests & Active Ledger */}
          <div className="p-5 bg-gradient-to-b from-[#0b0c16] to-[#04050d] border border-[#141830]/85 rounded-2xl flex flex-col justify-between hover:border-purple-500/20 transition-all duration-300">
            <div>
              <div className="flex items-center justify-between pb-2.5 border-b border-zinc-900 mb-3.5">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#4f46e5] font-extrabold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" />
                  My Requests
                </span>
                <button
                  onClick={() => onRequestTabSwitch('history')}
                  className="text-[9px] font-mono text-indigo-400 hover:text-indigo-300 font-medium uppercase hover:underline"
                >
                  Logs
                </button>
              </div>

              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {historyLedger.length === 0 ? (
                  <p className="text-[10px] font-sans text-zinc-600 p-4 bg-black/10 rounded-xl text-center leading-normal">
                    No run cycles logged. Open API Tester to dispatch custom HTTP web requests.
                  </p>
                ) : (
                  [...historyLedger].slice(0, 3).map((hist) => {
                    let badgeColor = 'text-green-400 bg-green-500/10 border-green-500/10';
                    if (hist.method === 'POST') badgeColor = 'text-amber-400 bg-amber-500/10 border-amber-500/10';
                    if (hist.method === 'DELETE') badgeColor = 'text-rose-400 bg-rose-500/10 border-rose-500/10';

                    return (
                      <div
                        key={hist.id}
                        onClick={() => onRequestTabSwitch('apitester')}
                        className="p-2.5 rounded-xl bg-black/20 border border-white/[0.02] hover:border-indigo-500/10 text-left cursor-pointer transition-colors flex items-center justify-between gap-1.5 min-w-0"
                      >
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <span className={`px-1 py-0.5 font-bold text-[8px] font-mono border rounded uppercase select-none ${badgeColor}`}>
                            {hist.method}
                          </span>
                          <span className="text-[11px] text-zinc-300 truncate font-semibold block leading-none">{hist.endpoint}</span>
                        </div>
                        <span className="font-mono text-[8.5px] text-zinc-600 shrink-0">{hist.latency ? `${hist.latency}ms` : '0ms'}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <p className="text-[9.5px] text-zinc-600 leading-normal font-sans pt-3 mt-3 border-t border-zinc-900/40">
              Click an individual logged spec row to re-execute in the emulator sandbox.
            </p>
          </div>

          {/* Bento Block 4: My Teams & Return to Account Navigation */}
          <div className="p-5 bg-gradient-to-b from-[#0b0c16] to-[#04050d] border border-[#141830]/85 rounded-2xl flex flex-col justify-between hover:border-purple-500/20 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#652afb]/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
            <div>
              <div className="flex items-center justify-between pb-2.5 border-b border-zinc-900 mb-3.5">
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-extrabold flex items-center gap-1.5">
                  <Network className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                  My Teams
                </span>
                <button
                  onClick={() => onRequestTabSwitch('team')}
                  className="text-[9px] font-mono text-purple-400 hover:text-purple-300 font-medium uppercase hover:underline"
                >
                  Join
                </button>
              </div>

              {/* Lists cooperative organizations & teams. Clicking switches context */}
              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 select-none">
                
                {/* Team 1: ProtoSync Developers */}
                <div
                  onClick={() => {
                    setSelectedWorkspace('Production API Gateway');
                  }}
                  className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between ${
                    selectedWorkspace === 'Production API Gateway' 
                      ? 'bg-[#18112e]/30 border-purple-500/30 text-white' 
                      : 'bg-black/20 border-white/[0.02] text-zinc-400 hover:border-zinc-800'
                  }`}
                >
                  <div className="leading-none">
                    <span className="text-[11px] font-bold block text-zinc-300 leading-tight">SaaS Devs Syndicate</span>
                    <span className="text-[8px] text-purple-400 font-mono mt-1 block uppercase font-bold">Collab Partner Roles</span>
                  </div>
                  <span className="text-[8px] font-mono bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded text-purple-300 scale-90 select-none">EDITOR</span>
                </div>

                {/* Team 2: Partner Sandbox Nodes */}
                <div
                  onClick={() => {
                    setSelectedWorkspace('SaaS Partner Sanboxes');
                  }}
                  className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between ${
                    selectedWorkspace === 'SaaS Partner Sanboxes' 
                      ? 'bg-[#18112e]/30 border-purple-500/30 text-white' 
                      : 'bg-black/20 border-white/[0.02] text-zinc-400 hover:border-zinc-800'
                  }`}
                >
                  <div className="leading-none">
                    <span className="text-[11px] font-bold block text-zinc-300 leading-tight">QA Automation Squad</span>
                    <span className="text-[8px] text-[#4f46e5] font-mono mt-1 block uppercase font-bold">Observer Nodes</span>
                  </div>
                  <span className="text-[8px] font-mono bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded text-indigo-300 scale-90 select-none">VIEWER</span>
                </div>

              </div>
            </div>

            {/* My Account navigation keys: Return to personal dashboard! */}
            <div className="pt-3 border-t border-zinc-900/40">
              {selectedWorkspace !== 'My Workspace' ? (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedWorkspace('My Workspace');
                  }}
                  className="w-full py-2 bg-gradient-to-r from-purple-600/30 to-indigo-600/30 hover:from-purple-500/40 hover:to-[#5c4fff]/40 text-purple-300 border border-purple-500/20 hover:border-purple-500/40 font-bold text-[10px] rounded-xl tracking-wider cursor-pointer select-none transition-all duration-300 uppercase font-mono animate-bounce"
                  title="Return context to personal dashboard"
                >
                  ◀ Return to Personal Account
                </button>
              ) : (
                <div className="text-[9.5px] text-zinc-600 leading-normal font-sans">
                  Click on client syndicate nodes to join external collaborative spaces instantly.
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
