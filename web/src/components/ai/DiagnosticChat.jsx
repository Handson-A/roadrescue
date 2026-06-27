'use client'

import { useEffect, useRef, useState } from 'react'
import { Send, Zap, ChevronDown } from 'lucide-react'
import DiagnosticResult from '@/components/ai/DiagnosticResult'

const quickPrompts = ["Car won't start", 'Grinding when braking', 'Engine overheating', 'Check engine light']

export default function DiagnosticChat({ onDiagnosisComplete }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: "Hello! I'm your RoadRescue diagnostic AI. Describe what's happening with your vehicle and I'll assess the fault.",
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [promptsVisible, setPromptsVisible] = useState(true)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const messageIdRef = useRef(1)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Hide quick prompts when keyboard opens to free vertical space
  useEffect(() => {
    const handleFocus = () => setPromptsVisible(false)
    const handleBlur = () => setTimeout(() => setPromptsVisible(true), 200)
    const el = inputRef.current
    if (el) {
      el.addEventListener('focus', handleFocus)
      el.addEventListener('blur', handleBlur)
    }
    return () => {
      if (el) {
        el.removeEventListener('focus', handleFocus)
        el.removeEventListener('blur', handleBlur)
      }
    }
  }, [])

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
    const currentInput = (textToSend || input).trim()
    if (!currentInput || loading) return

    messageIdRef.current += 1
    setMessages((prev) => [...prev, { id: messageIdRef.current, sender: 'user', text: currentInput }])
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
      setMessages((prev) => [...prev, { id: messageIdRef.current, sender: 'ai', diagnosisData: diagnosis }])
      if (onDiagnosisComplete) onDiagnosisComplete(diagnosis)
    } catch {
      const fallback = buildFallbackDiagnosis(currentInput)
      messageIdRef.current += 1
      setMessages((prev) => [...prev, { id: messageIdRef.current, sender: 'ai', diagnosisData: fallback }])
      if (onDiagnosisComplete) onDiagnosisComplete(fallback)
    } finally {
      setLoading(false)
    }
  }

  return (
    /*
      Use dvh (dynamic viewport height) so the container shrinks correctly
      when the soft keyboard opens on iOS/Android. This is the key fix.
    */
    <div className="ai-assist-container w-full flex flex-col overflow-hidden rounded-2xl bg-[#FFF8EA]">

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 border-b border-[#E0D5B7] bg-[#FFF9EF] px-4 py-3 shrink-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F5D108] text-[#1F1B10] shadow-sm">
          <Zap size={15} strokeWidth={2.5} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-[13px] font-black tracking-tight text-[#1F1B10]">AI Diagnostics</h2>
          <p className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Fault analysis ready
          </p>
        </div>
      </div>

      {/* ── MESSAGES ───────────────────────────────────────────────────── */}
      <div className="chat-messages-viewport flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[88%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-[#F5D108] text-[#1F1B10] font-semibold rounded-tr-sm'
                  : 'bg-white border border-[#E0D5B7] text-[#2A261C] rounded-tl-sm shadow-sm'
              }`}
            >
              {msg.text && <p>{msg.text}</p>}
              {msg.sender === 'ai' && msg.diagnosisData && (
                <div className={msg.text ? 'mt-3 pt-3 border-t border-[#F0E8D0]' : ''}>
                  <DiagnosticResult diagnosis={msg.diagnosisData} />
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-[#E0D5B7] bg-white px-4 py-3 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-[#B8A060] animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="h-1.5 w-1.5 rounded-full bg-[#B8A060] animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="h-1.5 w-1.5 rounded-full bg-[#B8A060] animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── INPUT DOCK ─────────────────────────────────────────────────── */}
      <div className="chat-input-dock border-t border-[#E0D5B7] bg-[#FFF9EF] px-4 pt-3 pb-4 shrink-0">

        {/* Quick prompts — hidden when keyboard is open to free space */}
        {promptsVisible && (
          <div className="mb-3 flex gap-2 overflow-x-auto pb-0.5 scrollbar-none">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                disabled={loading}
                onClick={() => handleSendMessage(prompt)}
                className="whitespace-nowrap rounded-full border border-[#D8C99A] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#4A4330] transition hover:bg-[#F5EDD0] hover:border-[#C0A860] disabled:opacity-40 active:scale-95 shrink-0"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Input row */}
        <div className="flex items-center gap-2 rounded-xl border border-[#DCCDA9] bg-white px-3 py-2 shadow-sm focus-within:border-[#B8A060] transition-colors">
          <input
            ref={inputRef}
            type="text"
            value={input}
            disabled={loading}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
            placeholder="Describe your car's symptoms..."
            className="min-w-0 flex-1 bg-transparent text-[13px] text-[#2A261C] placeholder:text-[#B0A07A] outline-none disabled:opacity-50"
            style={{ fontSize: '16px' }} /* Prevents iOS zoom on focus */
          />
          <button
            type="button"
            disabled={loading || !input.trim()}
            onClick={() => handleSendMessage()}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1A1609] text-white transition hover:bg-[#2C2410] disabled:opacity-30 active:scale-95"
          >
            <Send size={13} strokeWidth={2} />
          </button>
        </div>
      </div>

    </div>
  )
}