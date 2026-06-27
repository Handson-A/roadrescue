'use client'

import { useState } from 'react'
import { X, AlertTriangle, ChevronDown, CheckCircle2, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'

const REASON_OPTIONS = [
  { value: 'inappropriate_behavior', label: 'Inappropriate behavior' },
  { value: 'pricing_issue', label: 'Pricing issue' },
  { value: 'delay', label: 'Delay' },
  { value: 'other', label: 'Other' },
]

export default function ReportModal({ isOpen, onClose, requestId, reporterId }) {
  const { user } = useAuth()
  const [reason, setReason] = useState('')
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!reason || !comment.trim()) {
      toast.error('Please select a reason and describe the issue.')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          reporterId: user?.id || reporterId,
          reasonHeader: reason,
          comment: comment.trim(),
        }),
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Failed to submit report.')

      setSubmitted(true)
      setTimeout(() => {
        onClose?.()
        setReason('')
        setComment('')
        setSubmitted(false)
      }, 1800)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    if (submitting) return
    onClose?.()
    setReason('')
    setComment('')
    setSubmitted(false)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-modal-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl ring-1 ring-black/5 overflow-hidden">

          {/* Header */}
          <div className="flex items-start justify-between px-6 pt-6 pb-4">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-red-50">
                <AlertTriangle className="w-4.5 h-4.5 text-red-500" size={18} />
              </span>
              <div>
                <h2
                  id="report-modal-title"
                  className="text-[15px] font-semibold text-gray-900 leading-tight"
                >
                  Report Issue to Admin
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">Your report will be reviewed shortly</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={submitting}
              className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-40"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>

          {/* Divider */}
          <div className="h-px bg-gray-100 mx-6" />

          {/* Body */}
          {submitted ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 px-6">
              <span className="flex items-center justify-center w-14 h-14 rounded-full bg-green-50">
                <CheckCircle2 className="text-green-500" size={28} />
              </span>
              <p className="text-sm font-medium text-gray-800">Report submitted</p>
              <p className="text-xs text-gray-400 text-center">
                An admin will review your report and follow up if needed.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="px-6 pt-5 pb-6 space-y-4">
              {/* Reason */}
              <div className="space-y-1.5">
                <label
                  htmlFor="report-reason"
                  className="block text-xs font-medium text-gray-600 uppercase tracking-wide"
                >
                  Reason
                </label>
                <div className="relative">
                  <select
                    id="report-reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="
                      w-full appearance-none
                      px-3.5 py-2.5 pr-9
                      text-sm text-gray-900
                      bg-gray-50 border border-gray-200
                      rounded-xl
                      focus:outline-none focus:ring-2 focus:ring-red-400/50 focus:border-red-400
                      transition-all
                    "
                  >
                    <option value="" disabled>Select a reason…</option>
                    {REASON_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <ChevronDown
                    size={15}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                </div>
              </div>

              {/* Comment */}
              <div className="space-y-1.5">
                <label
                  htmlFor="report-comment"
                  className="block text-xs font-medium text-gray-600 uppercase tracking-wide"
                >
                  Details
                </label>
                <textarea
                  id="report-comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Describe what happened in as much detail as possible…"
                  rows={4}
                  className="
                    w-full resize-none
                    px-3.5 py-2.5
                    text-sm text-gray-900 placeholder:text-gray-400
                    bg-gray-50 border border-gray-200
                    rounded-xl
                    focus:outline-none focus:ring-2 focus:ring-red-400/50 focus:border-red-400
                    transition-all
                  "
                />
                <p className="text-[11px] text-gray-400 text-right">
                  {comment.length} / 500 chars
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={submitting}
                  className="
                    flex-1 px-4 py-2.5
                    text-sm font-medium text-gray-600
                    bg-gray-100 hover:bg-gray-200
                    rounded-xl transition-colors
                    disabled:opacity-40
                  "
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !reason || !comment.trim()}
                  className="
                    flex-[2] flex items-center justify-center gap-2
                    px-4 py-2.5
                    text-sm font-semibold text-white
                    bg-red-500 hover:bg-red-600
                    rounded-xl transition-colors
                    disabled:opacity-50 disabled:cursor-not-allowed
                    focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2
                  "
                >
                  {submitting ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    'Submit report'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  )
}