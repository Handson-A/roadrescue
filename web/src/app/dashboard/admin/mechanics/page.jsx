'use client'

import { useState, useEffect } from 'react'
import PageWrapper from '@/components/layout/PageWrapper'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import Button from '@/components/ui/Button'

export default function MechanicsVerificationPage() {
  const [mechanics, setMechanics] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let mounted = true

    async function loadMechanics() {
      if (mounted) setLoading(true)
      const response = await fetch('/api/admin/mechanics?status=pending', { cache: 'no-store' })
      const payload = await response.json()

      if (response.ok && mounted) {
        setMechanics(payload.mechanics || [])
      }
      if (mounted) setLoading(false)
    }

    loadMechanics()
    return () => {
      mounted = false
    }
  }, [])

  const handleApprove = async (mechanicUserId) => {
    await fetch('/api/admin/mechanics', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mechanicUserId, newStatus: 'verified' }),
    })
    setMechanics((current) => current.filter((mechanic) => mechanic.user_id !== mechanicUserId))
  }

  const handleReject = async (mechanicUserId) => {
    await fetch('/api/admin/mechanics', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mechanicUserId, newStatus: 'rejected' }),
    })
    setMechanics((current) => current.filter((mechanic) => mechanic.user_id !== mechanicUserId))
  }

  return (
    <PageWrapper title="Mechanic verification" description="Approve verified professionals before they enter the dispatch pool.">
      {loading ? (
        <div className="py-12 flex justify-center">
          <Spinner />
        </div>
      ) : mechanics.length === 0 ? (
        <Card>
          <div className="py-12 text-center text-sm text-muted">No mechanics waiting for verification.</div>
        </Card>
      ) : (
        <div className="space-y-4">
          {mechanics.map((mech) => (
            <Card key={mech.id}>
              <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr_0.8fr_1fr] lg:items-center">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-muted">Mechanic</p>
                  <p className="mt-2 text-base font-semibold">{mech.user?.full_name}</p>
                  <p className="text-sm text-muted">{mech.user?.email}</p>
                  <p className="text-sm text-muted">{mech.user?.phone || 'Phone pending'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-muted">Business</p>
                  <p className="mt-2 text-sm font-medium">{mech.business_name || 'Not set'}</p>
                  <p className="text-sm text-muted">{mech.rating_avg ? `Rating ${Number(mech.rating_avg).toFixed(1)}` : 'No ratings yet'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-muted">Specializations</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(mech.specializations || []).slice(0, 3).map((spec) => <Badge key={spec} label={spec} variant="default" />)}
                  </div>
                </div>
                <div className="flex gap-2 lg:justify-end">
                  <Button onClick={() => handleApprove(mech.user_id)}>Approve</Button>
                  <Button variant="outline" onClick={() => handleReject(mech.user_id)}>Reject</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </PageWrapper>
  )
}
