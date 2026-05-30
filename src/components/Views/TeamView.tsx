import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Trash2, 
  Mail, 
  ShieldAlert, 
  Sparkles, 
  CheckCircle,
  Share2,
  Shield,
  Clock,
  Radio,
  UserCheck,
  Send,
  Zap,
  Info,
  X
} from 'lucide-react';
import { User } from '../../types';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Owner' | 'Editor' | 'Read-only';
  joinedAt: string;
  status: 'active' | 'pending';
}

interface TeamViewProps {
  user: User;
  showNotification: (msg: string) => void;
}

export default function TeamView({ user, showNotification }: TeamViewProps) {
  const [members, setMembers] = useState<TeamMember[]>(() => {
    try {
      const saved = localStorage.getItem('protosync_team_seats');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return [
      { id: 'tm-1', name: 'Arjun Dev', email: 'arjun.dev@protosync.io', role: 'Owner', joinedAt: 'Jun 14, 2024', status: 'active' },
      { id: 'tm-2', name: 'Jessica Framer', email: 'jess.framer@protosync.io', role: 'Editor', joinedAt: 'Aug 10, 2024', status: 'active' },
      { id: 'tm-3', name: 'Marcus Trace', email: 'm.trace@client-nodes.com', role: 'Read-only', joinedAt: 'Jan 22, 2025', status: 'active' },
      { id: 'tm-4', name: 'Sarah Spark', email: 's.spark@protosync.io', role: 'Editor', joinedAt: 'Pending accept', status: 'pending' }
    ];
  });

  // Dynamic Workspace loading of actual persistent team directory from cloud backend
  React.useEffect(() => {
    if (user && user.email) {
      fetch(`/api/user/workspace-data?email=${encodeURIComponent(user.email)}`, {
        headers: {
          'Authorization': `Bearer ${user.token || ''}`
        }
      })
        .then(res => res.json())
        .then(result => {
          if (result.success && result.workspaceData && result.workspaceData.teamMembers) {
            setMembers(result.workspaceData.teamMembers);
          }
        })
        .catch(err => console.error("Error loading workspace team members:", err));
    }
  }, [user]);

  // Sync back companion helper
  const syncTeamToBackend = (updatedMembers: TeamMember[]) => {
    if (!user || !user.email) return;
    fetch(`/api/user/workspace-data?email=${encodeURIComponent(user.email)}`, {
      headers: {
        'Authorization': `Bearer ${user.token || ''}`
      }
    })
      .then(res => res.json())
      .then(result => {
        if (result.success && result.workspaceData) {
          const wd = result.workspaceData;
          wd.teamMembers = updatedMembers;
          fetch('/api/user/workspace-data', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${user.token || ''}`
            },
            body: JSON.stringify({
              email: user.email,
              workspaceData: wd
            })
          }).catch(err => console.error("Error syncing team members:", err));
        }
      })
      .catch(err => console.error("Error before sync:", err));
  };

  // Save changes to localStorage whenever members list transitions
  React.useEffect(() => {
    try {
      localStorage.setItem('protosync_team_seats', JSON.stringify(members));
      if (user && user.email) {
        syncTeamToBackend(members);
      }
    } catch (e) {
      console.error(e);
    }
  }, [members, user]);

  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [roleInput, setRoleInput] = useState<'Owner' | 'Editor' | 'Read-only'>('Editor');
  const [invitingMember, setInvitingMember] = useState(false);

  // Determine current user's role and flags for Owner-only features
  const currentUserMember = members.find(m => m.email.toLowerCase() === user.email.toLowerCase());
  const currentUserRole = currentUserMember ? currentUserMember.role : 'Owner';
  const isOwner = currentUserRole === 'Owner';

  // "Join Another's Team" popup flows states
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinStep, setJoinStep] = useState<1 | 2>(1);
  const [ownerEmail, setOwnerEmail] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [simulatedOtp, setSimulatedOtp] = useState<string | null>(null);
  const [requestingOtp, setRequestingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [errorText, setErrorText] = useState('');

  const teamActivities = [
    { actor: 'Jessica Framer', action: 'edited Processes Stripe Handshake pre-request script', time: '14 mins ago' },
    { actor: 'Arjun Dev', action: 'generated a new workspace API credential ACCESS_TOKEN', time: '1 hr ago' },
    { actor: 'Marcus Trace', action: 're-evaluated Assertion specs for Product Inventory schema', time: '3 hrs ago' },
    { actor: 'System Gatekeeper', action: 'provisioned sandbox namespace SSL certificates', time: '1 day ago' }
  ];

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || !nameInput.trim()) return;

    const emailNorm = emailInput.toLowerCase().trim();
    if (members.some(m => m.email === emailNorm)) {
      showNotification("A seat with this email address already exists.");
      return;
    }

    setInvitingMember(true);

    const newMember: TeamMember = {
      id: 'tm-' + Date.now(),
      name: nameInput.trim(),
      email: emailNorm,
      role: roleInput,
      joinedAt: 'Pending accept',
      status: 'pending'
    };

    // Call actual backend POST `/api/team/invite`
    fetch('/api/team/invite', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: emailNorm,
        name: newMember.name,
        role: newMember.role,
        senderName: user ? user.fullName : "A peer teammate",
        senderEmail: user ? user.email : "no-reply@protosync.io"
      })
    })
      .then(res => res.json())
      .then(resData => {
        setInvitingMember(false);
        setMembers(prev => [...prev, newMember]);
        setNameInput('');
        setEmailInput('');
        
        if (resData.simulated) {
          showNotification(`Invitation prepared! (Sandbox SMTP Simulator).`);
        } else {
          showNotification(`Real invitation sent to ${newMember.email} successfully via SMTP!`);
        }
      })
      .catch(err => {
        setInvitingMember(false);
        setMembers(prev => [...prev, newMember]);
        setNameInput('');
        setEmailInput('');
        showNotification(`Dispatched invitation request: ${err.message}`);
      });
  };

  // Trigger OTP sending
  const handleRequestOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerEmail.trim()) return;

    setRequestingOtp(true);
    setErrorText('');
    setSimulatedOtp(null);

    fetch('/api/team/send-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ownerEmail: ownerEmail.trim(),
        senderEmail: user?.email || 'guest@protosync.io',
        senderName: user?.fullName || 'Teammate'
      })
    })
      .then(async (res) => {
        setRequestingOtp(false);
        const data = await res.json();
        
        if (!res.ok) {
          setErrorText(data.error || "Failed to trigger OTP verification key.");
          return;
        }

        if (data.simulated) {
          setSimulatedOtp(data.otp);
          showNotification(`Email Simulation: Security OTP generated successfully!`);
        } else {
          showNotification(`A security verification code has been dispatched to ${ownerEmail.trim()}!`);
        }
        
        setJoinStep(2); // move to entering OTP step
      })
      .catch((err) => {
        setRequestingOtp(false);
        setErrorText(`Gateway error: ${err.message}`);
      });
  };

  // Verify OTP and update list of members
  const handleVerifyOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpInput.trim()) return;

    setVerifyingOtp(true);
    setErrorText('');

    fetch('/api/team/verify-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ownerEmail: ownerEmail.trim(),
        senderEmail: user?.email || 'guest@protosync.io',
        senderName: user?.fullName || 'Teammate',
        otp: otpInput.trim()
      })
    })
      .then(async (res) => {
        setVerifyingOtp(false);
        const data = await res.json();

        if (!res.ok) {
          setErrorText(data.error || "Validation of OTP code failed.");
          return;
        }

        showNotification(data.message || `Successfully joined the team!`);
        
        // Refresh local view team directory from cloud backend structure
        if (user && user.email) {
          fetch(`/api/user/workspace-data?email=${encodeURIComponent(user.email)}`, {
            headers: {
              'Authorization': `Bearer ${user.token || ''}`
            }
          })
            .then(res => res.json())
            .then(result => {
              if (result.success && result.workspaceData && result.workspaceData.teamMembers) {
                setMembers(result.workspaceData.teamMembers);
              }
            });
        }

        // Close modal
        setShowJoinModal(false);
        setJoinStep(1);
        setOwnerEmail('');
        setOtpInput('');
      })
      .catch((err) => {
        setVerifyingOtp(false);
        setErrorText(`Security OTP assertion error: ${err.message}`);
      });
  };

  const handleRevokeSeat = (id: string, name: string) => {
    if (members.length <= 1) {
      showNotification('Cannot revoke final remaining Owner seat for development sandbox.');
      return;
    }
    setMembers(prev => prev.filter(m => m.id !== id));
    showNotification(`Revoked workspace developer seat rights for: ${name}`);
  };

  const handleRoleChange = (id: string, newRole: 'Owner' | 'Editor' | 'Read-only') => {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, role: newRole } : m));
    showNotification(`Updated team seat authorization levels.`);
  };

  return (
    <div className="space-y-6 animate-fadeIn font-sans p-1">
      
      {/* Top Section Headers */}
      <div className="pb-3 border-b border-[#141830] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white font-display">Workspace Seat Allocations & Permissions</h2>
          <p className="text-zinc-500 text-xs text-zinc-400">Invite engineering teammates, assign permission scopes, and inspect sandbox action feeds.</p>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-mono">
          <Radio className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
          <span>MULTI-TENANT COLLABORATION ENABLED</span>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-[#090b16]/50 border border-[#11152a] rounded-2xl">
          <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block font-extrabold mb-1">ALLOCATED SEATS</span>
          <div className="text-xl font-bold font-mono text-white">
            {members.filter(m => m.status === 'active').length} <span className="text-xs text-zinc-500 font-normal">/ 10 seats</span>
          </div>
        </div>

        <div className="p-4 bg-[#090b16]/50 border border-[#11152a] rounded-2xl">
          <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block font-extrabold mb-1">OWNER ACCOUNTS</span>
          <div className="text-xl font-bold font-mono text-purple-400">
            {members.filter(m => m.role === 'Owner').length} <span className="text-xs text-zinc-500 font-normal">active</span>
          </div>
        </div>

        <div className="p-4 bg-[#090b16]/50 border border-[#11152a] rounded-2xl">
          <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block font-extrabold mb-1">PENDING INVITES</span>
          <div className="text-xl font-bold font-mono text-cyan-400">
            {members.filter(m => m.status === 'pending').length} <span className="text-xs text-zinc-500 font-normal">pending</span>
          </div>
        </div>

        <div className="p-4 bg-[#090b16]/50 border border-[#11152a] rounded-2xl">
          <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block font-extrabold mb-1">INTEGRATIONS SYNC</span>
          <div className="text-xl font-bold font-mono text-emerald-400">99.9% <span className="text-xs text-[#059669] font-normal font-sans">Ready</span></div>
        </div>
      </div>

      {/* Main split content */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
        
        {/* Left column: members directory + invite form */}
        <div className="xl:col-span-8 space-y-4">
          
          {/* Members list */}
          <div className="p-5 bg-[#090b16]/50 border border-[#11152a] rounded-3xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
              <span className="text-[10px] font-mono text-[#4a589e] uppercase font-black tracking-widest block">
                Workspace Seat Directory ({members.length})
              </span>
              <button
                type="button"
                onClick={() => {
                  setErrorText('');
                  setSimulatedOtp(null);
                  setOwnerEmail('');
                  setOtpInput('');
                  setJoinStep(1);
                  setShowJoinModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-950/40 text-indigo-300 border border-indigo-500/30 hover:border-indigo-400/50 hover:bg-indigo-500/10 font-bold text-[9px] rounded-xl tracking-wider cursor-pointer transition-all uppercase font-mono"
              >
                <Plus className="w-3.5 h-3.5" /> Join Another Person's Team
              </button>
            </div>

            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {members.map((m) => (
                <div 
                  key={m.id} 
                  className="p-3.5 rounded-2xl bg-black/25 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-purple-500/10 transition-colors duration-150"
                >
                  <div className="flex gap-3.5 items-center">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600/15 to-indigo-600/15 border border-purple-500/30 flex items-center justify-center font-bold text-xs text-purple-300 font-mono select-none">
                      {m.name.substring(0, 2).toUpperCase()}
                    </div>

                    <div className="space-y-0.5">
                      <div className="font-display font-bold text-xs text-zinc-100 flex items-center gap-2">
                        <span>{m.name}</span>
                        {m.status === 'pending' && (
                          <span className="text-[7.5px] font-mono font-bold uppercase rounded px-1.5 py-0.5 text-cyan-400 bg-cyan-500/10 border border-cyan-500/10 tracking-widest">
                            PENDING
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-[9px] text-zinc-500">{m.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3.5 self-end sm:self-center select-none font-mono text-[9px]">
                    <span className="text-zinc-600 hidden md:block">Seat Added: {m.joinedAt}</span>
                    
                    {/* Role switcher selection */}
                    <div className="flex items-center gap-1.5 bg-[#05060d] border border-white/5 rounded-xl px-2.5 py-1.5">
                      <span className="text-[8px] text-zinc-600">ROLE:</span>
                      {isOwner ? (
                        <select 
                          value={m.role}
                          onChange={(e) => handleRoleChange(m.id, e.target.value as any)}
                          className="bg-transparent border-none text-zinc-300 focus:outline-none font-bold text-[9px] cursor-pointer"
                        >
                          <option value="Owner">Owner</option>
                          <option value="Editor">Editor</option>
                          <option value="Read-only">Read-only</option>
                        </select>
                      ) : (
                        <span className="text-zinc-300 font-bold text-[9px] uppercase">{m.role}</span>
                      )}
                    </div>

                    {/* Revoke option (Owner-Only) */}
                    {isOwner && (
                      <button
                        onClick={() => handleRevokeSeat(m.id, m.name)}
                        className="p-1 px-2.5 bg-zinc-950 border border-white/5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20 rounded-lg transition-colors cursor-pointer"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Invitation block form */}
          <div className="p-5 bg-[#090b16]/50 border border-[#11152a] rounded-3xl space-y-4 relative overflow-hidden">
            {!isOwner && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-[2.5px] z-20 flex flex-col items-center justify-center text-center p-4">
                <Lock className="w-5 h-5 text-purple-400 mb-1.5 animate-pulse" />
                <span className="text-[10px] font-mono bg-zinc-950 border border-purple-500/20 text-purple-300 px-3.5 py-2 rounded-xl font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-xl select-none">
                  READONLY CONTEXT: OWNER RIGHTS REQUIRED
                </span>
                <p className="text-[9px] text-zinc-500 mt-1.5 max-w-[280px]">Only the workspace Owner has authorization credentials to purchase seats or invite peer developer teammates.</p>
              </div>
            )}
            <span className="text-[10px] font-mono text-purple-400 font-extrabold uppercase tracking-widest block">
              Invite Engineering peers
            </span>

            <form onSubmit={handleInviteSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <div className="md:col-span-4">
                <label className="text-[9px] font-mono text-zinc-500 block mb-1">PEER NAME</label>
                <input
                  type="text"
                  required
                  placeholder="Sarah Spark"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full bg-black/40 border border-white/5 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-700 focus:outline-none"
                />
              </div>

              <div className="md:col-span-4">
                <label className="text-[9px] font-mono text-zinc-500 block mb-1">TEAM EMAIL ADDRESS</label>
                <input
                  type="email"
                  required
                  placeholder="s.spark@protosync.io"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full bg-black/40 border border-white/5 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-700 focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-[9px] font-mono text-zinc-500 block mb-1">ROLE LEVEL</label>
                <select
                  value={roleInput}
                  onChange={(e) => setRoleInput(e.target.value as any)}
                  className="w-full bg-[#05060d] border border-white/5 rounded-xl px-2 py-2 text-xs text-zinc-300 focus:outline-none"
                >
                  <option value="Owner">Owner</option>
                  <option value="Editor">Editor</option>
                  <option value="Read-only">Read-only</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 text-purple-200" /> Invite
                </button>
              </div>
            </form>
          </div>

        </div>

        {/* Right column: live collaboration activity log feed */}
        <div className="xl:col-span-4 bg-[#090b16]/50 border border-[#11152a] rounded-3xl p-5 space-y-4">
          <div className="pb-2.5 border-b border-white/5">
            <span className="text-[10px] font-mono text-purple-400 font-extrabold uppercase tracking-wide block">
              Workspace Activity logs feed
            </span>
          </div>

          <div className="space-y-4">
            
            {teamActivities.map((act, idx) => (
              <div key={idx} className="p-3 bg-black/25 border border-white/5 rounded-2xl space-y-1 hover:border-[#13172e] transition-colors duration-200">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-zinc-300 font-bold flex items-center gap-1">
                    <UserCheck className="w-3 h-3 text-purple-400" /> {act.actor}
                  </span>
                  
                  <span className="text-zinc-600 flex items-center gap-1 font-normal text-[8px]">
                    <Clock className="w-2.5 h-2.5 text-zinc-600" /> {act.time}
                  </span>
                </div>

                <p className="text-[11px] text-zinc-500 font-sans leading-normal">
                  {act.action}
                </p>
              </div>
            ))}

            <div className="p-3.5 bg-black/10 border border-dashed border-white/5 rounded-2xl space-y-2">
              <div className="text-[10px] font-mono text-cyan-400 font-bold flex items-center gap-1">
                <Radio className="w-3 h-3 text-cyan-400 animate-pulse" /> CLUSTER CONCURRENCY SECURED
              </div>
              <p className="text-[10.5px] text-zinc-600 leading-normal font-sans">
                Multiple editors can modify collection elements together. Changes are automatically synchronized across nodes securely using TLS 1.3 socket paths.
              </p>
            </div>

          </div>
        </div>

      </div>

      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#090b16] border border-indigo-500/30 rounded-3xl p-6 shadow-2xl space-y-5 text-left">
            
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-bold text-white font-display flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-400" /> Join Peer Workspace Team
                </h3>
                <p className="text-zinc-500 text-[10.5px] font-sans mt-1">
                  Enter the registered email of the workspace owner you wish to join.
                </p>
              </div>
              <button 
                type="button"
                onClick={() => {
                  setShowJoinModal(false);
                  setJoinStep(1);
                  setOwnerEmail('');
                  setOtpInput('');
                  setErrorText('');
                }}
                className="text-zinc-500 hover:text-zinc-300 p-1 rounded-full hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorText && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10.5px] font-mono leading-relaxed">
                {errorText}
              </div>
            )}

            {joinStep === 1 ? (
              /* STEP 1: ENTER OWNER EMAIL */
              <form onSubmit={handleRequestOtpSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono text-zinc-500 block uppercase font-bold">Workspace Owner Email</label>
                  <input
                    type="email"
                    required
                    placeholder="ssk498532@gmail.com"
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    className="w-full bg-black/40 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-indigo-500/40 font-sans"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2 text-xs font-bold leading-none select-none">
                  <button
                    type="button"
                    onClick={() => setShowJoinModal(false)}
                    className="px-4 py-2.5 bg-zinc-950 border border-white/5 text-zinc-400 hover:text-white rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={requestingOtp}
                    className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {requestingOtp ? "Generating OTP..." : "Get OTP Code"}
                  </button>
                </div>
              </form>
            ) : (
              /* STEP 2: ENTER OTP */
              <form onSubmit={handleVerifyOtpSubmit} className="space-y-4">
                {simulatedOtp && (
                  <div className="p-3 bg-purple-950/30 border border-purple-500/20 rounded-xl space-y-1">
                    <span className="text-[9.5px] font-mono text-purple-300 font-bold uppercase tracking-wider block">Sandbox Preview Simulator Notice</span>
                    <p className="text-[10px] text-zinc-400 leading-normal font-sans">
                      The generated OTP verification code is:
                    </p>
                    <p className="font-mono text-lg font-bold text-center tracking-widest text-purple-300 bg-black/40 py-2 rounded-lg my-1 select-all">
                      {simulatedOtp}
                    </p>
                    <p className="text-[9px] text-zinc-500 leading-normal font-sans">
                      (A real email will be dispatched to <span className="font-bold text-zinc-400">{ownerEmail}</span> if SMTP credentials are configured.)
                    </p>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono text-zinc-500 block uppercase font-bold">Enter OTP Token</label>
                  <p className="text-[10px] text-zinc-400 font-sans mb-1">
                    Please ask the team lead to share the 6-digit verification code sent to <span className="text-white font-mono">{ownerEmail}</span>.
                  </p>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="000000"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-black/40 border border-white/5 rounded-xl px-3.5 py-3 text-center text-sm font-mono tracking-widest text-white focus:outline-none focus:border-indigo-500/40"
                  />
                </div>

                <div className="pt-2 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => setJoinStep(1)}
                    className="text-[10px] font-mono text-zinc-500 hover:text-zinc-300 underline cursor-pointer"
                  >
                    Back to Email
                  </button>
                  <div className="flex gap-2 text-xs font-bold leading-none select-none">
                    <button
                      type="button"
                      onClick={() => setShowJoinModal(false)}
                      className="px-4 py-2.5 bg-zinc-950 border border-white/5 text-zinc-400 hover:text-white rounded-xl cursor-pointer"
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      disabled={verifyingOtp}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {verifyingOtp ? "Verifying..." : "Verify & Join Workspace"}
                    </button>
                  </div>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
