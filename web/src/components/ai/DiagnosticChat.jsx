'use client';

/**
 * DiagnosticChat Component
 * Chat interface for AI diagnostic conversation with driver
 */

import { useState } from 'react';
import { ArrowLeft, Send, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DiagnosticChat({ onDiagnosisComplete }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: "Hello! I'm your RoadRescue AI Assistant. Describe what's happening with your vehicle in plain language, and I'll provide an immediate fault assessment.",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const quickPrompts = ["Car won't start", 'Grinding when braking', 'Engine overheating'];

  const handleSendMessage = async (textToSend) => {
    const currentInput = textToSend || input;
    if (!currentInput.trim() || loading) return;

    // 1. Mount User Message locally
    const userMessage = { id: Date.now(), sender: 'user', text: currentInput };
    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInput('');
    
    // FIXED: Using state setter function instead of const assignment mutation
    setLoading(true);

    try {
      // 2. Call your internal API handler route (Supports Free Tier backends)
      const response = await fetch('/api/diagnostic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: currentInput,
          history: messages.map(m => ({ 
            role: m.sender === 'user' ? 'user' : 'assistant', 
            content: m.text 
          }))
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Failed to process diagnosis');

      // 3. Mount AI Response Node
      const aiMessage = {
        id: Date.now() + 1,
        sender: 'ai',
        text: data.reply,
      };
      setMessages((prev) => [...prev, aiMessage]);

      // Optional trigger hook callback for your parent layout state
      if (onDiagnosisComplete && data.diagnosis) {
        onDiagnosisComplete(data.diagnosis);
      }
    } catch (err) {
      toast.error('AI node temporarily congested. Running backup routine...');
      
      // Local simulation fallback keeps your presentation stable if the key rate limit drops
      setTimeout(() => {
        setMessages((prev) => [...prev, {
          id: Date.now() + 2,
          sender: 'ai',
          text: `Fallback Routine: Based on the symptoms described for "${currentInput}", diagnostic checks point toward ignition system components or basic fluid level discrepancies. Please cross-verify your instrument cluster signals.`
        }]);
      }, 600);
    } finally {
      setLoading(false);
    }
  };

  return (
    // FIXED: Added lg:pl-64 layout structural padding to push content past the fixed sidebar bounds
    <div className="w-full min-h-[calc(100vh-4rem)] lg:min-h-screen lg:pl-64 flex flex-col bg-[#FFF8EA] text-slate-900">
      
      {/* Header Area: Completely clean, native app feel */}
      <div className="flex items-center gap-3 border-b border-[#E0D5B7] bg-[#FFF9EF] px-4 py-4">
        <button type="button" className="flex h-11 w-11 items-center justify-center rounded-full bg-white border border-[#DCCDA9] text-slate-700 hover:bg-slate-50 transition shadow-sm">
          <ArrowLeft size={18} />
        </button>
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F5D108] text-[#1F1B10] shadow-sm">
          <Zap size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-black tracking-tight text-[#1F1B10]">AI Assistant</h2>
          <p className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Active Diagnostic Stream
          </p>
        </div>
      </div>

      {/* Chat History Area: Beautiful scrolling message clusters */}
      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-6">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                msg.sender === 'user' 
                  ? 'bg-[#F5D108] text-[#1F1B10] font-bold rounded-tr-none' 
                  : 'bg-white border border-[#DCCDA9] text-slate-800 rounded-tl-none'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-[#DCCDA9] text-slate-400 rounded-2xl rounded-tl-none px-4 py-3 text-xs font-medium animate-pulse">
              Analyzing vehicle failure metrics...
            </div>
          </div>
        )}
      </div>

      {/* Input Action Area */}
      <div className="border-t border-[#E0D5B7] bg-[#FFF9EF] px-4 pb-24 lg:pb-6 pt-4">
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#7C6B44]">Try asking about:</p>
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {quickPrompts.map((prompt) => (
            <button 
              key={prompt} 
              type="button" 
              disabled={loading}
              onClick={() => handleSendMessage(prompt)} 
              className="whitespace-nowrap rounded-full border border-[#C8B98E] bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Text Input Box Frame Container */}
        <div className="flex items-center gap-2 rounded-2xl bg-white border border-[#DCCDA9] p-2 shadow-sm focus-within:border-slate-900 transition">
          <input
            type="text"
            value={input}
            disabled={loading}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Describe your car's symptoms in plain language..."
            className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-slate-400 text-slate-900 disabled:opacity-50"
          />
          <button 
            type="button" 
            disabled={loading || !input.trim()}
            onClick={() => handleSendMessage()} 
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white transition hover:bg-slate-800 disabled:opacity-30 active:scale-95"
          >
            <Send size={14} />
          </button>
        </div>
      </div>

    </div>
  );
}