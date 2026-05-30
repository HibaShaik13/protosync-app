import React, { useState } from 'react';
import { 
  Settings, 
  User, 
  Key, 
  Lock, 
  CreditCard, 
  ShieldCheck, 
  Command, 
  RefreshCw, 
  Trash2, 
  Check, 
  Copy, 
  Eye, 
  EyeOff,
  Sparkles,
  Database,
  Cpu,
  Sliders,
  Plus
} from 'lucide-react';
import { User as UserType, EnvVar } from '../../types';

interface SettingsViewProps {
  user: UserType;
  showNotification: (msg: string) => void;
  envVars: EnvVar[];
  addEnvRow: () => void;
  updateEnvRow: (id: string, field: 'key' | 'value', value: string) => void;
  toggleEnvRow: (id: string) => void;
  deleteEnvRow: (id: string) => void;
  toggleEnvSecret: (id: string) => void;
}

export default function SettingsView({ 
  user, 
  showNotification,
  envVars,
  addEnvRow,
  updateEnvRow,
  toggleEnvRow,
  deleteEnvRow,
  toggleEnvSecret
}: SettingsViewProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'environments' | 'keys' | 'security' | 'billing'>('profile');

  // Profile forms
  const [fullName, setFullName] = useState(user.fullName || 'Cloud Developer');
  const [email, setEmail] = useState(user.email || 'dev@protosync.io');
  const [workspace, setWorkspace] = useState(user.workspaceName || 'sandbox-workspace');

  // Keys form
  const [apiKeys, setApiKeys] = useState([
    { id: 'key-1', name: 'Production Sync Token', token: 'pk_live_protosync_e3b8a92f00', created: 'Jun 20, 2024' },
    { id: 'key-2', name: 'Local CLI Handshake', token: 'pk_test_protosync_9ab12480cd', created: 'Oct 02, 2024' }
  ]);
  const [newKeyName, setNewKeyName] = useState('');
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  // Security toggles
  const [multifactor, setMultifactor] = useState(false);
  const [advancedSsl, setAdvancedSsl] = useState(true);
  const [ipWhitelist, setIpWhitelist] = useState('0.0.0.0/0');

  // Billing simulation
  const [pricingChoice, setPricingChoice] = useState<'free' | 'pro' | 'enterprise'>('pro');

  const handleCopyToken = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKeyId(id);
    showNotification('Copied public API token to clipboard.');
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    showNotification('Updated user profile credential nodes in directory.');
  };

  const handleCreateApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    const newKey = {
      id: 'key-' + Date.now(),
      name: newKeyName.trim(),
      token: `pk_${pricingChoice}_protosync_` + Math.random().toString(16).substring(2, 12),
      created: 'Just now'
    };

    setApiKeys(prev => [...prev, newKey]);
    setNewKeyName('');
    showNotification(`Generated workspace OAuth signature token: ${newKey.name}`);
  };

  const handleRevokeKey = (id: string, name: string) => {
    setApiKeys(prev => prev.filter(k => k.id !== id));
    showNotification(`Revoked active gateway credential: ${name}`);
  };

  return (
    <div className="space-y-6 animate-fadeIn font-sans p-1">
      
      {/* Top Header Controls bar */}
      <div className="pb-3 border-b border-[#141830] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white font-display">System Settings & Gateway Node Keys</h2>
          <p className="text-zinc-500 text-xs text-zinc-400">Configure OAuth scopes, manage developer tokens, adjust billing quotas, and toggle SSL requirements.</p>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-mono">
          <Settings className="w-3.5 h-3.5 text-zinc-500 animate-spin" style={{ animationDuration: '6s' }} />
          <span>MANAGED WORKSPACE PROFILE</span>
        </div>
      </div>

      {/* Primary Inner Spacing Split */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* Left Side Subtab select column (Spans 3) */}
        <div className="xl:col-span-3 bg-[#070913]/50 border border-[#141835] rounded-3xl p-3.5 space-y-1">
          <span className="text-[8.5px] font-mono text-zinc-500 tracking-widest uppercase block pl-3 pb-2 select-none">
            CATEGORIES
          </span>

          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all border border-transparent cursor-pointer select-none ${
              activeTab === 'profile' 
                ? 'bg-[#151336]/40 border-purple-500/10 text-white font-bold' 
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.015]'
            }`}
          >
            <User className="w-4 h-4 text-purple-400 shrink-0" />
            <span>Profile settings</span>
          </button>

          <button
            onClick={() => setActiveTab('environments')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all border border-transparent cursor-pointer select-none ${
              activeTab === 'environments' 
                ? 'bg-[#151336]/40 border-purple-500/10 text-white font-bold' 
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.015]'
            }`}
          >
            <Sliders className="w-4 h-4 text-[#a855f7] shrink-0" />
            <span>Environment variables</span>
          </button>

          <button
            onClick={() => setActiveTab('keys')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all border border-transparent cursor-pointer select-none ${
              activeTab === 'keys' 
                ? 'bg-[#151336]/40 border-purple-500/10 text-white font-bold' 
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.015]'
            }`}
          >
            <Key className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Developer credentials</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all border border-transparent cursor-pointer select-none ${
              activeTab === 'security' 
                ? 'bg-[#151336]/40 border-purple-500/10 text-white font-bold' 
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.015]'
            }`}
          >
            <Lock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Secured Firewalls</span>
          </button>

          <button
            onClick={() => setActiveTab('billing')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all border border-transparent cursor-pointer select-none ${
              activeTab === 'billing' 
                ? 'bg-[#151336]/40 border-purple-500/10 text-white font-bold' 
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.015]'
            }`}
          >
            <CreditCard className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>SaaS Quota plans</span>
          </button>
        </div>

        {/* Right Side configuration contents (Spans 9) */}
        <div className="xl:col-span-9 bg-[#090b16]/50 border border-[#11152a] rounded-3xl p-5 min-h-[400px]">
          
          {/* TAB 1: Profile credentials */}
          {activeTab === 'profile' && (
            <div className="space-y-5 animate-slideLeft">
              <div className="space-y-1">
                <h3 className="font-display font-bold text-white text-sm">Developer Profile Settings</h3>
                <p className="text-zinc-500 text-xs">Manage workspace identification markers displayed across cluster nodes.</p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4 max-w-xl">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 animate-fadeIn">
                    <label className="text-[10px] font-mono text-zinc-500 uppercase block select-none">FULL NAME</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-black/40 border border-white/5 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-700 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5 animate-fadeIn">
                    <label className="text-[10px] font-mono text-zinc-500 uppercase block select-none">WORKSPACE ID</label>
                    <input
                      type="text"
                      required
                      value={workspace}
                      onChange={(e) => setWorkspace(e.target.value)}
                      className="w-full bg-black/40 border border-white/5 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-700 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 animate-fadeIn">
                  <label className="text-[10px] font-mono text-zinc-500 uppercase block select-none">AUTHENTICATED EMAIL ADDRESS</label>
                  <input
                    type="email"
                    disabled
                    value={email}
                    className="w-full bg-black/10 border border-white/5 text-zinc-500 rounded-xl px-3.5 py-2 text-xs select-none"
                  />
                  <span className="text-[9.5px] text-zinc-600 font-mono italic">Primary oauth email mappings cannot be changed from safe mode sandbox panels.</span>
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl cursor-pointer select-none transition-colors"
                >
                  Save Workspace settings
                </button>
              </form>
            </div>
          )}

          {/* TAB 1.5: Environment variables table */}
          {activeTab === 'environments' && (
            <div className="space-y-5 animate-slideLeft">
              <div className="space-y-1">
                <h3 className="font-display font-bold text-white text-sm">Workspace Global Environment Variables</h3>
                <p className="text-zinc-500 text-xs">Manage environment-wide key-value variables that automatically resolve using double curly bracing <code>{"{{VARIABLE}}"}</code> across URLs and headers.</p>
              </div>

              <div className="flex justify-between items-center text-xs select-none border-b border-[#141830] pb-3">
                <span className="font-display font-bold text-zinc-400 uppercase tracking-tight">Active Variable Maps</span>
                <button
                  onClick={addEnvRow}
                  className="px-3 py-1.5 bg-[#151336]/60 border border-purple-500/20 hover:border-purple-500/50 rounded-xl text-xs font-bold text-purple-300 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New Variable</span>
                </button>
              </div>

              <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                {envVars.length === 0 ? (
                  <div className="text-center py-10 text-zinc-600 font-mono text-xs border border-dashed border-white/5 rounded-2xl bg-black/10">
                    No active workspace variables defined.
                  </div>
                ) : (
                  envVars.map((item) => (
                    <div key={item.id} className="grid grid-cols-12 gap-3 items-center bg-black/20 p-2.5 rounded-2xl border border-white/5">
                      <div className="col-span-1 text-center">
                        <input
                          type="checkbox"
                          checked={item.active}
                          onChange={() => toggleEnvRow(item.id)}
                          className="rounded bg-black border-zinc-800 text-purple-600 focus:ring-0 cursor-pointer"
                        />
                      </div>

                      <div className="col-span-4">
                        <input
                          type="text"
                          value={item.key}
                          onChange={(e) => updateEnvRow(item.id, 'key', e.target.value)}
                          placeholder="VARIABLE_NAME"
                          className="w-full bg-black/45 border border-white/5 rounded-xl px-3.5 py-2 text-xs font-mono text-zinc-200 uppercase focus:outline-none focus:border-purple-500/50"
                        />
                      </div>

                      <div className="col-span-5 relative">
                        <input
                          type={item.isSecret ? 'password' : 'text'}
                          value={item.value}
                          onChange={(e) => updateEnvRow(item.id, 'value', e.target.value)}
                          placeholder="Value string"
                          className="w-full bg-black/45 border border-white/5 rounded-xl px-3.5 py-2 pr-10 text-xs font-mono text-purple-300 focus:outline-none focus:border-purple-500/50"
                        />
                        <button
                          type="button"
                          onClick={() => toggleEnvSecret(item.id)}
                          className="absolute right-3 top-2.5 text-zinc-500 hover:text-white cursor-pointer"
                        >
                          {item.isSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      <div className="col-span-2 flex items-center justify-end">
                        <button
                          onClick={() => deleteEnvRow(item.id)}
                          className="p-1 px-3 bg-[#130607] border border-rose-500/15 hover:border-rose-500/30 text-rose-400 hover:bg-rose-500/10 rounded-xl text-xs transition-colors cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Developer Keys */}
          {activeTab === 'keys' && (
            <div className="space-y-5 animate-slideLeft">
              <div className="space-y-1">
                <h3 className="font-display font-bold text-white text-sm">OAuth Gateway signature Keys</h3>
                <p className="text-zinc-500 text-xs">Verify past transaction signatures or issue administrative developer keys targeting the cluster.</p>
              </div>

              {/* API and TLS keys table */}
              <div className="space-y-3.5 pt-1.5">
                <span className="text-[9.5px] font-mono text-zinc-500 uppercase tracking-wider block font-bold">ACTIVE WORKSPACE KEYS</span>
                
                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                  {apiKeys.length === 0 ? (
                    <div className="text-center py-6 text-zinc-600 font-mono text-xs select-none border border-dashed border-white/5 rounded-xl bg-black/10">
                      No active API keys found. Generate a token below.
                    </div>
                  ) : (
                    apiKeys.map((k) => (
                      <div key={k.id} className="p-3 bg-black/25 border border-white/5 rounded-xl flex items-center justify-between gap-3 text-xs select-none font-mono">
                        <div className="space-y-1">
                          <div className="font-semibold text-zinc-200 font-sans">{k.name}</div>
                          <div className="text-[10.5px] text-purple-300 font-mono truncate max-w-[200px] sm:max-w-none">{k.token}</div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCopyToken(k.token, k.id)}
                            className="p-1.5 bg-zinc-950 hover:bg-white/5 rounded border border-white/5 text-zinc-400"
                          >
                            {copiedKeyId === k.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>

                          <button
                            onClick={() => handleRevokeKey(k.id, k.name)}
                            className="p-1.5 bg-[#140608] hover:bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Generate form */}
              <form onSubmit={handleCreateApiKey} className="pt-2 border-t border-white/5 space-y-3">
                <span className="text-[9.5px] font-mono text-zinc-500 uppercase tracking-wider block font-bold">Generate a new Developer token</span>
                
                <div className="flex flex-col sm:flex-row gap-3 items-end">
                  <div className="flex-1 w-full space-y-1">
                    <input
                      type="text"
                      required
                      placeholder="Production SDK endpoint token..."
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      className="w-full bg-black/40 border border-white/5 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-700 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl cursor-pointer shrink-0 transition-colors"
                  >
                    Generate OAuth token
                  </button>
                </div>
              </form>

            </div>
          )}

          {/* TAB 3: Firewall security */}
          {activeTab === 'security' && (
            <div className="space-y-6 animate-slideLeft">
              <div className="space-y-1">
                <h3 className="font-display font-bold text-white text-sm">Cluster Security & Firewall whitelist</h3>
                <p className="text-zinc-500 text-xs">Configure encryption parameters, proxy controls, and IP restriction tables.</p>
              </div>

              {/* Switche rows */}
              <div className="space-y-4">
                
                <div className="flex items-center justify-between p-3 bg-black/25 border border-white/5 rounded-xl">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-zinc-100 block">Enforce RSA SSL/TLS Handshake rules</span>
                    <span className="text-[10px] text-zinc-500 font-sans font-normal leading-normal block">Require rigorous HTTPS encryption handshakes for all simulated testing target operations.</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={advancedSsl} 
                    onChange={(e) => setAdvancedSsl(e.target.checked)}
                    className="w-8 h-4 rounded-full bg-zinc-800 accent-purple-500 cursor-pointer" 
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-black/25 border border-white/5 rounded-xl">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-zinc-100 block">Multifactor Identification nodes (MFA)</span>
                    <span className="text-[10px] text-zinc-500 font-sans font-normal leading-normal block">Send email confirmation certificates alerts before updating sensitive database environments structures.</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={multifactor} 
                    onChange={(e) => setMultifactor(e.target.checked)}
                    className="w-8 h-4 rounded-full bg-zinc-800 accent-purple-500 cursor-pointer" 
                  />
                </div>

                {/* Whitelist block */}
                <div className="space-y-1.5 font-mono text-xs">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase block select-none">IP FILTER CONFIGURATION CIDR</span>
                  <input 
                    type="text" 
                    value={ipWhitelist}
                    onChange={(e) => setIpWhitelist(e.target.value)}
                    className="w-full max-w-md bg-black/40 border border-white/5 text-zinc-300 font-semibold rounded-xl px-3.5 py-2 text-xs focus:outline-none" 
                  />
                  <p className="text-[9.5px] text-zinc-600 font-sans italic">Allow workspace trace requests from matching IP scope masks. Set to 0.0.0.0/0 to allow universal routing access logs.</p>
                </div>

              </div>

            </div>
          )}

          {/* TAB 4: Billing Plans */}
          {activeTab === 'billing' && (
            <div className="space-y-5 animate-slideLeft">
              <div className="space-y-1">
                <h3 className="font-display font-bold text-white text-sm">Workspace Quota limits & pricing plans</h3>
                <p className="text-zinc-500 text-xs">Select active plans, track allocated nodes capacities, and review invoice details.</p>
              </div>

              {/* Cards options */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono select-none">
                
                <div 
                  onClick={() => { setPricingChoice('free'); showNotification('Altered tier to Sandbox Basic.'); }}
                  className={`p-4 bg-black/20 border rounded-2xl cursor-pointer text-xs space-y-2 transition-all ${pricingChoice === 'free' ? 'border-[#3b82f6]/30 bg-[#3b82f6]/5 shadow-[0_0_8px_rgba(59,130,246,0.1)]' : 'border-white/5 hover:border-white/10'}`}
                >
                  <div className="font-display text-white font-black text-sm">Sandbox Basic</div>
                  <div className="text-[11.5px] text-zinc-400 font-bold">$0 <span className="text-[10px] text-zinc-600 font-normal">/ month</span></div>
                  <p className="text-[9.5px] text-zinc-600 font-sans font-normal leading-normal">50 daily traces, 2 workspace keys, shared public sandbox cluster nodes.</p>
                </div>

                <div 
                  onClick={() => { setPricingChoice('pro'); showNotification('Altered tier to Cloud Premium.'); }}
                  className={`p-4 bg-black/20 border rounded-2xl cursor-pointer text-xs space-y-2 relative overflow-hidden transition-all ${pricingChoice === 'pro' ? 'border-[#a855f7]/30 bg-[#a855f7]/5 shadow-[0_0_8px_rgba(168,85,247,0.1)]' : 'border-white/5 hover:border-white/10'}`}
                >
                  <div className="absolute top-1.5 right-1.5 text-[7px] bg-[#a855f7]/25 text-[#c084fc] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider font-sans">
                    ACTIVE
                  </div>
                  <div className="font-display text-white font-black text-sm flex items-center gap-1">
                    <Sparkles className="w-4 h-4 text-purple-400" /> Cloud Premium
                  </div>
                  <div className="text-[11.5px] text-purple-400 font-bold">$29 <span className="text-[10px] text-zinc-600 font-normal">/ month</span></div>
                  <p className="text-[9.5px] text-zinc-600 font-sans font-normal leading-normal">50,000 monthly traces, 10 team seats, whitelisted CIDR secure firewalls.</p>
                </div>

                <div 
                  onClick={() => { setPricingChoice('enterprise'); showNotification('Altered tier to Dedicated Cluster.'); }}
                  className={`p-4 bg-black/20 border rounded-2xl cursor-pointer text-xs space-y-2 transition-all ${pricingChoice === 'enterprise' ? 'border-[#059669]/30 bg-[#059669]/5 shadow-[0_0_8px_rgba(5,150,105,0.1)]' : 'border-white/5 hover:border-white/10'}`}
                >
                  <div className="font-display text-white font-black text-sm">Dedicated Cluster</div>
                  <div className="text-[11.5px] text-emerald-400 font-bold">$149 <span className="text-[10px] text-zinc-600 font-normal">/ month</span></div>
                  <p className="text-[9.5px] text-zinc-600 font-sans font-normal leading-normal">Unlimited trace flows, custom TLS certificates, multi-user concurrency traces SLA.</p>
                </div>

              </div>

              {/* Progress quotas */}
              <div className="p-4 bg-purple-950/20 border border-purple-500/20 rounded-2xl space-y-2 text-xs">
                <div className="flex justify-between font-mono text-[10.5px]">
                  <span className="text-purple-300 font-bold">MONTHLY VOLUME QUOTA TRAFFIC</span>
                  <span className="text-zinc-200">148,531 / 500,000 monthly operations traces</span>
                </div>
                {/* Meter */}
                <div className="h-1.5 bg-black rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: '29.7%' }} />
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
