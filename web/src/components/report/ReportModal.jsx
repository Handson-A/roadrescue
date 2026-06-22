'use client'

import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import Button from '@/components/ui/Button'
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!reason || !comment.trim()) {
      toast.error('Please select a reason and enter a comment.')
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
      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit report.')
      }

      toast.success('Report submitted to admin successfully.')
      onClose?.()
      setReason('')
      setComment('')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Report Issue to Admin" size="md">
      <form onSubmit={handleSubmit} className="space-y-5">
        <p className="text-xs text-muted font-medium leading-relaxed">
          Submit a formal report regarding this rescue request. An admin will review your submission.
        </p>

        <Select
          label="Reason"
          options={REASON_OPTIONS}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />

        <Textarea
          label="Comment"
          placeholder="Describe the issue in detail..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
        />

        <Button
          type="submit"
          loading={submitting}
          variant="danger"
          className="w-full"
        >
          Submit Report
        </Button>
      </form>
    </Modal>
  )
}
