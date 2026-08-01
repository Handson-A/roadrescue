'use client'

import { useEffect, useRef, useState } from 'react'
import { Send, Zap, ChevronDown, Wrench } from 'lucide-react'
import DiagnosticResult from '@/components/ai/DiagnosticResult'

const quickPrompts = ["Car won't start", 'Grinding when braking', 'Engine overheating', 'Check engine light']

export default function DiagnosticChat({ onDiagnosisComplete }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [promptsVisible, setPromptsVisible] = useState(true)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const messageIdRef = useRef(0)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const isEmpty = messages.length === 0 || messages.every((m) => !m.text && !m.diagnosisData)

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
    <div className="ai-assist-container min-h-0 w-full flex-1 flex flex-col overflow-hidden bg-transparent has-mobile-nav">

      {/* ── MESSAGES ───────────────────────────────────────────────────── */}
      <div className="chat-messages-viewport min-h-0">
        {isEmpty && !loading ? (
          <div className="flex-1 flex items-center justify-center px-6 py-12">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#F5EDD0] text-[#7A261E] shadow-sm">
                <Wrench size={22} />
              </div>
              <h3 className="mb-2 text-lg font-bold text-[#1F1B10]">How can I help diagnose your vehicle?</h3>
              <p className="max-w-xs text-sm text-[#6B5F4A]">Tell me what&#39;s happening — describe symptoms, sounds, or warning lights and I&#39;ll analyze possible causes and recommendations.</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[88%]">
                  <div className={`mb-2 inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                    msg.sender === 'user'
                      ? 'bg-[#1F1B10] text-white'
                      : 'bg-[#F5EDD0] text-[#7A261E]'
                  }`}>
                    {msg.sender === 'user' ? 'You' : 'RoadRescue'}
                  </div>
                  <div
                    className={`wrap-break-word rounded-[28px] px-4 py-4 text-[14px] leading-7 shadow-sm ${
                      msg.sender === 'user'
                        ? 'bg-[#1F1B10] text-white shadow-[0_10px_20px_-14px_rgba(27,23,12,0.7)] rounded-tr-[18px] rounded-bl-[18px]'
                        : 'bg-white border border-[#E5D0A7] text-[#2A261C] rounded-tl-[18px] rounded-br-[18px]'
                    }`}>
                    {msg.text && <p>{msg.text}</p>}
                    {msg.sender === 'ai' && msg.diagnosisData && (
                      <div className={msg.text ? 'mt-4 pt-4 border-t border-[#F3E6C5]' : ''}>
                        <DiagnosticResult diagnosis={msg.diagnosisData} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-3 rounded-[26px] border border-[#E5D0A7] bg-white px-4 py-3 shadow-sm">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#B8A060] animate-pulse" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#B8A060] animate-pulse delay-150" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#B8A060] animate-pulse delay-300" />
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8F7B45]">Analyzing...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* ── INPUT DOCK ─────────────────────────────────────────────────── */}
      <div className="chat-input-dock shrink-0">

        {/* Quick prompts — hidden when keyboard is open to free vertical space */}
        {promptsVisible && (
          <div className="mb-3 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                disabled={loading}
                onClick={() => handleSendMessage(prompt)}
                className="min-w-30 whitespace-nowrap rounded-full border border-[#D8C99A] bg-white px-3 py-2 text-[12px] font-semibold text-[#4A4330] transition hover:bg-[#F5EDD0] hover:border-[#C0A860] disabled:opacity-40 active:scale-95 shrink-0"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Input row */}
        <div className="flex items-center gap-2 rounded-[28px] border border-[#DCCDA9] bg-white px-3 py-3 shadow-sm focus-within:border-[#B8A060] transition-colors">
          <input
            ref={inputRef}
            type="text"
            value={input}
            disabled={loading}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
            placeholder="Describe your car's symptoms..."
            className="min-w-0 flex-1 bg-transparent text-[15px] text-[#2A261C] placeholder:text-[#A19258] outline-none disabled:opacity-50"
            style={{ fontSize: '16px' }}
          />
          <button
            type="button"
            disabled={loading || !input.trim()}
            onClick={() => handleSendMessage()}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-3xl bg-[#1A1609] text-white transition hover:bg-[#2C2410] disabled:opacity-30 active:scale-95"
          >
            <Send size={16} strokeWidth={2} />
          </button>
        </div>
      </div>

    </div>
  )
}