'use client'

import { useEffect, useState } from 'react'
import PageWrapper from '@/components/layout/PageWrapper'
import Card from '@/components/ui/Card'
import Spinner from '@/components/ui/Spinner'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let mounted = true

    async function loadUsers() {
      if (mounted) setLoading(true)
      const response = await fetch('/api/admin/users', { cache: 'no-store' })
      const payload = await response.json()

      if (response.ok && mounted) {
        setUsers(payload.users || [])
      }
      if (mounted) setLoading(false)
    }

    loadUsers()
    return () => {
      mounted = false
    }
  }, [])

  return (
    <PageWrapper title="User management" description="Track accounts, roles, and access across the RoadRescue platform.">
      <Card>
        {loading ? (
          <div className="py-12 flex justify-center">
            <Spinner />
          </div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted">No users found.</div>
        ) : (
          <div className="space-y-3">
            {users.map((user) => (
              <Card key={user.id} className="transition hover:-translate-y-0.5 hover:shadow-lift">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-base font-semibold">{user.full_name || 'Unnamed user'}</p>
                    <p className="text-sm text-muted">{user.email}</p>
                    <p className="text-sm text-muted">{user.phone || 'Phone not provided'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge label={user.role} variant={user.role} dot />
                    <Button variant="outline">Inspect</Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>
    </PageWrapper>
  )
}
