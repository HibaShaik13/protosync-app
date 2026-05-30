/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Folder, 
  Plus, 
  Trash2, 
  Download, 
  Search, 
  ChevronRight, 
  ChevronDown,
  Sparkles,
  Layers,
  Check,
  Globe,
  Database,
  ArrowRight,
  FileCode,
  Tag
} from 'lucide-react';
import { ApiRequestItem, CollectionFolder } from '../../types';

interface CollectionsViewProps {
  collections: CollectionFolder[];
  setCollections: React.Dispatch<React.SetStateAction<CollectionFolder[]>>;
  selectedWorkspace: string;
  activeCollectionId: string | null;
  setActiveCollectionId: (id: string | null) => void;
  showNotification: (msg: string) => void;
  onSelectedRequestLoad: (req: ApiRequestItem) => void;
  onRequestTabSwitch: (tab: 'apitester') => void;
}

export default function CollectionsView({ 
  collections, 
  setCollections, 
  selectedWorkspace,
  activeCollectionId,
  setActiveCollectionId,
  showNotification,
  onSelectedRequestLoad,
  onRequestTabSwitch
}: CollectionsViewProps) {
  
  const [explorerSearch, setExplorerSearch] = useState('');
  const selectedFolderId = activeCollectionId || collections[0]?.id || null;
  const setSelectedFolderId = setActiveCollectionId;
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>(() => {
    // Expand first few by default
    const initial: Record<string, boolean> = {};
    collections.forEach(col => {
      initial[col.id] = true;
    });
    return initial;
  });

  const [copiedSpecs, setCopiedSpecs] = useState(false);
  const [colInputModal, setColInputModal] = useState(false);
  const [newColName, setNewColName] = useState('');

  const toggleFolder = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolders(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreateCollectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim()) return;

    const uniqueId = 'col-' + Math.random().toString(36).substring(4, 9);
    const newCol: CollectionFolder = {
      id: uniqueId,
      name: newColName.trim(),
      requests: []
    };

    setCollections(prev => [...prev, newCol]);
    setExpandedFolders(prev => ({ ...prev, [uniqueId]: true }));
    setSelectedFolderId(uniqueId);
    setNewColName('');
    setColInputModal(false);
    showNotification(`Created collection folder: "${newCol.name}"`);
  };

  const handleDeleteCollection = (id: string, name: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setCollections(prev => prev.filter(c => c.id !== id));
    if (selectedFolderId === id) {
      setSelectedFolderId(null);
    }
    showNotification(`Deleted collection: "${name}"`);
  };

  // Export current specs helper
  const handleExportSpecs = () => {
    const formatted = JSON.stringify(collections, null, 2);
    navigator.clipboard.writeText(formatted);
    setCopiedSpecs(true);
    showNotification('Exported collections specification to clipboard.');
    setTimeout(() => setCopiedSpecs(false), 2000);
  };

  // Flattened requests list matching workspace, search or click to populate the Table panel
  const currentActiveFolder = collections.find(c => c.id === selectedFolderId) || collections[0];

  const getMethodStyle = (method: string) => {
    switch (method) {
      case 'GET': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25';
      case 'POST': return 'text-amber-500 bg-amber-500/10 border-amber-500/25';
      case 'PUT': return 'text-blue-400 bg-blue-500/10 border-blue-500/25';
      case 'DELETE': return 'text-rose-400 bg-rose-500/10 border-rose-500/25';
      case 'PATCH': return 'text-purple-400 bg-purple-500/10 border-[#8B5CF6]/25';
      default: return 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20';
    }
  };

  const filteredCollections = collections.filter(col => 
    col.name.toLowerCase().includes(explorerSearch.toLowerCase()) ||
    col.requests.some(req => req.name.toLowerCase().includes(explorerSearch.toLowerCase()))
  );

  return (
    <div className="space-y-5 animate-fadeIn font-sans p-1 max-w-[1550px] mx-auto select-none relative">
      
      {/* 1. VIEW HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-zinc-900">
        <div>
          <h1 className="text-xl font-bold font-display text-white tracking-tight">All Collections</h1>
          <p className="text-zinc-500 text-xs mt-0.5">Organize your API endpoints into collections.</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick specs export */}
          <button
            onClick={handleExportSpecs}
            className="px-3 py-1.5 bg-[#0e1124] hover:bg-zinc-900 text-[11px] text-[#8792c2] hover:text-white border border-[#1e244d] rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer h-9 shrink-0"
          >
            {copiedSpecs ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Download className="w-3.5 h-3.5 text-purple-400" />}
            {copiedSpecs ? 'Exported!' : 'Export JSON Spec'}
          </button>
          
          <button
            onClick={() => setColInputModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-[#6D4AFF] to-[#8B5CF6] hover:from-[#8B5CF6] hover:to-[#a78bfa] text-white font-bold text-[11px] rounded-lg tracking-wide transition-all shadow-[0_0_15px_rgba(109,74,255,0.2)] cursor-pointer h-9 shrink-0 active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ New Collection</span>
          </button>
        </div>
      </div>

      {/* 2. DUAL LAYOUT: EXPLORER TREE (35%) | REQUESTS TABLE (65%) */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-5 items-stretch min-h-[480px]">
        
        {/* LEFT SIDE: COLLECTION EXPLORER TREE PANEL - 3.5 cols equivalent */}
        <div className="lg:col-span-4 p-4 bg-gradient-to-b from-[#0b0c16] to-[#04050d] border border-[#141830] rounded-2xl flex flex-col justify-between shadow-[0_4px_30px_rgba(0,0,0,0.4)] backdrop-blur">
          <div className="space-y-3.5 flex-1 flex flex-col">
            
            {/* Folder top search bar and Active Workspace Dropdown */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2.5 bg-[#6D4AFF]/5 border border-[#6D4AFF]/15 rounded-xl px-3 py-2 select-none">
                <div className="flex items-center gap-2 min-w-0">
                  <Database className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <div className="min-w-0 font-sans">
                    <p className="text-[9px] text-zinc-500 font-semibold font-mono uppercase tracking-wider leading-none">Workspace Context</p>
                    <p className="text-[11px] font-bold text-white tracking-tight mt-1.5 truncate">{selectedWorkspace}</p>
                  </div>
                </div>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search collections..."
                  value={explorerSearch}
                  onChange={(e) => setExplorerSearch(e.target.value)}
                  className="w-full bg-black/25 border border-white/5 pl-8 pr-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#6D4AFF] rounded-xl font-sans"
                />
              </div>
            </div>

            {/* Tree listing folders */}
            <div className="flex-1 overflow-y-auto max-h-[380px] pr-1 space-y-1.5 scrollbar-thin scrollbar-thumb-zinc-900 border-t border-zinc-900/60 pt-3">
              {filteredCollections.length === 0 ? (
                <div className="text-center py-10 font-mono text-[10px] text-zinc-600">
                  No directory logs match.
                </div>
              ) : (
                filteredCollections.map((col) => {
                  const isExpanded = !!expandedFolders[col.id];
                  const isSelected = selectedFolderId === col.id;

                  return (
                    <div 
                      key={col.id} 
                      onClick={() => setSelectedFolderId(col.id)}
                      className={`rounded-xl transition-all duration-250 ${
                        isSelected ? 'bg-[#6D4AFF]/5 border border-[#6D4AFF]/20' : 'bg-transparent border border-transparent'
                      }`}
                    >
                      {/* Folder segment header row */}
                      <div className="flex items-center justify-between p-2 hover:bg-white/[0.01] rounded-lg cursor-pointer group">
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={(e) => toggleFolder(col.id, e)}
                            className="p-0.5 text-zinc-500 hover:text-white rounded"
                          >
                            {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-purple-400 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-zinc-500 shrink-0" />}
                          </button>
                          
                          <div className="p-1.5 bg-[#6D4AFF]/10 border border-[#6D4AFF]/15 text-purple-400 rounded-lg shrink-0">
                            <Folder className="w-3 h-3 text-purple-400" />
                          </div>
                          
                          <div className="min-w-0 pr-1 leading-tight">
                            <span className="text-[11px] font-bold text-zinc-200 group-hover:text-white truncate block">{col.name}</span>
                            <span className="text-[8.5px] font-mono text-zinc-600 font-semibold">{col.requests.length} records</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => handleDeleteCollection(col.id, col.name, e)}
                          className="p-1 text-zinc-700 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors hidden group-hover:block cursor-pointer shrink-0"
                          title="Purge catalog"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      {/* INDENTED NESTED REQUESTS LIST */}
                      {isExpanded && col.requests.length > 0 && (
                        <div className="pl-6 pr-2 pb-2 space-y-1 select-none">
                          {col.requests.map((req) => {
                            const isReqSelected = selectedRequestId === req.id;
                            return (
                              <div
                                key={req.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedRequestId(req.id);
                                  setSelectedFolderId(col.id);
                                  onSelectedRequestLoad(req);
                                  showNotification(`Loaded request details for "${req.name}"`);
                                }}
                                className={`flex items-center justify-between p-1.5 rounded-lg border cursor-pointer select-none transition-all ${
                                  isReqSelected 
                                    ? 'bg-[#6D4AFF]/15 border-[#6D4AFF]/30 text-white shadow-inner font-extrabold' 
                                    : 'bg-transparent border-transparent hover:bg-white/[0.02] text-zinc-400'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className={`px-1 py-0.5 text-[7px] font-black rounded border font-mono tracking-wider shrink-0 select-none ${getMethodStyle(req.method)}`}>
                                    {req.method}
                                  </span>
                                  <span className="text-[10px] font-sans truncate font-medium">{req.name}</span>
                                </div>
                                
                                <ArrowRight className="w-2.5 h-2.5 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {isExpanded && col.requests.length === 0 && (
                        <div className="pl-9 pr-2 pb-2 text-[9px] font-mono text-zinc-600">
                          Empty folder mapping.
                        </div>
                      )}

                    </div>
                  );
                })
              )}
            </div>

          </div>
        </div>

        {/* RIGHT SIDE: COLLECTIONS REQUESTS TABLE PANEL - 6 cols equivalent */}
        <div className="lg:col-span-6 p-4 bg-gradient-to-b from-[#0b0c16] to-[#04050d] border border-[#141830] rounded-2xl flex flex-col justify-between shadow-[0_4px_30px_rgba(0,0,0,0.4)] backdrop-blur">
          
          <div className="space-y-4 flex-1 flex flex-col">
            
            {/* Table controls */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-900 select-none">
              <div className="space-y-0.5">
                <h3 className="text-xs font-bold text-white font-display uppercase tracking-wider">
                  {currentActiveFolder ? currentActiveFolder.name : 'Selected Items'}
                </h3>
                <p className="text-[10px] text-zinc-500 font-mono">Workspace Database: Schema Index Mapping</p>
              </div>

              {currentActiveFolder && (
                <button
                  onClick={() => {
                    // Quick add request inside active collections index
                    const name = prompt('Enter request name:', 'GET API Endpoint');
                    if (!name || !name.trim()) return;
                    
                    const newReq: ApiRequestItem = {
                      id: 'req-' + Date.now(),
                      name: name.trim(),
                      method: 'GET',
                      url: '{{BASE_URL}}/api/routes',
                      headers: [],
                      params: [],
                      bodyType: 'none',
                      bodyContent: '',
                      testScript: ''
                    };

                    setCollections(prev => prev.map(c => {
                      if (c.id === currentActiveFolder.id) {
                        return { ...c, requests: [...c.requests, newReq] };
                      }
                      return c;
                    }));
                    
                    onSelectedRequestLoad(newReq);
                    showNotification(`Appended request spec: "${newReq.name}"`);
                  }}
                  className="px-2.5 py-1.5 bg-black/45 hover:bg-[#6D4AFF]/10 hover:text-white border border-[#1e244d] rounded-lg text-[9.5px] font-bold text-[#8792c2] flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 h-[12px]" /> + Add Request Record
                </button>
              )}
            </div>

            {/* Content Table list */}
            <div className="flex-1 overflow-x-auto select-none">
              {!currentActiveFolder || currentActiveFolder.requests.length === 0 ? (
                <div className="text-center py-20 font-mono text-[10.5px] text-zinc-600 border border-dashed border-white/5 rounded-2xl bg-black/10">
                  No records stored inside current directory index folder. Click "+ Add Request Record" above or create a new collection segment.
                </div>
              ) : (
                <table className="w-full text-left text-[11px] font-sans border-collapse select-none">
                  <thead>
                    <tr className="border-b border-zinc-900/60 pb-2 text-[10px] font-mono text-zinc-500 font-bold uppercase select-none">
                      <th className="pb-3 pr-2 w-14">VERB</th>
                      <th className="pb-3">NAME OF RECORD</th>
                      <th className="pb-3 max-hidden sm:table-cell">MAPPED PATH ENDPOINT</th>
                      <th className="pb-3 text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900/60 text-zinc-300">
                    {currentActiveFolder.requests.map((req) => (
                      <tr 
                        key={req.id} 
                        onClick={() => {
                          setSelectedRequestId(req.id);
                          onSelectedRequestLoad(req);
                        }}
                        className={`hover:bg-white/[0.015] transition-all cursor-pointer group ${
                          selectedRequestId === req.id ? 'bg-[#6D4AFF]/5' : ''
                        }`}
                      >
                        {/* Verb */}
                        <td className="py-3 pr-2">
                          <span className={`px-1.5 py-0.5 text-[8px] font-mono font-black border rounded scale-90 block text-center w-[46px] select-none ${getMethodStyle(req.method)}`}>
                            {req.method}
                          </span>
                        </td>
                        {/* Title */}
                        <td className="py-3 font-semibold text-zinc-200 group-hover:text-white transition-colors truncate">
                          {req.name}
                        </td>
                        {/* Path URL */}
                        <td className="py-3 text-zinc-500 font-mono text-[10px] max-w-xs truncate pr-3 max-hidden sm:table-cell">
                          {req.url}
                        </td>
                        {/* Actions load */}
                        <td className="py-3 text-right select-none">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectedRequestLoad(req);
                              onRequestTabSwitch('apitester');
                            }}
                            className="px-2.5 py-1 bg-[#6D4AFF]/10 border border-[#6D4AFF]/20 hover:bg-[#6D4AFF] hover:text-white text-purple-300 font-bold text-[9px] rounded-md tracking-tight transition-all cursor-pointer whitespace-nowrap uppercase leading-none h-[22px]"
                          >
                            Run Tester
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

          </div>
          
        </div>

      </div>

      {/* 3. COLLECTION CREATOR MODAL DIALOG */}
      {colInputModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0b0c16]/95 border border-[#1e2447] rounded-3xl p-6 max-w-sm w-full shadow-2xl relative font-sans animate-zoomIn space-y-4 select-none">
            
            <div className="space-y-1">
              <h2 className="text-base font-bold text-white tracking-tight font-display mb-1">Create New Folder Category</h2>
              <p className="text-zinc-500 text-xs">Organize your endpoints inside a common spec folder block.</p>
            </div>

            <form onSubmit={handleCreateCollectionSubmit} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-zinc-500 font-mono">Category Folder Title</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Products Gateway REST endpoints"
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#6D4AFF] font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-900 select-none">
                <button
                  type="button"
                  onClick={() => setColInputModal(false)}
                  className="px-4 py-2 hover:bg-white/5 border border-transparent rounded-xl text-xs font-bold text-zinc-400 hover:text-white cursor-pointer select-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl text-xs font-bold text-white shadow-lg cursor-pointer"
                >
                  Establish Folder
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
