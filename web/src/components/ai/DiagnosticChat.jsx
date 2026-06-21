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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

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
        diagnosisData: diagnosis, // Attach the rich JSON metrics structure directly to this chat item
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
    <div className="w-full min-h-[calc(100vh-4rem)] lg:min-h-screen lg:pl-64 flex flex-col bg-[#FFF8EA] text-slate-900">
      <div className="flex items-center gap-3 border-b border-[#E0D5B7] bg-[#FFF9EF] px-4 py-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F5D108] text-[#1F1B10] shadow-sm">
          <Zap size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-black tracking-tight text-[#1F1B10]">AI Diagnostics</h2>
          <p className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Structured vehicle fault stream
          </p>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-6">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm space-y-3 ${
                msg.sender === 'user'
                  ? 'bg-[#F5D108] text-[#1F1B10] font-bold rounded-tr-none'
                  : 'bg-white border border-[#DCCDA9] text-slate-800 rounded-tl-none'
              }`}
            >
              {/* Main chat text */}
              <div>{msg.text}</div>
              
              {/* Nested diagnostic box to keep it grouped under the AI reply on the left */}
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
            <div className="bg-white border border-[#DCCDA9] text-slate-400 rounded-2xl rounded-tl-none px-4 py-3 text-xs font-medium animate-pulse">
              AI is analyzing vehicle failure metrics...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Action Tray */}
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
  )
}