/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  BookOpen, 
  Download, 
  Code, 
  Terminal, 
  HelpCircle, 
  Layers, 
  Settings, 
  Activity, 
  Sparkles, 
  Check, 
  FileCode, 
  ArrowRight, 
  ChevronRight, 
  History,
  Lock,
  Globe,
  Database,
  Cpu,
  Info
} from 'lucide-react';
import { ApiRequestItem } from '../../types';

interface DocumentationViewProps {
  activeRequest?: ApiRequestItem;
  showNotification: (msg: string) => void;
}

export default function DocumentationView({ activeRequest, showNotification }: DocumentationViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'academy' | 'howto'>('academy');
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    showNotification(`Copied ${label} to clipboard.`);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const downloadTextbookNotes = () => {
    const markdownContent = `# PROTOSYNC API ENGINEERING ACADEMY & SITE MANUAL
======================================================

Generated on: ${new Date().toLocaleDateString()}
Theme: Basics to Advanced Integration Standards

------------------------------------------------------
PART 1: THE CORE BASICS OF REST API & HTTP TRANSFERS
------------------------------------------------------

1. WHAT IS AN API?
An API (Application Programming Interface) is a set of rules and protocols that allows 
different software applications to communicate with each other. It acts as an 
intermediary, delivering your request to a server and returning the server's response.

2. WHAT IS HTTP (HYPERTEXT TRANSFER PROTOCOL)?
HTTP is the foundation of data communication on the World Wide Web. It operates as a 
Request-Response protocol in a Client-Server model.

3. STRUCTURE OF AN HTTP REQUEST:
- VERB (Method): Identifies the operation (GET, POST, PUT, PATCH, DELETE).
- URI / URL: The network address where the resource lives.
- HEADERS: Key-value metadata containing content types, authentication keys, and user agents.
- PARAMETERS: Query string factors appended after path marks (e.g. ?limit=10).
- REQUEST BODY: The primary payload data (often formatted in JSON) sent to create or update resources.

4. STRUCTURE OF AN HTTP RESPONSE:
- STATUS CODE: Three-digit numeric code indicating outcome (e.g. 200 OK, 404 Not Found).
- HEADERS: Response parameters such as Content-Type, CORS permissions, and server spec tokens.
- RESPONSE BODY: The computed output payload representing the requested object.

------------------------------------------------------
PART 2: DETAILED HTTP METHOD BREAKDOWN & COMPARISONS
------------------------------------------------------

* GET: Retrieve resources. Should NEVER alter backend databases.
  - Path parameters and query params only. No Payload body.
  - Safe & Idempotent.

* POST: Create new resources.
  - Sends object schema in payload body.
  - Neither Safe nor Idempotent. Multiple triggers build multiple rows.

* PUT: Complete override of target resource.
  - Replaces all properties of the target object.
  - Idempotent.

* PATCH: Partial modification of resource.
  - Modifies only the specific fields specified.
  - Useful for sparse parameter updates in huge schemas to save bandwidth.

* DELETE: Purge target resource permanently.
  - Removes the target ID.
  - Idempotent.

------------------------------------------------------
PART 3: STANDARD RESPONSE CODES GLOSSARY
------------------------------------------------------
* 1xx (Informational): Processing handshake request.
* 2xx (Success): Correctly executed.
  - 200 OK: Request succeeded.
  - 201 Created: New resource successfully created in database.
* 3xx (Redirection): Resource relocated.
* 4xx (Client Error): Invalid request parameters.
  - 400 Bad Request: Missing required payload keys or typos in body content.
  - 401 Unauthorized: Bearer JWT validation or credentials invalid.
  - 403 Forbidden: Correct credentials but insufficient role privileges.
  - 404 Not Found: Path mapping not located on target hostname.
* 5xx (Server Error): Application crashes or persistence collapse.
  - 500 Internal Server Error: Database failure or unexpected error logic.

------------------------------------------------------
PART 4: PROTOSYNC PLATFORM HOW-TO-USE MANUAL
------------------------------------------------------

HOW TO TEST YOUR ENDPOINTS STEP-BY-STEP:
1. SWITCH TENANTS IN THE WORKSPACES TAB:
   Create or toggle active namespaces representing isolated databases.

2. REGISTER DIRECTORY COLLECTIONS:
   Enter a title, group related resources, and export specifications instantly.

3. CONSTRUCT HANDSHAKESHIPS IN API TESTER:
   - Select HTTP Verb (GET, POST, PUT, PATCH, DELETE).
   - Enter your resource URL.
   - Configure Params, Headers, or JSON requests body in the workbench panels.
   - Click "Send" to fire transaction and generate detailed telemetry tracing logs.

4. RESOLVING LOCALHOST RESTRICTIONS (MIXED-CONTENT CORS CONSTRAINTS):
   Web browsers block localhost calls (e.g., http://127.0.0.1:5000) from within secure HTTPS pages.
   To bypass this:
   - Run: 'ngrok http 5000' to create a secure HTTPS bridge tunnel, then copy-paste the ngrok address.
   - Or configure permissive CORS headers in your local code: 'CORS(app)'.

======================================================
End of Training Handbook. Keep Engineering Flawlessly!
`;

    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `ProtoSync_API_Engineering_Manual.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setDownloadSuccess(true);
    showNotification("Downloaded complete API notes as Markdown textbook!");
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 animate-fadeIn font-sans p-1 max-w-[1550px] mx-auto select-none relative">
      
      {/* 1. TOP TITLE BLOCK & GLOBAL DOWNLOAD CONTROLLER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-zinc-900 select-none">
        <div className="space-y-1 text-left">
          <h2 className="text-xl font-bold font-display text-white tracking-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-400" />
            Learning Academy & Documentation
          </h2>
          <p className="text-zinc-500 text-xs font-sans tracking-wide">
            Master HTTP architecture, API payloads, and explore ProtoSync workbench walkthroughs.
          </p>
        </div>

        <button
          onClick={downloadTextbookNotes}
          className="flex items-center gap-1.5 px-3.5 py-2.5 bg-gradient-to-r from-[#6D4AFF] to-[#8B5CF6] hover:from-[#8B5CF6] hover:to-[#a78bfa] text-white font-bold text-[11px] rounded-lg tracking-wide transition-all shadow-[0_0_15px_rgba(109,74,255,0.25)] hover:shadow-[0_0_20px_rgba(139,92,246,0.45)] cursor-pointer select-none shrink-0 active:scale-[0.98]"
        >
          {downloadSuccess ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Download className="w-3.5 h-3.5" />}
          <span>{downloadSuccess ? "Downloaded Notes!" : "Download Whole Notes (.md)"}</span>
        </button>
      </div>

      {/* 2. SUB-TABS INTERACTIVE SHIFT SELECTOR */}
      <div className="flex border border-[#141830] bg-[#0c0e1e]/40 p-1 rounded-xl w-full sm:w-[380px] select-none">
        <button
          onClick={() => setActiveSubTab('academy')}
          className={`flex-1 py-2 rounded-lg text-[10px] uppercase font-bold text-center tracking-wider transition-all cursor-pointer ${
            activeSubTab === 'academy' 
              ? 'bg-[#6D4AFF]/15 text-purple-300 border border-[#6D4AFF]/25 font-black' 
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          📘 API Learning Academy
        </button>
        <button
          onClick={() => setActiveSubTab('howto')}
          className={`flex-1 py-2 rounded-lg text-[10px] uppercase font-bold text-center tracking-wider transition-all cursor-pointer ${
            activeSubTab === 'howto' 
              ? 'bg-[#6D4AFF]/15 text-purple-300 border border-[#6D4AFF]/25 font-black' 
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          🖥️ Website How-To Guide
        </button>
      </div>

      {/* 3. DOCK SUB-PANEL CORE CONTAINER */}
      {activeSubTab === 'academy' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-left">
          
          {/* LEFT COLUMN: BASIC TO ADVANCED REST LESSON PLANS - 7 span cols */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Lesson Unit 1: What is an API & How HTTP Works */}
            <div className="p-5 bg-gradient-to-b from-[#0b0c16] to-[#04050d] border border-[#141830] rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.4)] backdrop-blur space-y-4">
              <div className="space-y-1">
                <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-widest font-bold">Lesson Block #01</span>
                <h3 className="text-sm font-bold font-display text-white tracking-tight">Understanding API Foundations</h3>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  An API (Application Programming Interface) allows structured, automated data handshakes between an application (such as a React web browser front) and backend microservices. Communication flows over safe internet routers using the REST paradigm based on Hypertext Transfer Protocol.
                </p>
              </div>

              {/* PURE TAILWIND CSS VISUAL VISUALIZATION DIAGRAM */}
              <div className="p-4 bg-black/45 border border-white/5 rounded-xl space-y-3">
                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider font-bold">API handshake topology diagram</span>
                
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-2 relative font-mono text-[9.5px]">
                  
                  {/* Front Client Block */}
                  <div className="w-full sm:w-28 p-2.5 bg-purple-500/10 border border-purple-500/20 text-purple-300 rounded-lg text-center flex flex-col items-center gap-1 shrink-0">
                    <Globe className="w-4 h-4 text-purple-400" />
                    <span className="font-bold">React Client</span>
                    <span className="text-[8px] text-zinc-500">(Front Node)</span>
                  </div>

                  {/* Flow Arrows */}
                  <div className="flex-1 flex flex-col items-center justify-center gap-1.5 w-full">
                    <div className="w-full flex items-center justify-between px-2 text-zinc-500 text-[8.5px]">
                      <span>1. HTTP API Request spec payload</span>
                      <ArrowRight className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                    </div>
                    <div className="h-[1px] w-full bg-gradient-to-r from-purple-500 via-indigo-500 to-emerald-500" />
                    <div className="w-full flex items-center justify-between px-2 text-zinc-500 text-[8.5px]">
                      <ArrowRight className="w-3.5 h-3.5 text-emerald-400 rotate-180" />
                      <span>2. Response telemetry (JSON + 200 OK)</span>
                    </div>
                  </div>

                  {/* Back Service Block */}
                  <div className="w-full sm:w-28 p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-lg text-center flex flex-col items-center gap-1 shrink-0">
                    <Database className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold">REST Backend</span>
                    <span className="text-[8px] text-zinc-500">(SQLite/Flask Engine)</span>
                  </div>

                </div>
              </div>
            </div>

            {/* Lesson Unit 2: Detailed HTTP Methods Comparison (GET, POST, PUT, PATCH, DELETE) */}
            <div className="p-5 bg-gradient-to-b from-[#0b0c16] to-[#04050d] border border-[#141830] rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.4)] backdrop-blur space-y-4">
              <div className="space-y-1">
                <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-widest font-bold">Lesson Block #02</span>
                <h3 className="text-sm font-bold font-display text-white tracking-tight">The HTTP REST Verbs Handbook</h3>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  Every request specification must carry an explicit method context defining the nature of the transaction.
                </p>
              </div>

              {/* Robust responsive grid detailing CRUD specs */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                
                {/* GET */}
                <div className="p-3 bg-black/30 border border-emerald-500/10 rounded-xl space-y-1.5 hover:border-emerald-500/25 transition-colors">
                  <span className="px-1.5 py-0.5 text-[7px] font-black font-mono text-emerald-400 bg-emerald-500/15 rounded uppercase border border-emerald-500/20">GET</span>
                  <div className="text-[10px] font-bold text-white tracking-wide mt-1">Read / fetch records</div>
                  <p className="text-[9px] text-zinc-500 font-sans mt-1">Queries data properties. No Body content. Idempotent.</p>
                </div>

                {/* POST */}
                <div className="p-3 bg-black/30 border border-purple-500/10 rounded-xl space-y-1.5 hover:border-purple-500/25 transition-colors">
                  <span className="px-1.5 py-0.5 text-[7px] font-black font-mono text-purple-400 bg-purple-500/15 rounded uppercase border border-purple-500/20">POST</span>
                  <div className="text-[10px] font-bold text-white tracking-wide mt-1">Create data payload</div>
                  <p className="text-[9px] text-zinc-500 font-sans mt-1">Spawns new DB rows. Needs raw JSON body. Non-idempotent.</p>
                </div>

                {/* PUT */}
                <div className="p-3 bg-black/30 border border-blue-500/10 rounded-xl space-y-1.5 hover:border-blue-500/25 transition-colors">
                  <span className="px-1.5 py-0.5 text-[7px] font-black font-mono text-blue-400 bg-blue-500/15 rounded uppercase border border-blue-500/20">PUT</span>
                  <div className="text-[10px] font-bold text-white tracking-wide mt-1">Full overwrite item</div>
                  <p className="text-[9px] text-zinc-500 font-sans mt-1">Replaces resource property blocks entirely. Idempotent.</p>
                </div>

                {/* PATCH */}
                <div className="p-3 bg-black/30 border border-amber-500/10 rounded-xl space-y-1.5 hover:border-amber-500/25 transition-colors">
                  <span className="px-1.5 py-0.5 text-[7px] font-black font-mono text-amber-400 bg-amber-500/15 rounded uppercase border border-amber-500/20">PATCH</span>
                  <div className="text-[10px] font-bold text-white tracking-wide mt-1">Partial patch update</div>
                  <p className="text-[9px] text-zinc-500 font-sans mt-1">Alters only provided schema keys. Saves heavy pipelines.</p>
                </div>

                {/* DELETE */}
                <div className="p-3 bg-black/30 border border-rose-500/10 rounded-xl space-y-1.5 hover:border-rose-500/25 transition-colors">
                  <span className="px-1.5 py-0.5 text-[7px] font-black font-mono text-rose-400 bg-rose-500/15 rounded uppercase border border-rose-500/20">DELETE</span>
                  <div className="text-[10px] font-bold text-white tracking-wide mt-1">Purge object row</div>
                  <p className="text-[9px] text-zinc-500 font-sans mt-1">Deallocates catalog record mapping. Idempotent.</p>
                </div>

              </div>
            </div>

            {/* Lesson Unit 3: HTTP Request Components (Headers, Query String, Body payload) */}
            <div className="p-5 bg-gradient-to-b from-[#0b0c16] to-[#04050d] border border-[#141830] rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.4)] backdrop-blur space-y-4">
              <div className="space-y-1">
                <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-widest font-bold">Lesson Block #03</span>
                <h3 className="text-sm font-bold font-display text-white tracking-tight">Request Architecture Ingredients</h3>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  When you invoke a REST API, you package your instructions into three critical parameters.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-white text-[11px] font-bold font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    <span>1. Query Parameters</span>
                  </div>
                  <p className="text-[10.5px] text-zinc-400 leading-normal font-sans">
                    Appended directly to the end of URLs using key-value hashes (e.g., <code className="text-indigo-300">?limit=10&page=2</code>). Ideal for filtering, sorting, or pagination.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-white text-[11px] font-bold font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    <span>2. HTTP Request Headers</span>
                  </div>
                  <p className="text-[10.5px] text-zinc-400 leading-normal font-sans">
                    Core transit metadata that operates as control tokens (e.g., content encoders, Bearer authorization signatures, custom tokens, or proxy bypass flags).
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-white text-[11px] font-bold font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>3. Request Body / Payload</span>
                    <span className="text-[8px] border border-emerald-500/20 text-emerald-400 font-mono px-1 rounded uppercase bg-emerald-500/10">JSON</span>
                  </div>
                  <p className="text-[10.5px] text-zinc-400 leading-normal font-sans">
                    The heavy cargo containing attributes mapping to storage schemas (e.g., SQLite columns or MongoDB keys). Sent safely using a raw JSON string block.
                  </p>
                </div>

              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: CORE STATUS CODES & CODE EXAMPLES - 4 span cols */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Status Codes glossary card */}
            <div className="p-4 bg-gradient-to-b from-[#0b0c16] to-[#04050d] border border-[#141830] rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.4)] backdrop-blur space-y-3">
              <span className="text-[9px] font-mono text-purple-400 uppercase tracking-wider font-bold">Standard Reference Manual</span>
              <h3 className="text-xs font-bold font-display text-white uppercase tracking-wider">Status Codes cheat sheet</h3>

              <div className="space-y-2 text-[10.5px] font-mono divide-y divide-zinc-900 pr-1">
                
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-emerald-400 font-bold bg-emerald-500/5 px-1.5 py-0.5 border border-emerald-500/10 rounded text-[9px]">200 OK</span>
                  <span className="text-zinc-400 font-sans text-[10px] text-right">Successful execution.</span>
                </div>

                <div className="flex items-center justify-between py-1.5">
                  <span className="text-emerald-400 font-bold bg-emerald-500/5 px-1.5 py-0.5 border border-emerald-500/10 rounded text-[9px]">201 CREATED</span>
                  <span className="text-zinc-400 font-sans text-[10px] text-right">Resource created in database.</span>
                </div>

                <div className="flex items-center justify-between py-1.5">
                  <span className="text-amber-400 font-bold bg-amber-500/5 px-1.5 py-0.5 border border-amber-500/10 rounded text-[9px]">400 BAD REQUEST</span>
                  <span className="text-zinc-400 font-sans text-[10px] text-right text-zinc-500">Missing payload keys/typos.</span>
                </div>

                <div className="flex items-center justify-between py-1.5">
                  <span className="text-[#8B5CF6] font-bold bg-[#8B5CF6]/5 px-1.5 py-0.5 border border-[#8B5CF6]/10 rounded text-[9px]">401 UNAUTHORIZED</span>
                  <span className="text-zinc-400 font-sans text-[10px] text-right text-zinc-500">Bearer token absent or expired.</span>
                </div>

                <div className="flex items-center justify-between py-1.5">
                  <span className="text-rose-400 font-bold bg-rose-500/5 px-1.5 py-0.5 border border-rose-500/10 rounded text-[9px]">404 NOT FOUND</span>
                  <span className="text-zinc-400 font-sans text-[10px] text-right text-zinc-500">Endpoint mapping does not exist.</span>
                </div>

                <div className="flex items-center justify-between py-1.5">
                  <span className="text-red-500 font-bold bg-rose-950/20 px-1.5 py-0.5 border border-rose-500/10 rounded text-[9px]">500 FAULT</span>
                  <span className="text-zinc-400 font-sans text-[10px] text-right text-zinc-600">Backend crash or SQL collision.</span>
                </div>

              </div>
            </div>

            {/* Quick API integration sample */}
            <div className="p-4 bg-gradient-to-b from-[#0b0c16] to-[#04050d] border border-[#141830] rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.4)] backdrop-blur space-y-3.5 relative">
              <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-wider font-bold">Standard Client Interface code</span>
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold font-display text-white uppercase tracking-wider">Example: React API fetch</h3>
                <button
                  onClick={() => handleCopy('fetch("https://api.site.com/getdata");', 'sample_fetch')}
                  className="text-[9px] font-mono text-zinc-500 hover:text-white"
                >
                  {copiedText === 'sample_fetch' ? 'Copied' : 'Copy'}
                </button>
              </div>

              <div className="p-3 bg-black/60 rounded-xl border border-white/5 font-mono text-[9px] text-[#8792c2] overflow-x-auto">
                <pre>{`fetch("https://api.protosync.io/v1/students", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer jwt-secret"
  },
  body: JSON.stringify({
    name: "Arjun",
    department: "CSE"
  })
})
.then(res => res.json())
.then(data => console.log(data));`}</pre>
              </div>
            </div>

          </div>

        </div>
      ) : (
        /* TAB TWO: HOW-TO-USE PORT STATS TUTORIAL */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch text-left animate-fadeIn">
          
          {/* STEP BY STEP WALKTHROUGH - 8 SPAN COL */}
          <div className="lg:col-span-8 space-y-5">
            <div className="p-5 bg-gradient-to-b from-[#0b0c16] to-[#04050d] border border-[#141830] rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.4)] backdrop-blur space-y-5">
              
              <div className="space-y-1">
                <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-widest font-bold">Comprehensive System Tutorial</span>
                <h3 className="text-sm font-bold font-display text-white tracking-tight">How to Process Your Endpoints and Use this Website</h3>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  ProtoSync is an enterprise SaaS-grade API engineering and monitoring platform. Here is exactly where everything lives and how to utilize your sandboxed environment flawlessly.
                </p>
              </div>

              {/* Step checklist blocks */}
              <div className="space-y-4 pt-2 font-sans text-xs">
                
                {/* Step 1 */}
                <div className="flex gap-3.5 items-start">
                  <div className="p-2 bg-[#6D4AFF]/10 text-purple-400 rounded-lg shrink-0 font-mono font-bold text-xs border border-purple-500/15 leading-none shadow-inner">
                    01
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-white tracking-wide">Manage Database Isolation (Workspaces tab)</h4>
                    <p className="text-zinc-500 leading-normal">
                      The workspaces panel operates as a system de-allocator. Start by spawning isolated, secure tenant domains representing distinct microservices for your APIs.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-3.5 items-start">
                  <div className="p-2 bg-[#6D4AFF]/10 text-purple-400 rounded-lg shrink-0 font-mono font-bold text-xs border border-purple-500/15 leading-none shadow-inner">
                    02
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-white tracking-wide">Organize Endpoint Mapping (Collections tab)</h4>
                    <p className="text-zinc-500 leading-normal">
                      Before testing, group your paths into descriptive, searchable directories. Our system isolates collection folder lists dynamically to show only items belonging to your active selected workspace context.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-3.5 items-start">
                  <div className="p-2 bg-[#6D4AFF]/10 text-purple-400 rounded-lg shrink-0 font-mono font-bold text-xs border border-purple-500/15 leading-none shadow-inner">
                    03
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-white tracking-wide">Test HTTP Handshakes (API Tester tab)</h4>
                    <p className="text-zinc-500 leading-normal">
                      Select your method (GET, POST, PUT, PATCH, DELETE) and path, then construct payload bodies in the interactive JSON sandbox editor. Click the Always-On <span className="text-purple-400 font-bold">&#43; Add Request</span> inside your sidebar collection to spawn pre-configured endpoints quickly inside catalog indexes.
                    </p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex gap-3.5 items-start">
                  <div className="p-2 bg-[#6D4AFF]/10 text-purple-400 rounded-lg shrink-0 font-mono font-bold text-xs border border-purple-500/15 leading-none shadow-inner">
                    04
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-white tracking-wide font-sans">Verify Connection Sandbox Barriers (Self-Healing Local Emulation)</h4>
                    <p className="text-zinc-500 leading-normal">
                      HTTPS browsers explicitly block unsecured mixed-content calls pointing to localhost binders like <code className="text-zinc-300 font-mono bg-black/40 px-1 py-0.5 rounded">http://127.0.0.1:5000</code>. To safeguard your work, if your local server handshake fails, ProtoSync fires an ultra-modern <strong>Virtual SQLite/Flask Emulator</strong>, safely compiling mock entries inside your client storage memory to simulate insertion transactions accurately!
                    </p>
                  </div>
                </div>

              </div>

            </div>
          </div>

          {/* RIGHT SIDEBAR DETAILS - 4 SPAN COL */}
          <div className="lg:col-span-4 space-y-5 flex flex-col justify-between">
            
            <div className="p-5 bg-gradient-to-b from-[#0b0c16] to-[#04050d] border border-[#141830] rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.4)] backdrop-blur space-y-3.5">
              <span className="text-[9px] font-mono text-purple-400 uppercase tracking-wider font-bold">System Quick Links</span>
              <h3 className="text-xs font-bold font-display text-white uppercase tracking-wider">Troubleshooting guide</h3>

              <div className="space-y-3 text-xs leading-relaxed text-zinc-400 font-sans">
                <div className="flex gap-2 items-start bg-black/40 p-3.5 rounded-xl border border-white/5">
                  <Info className="w-4.5 h-4.5 text-purple-400 shrink-0 mt-0.5" />
                  <p className="text-[10.5px]">
                    Ensure your python files install and import CORS properly. Running <strong>pip install flask-cors</strong> resolves CORS headers.
                  </p>
                </div>

                <div className="flex gap-2 items-start bg-black/40 p-3.5 rounded-xl border border-white/5">
                  <Sparkles className="w-4.5 h-4.5 text-cyan-400 shrink-0 mt-0.5 animate-pulse" />
                  <p className="text-[10.5px]">
                    To view request transactions across multiple days and analytics, explore the <strong>Historical Trace Logs</strong> tab or view live telemetry metrics mapping on the <strong>Dashboard</strong>.
                  </p>
                </div>
              </div>
            </div>

            {/* Support quote */}
            <div className="p-5 border border-dashed border-[#1e2447] bg-black/10 rounded-2xl flex items-center gap-3 select-none">
              <Terminal className="w-5 h-5 text-purple-500 shrink-0 animate-pulse" />
              <div className="space-y-0.5 text-left font-mono">
                <span className="text-[8.5px] text-zinc-600 block uppercase font-bold tracking-widest">Compiler status</span>
                <span className="text-[10.5px] text-zinc-400 leading-none block">System normal. Handshakes responsive.</span>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
