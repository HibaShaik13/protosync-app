/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { 
  Cpu, 
  Terminal, 
  Database, 
  Activity, 
  Globe, 
  Users, 
  ArrowRight, 
  CheckCircle, 
  Layers,
  LineChart
} from 'lucide-react';
import { useState, useEffect } from 'react';

export default function HeroSection() {
  const [activeTab, setActiveTab] = useState<'json' | 'js' | 'curl'>('json');
  const [liveReqCount, setLiveReqCount] = useState(12845620);

  // Live request count ticker simulator for hyper-realistic feel
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveReqCount(prev => prev + Math.floor(Math.random() * 4) + 1);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const codeSnippets = {
    json: `{
  "request": "POST /v1/collections/protosync-prod",
  "headers": {
    "Authorization": "Bearer ps_live_8f3a...b9e4",
    "Content-Type": "application/json"
  },
  "payload": {
    "syncMode": "realtime_diff",
    "environments": ["us-east", "eu-central"],
    "options": { "compression": true }
  }
}`,
    js: `import { ProtoSync } from '@protosync/sdk';

const client = new ProtoSync({
  apiKey: 'ps_live_8f3ab9e4'
});

// Sync database schema instantly
const res = await client.sync({
  mode: 'realtime_diff',
  environments: ['us-east', 'eu-central']
});`,
    curl: `curl -X POST https://api.protosync.io/v1/collections/protosync-prod \\
  -H "Authorization: Bearer ps_live_8f3ab9e4" \\
  -H "Content-Type: application/json" \\
  -d '{
    "syncMode": "realtime_diff",
    "environments": ["us-east", "eu-central"]
  }'`
  };

  return (
    <div className="relative flex flex-col justify-between h-full w-full py-10 px-8 lg:px-14 overflow-hidden select-none">
      
      {/* Top Banner - Interactive Branding Logo */}
      <div className="relative z-10 flex items-center gap-3">
        <motion.div 
          className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-[0_0_20px_rgba(139,92,246,0.3)] border border-purple-400/30 cursor-pointer"
          whileHover={{ scale: 1.05, rotate: 90 }}
          transition={{ type: "spring", stiffness: 300, damping: 12 }}
        >
          {/* Neon inner cube vectors */}
          <div className="absolute inset-1.5 rounded-lg border border-white/20 bg-black/40 flex items-center justify-center">
            <Cpu className="w-5 h-5 text-purple-300" />
          </div>
          <div className="absolute -inset-0.5 rounded-xl bg-purple-500/25 blur-sm -z-10" />
        </motion.div>
        <div>
          <span className="font-display font-bold text-xl tracking-tight text-white">Proto<span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">Sync</span></span>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest font-semibold">API NETWORK OK</span>
          </div>
        </div>
      </div>

      {/* Center Hero Description & Animated IDE Widget Wrapper */}
      <div className="relative z-10 my-auto py-8">
        
        {/* Cinematic Headline & Subtext */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="font-display text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.12]">
            Build, Test & Scale <br />
            <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent drop-shadow-[0_2px_15px_rgba(168,85,247,0.15)]">
              APIs Faster
            </span>
          </h1>
          <p className="mt-4 text-base text-zinc-400 max-w-md leading-relaxed">
            Modern API collaboration, continuous mocking, and automated testing suite built elegantly for core developer teams.
          </p>
        </motion.div>

        {/* Floating Neon Cyberpunk Interactive Component - Live API Editor */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-10 glass-card rounded-2xl glow-card-purple border border-white/5 overflow-hidden shadow-2xl relative"
        >
          {/* Header Bar */}
          <div className="bg-black/40 px-5 py-3 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
              <span className="text-[11px] font-mono text-zinc-500 ml-2.5">protosync-client-v2.ts</span>
            </div>
            
            <div className="flex bg-[#0f0a28]/60 rounded-lg p-0.5 border border-purple-500/15">
              {(['json', 'js', 'curl'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-2.5 py-1 rounded font-mono text-[10px] uppercase font-bold transition-all ${
                    activeTab === tab 
                      ? 'bg-purple-600 text-white shadow-md' 
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Code Viewer pane with floating mock network response badge */}
          <div className="p-5 font-mono text-[11px] leading-relaxed text-purple-200 bg-black/20 relative min-h-[160px] max-h-[190px] overflow-y-auto">
            <pre className="text-zinc-300 selection:bg-purple-500/30 select-all scrollbar-hide">
              <code>{codeSnippets[activeTab]}</code>
            </pre>

            {/* Glowing response node hover */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 1, duration: 0.4 }}
              className="absolute bottom-3 right-3 bg-indigo-950/80 border border-cyan-400/40 px-3 py-1.5 rounded-lg flex items-center gap-2 backdrop-blur-md shadow-[0_0_15px_rgba(34,211,238,0.2)]"
            >
              <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span className="text-[9px] font-bold text-cyan-300 tracking-wider">RESPONSE: 200 OK (11ms)</span>
            </motion.div>
          </div>
        </motion.div>

        {/* Network nodes micro illustration floating overlay */}
        <div className="absolute right-[-40px] top-[10%] opacity-35 pointer-events-none -z-10 animate-float-slow">
          <svg width="220" height="150" viewBox="0 0 220 150" fill="none" className="stroke-purple-500/30 stroke-[1.5]">
            <path d="M20 20 L200 40 L160 120 Z" />
            <path d="M200 40 L100 90 L20 20" />
            <circle cx="20" cy="20" r="4" className="fill-purple-500 shadow-glow" />
            <circle cx="200" cy="40" r="5" className="fill-cyan-400 shadow-glow" />
            <circle cx="160" cy="120" r="4" className="fill-indigo-500" />
            <circle cx="100" cy="90" r="3" className="fill-fuchsia-400" />
          </svg>
        </div>

      </div>

      {/* Bottom Interactive Grid of Developer Statistics */}
      <div className="relative z-10">
        <div className="grid grid-cols-3 gap-3">
          
          <motion.div 
            whileHover={{ y: -3, borderColor: 'rgba(168, 85, 247, 0.3)' }}
            className="glass-card bg-[#0b0821]/45 p-4 rounded-xl border border-white/5 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-purple-400 mb-1">
              <Database className="w-4 h-4" />
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping" />
            </div>
            <div>
              <div className="font-display font-bold text-base lg:text-lg text-white">
                {(liveReqCount / 1000000).toFixed(6)}M
              </div>
              <div className="text-[10px] text-zinc-500 tracking-wide font-medium whitespace-nowrap">API Requests Live</div>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -3, borderColor: 'rgba(168, 85, 247, 0.3)' }}
            className="glass-card bg-[#0b0821]/45 p-4 rounded-xl border border-white/5 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-cyan-400 mb-1">
              <Activity className="w-4 h-4" />
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div>
              <div className="font-display font-bold text-base lg:text-lg text-white">
                99.98%
              </div>
              <div className="text-[10px] text-zinc-500 tracking-wide font-medium whitespace-nowrap">Success SLA</div>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -3, borderColor: 'rgba(168, 85, 247, 0.3)' }}
            className="glass-card bg-[#0b0821]/45 p-4 rounded-xl border border-white/5 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-indigo-400 mb-1">
              <Users className="w-4 h-4" />
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div>
              <div className="font-display font-bold text-base lg:text-lg text-white">
                50K+
              </div>
              <div className="text-[10px] text-zinc-500 tracking-wide font-medium whitespace-nowrap">Global Devs</div>
            </div>
          </motion.div>

        </div>
        
        {/* Footnote statement */}
        <div className="mt-6 flex items-center justify-between text-[11px] text-zinc-500">
          <span className="flex items-center gap-1">
            <Layers className="w-3 h-3 text-purple-500" /> Built for mission-critical microservices
          </span>
          <span className="font-mono text-zinc-600">v3.4.12-release</span>
        </div>
      </div>

    </div>
  );
}
