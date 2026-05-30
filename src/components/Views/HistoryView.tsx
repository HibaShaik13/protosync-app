import React, { useState } from 'react';
import { 
  Search, 
  Trash2, 
  Layers, 
  Clock, 
  Database, 
  Activity, 
  ArrowRight, 
  X, 
  Check, 
  Copy, 
  SlidersHorizontal,
  ChevronRight,
  Filter,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';
import { QueryHistory, ApiRequestItem } from '../../types';

interface HistoryViewProps {
  historyLedger: QueryHistory[];
  setHistoryLedger: React.Dispatch<React.SetStateAction<QueryHistory[]>>;
  setActiveRequest: (req: ApiRequestItem) => void;
  setActiveTab: (tab: any) => void;
  showNotification: (msg: string) => void;
}

export default function HistoryView({
  historyLedger,
  setHistoryLedger,
  setActiveRequest,
  setActiveTab,
  showNotification
}: HistoryViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedLog, setSelectedLog] = useState<QueryHistory | null>(null);
  const [copiedLogId, setCopiedLogId] = useState<string | null>(null);

  // Performance calculations
  const totalRequests = historyLedger.length;
  const averageLatency = totalRequests > 0 
    ? Math.round(historyLedger.reduce((acc, curr) => acc + curr.latency, 0) / totalRequests)
    : 0;
  
  const successCount = historyLedger.filter(item => item.status >= 200 && item.status < 300).length;
  const successRatio = totalRequests > 0 ? Math.round((successCount / totalRequests) * 100) : 100;
  const totalBytes = historyLedger.reduce((acc, curr) => acc + (curr.responseBytes || 0), 0);
  const formattedBytes = totalBytes > 1048576 
    ? `${(totalBytes / 1048576).toFixed(2)} MB` 
    : totalBytes > 1024 
    ? `${(totalBytes / 1024).toFixed(1)} KB` 
    : `${totalBytes} B`;

  // Filter lists
  const filteredHistory = historyLedger.filter(item => {
    const matchesSearch = item.endpoint.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMethod = selectedMethod === 'ALL' || item.method === selectedMethod;
    
    let matchesStatus = true;
    if (selectedStatus === '2XX') {
      matchesStatus = item.status >= 200 && item.status < 300;
    } else if (selectedStatus === '4XX') {
      matchesStatus = item.status >= 400 && item.status < 500;
    } else if (selectedStatus === '5XX') {
      matchesStatus = item.status >= 500;
    }

    return matchesSearch && matchesMethod && matchesStatus;
  });

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLogId(id);
    showNotification('Copied log endpoint target details.');
    setTimeout(() => setCopiedLogId(null), 2000);
  };

  const handleReloadRequest = (item: QueryHistory) => {
    setActiveRequest({
      id: 'req-' + Date.now(),
      name: `Rebuilt: ${item.method} ${item.endpoint.split('/').pop()?.split('?')[0] || 'endpoint'}`,
      method: item.method as any,
      url: item.endpoint,
      headers: [
        { id: 'h-auto', key: 'Content-Type', value: 'application/json', active: true }
      ],
      params: [],
      bodyType: item.method === 'GET' ? 'none' : 'json',
      bodyContent: item.responsePreview && item.responsePreview.startsWith('{') ? '{\n  "ref": "loaded_from_history"\n}' : ''
    });
    setActiveTab('apitester');
    showNotification('Loaded target handshake specs inside API Tester.');
  };

  return (
    <div className="space-y-6 animate-fadeIn font-sans p-1">
      
      {/* Top Section Header */}
      <div className="pb-3 border-b border-[#141830] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white font-display">Workspace Handshakes Trace Log Ledger</h2>
          <p className="text-zinc-500 text-xs">Verify past transaction signatures, inspect payloads, and restore playground configurations.</p>
        </div>

        <button
          onClick={() => {
            setHistoryLedger([]);
            setSelectedLog(null);
            showNotification('Cleared all live transaction history logs.');
          }}
          className="self-start md:self-auto px-4 py-2 bg-rose-950/20 hover:bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-semibold cursor-pointer select-none transition-colors duration-200"
        >
          Clear Workspace History
        </button>
      </div>

      {/* Analytics widgets metrics bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-4 bg-[#090b16]/50 border border-[#11152a] rounded-2xl relative overflow-hidden flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-extrabold block">TOTAL TRACES</span>
            <div className="text-xl font-bold font-mono text-white">{totalRequests} <span className="text-xs text-zinc-500 font-normal">nodes</span></div>
          </div>
          <div className="p-2.5 bg-purple-500/10 text-purple-400 border border-purple-500/10 rounded-xl shrink-0">
            <Database className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 bg-[#090b16]/50 border border-[#11152a] rounded-2xl relative overflow-hidden flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-extrabold block">AVERAGE LATENCY</span>
            <div className="text-xl font-bold font-mono text-cyan-400">{averageLatency} <span className="text-xs text-zinc-500 font-normal">ms</span></div>
          </div>
          <div className="p-2.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/10 rounded-xl shrink-0">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 bg-[#090b16]/50 border border-[#11152a] rounded-2xl relative overflow-hidden flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-extrabold block">SUCCESS RATIO</span>
            <div className="text-xl font-bold font-mono text-emerald-400">{successRatio}%</div>
          </div>
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 rounded-xl shrink-0">
            <CheckCircle className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 bg-[#090b16]/50 border border-[#11152a] rounded-2xl relative overflow-hidden flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-extrabold block">TOTAL BANDWIDTH</span>
            <div className="text-xl font-bold font-mono text-purple-400">{formattedBytes}</div>
          </div>
          <div className="p-2.5 bg-indigo-500/10 text-purple-400 border border-indigo-500/10 rounded-xl shrink-0">
            <Activity className="w-4 h-4" />
          </div>
        </div>

      </div>

      {/* Primary Layout Controls & Ledger Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        
        {/* Main Log tables column - spans all if no active details log drawer is selected */}
        <div className={`${selectedLog ? 'xl:col-span-8' : 'xl:col-span-12'} p-5 bg-[#090b16]/50 border border-[#11152a] rounded-3xl space-y-4 transition-all duration-300`}>
          
          {/* Filters controls panel */}
          <div className="flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center text-xs pb-2 border-b border-white/5">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Query by URL target endpoint or Transaction ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#05060d] border border-white/5 rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition-colors"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')} 
                  className="absolute right-3 top-2.5 text-zinc-500 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick dropdown filters */}
            <div className="flex flex-wrap items-center gap-2.5">
              
              {/* Method select */}
              <div className="flex items-center gap-1.5 bg-[#05060d] border border-white/5 rounded-xl px-2.5 py-1.5 text-zinc-400">
                <span className="font-mono text-[9px] uppercase tracking-wide text-zinc-500">METHOD:</span>
                <select
                  value={selectedMethod}
                  onChange={(e) => setSelectedMethod(e.target.value)}
                  className="bg-transparent border-none text-zinc-200 focus:outline-none text-xs font-semibold cursor-pointer uppercase font-mono"
                >
                  <option value="ALL">ALL</option>
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>

              {/* Status select */}
              <div className="flex items-center gap-1.5 bg-[#05060d] border border-white/5 rounded-xl px-2.5 py-1.5 text-zinc-400">
                <span className="font-mono text-[9px] uppercase tracking-wide text-zinc-500">STATUS:</span>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="bg-transparent border-none text-zinc-200 focus:outline-none text-xs font-semibold cursor-pointer uppercase font-mono"
                >
                  <option value="ALL">ALL CODES</option>
                  <option value="2XX">2XX SUCCESS</option>
                  <option value="4XX">4XX FAILURES</option>
                  <option value="5XX">5XX SHIELD FAULTS</option>
                </select>
              </div>

            </div>

          </div>

          {/* List/Table */}
          {filteredHistory.length === 0 ? (
            <div className="py-20 text-center border border-dashed border-white/5 rounded-2xl bg-black/5 flex flex-col items-center justify-center space-y-2">
              <span className="text-zinc-600 font-mono text-xs">No matching transaction footprints found.</span>
              <p className="text-[10px] text-zinc-500 max-w-sm">Trigger API testing gateway transactions or alter filtering keywords.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#141830] text-zinc-500 text-[10px] uppercase font-bold tracking-wider select-none">
                    <th className="pb-3 font-mono">METHOD</th>
                    <th className="pb-3 font-mono">TARGET ENDPOINT</th>
                    <th className="pb-3 font-mono">STATUS</th>
                    <th className="pb-3 font-mono">LATENCY SLA</th>
                    <th className="pb-3 font-mono">SIZE</th>
                    <th className="pb-3 font-mono text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900/50">
                  {filteredHistory.map((item) => {
                    const isSuccess = item.status >= 200 && item.status < 300;
                    const isError = item.status >= 500;
                    const isAuthError = item.status === 401 || item.status === 403;
                    const isActive = selectedLog?.id === item.id;

                    const sizeRepr = item.responseBytes > 1024 
                      ? `${(item.responseBytes / 1024).toFixed(1)} KB` 
                      : `${item.responseBytes} B`;

                    return (
                      <tr 
                        key={item.id} 
                        onClick={() => setSelectedLog(item)}
                        className={`hover:bg-white/[0.02] cursor-pointer transition-colors duration-150 group ${
                          isActive ? 'bg-[#9333ea]/5 border border-[#a855f7]/25' : ''
                        }`}
                      >
                        <td className="py-3.5">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider block w-fit ${
                            item.method === 'GET' ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' 
                            : item.method === 'POST' ? 'text-purple-400 bg-purple-500/10 border border-purple-500/20' 
                            : item.method === 'DELETE' ? 'text-rose-400 bg-rose-500/10 border border-rose-500/20' 
                            : 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
                          }`}>
                            {item.method}
                          </span>
                        </td>
                        
                        <td className="py-3.5 pr-4 max-w-[280px] lg:max-w-[400px] truncate font-mono text-zinc-200 select-all font-semibold" title={item.endpoint}>
                          {item.endpoint}
                        </td>
                        
                        <td className="py-3.5 font-mono">
                          <span className={`flex items-center gap-1.5 font-bold ${
                            isSuccess ? 'text-emerald-400' 
                            : isError ? 'text-rose-400 shadow-[0_0_8px_rgba(239,68,68,0.15)]' 
                            : isAuthError ? 'text-amber-400' 
                            : 'text-zinc-400'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              isSuccess ? 'bg-emerald-500 animate-pulse' 
                              : isError ? 'bg-rose-500' 
                              : isAuthError ? 'bg-amber-500' 
                              : 'bg-zinc-500'
                            }`} />
                            {item.status}
                          </span>
                        </td>
                        
                        <td className="py-3.5 font-mono">
                          <span className={`${
                            item.latency < 100 ? 'text-emerald-400' 
                            : item.latency < 400 ? 'text-zinc-300' 
                            : 'text-rose-400 font-semibold'
                          }`}>
                            {item.latency}ms
                          </span>
                        </td>

                        <td className="py-3.5 font-mono text-zinc-500">
                          {sizeRepr}
                        </td>

                        <td className="py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleReloadRequest(item)}
                            className="bg-zinc-900 border border-white/5 hover:border-purple-500/30 text-purple-400 hover:text-white text-[9px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all"
                          >
                            Restore
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer stats count and pagination metrics */}
          <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500 pt-3 border-t border-white/5">
            <span>SHOWING {filteredHistory.length} OF {totalRequests} RECORDS CONTEXT</span>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span>LOG LEDGER CONNECTED SECURELY</span>
            </div>
          </div>

        </div>

        {/* Sliding VSCode-style Detail drawer panel column - spans 4 */}
        {selectedLog && (
          <div className="xl:col-span-4 p-5 bg-[#0a0c16] border border-[#1f254e] rounded-3xl space-y-4 animate-slideLeft">
            
            {/* Header drawer controls */}
            <div className="flex justify-between items-center pb-2 border-b border-white/15">
              <div className="space-y-0.5">
                <span className="text-[9px] font-mono text-purple-400 font-bold uppercase tracking-wider block">Signature Details Panel</span>
                <span className="text-[10px] font-mono text-zinc-400 truncate max-w-[180px] block" title={selectedLog.id}>
                  ID: {selectedLog.id}
                </span>
              </div>

              <button 
                onClick={() => setSelectedLog(null)}
                className="p-1 px-2.5 bg-zinc-900/50 hover:bg-white/10 hover:text-white border border-white/5 text-zinc-400 rounded-lg text-xs"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* HTTP Specifications parameters */}
            <div className="space-y-4">
              
              {/* Endpoint row */}
              <div className="space-y-1">
                <span className="text-[9px] font-mono text-zinc-500 uppercase block">TARGET URI</span>
                <div className="p-2.5 bg-black/40 rounded-xl border border-white/5 font-mono text-[11px] text-zinc-300 break-all select-all flex justify-between gap-1 items-start">
                  <span>{selectedLog.endpoint}</span>
                  <button 
                    onClick={() => handleCopyText(selectedLog.endpoint, selectedLog.id)}
                    className="p-1 shrink-0 bg-[#0e1124] hover:bg-white/5 border border-white/5 rounded text-zinc-500 hover:text-white"
                  >
                    {copiedLogId === selectedLog.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              {/* Status & Latency Specs double grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase block">HTTP CODE</span>
                  <div className="p-2.5 bg-black/40 rounded-xl border border-white/5 font-mono text-[11.5px] text-white font-bold flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${selectedLog.status >= 200 && selectedLog.status < 300 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    {selectedLog.status} {selectedLog.status >= 200 && selectedLog.status < 300 ? 'OK' : 'FAIL'}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase block">TRANSMISSION TIME</span>
                  <div className="p-2.5 bg-black/40 rounded-xl border border-white/5 font-mono text-[11.5px] text-cyan-400 font-bold">
                    {selectedLog.latency} ms
                  </div>
                </div>
              </div>

              {/* Timestamp and weights details */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase block">RECORD TIME</span>
                  <div className="p-2.5 bg-black/40 rounded-xl border border-white/5 font-mono text-[11px] text-zinc-400">
                    {selectedLog.timestamp}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase block">DATA DENSITY WEIGHT</span>
                  <div className="p-2.5 bg-black/40 rounded-xl border border-white/5 font-mono text-[11px] text-zinc-400">
                    {selectedLog.responseBytes} bytes
                  </div>
                </div>
              </div>

              {/* Response Code Block Viewer (VSCode dark theme simulation) */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase block">RESPONSE PREVIEW BODY</span>
                  <span className="text-[9px] font-mono text-purple-400 uppercase tracking-widest font-extrabold">application/json</span>
                </div>

                <div className="p-3 bg-[#030408] rounded-xl border border-white/10 font-mono text-[10.5px] text-purple-200 leading-normal select-all overflow-x-auto select-none">
                  {selectedLog.responsePreview && selectedLog.responsePreview.startsWith('{') ? (
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(JSON.parse((selectedLog.responsePreview.endsWith('...') ? selectedLog.responsePreview.slice(0, -3) : selectedLog.responsePreview)), null, 2)}
                    </pre>
                  ) : (
                    <pre className="whitespace-pre-wrap">{selectedLog.responsePreview || 'Empty raw response payload body.'}</pre>
                  )}
                </div>
              </div>

              {/* Action trigger restore */}
              <button
                onClick={() => handleReloadRequest(selectedLog)}
                className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-2"
              >
                <span>RELOAD SOURCE SPEC INTO WORKBENCH</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

            </div>

          </div>
        )}

      </div>

    </div>
  );
}
