'use client';

/**
 * DiagnosticChat Component
 * Chat interface for AI diagnostic conversation with driver
 */

import { useState } from 'react';
import Button from '@/components/ui/Button';
import { ArrowLeft, Send, Sparkles, Zap } from 'lucide-react';

export default function DiagnosticChat({ onDiagnosisComplete }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: 'Hello! Describe your vehicle symptoms in plain language and I will provide a preliminary fault assessment. What is happening with your car?',
    },
  ]);
  const [input, setInput] = useState('');
  const quickPrompts = ['Car won\'t start', 'Grinding when braking', 'Engine overheating'];

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage = { id: Date.now(), sender: 'user', text: input };
    setMessages([...messages, userMessage]);
    setInput('');

    // Simulate AI response (in production, call OpenAI API)
    setTimeout(() => {
      const aiMessage = {
        id: Date.now() + 1,
        sender: 'ai',
        text: 'Based on what you described, this could be related to the battery, starter, or alternator. I need one more symptom detail before I narrow it down.',
      };
      setMessages((prev) => [...prev, aiMessage]);
    }, 500);
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col bg-slate-950 text-white md:min-h-144 md:rounded-4xl md:shadow-[0_20px_50px_rgba(15,23,42,0.2)]">
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-4">
        <button type="button" className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white">
          <ArrowLeft size={18} />
        </button>
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-400 text-slate-950">
          <Zap size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-black uppercase tracking-[0.18em]">AI Assistant</h2>
          <p className="mt-1 flex items-center gap-2 text-xs text-emerald-300"><span className="h-2 w-2 rounded-full bg-emerald-400" />Online — Powered by AI</p>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-3xl px-4 py-3 text-sm leading-6 ${msg.sender === 'user' ? 'bg-amber-400 text-slate-950' : 'border border-white/10 bg-white text-slate-900 shadow-lg shadow-black/10'}`}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3">
        <p className="mb-2 text-xs text-slate-400">Try asking about:</p>
        <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
          {quickPrompts.map((prompt) => (
            <button key={prompt} type="button" onClick={() => setInput(prompt)} className="whitespace-nowrap rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-950">
              {prompt}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 rounded-[1.35rem] bg-white px-3 py-2 text-slate-950 shadow-lg shadow-black/10">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Describe your car's problem..."
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
          <button type="button" onClick={handleSendMessage} className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-400 text-slate-950">
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}


// 'use client';

// /**
//  * DiagnosticChat Component
//  * Chat interface for AI diagnostic conversation with driver
//  */

// import { useState } from 'react';
// import Button from '@/components/ui/Button';
// import { ArrowLeft, Send, Sparkles, Zap } from 'lucide-react';

// export default function DiagnosticChat({ onDiagnosisComplete }) {
//   const [messages, setMessages] = useState([
//     {
//       id: 1,
//       sender: 'ai',
//       text: "Hello! I'm your RoadRescue AI Assistant. Describe what's happening with your vehicle, and I'll help diagnose the issue.",
//     },
//   ]);
//   const [input, setInput] = useState('');
//   const quickPrompts = ["Car won't start", 'Grinding when braking', 'Engine overheating'];

//   const handleSendMessage = async () => {
//     if (!input.trim()) return;

//     // Add user message
//     const userMessage = { id: Date.now(), sender: 'user', text: input };
//     setMessages([...messages, userMessage]);
//     setInput('');

//     // Simulate AI response
//     setTimeout(() => {
//       const aiMessage = {
//         id: Date.now() + 1,
//         sender: 'ai',
//         text: 'Based on what you described, this could be related to the battery, starter, or alternator. I need one more symptom detail before I narrow it down.',
//       };
//       setMessages((prev) => [...prev, aiMessage]);
//     }, 500);
//   };

//   return (
//     <div className="flex min-h-[calc(100vh-8rem)] flex-col bg-[#f4f1ea] text-slate-900 md:min-h-144 md:rounded-4xl md:shadow-[0_20px_50px_rgba(0,0,0,0.05)]">
      
//       {/* Header Area */}
//       <div className="flex items-center gap-3 border-b border-black/5 px-4 py-4 bg-[#f4f1ea]">
//         <button type="button" className="flex h-11 w-11 items-center justify-center rounded-full bg-transparent text-slate-800 hover:bg-black/5 transition-colors">
//           <ArrowLeft size={20} />
//         </button>
//         <div className="min-w-0 flex-1 text-center pr-11"> {/* Centers title like native apps */}
//           <h2 className="truncate text-lg font-bold tracking-tight text-[#7a6a48] font-serif">RoadRescue</h2>
//         </div>
//         <button type="button" className="absolute right-4 p-2 text-slate-800">
//           {/* Placeholder to match layout bell icon if needed */}
//         </button>
//       </div>

//       {/* Chat History Area */}
//       <div className="flex-1 space-y-6 overflow-y-auto px-4 py-4">
//         {messages.map((msg) => (
//           <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
//             <div 
//               className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-6 shadow-sm border ${
//                 msg.sender === 'user' 
//                   ? 'bg-[#ffd300] border-[#e6bd00] text-slate-900 font-medium' 
//                   : 'bg-[#fbf9f4] border-[#ebd9be] text-slate-800'
//               }`}
//             >
//               {msg.text}
//             </div>
//             <span className="mt-1 text-[10px] text-slate-400 px-1">Just now</span>
//           </div>
//         ))}
//       </div>

//       {/* Input Action Area */}
//       <div className="border-t border-black/5 bg-[#f4f1ea] px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3">
//         <p className="mb-2 text-xs font-medium text-slate-500">Try asking about:</p>
//         <div className="mb-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
//           {quickPrompts.map((prompt) => (
//             <button 
//               key={prompt} 
//               type="button" 
//               onClick={() => setInput(prompt)} 
//               className="whitespace-nowrap rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
//             >
//               {prompt}
//             </button>
//           ))}
//         </div>

//         {/* Text Input Container */}
//         <div className="flex items-center gap-2 rounded-xl bg-[#fbf9f4] border border-[#ebd9be] px-3 py-2 text-slate-900 shadow-inner">
//           <input
//             type="text"
//             value={input}
//             onChange={(e) => setInput(e.target.value)}
//             onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
//             placeholder="Describe symptoms (e.g."
//             className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
//           />
//           <button 
//             type="button" 
//             onClick={handleSendMessage} 
//             className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#605822] text-white transition-transform active:scale-95"
//           >
//             <Send size={16} />
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }