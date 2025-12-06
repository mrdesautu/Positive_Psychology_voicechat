import React, { useState, useEffect, useRef } from 'react';
import { useLiveSession } from './hooks/useLiveSession';
import AudioVisualizer from './components/AudioVisualizer';
import ChatMessage from './components/ChatMessage';
import { ConnectionState, ChatMessage as ChatMessageType } from './types';

const INITIAL_SYSTEM_INSTRUCTION = `You are "PosiPsych," an advanced AI assistant designed for psychology professionals. 
Your knowledge base is rigorously grounded in the latest scientific papers and evidence-based practices in positive psychology (e.g., PERMA model, Character Strengths, Flow, Resilience).
Your role is to assist the professional in:
1. Diagnosis support: Analyzing symptoms through a positive psychology lens (e.g., lack of engagement, meaninglessness).
2. Treatment strategies: Suggesting evidence-based interventions (e.g., gratitude visits, strength spotting, job crafting).
3. Follow-up: Helping design tracking mechanisms for patient well-being.
Always maintain a professional, clinical, yet empathetic tone. Be concise. Assume the user is an expert.`;

interface SavedSession {
  id: string;
  timestamp: number;
  preview: string;
  context: string;
  messages: ChatMessageType[];
}

export default function App() {
  const [caseContext, setCaseContext] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [savedSessions, setSavedSessions] = useState<SavedSession[]>([]);
  
  // Combine static instruction with dynamic case context
  const fullSystemInstruction = `${INITIAL_SYSTEM_INSTRUCTION}\n\nCURRENT CASE CONTEXT:\n${caseContext || 'No specific case context provided. Ready for general consultation.'}`;

  const { connect, disconnect, connectionState, messages, setMessages, volume } = useLiveSession(fullSystemInstruction);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load sessions from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('posipsych_sessions');
    if (saved) {
      try {
        const parsed: SavedSession[] = JSON.parse(saved);
        // Revive dates in messages
        const revived = parsed.map(session => ({
          ...session,
          messages: session.messages.map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }));
        setSavedSessions(revived);
      } catch (e) {
        console.error("Failed to parse saved sessions", e);
      }
    }
  }, []);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const isConnected = connectionState === ConnectionState.CONNECTED;
  const isConnecting = connectionState === ConnectionState.CONNECTING;

  const handleToggleConnection = () => {
    if (isConnected || isConnecting) {
      disconnect();
    } else {
      connect();
    }
  };

  const saveCurrentSession = () => {
    if (!caseContext.trim() && messages.length === 0) return;

    const newSession: SavedSession = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      preview: caseContext.trim().slice(0, 30) || 'Untitled Session',
      context: caseContext,
      messages: messages
    };

    const updatedSessions = [newSession, ...savedSessions];
    setSavedSessions(updatedSessions);
    localStorage.setItem('posipsych_sessions', JSON.stringify(updatedSessions));
  };

  const loadSession = (session: SavedSession) => {
    if (isConnected) {
      alert("Please disconnect the current session before loading a saved one.");
      return;
    }
    if (confirm("Loading a saved session will overwrite your current workspace. Continue?")) {
      setCaseContext(session.context);
      setMessages(session.messages);
      setIsSidebarOpen(false); // Close sidebar on mobile after selection
    }
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedSessions = savedSessions.filter(s => s.id !== id);
    setSavedSessions(updatedSessions);
    localStorage.setItem('posipsych_sessions', JSON.stringify(updatedSessions));
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden text-slate-800">
      {/* Sidebar - Context & Info */}
      <aside className={`
        fixed inset-y-0 left-0 z-20 w-80 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0
        flex flex-col
      `}>
        <div className="flex flex-col h-full p-6 overflow-hidden">
          <div className="flex items-center space-x-2 mb-8 text-teal-700 shrink-0">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h1 className="text-xl font-bold tracking-tight">PosiPsych AI</h1>
          </div>

          <div className="space-y-6 flex-1 overflow-y-auto pr-2 scrollbar-hide">
            {/* Context Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Patient Case Context
              </label>
              <textarea 
                className="w-full h-32 p-3 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-slate-50 resize-none transition-all"
                placeholder="Paste abstract, patient notes, or specific symptoms here..."
                value={caseContext}
                onChange={(e) => setCaseContext(e.target.value)}
                disabled={isConnected}
              />
              <div className="flex justify-between items-center mt-2">
                 <p className="text-xs text-slate-400">
                  Update context before connecting.
                 </p>
                 <button 
                  onClick={saveCurrentSession}
                  className="text-xs bg-teal-50 text-teal-700 px-3 py-1.5 rounded-md hover:bg-teal-100 font-medium transition-colors border border-teal-100 flex items-center gap-1"
                 >
                   <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>
                   Save
                 </button>
              </div>
            </div>

            {/* Saved History */}
            {savedSessions.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Patient History
                </label>
                <div className="space-y-2">
                  {savedSessions.map((session) => (
                    <div 
                      key={session.id}
                      onClick={() => loadSession(session)}
                      className="group flex flex-col p-3 rounded-lg border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-md cursor-pointer transition-all relative"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium text-xs text-slate-700 truncate w-3/4">
                          {session.preview || 'Untitled Case'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(session.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 line-clamp-2">
                        {session.messages.length} messages saved.
                      </p>
                      
                      <button
                        onClick={(e) => deleteSession(session.id, e)}
                        className="absolute bottom-2 right-2 p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete session"
                      >
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Static Info */}
            <div className="bg-teal-50 p-4 rounded-lg border border-teal-100">
              <h3 className="text-sm font-semibold text-teal-800 mb-1">Focus Areas</h3>
              <ul className="text-xs text-teal-700 space-y-1 list-disc list-inside">
                <li>PERMA Profiler Analysis</li>
                <li>Strength-Based Interventions</li>
                <li>Resilience Building</li>
                <li>Flow State Optimization</li>
              </ul>
            </div>
          </div>

          <div className="mt-auto pt-6 border-t border-slate-100 shrink-0">
            <div className="flex items-center justify-between text-xs text-slate-400">
               <span>Powered by Gemini 2.5 Live</span>
               <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative">
        {/* Mobile Header */}
        <div className="lg:hidden h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4">
          <span className="font-bold text-teal-700">PosiPsych AI</span>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7"/></svg>
          </button>
        </div>

        {/* Visualizer Area */}
        <div className="h-64 bg-white border-b border-slate-200 flex flex-col items-center justify-center relative p-6 shrink-0">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-50/50 to-white pointer-events-none" />
          
          <div className="w-full max-w-3xl h-32 relative z-10">
            <AudioVisualizer isActive={isConnected} volume={volume} />
          </div>
          
          <div className="mt-6 flex items-center justify-center space-x-4 z-10">
             <button
                onClick={handleToggleConnection}
                disabled={isConnecting}
                className={`
                  flex items-center space-x-2 px-8 py-3 rounded-full font-medium transition-all transform active:scale-95 shadow-lg
                  ${isConnected 
                    ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200' 
                    : 'bg-teal-600 text-white hover:bg-teal-700'}
                  ${isConnecting ? 'opacity-70 cursor-wait' : ''}
                `}
             >
                {isConnecting ? (
                  <span>Connecting...</span>
                ) : isConnected ? (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                    <span>End Session</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>
                    <span>Start Consultation</span>
                  </>
                )}
             </button>
          </div>
          
          <div className="absolute top-4 right-4 text-xs font-mono text-slate-400">
            {connectionState === 'connected' ? 'LIVE AUDIO' : 'STANDBY'}
          </div>
        </div>

        {/* Transcript Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-50 relative scrollbar-hide">
          <div className="max-w-3xl mx-auto space-y-6 pb-20">
            {messages.length === 0 && (
              <div className="text-center mt-20 opacity-40 select-none">
                <svg className="w-16 h-16 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <p className="text-slate-500">
                  Ready to assist with your patient case.<br/>
                  Enter context on the left and press Start.
                </p>
              </div>
            )}
            
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            
            <div ref={messagesEndRef} />
          </div>
        </div>
      </main>
      
      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-10 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}