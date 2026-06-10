'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, PhoneCall, Paperclip, Send, Share2 } from 'lucide-react'

export default function RescueChatPanel({
  title,
  subtitle,
  contactName,
  contactRole,
  avatarUrl,
  statusText,
  statusTone = 'success',
  initialMessages = [],
  primaryActionHref,
  primaryActionLabel,
  secondaryActionLabel,
  secondaryActionHref,
}) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState(initialMessages)

  const statusClass = useMemo(() => {
    if (statusTone === 'warning') return 'border-amber-200 bg-amber-50 text-amber-800'
    if (statusTone === 'danger') return 'border-red-200 bg-red-50 text-red-700'
    return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  }, [statusTone])

  function sendMessage() {
    if (!input.trim()) return

    setMessages((current) => [
      ...current,
      { id: Date.now(), sender: 'me', text: input.trim(), time: 'Just now' },
    ])
    setInput('')
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-[2rem] bg-[#FAFBFD] shadow-[0_20px_50px_rgba(15,23,42,0.12)] ring-1 ring-slate-200 md:min-h-[36rem]">
      <div className="flex items-center gap-3 border-b border-slate-200 bg-[#FAFBFD] px-4 py-4">
        <Link href=".." className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-950 shadow-sm ring-1 ring-slate-200">
          <ArrowLeft size={18} />
        </Link>

        <div className="h-11 w-11 overflow-hidden rounded-full bg-slate-200 ring-2 ring-amber-400">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt={contactName || 'Contact'} className="h-full w-full object-cover" />
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-black text-slate-950">{title}</h1>
          <p className="truncate text-xs text-slate-500">{contactName} · {contactRole}</p>
        </div>

        <div className="flex items-center gap-2">
          <button className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm ring-1 ring-slate-200" aria-label="Call">
            <PhoneCall size={18} />
          </button>
          <button className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm ring-1 ring-slate-200" aria-label="Share">
            <Share2 size={18} />
          </button>
        </div>
      </div>

      <div className="px-4 pb-4 pt-5">
        <div className={`mx-auto w-fit rounded-full px-4 py-2 text-sm font-semibold ring-1 ${statusClass}`}>
          {statusText}
        </div>
        {subtitle && <p className="mt-3 text-center text-sm text-slate-500">{subtitle}</p>}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="space-y-4">
          {messages.map((message) => {
            const isMine = message.sender === 'me'

            return (
              <div key={message.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[88%] rounded-3xl px-4 py-3 text-sm leading-6 shadow-sm ${isMine ? 'bg-amber-400 text-slate-950' : 'bg-white text-slate-800 ring-1 ring-slate-200'}`}>
                  <p>{message.text}</p>
                  <p className={`mt-1 text-[11px] ${isMine ? 'text-slate-700' : 'text-slate-400'}`}>{message.time}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="border-t border-slate-200 bg-[#FAFBFD] px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3">
        <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
          <button className="whitespace-nowrap rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800">Share Location</button>
          <button className="whitespace-nowrap rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800">Request ETA</button>
          <button className="whitespace-nowrap rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800">Send Photo</button>
        </div>

        <div className="mb-3 flex items-center gap-2 rounded-[1.35rem] bg-white px-3 py-2 shadow-sm ring-1 ring-slate-200">
          <button className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500" aria-label="Attach file">
            <Paperclip size={18} />
          </button>
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && sendMessage()}
            placeholder="Type a message..."
            className="min-w-0 flex-1 bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400"
          />
          <button onClick={sendMessage} className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-400 text-slate-950" aria-label="Send message">
            <Send size={16} />
          </button>
        </div>

        <div className="flex gap-2">
          {primaryActionHref && primaryActionLabel && (
            <Link href={primaryActionHref} className="inline-flex h-12 flex-1 items-center justify-center rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm">
              {primaryActionLabel}
            </Link>
          )}
          {secondaryActionHref && secondaryActionLabel && (
            <Link href={secondaryActionHref} className="inline-flex h-12 flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm">
              {secondaryActionLabel}
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}