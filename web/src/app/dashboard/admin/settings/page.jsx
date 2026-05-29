'use client'

import Link from 'next/link'

import PageWrapper from '@/components/layout/PageWrapper'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { useState } from 'react'

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    enableNewRegistrations: true,
    requireMechanicVerification: true,
  })

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <PageWrapper 
      title="System Settings" 
      description="Configure platform-wide settings and system parameters."
    >
      <div className="mx-auto max-w-2xl space-y-6">
        <Card className="p-6">
          <h2 className="mb-4 text-xl font-bold text-[#111827]">System Configuration</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="font-semibold text-[#111827]">Maintenance Mode</label>
                <p className="text-sm text-[#7C7767]">Prevent new requests when enabled</p>
              </div>
              <input 
                type="checkbox" 
                checked={settings.maintenanceMode}
                onChange={() => handleToggle('maintenanceMode')}
                className="w-4 h-4"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="font-semibold text-[#111827]">Enable New Registrations</label>
                <p className="text-sm text-[#7C7767]">Allow new users to register</p>
              </div>
              <input 
                type="checkbox" 
                checked={settings.enableNewRegistrations}
                onChange={() => handleToggle('enableNewRegistrations')}
                className="w-4 h-4"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="font-semibold text-[#111827]">Require Mechanic Verification</label>
                <p className="text-sm text-[#7C7767]">Manual approval for mechanics</p>
              </div>
              <input 
                type="checkbox" 
                checked={settings.requireMechanicVerification}
                onChange={() => handleToggle('requireMechanicVerification')}
                className="w-4 h-4"
              />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 text-xl font-bold text-[#111827]">Database & Backup</h2>
          <div className="space-y-4">
            <Button variant="outline" className="w-full">View Database Stats</Button>
            <Button variant="outline" className="w-full">Trigger Backup</Button>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 text-xl font-bold text-[#111827]">Platform Security</h2>
          <div className="space-y-4">
            <Button variant="outline" className="w-full">View Audit Log</Button>
            <Button variant="outline" className="w-full">Manage API Keys</Button>
            <Button variant="outline" className="w-full">View Security Incidents</Button>
            <Link href="/dashboard/admin/reviews" className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#111827] text-sm font-semibold text-[#F3F4F6]">
              Review pending edits
            </Link>
          </div>
        </Card>
      </div>
    </PageWrapper>
  )
}
