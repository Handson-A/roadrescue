'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowLeft, Send } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useKeyboardOpen } from '@/hooks/useKeyboardOpen'

export default function RescueChatPanel({
  requestId,
  contactName,
  contactRole,
  statusText,
  statusTone = 'success',
}) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(!!requestId)
  const [currentUserId, setCurrentUserId] = useState(null)
  const messagesEndRef = useRef(null)
  const supabase = createClient()
  const pathname = usePathname()
  const isKeyboardOpen = useKeyboardOpen()

  useEffect(() => {
    if (!requestId) {
      return
    }

    async function loadUserAndMessages() {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)

      const response = await fetch(`/api/requests/${requestId}/messages`)
      const result = await response.json()
      if (response.ok) {
        setMessages(result.messages || [])
      }
      setLoading(false)
    }

    loadUserAndMessages()
  }, [requestId, supabase])

  useEffect(() => {
    if (!requestId) return

    const channel = supabase
      .channel(`messages-${requestId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `request_id=eq.${requestId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new])
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [requestId, supabase])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || !requestId) return

    const response = await fetch(`/api/requests/${requestId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: input.trim() }),
    })

    if (response.ok) {
      setInput('')
    }
  }

  const statusClass = statusTone === 'warning'
    ? 'border-amber-200 bg-amber-50 text-amber-800'
    : statusTone === 'danger'
      ? 'border-red-200 bg-red-50 text-red-700'
      : 'border-emerald-200 bg-emerald-50 text-emerald-700'

  const hasMobileNav = !pathname?.startsWith('/dashboard/admin')

  return (
    <div className={`flex flex-1 w-full flex-col overflow-hidden bg-transparent ${hasMobileNav && !isKeyboardOpen ? 'has-mobile-nav' : ''}`}>
      <div className="flex items-center gap-3 border-b border-[#D7CCAD] bg-[#FFFBF4]/80 backdrop-blur-md px-4 py-4 shrink-0">
        <Link href=".." className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-950 shadow-sm ring-1 ring-slate-200">
          <ArrowLeft size={18} />
        </Link>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-black text-slate-950">Chat</h1>
          <p className="truncate text-xs text-slate-500">{contactName} · {contactRole}</p>
        </div>
      </div>

      <div className="px-4 pb-4 pt-5 shrink-0">
        <div className={`mx-auto w-fit rounded-full px-4 py-2 text-sm font-semibold ring-1 ${statusClass}`}>
          {statusText}
        </div>
      </div>

      <div className="chat-messages-viewport">
        {loading ? (
          <div className="text-center text-sm text-slate-500">Loading messages...</div>
        ) : messages.length === 0 && !requestId ? (
          <div className="text-center text-sm text-slate-500">
            Admin coordination console is read-only. Select a specific request to chat.
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-sm text-slate-500">No messages yet. Start the conversation.</div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender_id === currentUserId

            return (
              <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[88%] rounded-3xl px-4 py-3 text-sm leading-6 shadow-sm ${isMine ? 'bg-amber-400 text-slate-950' : 'bg-white text-slate-800 ring-1 ring-slate-200'}`}>
                  <p>{msg.message}</p>
                  <p className={`mt-1 text-[11px] ${isMine ? 'text-slate-700' : 'text-slate-400'}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-dock shrink-0">
        <div className="flex items-center gap-2 rounded-[28px] border border-[#DCCDA9] bg-white px-3 py-3 shadow-sm focus-within:border-[#B8A060] transition-colors">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder={requestId ? "Type a message..." : "Select a request to chat..."}
            disabled={!requestId}
            className="min-w-0 flex-1 bg-transparent text-[15px] text-[#2A261C] placeholder:text-[#A19258] outline-none disabled:cursor-not-allowed disabled:opacity-60"
            style={{ fontSize: '16px' }}
          />
          <button onClick={sendMessage} disabled={!input.trim() || !requestId} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-3xl bg-[#1A1609] text-white transition hover:bg-[#2C2410] disabled:opacity-30 active:scale-95" aria-label="Send message">
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}