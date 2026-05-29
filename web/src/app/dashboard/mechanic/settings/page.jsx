'use client'

import { useEffect, useState } from 'react'

import { useAuth } from '@/hooks/useAuth'
import PageWrapper from '@/components/layout/PageWrapper'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import toast from 'react-hot-toast'

export default function MechanicSettingsPage() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [requestLoading, setRequestLoading] = useState(false)
  const [preferences, setPreferences] = useState({
    theme: 'system',
    preferred_language: 'en',
    notification_preferences: { jobAlerts: true, messageAlerts: true, push: true },
    communication_preferences: [],
    home_location_label: '',
    work_location_label: '',
    bio: '',
    secondary_phone: '',
  })
  const [changeRequest, setChangeRequest] = useState({
    business_name: '',
    specializations: '',
    service_radius_km: '',
    license_number: '',
    reason: '',
  })

  useEffect(() => {
    let mounted = true

    async function loadPreferences() {
      const response = await fetch('/api/profile/preferences', { cache: 'no-store' })
      const payload = await response.json()

      if (!mounted || !response.ok || !payload.preferences) return

      setPreferences({
        theme: payload.preferences.theme || 'system',
        preferred_language: payload.preferences.preferred_language || 'en',
        notification_preferences: payload.preferences.notification_preferences || { jobAlerts: true, messageAlerts: true, push: true },
        communication_preferences: payload.preferences.communication_preferences || [],
        home_location_label: payload.preferences.home_location_label || '',
        work_location_label: payload.preferences.work_location_label || '',
        bio: payload.preferences.bio || '',
        secondary_phone: payload.preferences.secondary_phone || '',
      })
    }

    loadPreferences()
    return () => { mounted = false }
  }, [])

  const updatePreference = (field, value) => {
    setPreferences((prev) => ({ ...prev, [field]: value }))
  }

  const toggleNotification = (field) => {
    setPreferences((prev) => ({
      ...prev,
      notification_preferences: {
        ...prev.notification_preferences,
        [field]: !prev.notification_preferences?.[field],
      },
    }))
  }

  const toggleCommunication = (value) => {
    setPreferences((prev) => ({
      ...prev,
      communication_preferences: prev.communication_preferences.includes(value)
        ? prev.communication_preferences.filter((item) => item !== value)
        : [...prev.communication_preferences, value],
    }))
  }

  const handlePreferenceSave = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/profile/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      })

      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Failed to save preferences')

      toast.success('Preferences saved')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const submitChangeRequest = async () => {
    setRequestLoading(true)
    try {
      const response = await fetch('/api/profile/change-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'mechanic',
          target_table: 'mechanic_profiles',
          field_key: 'business_name',
          old_value: null,
          new_value: {
            business_name: changeRequest.business_name,
            specializations: changeRequest.specializations.split(',').map((item) => item.trim()).filter(Boolean),
            service_radius_km: Number(changeRequest.service_radius_km) || null,
            license_number: changeRequest.license_number || null,
          },
          reason: changeRequest.reason,
        }),
      })

      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Failed to submit review request')

      toast.success('Change request submitted for review')
      setChangeRequest({ business_name: '', specializations: '', service_radius_km: '', license_number: '', reason: '' })
    } catch (error) {
      toast.error(error.message)
    } finally {
      setRequestLoading(false)
    }
  }

  return (
    <PageWrapper 
      title="Settings" 
      description="Persist preferences now, and route sensitive mechanic edits through review."
    >
      <div className="mx-auto max-w-2xl space-y-6">
        <Card className="p-6">
          <h2 className="mb-4 text-xl font-bold text-[#111827]">Persistent Preferences</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Theme" value={preferences.theme} onChange={(e) => updatePreference('theme', e.target.value)} placeholder="system" />
            <Input label="Preferred language" value={preferences.preferred_language} onChange={(e) => updatePreference('preferred_language', e.target.value)} placeholder="en" />
            <Input label="Secondary phone" value={preferences.secondary_phone} onChange={(e) => updatePreference('secondary_phone', e.target.value)} placeholder="+233..." />
            <Input label="Home base" value={preferences.home_location_label} onChange={(e) => updatePreference('home_location_label', e.target.value)} placeholder="Workshop area" />
            <Input label="Work location" value={preferences.work_location_label} onChange={(e) => updatePreference('work_location_label', e.target.value)} placeholder="Service area" />
          </div>
          <div className="mt-4">
            <Textarea label="Bio / about" value={preferences.bio} onChange={(e) => updatePreference('bio', e.target.value)} rows={4} placeholder="Short mechanic profile summary" />
          </div>
          <div className="mt-4 flex gap-2">
            {['jobAlerts', 'messageAlerts', 'push'].map((field) => (
              <button key={field} type="button" onClick={() => toggleNotification(field)} className={`rounded-full px-4 py-2 text-sm font-semibold ${preferences.notification_preferences?.[field] ? 'bg-[#FFD700] text-[#111827]' : 'bg-[#F3F4F6] text-[#7C7767]'}`}>
                {field}
              </button>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {['call', 'sms', 'whatsapp'].map((field) => (
              <button key={field} type="button" onClick={() => toggleCommunication(field)} className={`rounded-full px-4 py-2 text-sm font-semibold ${preferences.communication_preferences.includes(field) ? 'bg-[#111827] text-[#F3F4F6]' : 'bg-[#F3F4F6] text-[#7C7767]'}`}>
                {field}
              </button>
            ))}
          </div>
          <Button className="mt-6 w-full" loading={loading} onClick={handlePreferenceSave}>Save preferences</Button>
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 text-xl font-bold text-[#111827]">Semi-Locked Change Requests</h2>
          <div className="space-y-4">
            <Input label="Business name" value={changeRequest.business_name} onChange={(e) => setChangeRequest((prev) => ({ ...prev, business_name: e.target.value }))} placeholder="Workshop name" />
            <Input label="Specializations" value={changeRequest.specializations} onChange={(e) => setChangeRequest((prev) => ({ ...prev, specializations: e.target.value }))} placeholder="Engine repair, tires..." />
            <Input label="Service radius (km)" type="number" value={changeRequest.service_radius_km} onChange={(e) => setChangeRequest((prev) => ({ ...prev, service_radius_km: e.target.value }))} placeholder="25" />
            <Input label="License number" value={changeRequest.license_number} onChange={(e) => setChangeRequest((prev) => ({ ...prev, license_number: e.target.value }))} placeholder="MECH-2048" />
            <Textarea label="Reason for review" value={changeRequest.reason} onChange={(e) => setChangeRequest((prev) => ({ ...prev, reason: e.target.value }))} rows={3} placeholder="Explain why this should be approved" />
            <Button className="w-full" loading={requestLoading} onClick={submitChangeRequest}>Submit for admin review</Button>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 text-xl font-bold text-[#111827]">Security</h2>
          <div className="space-y-4">
            <Button variant="outline" className="w-full">Change Password</Button>
            <Button variant="outline" className="w-full">View Active Sessions</Button>
          </div>
        </Card>
      </div>
    </PageWrapper>
  )
}
