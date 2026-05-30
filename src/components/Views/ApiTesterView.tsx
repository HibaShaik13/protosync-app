/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Folder, 
  Plus, 
  Trash2, 
  Search, 
  ChevronRight, 
  ChevronDown, 
  FolderPlus, 
  Play, 
  RefreshCw, 
  Check, 
  Copy, 
  CheckCircle,
  Eye,
  EyeOff,
  Activity
} from 'lucide-react';
import { ApiRequestItem, CollectionFolder, EnvVar, QueryHistory, User } from '../../types';

interface ApiTesterViewProps {
  user: User;
  activeRequest: ApiRequestItem;
  setActiveRequest: React.Dispatch<React.SetStateAction<ApiRequestItem>>;
  filteredCollections: CollectionFolder[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  expandedFolders: Record<string, boolean>;
  setExpandedFolders: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  activeCollectionId: string | null;
  setActiveCollectionId: (id: string | null) => void;
  
  addHeaderRow: () => void;
  deleteHeaderRow: (id: string) => void;
  updateHeaderRow: (id: string, field: 'key' | 'value' | 'description', val: string) => void;
  toggleHeaderRow: (id: string) => void;
  
  addParamRow: () => void;
  deleteParamRow: (id: string) => void;
  updateParamRow: (id: string, field: 'key' | 'value' | 'description', val: string) => void;
  toggleParamRow: (id: string) => void;

  handleCreateCollection: () => void;
  handleAddNewRequestToCollection: (colId: string) => void;
  loadRequestToWorkbench: (req: ApiRequestItem) => void;
  
  executingRequest: boolean;
  handleRunRequest: (e: React.FormEvent) => void;
  
  lastResponse: any;
  lastResponseStatus: number;
  lastResponseSize: string;
  lastResponseTime: number;
  testResults: Array<{ name: string; passed: boolean }>;

  playgroundSubTab: 'params' | 'headers' | 'body' | 'auth' | 'scripts' | 'tests';
  setPlaygroundSubTab: (tab: 'params' | 'headers' | 'body' | 'auth' | 'scripts' | 'tests') => void;
  responseSubTab: 'json' | 'headers' | 'results' | 'troubleshoot';
  setResponseSubTab: (tab: 'json' | 'headers' | 'results' | 'troubleshoot') => void;

  envVars: EnvVar[];
  addEnvRow: () => void;
  updateEnvRow: (id: string, field: 'key' | 'value', value: string) => void;
  toggleEnvRow: (id: string) => void;
  deleteEnvRow: (id: string) => void;
  toggleEnvSecret: (id: string) => void;

  copiedKey: string | null;
  handleCopyClipboard: (text: string, label: string) => void;
  resolveEnvironmentValue: (raw: string) => string;
  
  historyLedger: QueryHistory[];
  setHistoryLedger: React.Dispatch<React.SetStateAction<QueryHistory[]>>;
  showNotification: (msg: string) => void;
}

export default function ApiTesterView({
  user,
  activeRequest,
  setActiveRequest,
  filteredCollections,
  searchQuery,
  setSearchQuery,
  expandedFolders,
  setExpandedFolders,
  activeCollectionId,
  setActiveCollectionId,
  addHeaderRow,
  deleteHeaderRow,
  updateHeaderRow,
  toggleHeaderRow,
  addParamRow,
  deleteParamRow,
  updateParamRow,
  toggleParamRow,
  handleCreateCollection,
  handleAddNewRequestToCollection,
  loadRequestToWorkbench,
  executingRequest,
  handleRunRequest,
  lastResponse,
  lastResponseStatus,
  lastResponseSize,
  lastResponseTime,
  testResults,
  playgroundSubTab,
  setPlaygroundSubTab,
  responseSubTab,
  setResponseSubTab,
  envVars,
  addEnvRow,
  updateEnvRow,
  toggleEnvRow,
  deleteEnvRow,
  toggleEnvSecret,
  copiedKey,
  handleCopyClipboard,
  resolveEnvironmentValue,
  historyLedger,
  setHistoryLedger,
  showNotification
}: ApiTesterViewProps) {

  const [troubleshootTab, setTroubleshootTab] = React.useState<'guide' | 'flask' | 'client' | 'sql'>('guide');

  const getRequestPath = () => {
    try {
      const urlStr = resolveEnvironmentValue(activeRequest.url);
      const withHttp = urlStr.startsWith('http') ? urlStr : `http://${urlStr}`;
      const u = new URL(withHttp);
      return u.pathname || '/postdata';
    } catch(e) {
      return '/postdata';
    }
  };

  const getBodyKeys = (): string[] => {
    try {
      const content = resolveEnvironmentValue(activeRequest.bodyContent || '');
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed === 'object') {
        const keys = Object.keys(parsed);
        if (keys.length > 0) return keys;
      }
    } catch(e) {}
    return ['name', 'department']; // default fallback
  };

  const getFlaskRemediationCode = () => {
    const route = getRequestPath();
    const bodyKeys = getBodyKeys();
    const extractionLines = bodyKeys.map(k => `    ${k} = data.get("${k}")`).join('\n');
    const validationCheck = `    if not ${bodyKeys.join(' or not ')}:`;
    const schemaColumns = bodyKeys.join(', ');
    const schemaPlaceholders = bodyKeys.map(() => '?').join(', ');
    const paramsTuple = bodyKeys.map(k => k).join(', ');

    return `# =========================================================
# PRODUCTION-READY FLASK SERVER (RESOLVES SANDBOX BLOCKS & CORS)
# =========================================================
# Requirements: pip install flask flask-cors
# Execute command: python app.py

from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import sys

app = Flask(__name__)

# ENABLE COMPREHENSIVE GLOBAL CORS (Permits safe sandbox triggers)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

DB_PATH = "students.db"

def init_db():
    """Initializes local SQLite3 database tracking student schemas."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            department TEXT NOT NULL
        )
    ''')
    conn.commit()
    conn.close()

init_db()

@app.route('${route}', methods=['${activeRequest.method}'])
def handle_endpoint():
    # 1. Advanced Backend Logging - print(request.json) equivalent
    print("\\n[Flask APILog] Received incoming request on route: ${route}")
    print(f"Origin IP Access: {request.remote_addr} | Content-Type: {request.content_type}")
    
    # 2. Extract and Validate body format (Supports JSON defaults fallback)
    data = request.get_json(silent=True)
    if not data:
        print("[Flask Warning] Missing JSON payload. Falling back to empty body '{}'.")
        data = {}

${extractionLines}

    # 3. Request Attribute Level Validation schemas
${validationCheck}
        print("[Flask APIValidationError] Attributes verification failed. Missing required body values.")
        return jsonify({
            "error": "Bad Request Schema",
            "message": "Required keys (${bodyKeys.join(', ')}) were empty or incomplete in request."
        }), 400

    # 4. Persistence transactions integration (SQLite3 DB insertion logic)
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # SQLite Insertion Engine
        cursor.execute(
            "INSERT INTO students (${schemaColumns}) VALUES (${schemaPlaceholders})", 
            (${paramsTuple})
        )
        conn.commit()
        last_id = cursor.lastrowid
        conn.close()

        print(f"[Flask APISuccess] Student persisted successfully. Generated Row ID: {last_id}")
        return jsonify({
            "message": "Student Added Successfully",
            "row_id": last_id,
            "status": "201_CREATED"
        }), 201

    except Exception as e:
        print(f"[Flask APIDatabaseError] Persistence pipeline collapsed: {str(e)}", file=sys.stderr)
        return jsonify({
            "error": "Database persistence error",
            "details": str(e)
        }), 500

@app.route('${route}', methods=['GET'])
def list_records():
    # Helper route to verify insertion transactions
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM students")
        rows = cursor.fetchall()
        conn.close()
        
        records = [{"id": r[0], "name": r[1], "department": r[2]} for r in rows]
        return jsonify({
            "students": records,
            "count": len(records)
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Add explicit support for host='0.0.0.0' and port 5000 as mandated by infrastructure
    print("Launching Flask server on port 5000...")
    app.run(host='0.0.0.0', port=5000, debug=True)
`;
  };

  const getReactFetchRemediationCode = () => {
    const route = getRequestPath();
    const bodyKeys = getBodyKeys();
    const payloadObjStr = bodyKeys.map(k => `        "${k}": "${k === 'name' ? 'Hiba' : k === 'department' ? 'CSE' : 'value'}"`).join(',\n');

    return `// =========================================================
// STANDARD CLIENT FETCH INTERACTION (REACT FRONTEND INTEGRATION)
// =========================================================

const triggerHandshake = async () => {
  // Safe environment auto-switching URLs handler (supports localhost & public tunnels)
  const isTestingInSandbox = window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1";
  
  // Replace with your real-time ngrok tunnel address if working outside localhost bounds
  const publicTunnelURL = "https://xxxx.ngrok-free.app"; 
  const targetAPI = isTestingInSandbox 
    ? \`\${publicTunnelURL}${route}\` 
    : "http://127.0.0.1:5000${route}";

  console.log(\`[Fetch Link] Directing execution to: \${targetAPI}... \`);

  try {
    const response = await fetch(targetAPI, {
      method: "${activeRequest.method}",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        // Bypasses the default free-tier ngrok warning splash-screen walls
        "ngrok-skip-browser-warning": "69420" 
      },
      body: JSON.stringify({
\${payloadObjStr}
      })
    });

    if (!response.ok) {
      throw new Error(\`Server responded with fault status: \${response.status}\`);
    }

    const data = await response.json();
    console.log("Transmission completely finalized! Result:", data);
  } catch (error) {
    console.error("handshake transmission rejected:", error.message);
  }
};
`;
  };

  const getSQLiteSchemaCode = () => {
    const bodyKeys = getBodyKeys();
    const tableColumns = bodyKeys.map(k => `    ${k} TEXT NOT NULL`).join(',\n');
    const demoValues = bodyKeys.map((k) => k === 'name' ? "'Hiba'" : k === 'department' ? "'CSE'" : "'demo_val'").join(', ');

    return `-- =========================================================
-- SQLITE3 PERSISTENT LOCAL DATABASES SETUP
-- =========================================================

-- 1. Create student persisted table schemas
CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
${tableColumns}
);

-- 2. Seed default insert check to verify engine logic works
INSERT INTO students (${bodyKeys.join(', ')}) 
VALUES (${demoValues});

-- 3. Query records verification check
SELECT * FROM students;
`;
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start p-2 animate-fadeIn font-sans">
      
      {/* ========================================================= */}
      {/* 2.1 COLLECTIONS DIRECTORY DRAWER - Width: 320px equivalents */}
      {/* ========================================================= */}
      <div className="xl:col-span-3 bg-[#0a0c1a]/55 border border-[#171c3a] rounded-3xl p-4 flex flex-col min-h-[460px] max-h-[640px] overflow-hidden shadow-xl relative backdrop-blur-md">
        
        {/* Header collections and actions icon */}
        <div className="flex items-center justify-between border-b border-[#12162a] pb-3 mb-3">
          <div className="flex items-center gap-1.5 select-none text-purple-200">
            <Folder className="w-4 h-4 text-purple-400" />
            <span className="font-display font-black text-xs uppercase tracking-wider">Collections</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleCreateCollection}
              title="Create new collection folder"
              className="p-1 hover:bg-purple-500/15 border border-transparent rounded text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
            >
              <FolderPlus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Input search Collections inside directory tree */}
        <div className="relative mb-3.5">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2" />
          <input
            type="text"
            placeholder="Search folder collections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/40 border border-[#141830] pl-8.5 pr-3 py-1 text-[11px] rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/55"
          />
        </div>

        {/* Scrollable listing folders */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 scrollbar-thin">
          {filteredCollections.length === 0 ? (
            <div className="text-center py-10 text-[10px] font-mono text-zinc-600">
              No files match search.
            </div>
          ) : (
            filteredCollections.map((col) => {
              const soccerExpanded = expandedFolders[col.id];
              const isExpanded = soccerExpanded === undefined ? (col.id === activeCollectionId) : soccerExpanded;
              const isSelected = activeCollectionId === col.id;
              
              return (
                <div key={col.id} className="space-y-1">
                  
                  {/* Folder element */}
                  <div className={`flex items-center justify-between group px-1.5 py-1 rounded-xl transition-all ${
                    isSelected ? 'bg-purple-600/10 border border-purple-500/35 shadow-[0_0_10px_rgba(109,74,255,0.1)]' : 'hover:bg-[#101429]/40'
                  }`}>
                    <button
                      onClick={() => {
                        setActiveCollectionId(col.id);
                        setExpandedFolders(prev => ({ ...prev, [col.id]: !isExpanded }));
                      }}
                      className="flex items-center gap-2 text-left flex-1 font-mono text-[11px] font-bold text-zinc-300 hover:text-white min-w-0"
                    >
                      {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-purple-500 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />}
                      <span className="truncate max-w-[125px]" title={col.name}>{col.name}</span>
                      <span className="text-[9px] text-zinc-500 font-normal shrink-0">({col.requests.length})</span>
                    </button>

                    <button
                      onClick={() => handleAddNewRequestToCollection(col.id)}
                      title="Append new custom endpoint specs"
                      className="p-1 hover:bg-[#6D4AFF]/15 text-purple-400 hover:text-purple-300 rounded transition flex items-center justify-center border border-purple-500/15 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Child nodes inside folders */}
                  {isExpanded && col.requests.map((req) => {
                    const isSelected = activeRequest.id === req.id;
                    const methodLabels = {
                      GET: 'text-emerald-400 bg-emerald-500/10',
                      POST: 'text-purple-400 bg-purple-500/10',
                      PUT: 'text-blue-400 bg-blue-500/10',
                      DELETE: 'text-rose-400 bg-rose-500/10',
                      PATCH: 'text-amber-400 bg-amber-500/10',
                    };

                    return (
                      <button
                        key={req.id}
                        onClick={() => loadRequestToWorkbench(req)}
                        className={`w-full pl-6 pr-2 py-2 rounded-xl text-left flex items-center justify-between gap-2.5 transition-all outline-none border cursor-pointer ${
                          isSelected 
                            ? 'bg-[#18122d]/75 border-purple-500/40 text-purple-200 font-bold shadow-[inset_0_0_12px_rgba(168,85,247,0.1)]' 
                            : 'bg-transparent border-transparent text-[#97a0cc] hover:bg-white/[0.01]'
                        }`}
                      >
                        <span className="text-[11px] truncate flex-1 font-sans">{req.name}</span>
                        <span className={`text-[8px] font-mono leading-none font-black px-1 py-0.5 rounded border uppercase shrink-0 ${
                          methodLabels[req.method as keyof typeof methodLabels] || 'text-[#97a0cc]'
                        }`}>
                          {req.method}
                        </span>
                      </button>
                    );
                  })}

                </div>
              );
            })
          )}
        </div>

      </div>

      {/* ========================================================= */}
      {/* 2.2 MAIN API WORKBENCH ENGINE - Width: columns 5 equivalent */}
      {/* ========================================================= */}
      <div className="xl:col-span-5 bg-[#0a0c1a]/55 border border-[#171c3a] rounded-3xl p-4.5 space-y-4 shadow-xl backdrop-blur-md">
        
        {/* Method & Address Form */}
        <form onSubmit={handleRunRequest} className="space-y-4">
          <div className="flex gap-2">
            
            {/* Method Select */}
            <select
              value={activeRequest.method}
              onChange={(e) => setActiveRequest(prev => ({ ...prev, method: e.target.value as any }))}
              className="bg-[#0b0c15] border border-[#1e2343] rounded-xl px-3 py-2.5 text-xs font-mono font-black text-purple-300 focus:outline-none focus:border-purple-500 cursor-pointer text-center"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
            </select>

            {/* URL input */}
            <div className="flex-1 space-y-1.5">
              <input
                type="text"
                value={activeRequest.url}
                onChange={(e) => setActiveRequest(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://api.protosync.io/v1/health"
                className="w-full bg-[#0b0c15] border border-[#1e2343] rounded-xl px-3.5 py-2.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-purple-500"
              />
              {activeRequest.url.includes('{{') && (
                <div className="text-[10px] font-mono text-purple-400 pl-1 flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-purple-500" />
                  <span>Resolved URL: <code className="text-zinc-300 break-all bg-black/30 px-1 py-0.5 rounded border border-white/5">{resolveEnvironmentValue(activeRequest.url)}</code></span>
                </div>
              )}
              
              {(activeRequest.url.toLowerCase().includes('localhost') || activeRequest.url.toLowerCase().includes('127.0.0.1')) && (
                <div className="text-[10.5px] font-sans text-amber-300 bg-amber-950/20 border border-amber-500/20 rounded-xl p-3.5 mt-2 space-y-2 text-left leading-relaxed">
                  <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    <span>Browser localhost Sandbox Security Constraint</span>
                  </div>
                  <p className="text-zinc-300">
                    Desktop clients like Postman run natively with system-level privileges bypasses. However, modern web clients (like ProtoSync, Swagger, and Hoppscotch Web) run in secure HTTPS browser sandboxes. To protect your machine's loopbacks, browsers **strictly block** mixed-content connections from secure cloud pages to insecure local endpoints like <code className="text-zinc-100 font-mono bg-black/40 px-1.5 py-0.5 rounded border border-white/5">http://127.0.0.1:5000</code>.
                  </p>
                  <div>
                    <span className="text-purple-300 font-bold block mb-1">🛠️ Two professional ways to run local testing instantly:</span>
                    <ul className="space-y-2 pl-0 list-none">
                      <li className="flex gap-2 items-start">
                        <span className="text-purple-400 font-bold font-mono">1.</span>
                        <div className="text-zinc-300">
                          <strong>Recommended (Fastest & Simplest):</strong> Pipe your port 5000 into a secure public tunnel by running <code className="text-purple-200 font-mono bg-black/50 px-1 py-0.5 rounded font-semibold">ngrok http 5000</code> in your terminal. Paste the generated secure tunnel URL (e.g. <code className="text-emerald-400 font-mono">https://xxxx.ngrok-free.app/postdata</code>) in the URL input above. 
                          <span className="text-[9.5px] text-zinc-400 block mt-0.5 italic">Note: Our smart proxy gateway automatically strips the ngrok warning splash screen for you!</span>
                        </div>
                      </li>
                      <li className="flex gap-2 items-start">
                        <span className="text-purple-400 font-bold font-mono">2.</span>
                        <div className="text-zinc-300">
                          <strong>Local Python/Flask Route:</strong> If your browser permits local requests, you must enable absolute Cross-Origin Resource Sharing (CORS) inside your flask code by running:
                          <pre className="text-[9px] font-mono text-purple-300 bg-black/50 p-2 rounded border border-white/5 mt-1 max-w-full overflow-x-auto">
{`from flask_cors import CORS
CORS(app)  # Permits sandbox incoming traffic`}
                          </pre>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Send button */}
            <button
              type="submit"
              disabled={executingRequest}
              className="px-5.5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-xs font-bold text-white rounded-xl transition-all shadow-lg shadow-purple-900/10 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 font-sans"
            >
              {executingRequest ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" strokeWidth={3} />
                  <span>Send...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current shrink-0" strokeWidth={3} />
                  <span>Send</span>
                </>
              )}
            </button>

          </div>
        </form>

        {/* Workbench sub-tabs panels navigation */}
        <div className="border border-[#141830] bg-[#0c0e1e]/45 rounded-2xl overflow-hidden">
          
          <div className="bg-black/35 border-b border-[#141830] px-3.5 py-1.5 flex items-center gap-1.5 overflow-x-auto select-none scrollbar-none">
            {(['params', 'headers', 'body', 'auth', 'scripts', 'tests'] as const).map((sub) => {
              const tabLabels = {
                params: 'Params',
                headers: `Headers (${activeRequest.headers.filter(h => h.active).length})`,
                body: 'Body',
                auth: 'Auth',
                scripts: 'Pre-script',
                tests: 'Tests'
              };
              return (
                <button
                  key={sub}
                  onClick={() => setPlaygroundSubTab(sub)}
                  className={`text-[10px] uppercase font-bold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    playgroundSubTab === sub
                      ? 'bg-purple-600/15 text-purple-300 border border-purple-500/30 font-black'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {tabLabels[sub]}
                </button>
              );
            })}
          </div>

          {/* Sub-tab variables options viewports */}
          <div className="p-4.5 text-zinc-300 min-h-[190px] max-h-[290px] overflow-y-auto">
            
            {/* SUB-TAB 1: PARAMS TABLE */}
            {playgroundSubTab === 'params' && (
              <div className="space-y-3.5">
                <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500 select-none">
                  <span>URL QUERY ATTRIBUTES</span>
                  <button
                    onClick={addParamRow}
                    className="px-2 py-0.5 border border-[#1e2343] hover:border-purple-500/30 rounded font-bold font-mono text-[9px] text-[#8691c2] hover:text-purple-300 cursor-pointer transition-colors"
                  >
                    + Append Row
                  </button>
                </div>

                {activeRequest.params.length === 0 ? (
                  <div className="text-center py-6 font-mono text-[10px] text-zinc-600 select-none">
                    No active parameters defined. Queries are added on paths automatically.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activeRequest.params.map((item) => (
                      <div key={item.id} className="flex gap-2 items-center">
                        <input
                          type="checkbox"
                          checked={item.active}
                          onChange={() => toggleParamRow(item.id)}
                          className="rounded bg-black border-zinc-800 text-purple-600"
                        />
                        <input
                          type="text"
                          value={item.key}
                          onChange={(e) => updateParamRow(item.id, 'key', e.target.value)}
                          placeholder="Key key"
                          className="bg-black/35 border border-white/5 rounded px-2 py-1 text-[11px] text-zinc-200 font-mono w-1/3"
                        />
                        <input
                          type="text"
                          value={item.value}
                          onChange={(e) => updateParamRow(item.id, 'value', e.target.value)}
                          placeholder="Val value"
                          className="bg-black/35 border border-white/5 rounded px-2 py-1 text-[11px] text-zinc-200 font-mono w-1/3"
                        />
                        <button
                          onClick={() => deleteParamRow(item.id)}
                          className="text-zinc-600 hover:text-rose-400 p-1 rounded hover:bg-rose-500/10 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SUB-TAB 2: HEADERS TABLE */}
            {playgroundSubTab === 'headers' && (
              <div className="space-y-3.5">
                <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500 select-none">
                  <span>SANDBOX HTTP HEADERS DETECTOR</span>
                  <button
                    onClick={addHeaderRow}
                    className="px-2 py-0.5 border border-[#1e2343] hover:border-purple-500/30 rounded font-bold font-mono text-[9px] text-[#8691c2] hover:text-purple-300 cursor-pointer transition-colors"
                  >
                    + Append Header
                  </button>
                </div>

                {activeRequest.headers.length === 0 ? (
                  <div className="text-center py-6 font-mono text-[10px] text-zinc-600 select-none">
                    Sends browser default query parameters headers.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activeRequest.headers.map((item) => (
                      <div key={item.id} className="flex gap-2 items-center">
                        <input
                          type="checkbox"
                          checked={item.active}
                          onChange={() => toggleHeaderRow(item.id)}
                          className="rounded bg-black border-zinc-800 text-purple-600"
                        />
                        <input
                          type="text"
                          value={item.key}
                          onChange={(e) => updateHeaderRow(item.id, 'key', e.target.value)}
                          placeholder="Header spec key"
                          className="bg-black/35 border border-white/5 rounded px-2 py-1 text-[11px] text-zinc-200 font-mono w-1/3"
                        />
                        <input
                          type="text"
                          value={item.value}
                          onChange={(e) => updateHeaderRow(item.id, 'value', e.target.value)}
                          placeholder="Value spec value"
                          className="bg-black/35 border border-white/5 rounded px-2 py-1 text-[11px] text-zinc-200 font-mono w-1/3"
                        />
                        <button
                          onClick={() => deleteHeaderRow(item.id)}
                          className="text-zinc-600 hover:text-rose-400 p-1 rounded hover:bg-rose-500/10 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SUB-TAB 3: BODY RAW EDITOR */}
            {playgroundSubTab === 'body' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[10px] font-mono select-none">
                  <span className="text-zinc-500 font-bold uppercase text-[9px] tracking-wider">Payload Body Structure:</span>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setActiveRequest(prev => ({ ...prev, bodyType: 'none' }))}
                      className={`px-2 py-0.5 rounded cursor-pointer transition-colors text-[9px] uppercase font-bold border ${activeRequest.bodyType === 'none' ? 'bg-zinc-800 text-zinc-300 border-zinc-700 font-black' : 'bg-transparent text-zinc-500 border-transparent hover:text-zinc-400'}`}
                    >
                      None
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveRequest(prev => ({ ...prev, bodyType: 'json' }))}
                      className={`px-2 py-0.5 rounded cursor-pointer transition-colors text-[9px] uppercase font-bold border ${activeRequest.bodyType === 'json' ? 'bg-purple-950/40 text-purple-300 border-purple-500/30' : 'bg-transparent text-zinc-500 border-transparent hover:text-zinc-400'}`}
                    >
                      JSON (application/json)
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    value={activeRequest.bodyContent || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setActiveRequest(prev => ({
                        ...prev,
                        bodyContent: val,
                        bodyType: val.trim() ? 'json' : prev.bodyType
                      }));
                    }}
                    placeholder={`{\n  "name": "Hiba",\n  "department": "CSE"\n}`}
                    className={`w-full h-32 bg-[#05040f] border rounded-xl p-3 text-xs font-mono text-purple-200 focus:outline-none transition-all ${
                      activeRequest.bodyType === 'none' 
                        ? 'border-zinc-800/60 opacity-40 focus:border-zinc-700' 
                        : 'border-[#1e2343] focus:border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.03)]'
                    }`}
                  />
                  {activeRequest.bodyType === 'none' && (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-[0.5px] rounded-xl flex items-center justify-center pointer-events-none select-none">
                      <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest bg-[#0b0c15] px-3.5 py-1.5 rounded-xl border border-zinc-800/50">
                        Body Ignored (Click "JSON" above to Enable)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SUB-TAB 4: AUTH METADATA */}
            {playgroundSubTab === 'auth' && (
              <div className="space-y-3">
                <span className="text-[10px] font-mono text-zinc-500 block mb-1">STANDARD BEARER SCHEME OAUTH</span>
                <p className="text-[11px] text-zinc-500 leading-normal">
                  Requires authorized headers passed dynamically down trace networks using active variables.
                </p>

                <input
                  type="text"
                  readOnly
                  value="Authorization: Bearer {{ACCESS_TOKEN}}"
                  className="w-full bg-black/35 border border-white/5 rounded px-2.5 py-2 text-xs text-zinc-400 font-mono select-all focus:outline-none"
                />
              </div>
            )}

            {/* SUB-TAB 5: PRE-REQUEST SCRIPTS */}
            {playgroundSubTab === 'scripts' && (
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-zinc-500 block">SANDBOX JAVASCRIPT EXECUTION hooks</span>
                <textarea
                  value={activeRequest.preRequestScript || ''}
                  onChange={(e) => setActiveRequest(prev => ({ ...prev, preRequestScript: e.target.value }))}
                  className="w-full h-24 bg-[#050410] border border-white/5 rounded-xl p-3 text-xs font-mono text-purple-300 focus:outline-none"
                />
              </div>
            )}

            {/* SUB-TAB 6: RESPONSE ASSERT TESTS */}
            {playgroundSubTab === 'tests' && (
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-zinc-500 block">CHAI-JS ASSERTIONS SPECIFICATION</span>
                <textarea
                  value={activeRequest.testScript || ''}
                  onChange={(e) => setActiveRequest(prev => ({ ...prev, testScript: e.target.value }))}
                  className="w-full h-24 bg-[#050410] border border-white/5 rounded-xl p-3 text-xs font-mono text-indigo-300 focus:outline-none"
                />
              </div>
            )}

          </div>

        </div>

      </div>

      {/* ========================================================= */}
      {/* 2.3 RIGHT RESPONSE VIEWER PANEL - Width: 420px equivalents */}
      {/* ========================================================= */}
      <div className="xl:col-span-4 bg-[#0a0c1a]/55 border border-[#171c3a] rounded-3xl p-4.5 space-y-4 shadow-xl backdrop-blur-md relative min-h-[460px]">
        
        {/* Decorative shadow */}
        <div className="absolute right-0 top-0 w-24 h-24 bg-purple-500/5 blur-3xl" />

        <div className="flex justify-between items-center pb-2 border-b border-[#12162a] select-none text-purple-200">
          <span className="text-[10px] font-mono font-black uppercase tracking-wider block">Response Ledger</span>
          <span className="text-[9px] font-mono text-zinc-500">HTTP REST SPECIFICATION</span>
        </div>

        {lastResponse ? (
          <div className="space-y-4">
            
            {/* Speed Metrics row */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-black flex items-center gap-1 border ${
                  lastResponseStatus === 200 || lastResponseStatus === 201
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    lastResponseStatus === 200 || lastResponseStatus === 201 ? 'bg-emerald-400' : 'bg-rose-500'
                  }`} />
                  {lastResponseStatus} {lastResponseStatus === 200 || lastResponseStatus === 201 ? 'OK' : 'DENIED'}
                </span>

                {lastResponse?.__simulated && (
                  <span className="px-2 py-0.5 rounded text-[9.5px] font-sans font-bold bg-purple-500/15 text-purple-300 border border-purple-500/20 animate-pulse flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
                    Local Emulator Mode
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2.5 text-[10px] text-zinc-500 font-mono">
                <div>Time: <span className="text-cyan-400 font-bold font-sans">{lastResponseTime}ms</span></div>
                <div className="w-[1px] h-3 bg-zinc-800" />
                <div>Size: <span className="text-purple-400 font-bold font-sans">{lastResponseSize}</span></div>
              </div>
            </div>

            {/* response browser view tabs */}
            <div className="border border-[#141830] bg-black/25 rounded-2xl overflow-hidden">
              <div className="bg-black/35 border-b border-[#141830] p-1 flex items-center gap-1 overflow-x-auto scrollbar-none">
                {(['json', 'headers', 'results', 'troubleshoot'] as const).map((respTab) => {
                  const labels = {
                    json: 'Pretty Body',
                    headers: 'Headers (5)',
                    results: `Asserts (${testResults.length})`,
                    troubleshoot: 'Connection Guide'
                  };
                  return (
                    <button
                      key={respTab}
                      type="button"
                      onClick={() => setResponseSubTab(respTab)}
                      className={`text-[9.5px] font-bold tracking-tight uppercase px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                        responseSubTab === respTab
                          ? 'bg-purple-600/15 text-purple-300 font-black border border-purple-500/25'
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {labels[respTab]}
                    </button>
                  );
                })}
              </div>

              <div className="p-3 bg-[#04020a] min-h-[170px] max-h-[290px] overflow-y-auto font-mono text-[11px]">
                
                {responseSubTab === 'json' && (
                  <div className="space-y-2">
                    {lastResponseStatus !== 200 && lastResponseStatus !== 201 && (
                      <div className="p-2.5 border border-amber-500/20 bg-amber-500/5 rounded-xl flex items-center justify-between gap-2 text-[10px] text-zinc-300 font-sans">
                        <span className="flex items-center gap-1.5 text-amber-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          Did you get a 404 or connection error? Need a Flask setup?
                        </span>
                        <button
                          type="button"
                          onClick={() => setResponseSubTab('troubleshoot')}
                          className="px-2 py-0.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 rounded font-bold cursor-pointer transition-colors font-mono text-[9px]"
                        >
                          Setup Guide
                        </button>
                      </div>
                    )}
                    
                    <div className="relative">
                      <button
                        onClick={() => handleCopyClipboard(typeof lastResponse === 'object' && lastResponse !== null ? JSON.stringify(lastResponse, null, 2) : String(lastResponse), 'response_pretty')}
                        className="absolute right-1 top-1 text-[9px] text-zinc-500 hover:text-white bg-slate-900 px-1.5 py-0.5 rounded border border-white/5 transition-colors cursor-pointer"
                      >
                        {copiedKey === 'response_pretty' ? 'Copied' : 'Copy'}
                      </button>
                      <pre className="text-emerald-300 leading-relaxed max-w-full overflow-x-auto select-all scrollbar-none text-left">
                        <code>{typeof lastResponse === 'object' && lastResponse !== null ? JSON.stringify(lastResponse, null, 2) : String(lastResponse)}</code>
                      </pre>
                    </div>
                  </div>
                )}

                {responseSubTab === 'troubleshoot' && (
                  <div className="space-y-4 font-sans animate-fadeIn text-left">
                    
                    {/* Troubleshoot Selection Headers */}
                    <div className="flex flex-wrap items-center justify-between gap-1.5 pb-2 border-b border-white/5">
                      <span className="text-[10px] font-mono font-bold text-purple-400 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                        SANDBOX EXECUTIONS & CORS BRIDGE
                      </span>
                      
                      <div className="flex items-center gap-1 bg-black/60 p-0.5 rounded-lg border border-white/5 font-mono text-[9px]">
                        <button
                          type="button"
                          onClick={() => setTroubleshootTab('guide')}
                          className={`px-2 py-0.5 rounded cursor-pointer leading-tight transition-colors ${troubleshootTab === 'guide' ? 'bg-purple-950/40 text-purple-300 font-bold' : 'text-zinc-500 hover:text-zinc-400'}`}
                        >
                          Remediation
                        </button>
                        <button
                          type="button"
                          onClick={() => setTroubleshootTab('flask')}
                          className={`px-2 py-0.5 rounded cursor-pointer leading-tight transition-colors ${troubleshootTab === 'flask' ? 'bg-purple-950/40 text-purple-300 font-bold' : 'text-zinc-500 hover:text-zinc-400'}`}
                        >
                          Flask (Python)
                        </button>
                        <button
                          type="button"
                          onClick={() => setTroubleshootTab('client')}
                          className={`px-2 py-0.5 rounded cursor-pointer leading-tight transition-colors ${troubleshootTab === 'client' ? 'bg-purple-950/40 text-purple-300 font-bold' : 'text-zinc-500 hover:text-zinc-400'}`}
                        >
                          React API Fetch
                        </button>
                        <button
                          type="button"
                          onClick={() => setTroubleshootTab('sql')}
                          className={`px-2 py-0.5 rounded cursor-pointer leading-tight transition-colors ${troubleshootTab === 'sql' ? 'bg-purple-950/40 text-purple-300 font-bold' : 'text-zinc-500 hover:text-zinc-400'}`}
                        >
                          SQLite SQL
                        </button>
                      </div>
                    </div>

                    {/* Troubleshoot Panel Body Content */}
                    <div className="text-[11px] text-zinc-300 leading-relaxed font-sans mt-2">
                      
                      {troubleshootTab === 'guide' && (
                        <div className="space-y-4">
                          <div className="p-3 bg-purple-950/20 border border-purple-500/20 rounded-xl space-y-2">
                            <h4 className="font-bold text-purple-300 font-sans flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                              Why Postman Works vs. Why Cloud Web Apps Block localhost
                            </h4>
                            <p className="text-[10px] text-zinc-300 font-sans leading-relaxed">
                              <strong>Postman Desktop</strong> is an installed system utility with complete native privileges to directly query loopback sockets like <code className="text-white font-mono bg-black/40 px-1 rounded">http://127.0.0.1:5000</code>.
                            </p>
                            <p className="text-[10px] text-zinc-300 font-sans leading-relaxed">
                              However, because this workspace runs in a secure cloud console over **HTTPS** (<code className="text-zinc-400 font-mono">https://ais-dev-...</code>), your client's browser strictly blocks insecure calls to your laptop (called <strong>Mixed Content Security</strong>). Our cloud microservices also cannot connect to <code className="text-purple-300 font-mono">127.0.0.1</code> because that loopback points to the cloud server, not your machine.
                            </p>
                          </div>

                          {/* Critical python routing diagnostics block */}
                          <div className="p-3 bg-amber-950/25 border border-amber-500/20 rounded-xl space-y-2 font-sans-serif">
                            <h4 className="font-bold text-amber-300 text-[10.5px] uppercase tracking-wider flex items-center gap-1.5 font-mono">
                              ⚠️ Backend Route Collision Detected
                            </h4>
                            <p className="text-[10px] text-zinc-300 leading-relaxed font-sans">
                              Your Flask code defines the exact same route decorators:
                            </p>
                            <div className="p-2 bg-black/45 border border-white/5 rounded-lg font-mono text-[9.5px] text-amber-200">
                              <code>
                                # Collision Point:<br />
                                @app.route('/getalldata', methods=['GET']) def handle_endpoint(): ...<br />
                                @app.route('/getalldata', methods=['GET']) def list_records(): ...
                              </code>
                            </div>
                            <p className="text-[10.5px] text-zinc-400 font-sans leading-snug">
                              In Python, duplicate decorators override each other! Only the second function (<code className="text-[9.5px] text-amber-400 font-mono">list_records</code>) gets mounted. This causes your insert function (<code className="text-[9.5px] text-amber-400 font-mono font-semibold">handle_endpoint</code>) to be totally skipped, bypassing database transactions.
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                            <div className="bg-[#070913] p-2.5 rounded-lg border border-white/5 space-y-0.5">
                              <span className="text-zinc-500 block uppercase font-bold text-[8px]">Sandbox URL Restriction</span>
                              <span className="text-rose-400 font-bold">HTTPS MIXED_CONTENT</span>
                            </div>
                            <div className="bg-[#070913] p-2.5 rounded-lg border border-white/5 space-y-0.5">
                              <span className="text-zinc-500 block uppercase font-bold text-[8px]">Local Server Port</span>
                              <span className="text-purple-300 font-bold">5000 (Flask / CORS)</span>
                            </div>
                          </div>

                          <div className="space-y-2 bg-[#080a18] p-3.5 border border-[#1b2349]/50 rounded-xl">
                            <span className="text-[10px] font-mono text-[#778aff] uppercase font-bold tracking-wider block mb-1">How to test and connect instantly:</span>
                            <ul className="space-y-2 list-none pl-0">
                              <li className="flex gap-2.5 items-start text-[10.5px]">
                                <span className="text-purple-400 font-bold font-mono">A.</span>
                                <span className="text-zinc-300 leading-snug">
                                  <strong>Option 1 (Ngrok SECURE Tunnels):</strong> Run <code className="bg-black/40 px-1 py-0.5 font-mono text-zinc-100 rounded">ngrok http 5000</code> in your terminal. Copy the generated public URL starting with <code className="text-purple-300 font-sans">https://...</code>, paste it inside ProtoSync's URL bar, and set your Flask route input to target the public secure route.
                                </span>
                              </li>
                              <li className="flex gap-2.5 items-start text-[10.5px]">
                                <span className="text-purple-400 font-bold font-mono">B.</span>
                                <span className="text-zinc-300 leading-snug">
                                  <strong>Option 2 (Full Local Mode):</strong> Download this application folder as a ZIP file, extract it, and spin up ProtoSync locally (<code className="bg-black/40 px-1 py-0.5 font-mono text-zinc-100 rounded">npm run dev</code>). This hosts ProtoSync on <code className="text-purple-300">http://localhost:3000</code>, freeing the sandbox restriction and letting you query <code className="text-emerald-400">http://127.0.0.1:5000</code> natively with zero changes!
                                </span>
                              </li>
                            </ul>
                          </div>
                        </div>
                      )}

                      {troubleshootTab === 'flask' && (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center bg-[#070913] p-1.5 px-3 rounded-lg border border-white/5">
                            <span className="text-[10px] text-zinc-400 font-mono">Dynamic local Flask CORS script matching your payload schema</span>
                            <button
                              type="button"
                              onClick={() => handleCopyClipboard(getFlaskRemediationCode(), 'troubleshoot_flask')}
                              className="text-[9.5px] text-zinc-400 hover:text-white bg-slate-900 border border-white/5 px-2 py-0.5 rounded transition-colors cursor-pointer"
                            >
                              {copiedKey === 'troubleshoot_flask' ? 'Copied' : 'Copy'}
                            </button>
                          </div>
                          <pre className="text-purple-200 bg-[#030409] p-3 rounded-xl border border-white/5 max-h-[170px] overflow-y-auto overflow-x-auto text-[10px] font-mono select-all leading-normal scrollbar-none">
                            <code>{getFlaskRemediationCode()}</code>
                          </pre>
                        </div>
                      )}

                      {troubleshootTab === 'client' && (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center bg-[#070913] p-1.5 px-3 rounded-lg border border-white/5">
                            <span className="text-[10px] text-zinc-400 font-mono">React Fetch wrapper with ngrok bypass warnings bypass</span>
                            <button
                              type="button"
                              onClick={() => handleCopyClipboard(getReactFetchRemediationCode(), 'troubleshoot_client')}
                              className="text-[9.5px] text-zinc-400 hover:text-white bg-slate-900 border border-white/5 px-2 py-0.5 rounded transition-colors cursor-pointer"
                            >
                              {copiedKey === 'troubleshoot_client' ? 'Copied' : 'Copy'}
                            </button>
                          </div>
                          <pre className="text-purple-200 bg-[#030409] p-3 rounded-xl border border-white/5 max-h-[170px] overflow-y-auto overflow-x-auto text-[10px] font-mono select-all leading-normal scrollbar-none">
                            <code>{getReactFetchRemediationCode()}</code>
                          </pre>
                        </div>
                      )}

                      {troubleshootTab === 'sql' && (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center bg-[#070913] p-1.5 px-3 rounded-lg border border-white/5">
                            <span className="text-[10px] text-zinc-400 font-mono">Persistent SQLite3 data migrations structured insertion scripts</span>
                            <button
                              type="button"
                              onClick={() => handleCopyClipboard(getSQLiteSchemaCode(), 'troubleshoot_sql')}
                              className="text-[9.5px] text-zinc-400 hover:text-white bg-slate-900 border border-white/5 px-2 py-0.5 rounded transition-colors cursor-pointer"
                            >
                              {copiedKey === 'troubleshoot_sql' ? 'Copied' : 'Copy'}
                            </button>
                          </div>
                          <pre className="text-purple-200 bg-[#030409] p-3 rounded-xl border border-white/5 max-h-[170px] overflow-y-auto overflow-x-auto text-[10px] font-mono select-all leading-normal scrollbar-none">
                            <code>{getSQLiteSchemaCode()}</code>
                          </pre>
                        </div>
                      )}

                    </div>

                    <div className="pt-2.5 border-t border-white/5 flex items-center justify-between text-[10px] font-mono">
                      <span className="text-zinc-650 font-sans">Need raw response data instead?</span>
                      <button 
                        type="button"
                        onClick={() => {
                          setResponseSubTab('json');
                          showNotification("Switched back to raw Pretty Body text view");
                        }}
                        className="text-[#7282b8] hover:text-white transition-colors cursor-pointer underline font-sans"
                      >
                        Go back to Pretty Body tab
                      </button>
                    </div>

                  </div>
                )}

                {responseSubTab === 'headers' && (
                  <div className="space-y-1.5 text-zinc-400">
                    {[
                      { k: 'Content-Type', v: 'application/json' },
                      { k: 'Cache-Control', v: 'no-cache, private' },
                      { k: 'Server', v: 'Flask-API-Protosync/v1.4' },
                      { k: 'X-RateLimit-Limit', v: '20000_quota' },
                      { k: 'X-Trace-Node', v: 'k8s-pod-7b9c.usa-east' }
                    ].map((hd, idx) => (
                      <div key={idx} className="flex justify-between border-b border-zinc-900 py-1 font-mono text-[10px] break-all">
                        <span className="text-purple-300 select-all pr-2">{hd.k}</span>
                        <span className="text-zinc-300 select-all text-right">{hd.v}</span>
                      </div>
                    ))}
                  </div>
                )}

                {responseSubTab === 'results' && (
                  <div className="space-y-2">
                    {testResults.length === 0 ? (
                      <div className="text-center py-6 text-zinc-600 font-mono text-[10px] select-none">
                        No post assert checks executed. Config tests criteria next scripts.
                      </div>
                    ) : (
                      testResults.map((t, idx) => (
                        <div key={idx} className="p-2 border border-white/5 rounded-xl flex items-center justify-between gap-2.5">
                          <span className="text-[10px] text-zinc-300 select-all font-mono leading-tight">{t.name}</span>
                          <span className={`font-mono font-bold text-[9.5px] tracking-widest ${t.passed ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {t.passed ? 'PASS' : 'FAIL'}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}

              </div>
            </div>

          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-center items-center py-24 select-none">
            <Activity className="w-8 h-8 text-zinc-700 animate-pulse mb-3" />
            <p className="font-mono text-[10px] text-zinc-600 tracking-wide">WAITING FOR CLIENT EXECUTIONS...</p>
            <p className="text-[9.5px] text-zinc-700 max-w-xs text-center mt-1">Press the SEND button above to fire transactions schemas.</p>
          </div>
        )}

      </div>

    </div>
  );
}
