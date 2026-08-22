'use client'

import { useState } from 'react'
import { X, AlertTriangle, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import Button from '@/components/ui/Button'

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

  const handleClose = () => {
    if (submitting) return
    setReason('')
    setComment('')
    setSubmitted(false)
    onClose()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!reason || !comment.trim()) return

    setSubmitting(true)
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          reporterId,
          reasonHeader: reason,
          comment: comment.trim(),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit report')
      }

      setSubmitted(true)
      toast.success('Report submitted successfully')
    } catch (err) {
      console.error(err)
      toast.error('Failed to submit report. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={handleClose}
      />

      {/* Modal shell */}
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 px-4 animate-in zoom-in-95 duration-200">
        <div className="overflow-hidden rounded-2xl border border-border bg-white p-6 shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
              <AlertTriangle size={18} className="text-red-500" />
              Report Incident
            </h3>
            <button
              onClick={handleClose}
              disabled={submitting}
              className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-30"
            >
              <X size={18} />
            </button>
          </div>

          {submitted ? (
            /* Success State */
            <div className="py-8 text-center space-y-3">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                <CheckCircle2 size={24} />
              </div>
              <h4 className="text-sm font-bold text-gray-900">Incident Reported Successfully</h4>
              <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
                Thank you for your report. Our admin team will investigate the details provided and take immediate corrective measures.
              </p>
              <div className="pt-2">
                <Button onClick={handleClose} className="w-full">
                  Dismiss
                </Button>
              </div>
            </div>
          ) : (
            /* Form State */
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {/* Reason Select */}
              <Select
                label="Reason"
                id="report-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                options={[{ value: '', label: 'Select a reason…' }, ...REASON_OPTIONS]}
              />

              {/* Comment Textarea */}
              <div>
                <Textarea
                  label="Details"
                  id="report-comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Describe what happened in as much detail as possible…"
                  rows={4}
                  maxLength={500}
                />
                <p className="text-[11px] text-gray-400 text-right mt-1">
                  {comment.length} / 500 chars
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2.5 pt-1">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={submitting}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="danger"
                  disabled={!reason || !comment.trim()}
                  loading={submitting}
                  className="flex-[2]"
                >
                  Submit report
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  )
}