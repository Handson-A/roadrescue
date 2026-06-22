'use client'

import { useEffect, useRef, useState } from 'react'
import { Send, Zap } from 'lucide-react'
import DiagnosticResult from '@/components/ai/DiagnosticResult'

export default function DiagnosticChat({ onDiagnosisComplete }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: "Hello! I'm your RoadRescue diagnostic AI. Describe what's happening with your vehicle in plain language, and I'll provide a fault assessment.",
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const messageIdRef = useRef(1)
  const quickPrompts = ["Car won't start", 'Grinding when braking', 'Engine overheating']

  // Auto-scroll the messages area when new chat nodes append
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  function buildFallbackDiagnosis(currentInput) {
    return {
      problem: `Based on "${currentInput}", checks point to ignition, fluid, or dashboard warning issues. Verify the vehicle before driving further.`,
      severity: 'medium',
      recommendations: [
        'Check battery terminals and dashboard warning lights.',
        'Verify fuel level and fluid leaks before moving the vehicle.',
        'Use RoadRescue dispatch if the vehicle feels unsafe to drive.',
      ],
      estimated_causes: ['Battery or ignition fault', 'Low fluid level', 'Sensor warning'],
    }
  }

  async function handleSendMessage(textToSend) {
    const currentInput = textToSend || input
    if (!currentInput.trim() || loading) return

    messageIdRef.current += 1
    const userMessage = { id: messageIdRef.current, sender: 'user', text: currentInput }
    setMessages((prev) => [...prev, userMessage])
    if (!textToSend) setInput('')

    setLoading(true)

    try {
      const response = await fetch('/api/ai/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptoms: currentInput }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) throw new Error(data.error || 'Failed to process diagnosis')

      const diagnosis = data.diagnosis || buildFallbackDiagnosis(currentInput)

      messageIdRef.current += 1
      const aiMessage = {
        id: messageIdRef.current,
        sender: 'ai',
        text: diagnosis.problem || 'Unable to diagnose issue',
        diagnosisData: diagnosis,
      }
      setMessages((prev) => [...prev, aiMessage])

      if (onDiagnosisComplete) {
        onDiagnosisComplete(diagnosis)
      }
    } catch (err) {
      const fallbackDiagnosis = buildFallbackDiagnosis(currentInput)

      messageIdRef.current += 1
      setMessages((prev) => [
        ...prev, 
        {
          id: messageIdRef.current,
          sender: 'ai',
          text: fallbackDiagnosis.problem,
          diagnosisData: fallbackDiagnosis,
        }
      ])

      if (onDiagnosisComplete) {
        onDiagnosisComplete(fallbackDiagnosis)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    /* FIXED: Container uses a strict relative viewport boundary layout leaving breathing space for your bottom navigation bars */
    <div className="w-full h-[calc(100vh-13rem)] md:h-[calc(100vh-8rem)] flex flex-col bg-[#FFF8EA] text-slate-900 overflow-hidden rounded-2xl border border-[#DCCDA9]/60 shadow-sm">
      
      {/* STATIC TOP HEADER BLOCK */}
      <div className="flex items-center gap-3 border-b border-[#E0D5B7] bg-[#FFF9EF] px-4 py-3.5 shrink-0">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F5D108] text-[#1F1B10] shadow-sm">
          <Zap size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-black tracking-tight text-[#1F1B10]">AI Diagnostics</h2>
          <p className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-bold">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Structured vehicle fault stream
          </p>
        </div>
      </div>

      {/* ONLY SCROLLABLE LAYOUT ELEMENT: MESSAGES WINDOW */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-xs space-y-3 ${
                msg.sender === 'user'
                  ? 'bg-[#F5D108] text-[#1F1B10] font-black rounded-tr-none'
                  : 'bg-white border border-[#DCCDA9] text-slate-800 rounded-tl-none'
              }`}
            >
              <div>{msg.text}</div>
              
              {msg.sender === 'ai' && msg.diagnosisData && (
                <div className="pt-2 border-t border-slate-100">
                  <DiagnosticResult diagnosis={msg.diagnosisData} />
                </div>
              )}
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-[#DCCDA9] text-slate-400 rounded-2xl rounded-tl-none px-4 py-2.5 text-xs font-medium animate-pulse">
              AI is analyzing vehicle failure metrics...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* STATIC ANCHORED ACTION BOTTOM TRAY: Clears the mobile navigation tab context without overlapping */}
      <div className="border-t border-[#E0D5B7] bg-[#FFF9EF] px-4 py-4 shrink-0 shadow-[0_-4px_12px_rgba(31,27,16,0.02)]">
        <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-[#7C6B44]">Try asking about:</p>
        <div className="mb-3.5 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              disabled={loading}
              onClick={() => handleSendMessage(prompt)}
              className="whitespace-nowrap rounded-full border border-[#C8B98E] bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition disabled:opacity-50 active:scale-95"
            >
              {prompt}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-white border border-[#DCCDA9] p-1.5 shadow-xs focus-within:border-[#1F1B10] transition-colors">
          <input
            type="text"
            value={input}
            disabled={loading}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Describe your car's symptoms..."
            className="min-w-0 flex-1 bg-transparent px-2 text-xs sm:text-sm outline-none placeholder:text-slate-400 text-slate-900 disabled:opacity-50"
          />
          <button
            type="button"
            disabled={loading || !input.trim()}
            onClick={() => handleSendMessage()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white transition hover:bg-slate-800 disabled:opacity-20 active:scale-95"
          >
            <Send size={12} />
          </button>
        </div>
      </div>

    </div>
  )
}