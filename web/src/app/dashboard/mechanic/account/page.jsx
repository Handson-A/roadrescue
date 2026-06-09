'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import PageWrapper from '@/components/layout/PageWrapper'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Spinner from '@/components/ui/Spinner'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { 
  Building2, MapPin, Wrench, ShieldAlert, Award, Clock, 
  Phone, Mail, FileText, CheckCircle2, Sliders, Bell, MessageSquare 
} from 'lucide-react'

export default function MechanicAccountPage() {
  const { user, profile } = useAuth()
  const [mechanicProfile, setMechanicProfile] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const userIdRef = useRef(user?.id)

  // Combined Form State covering Profile, Mechanic parameters, and App preferences
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    businessName: '',
    specializations: '',
    serviceArea: '',
    serviceRadius: '',
    hourlyRate: '',
    currentStatus: 'offline',
    yearsExperience: '',
    licenseNumber: '',
    licenseExpiry: '',
    availability: false,
    
    // Extracted Persistent Preferences
    theme: 'system',
    preferredLanguage: 'en',
    secondaryPhone: '',
    notificationPreferences: { jobAlerts: true, messageAlerts: true, push: true },
    communicationPreferences: ['call', 'sms'],
  })

  useEffect(() => {
    userIdRef.current = user?.id

    if (!userIdRef.current) return

    let mounted = true
    async function loadFullProfile() {
      const currentUserId = userIdRef.current
      if (!currentUserId) return

      const supabase = createClient()
      
      // 1. Fetch base profile parameters
      const { data: baseProfile } = await supabase
        .from('profiles')
        .select('full_name, email, phone')
        .eq('id', currentUserId)
        .maybeSingle()

      // 2. Fetch mechanic workplace metadata
      const { data: mechData } = await supabase
        .from('mechanic_profiles')
        .select('business_name, specializations, location_label, service_radius_km, hourly_rate, current_status, years_experience, license_number, license_expiry, is_available, verification_status, verified_at, total_jobs_completed, average_rating, created_at')
        .eq('user_id', currentUserId)
        .maybeSingle()

      // 3. Fetch custom persistent preferences endpoint
      let preferenceData = null
      try {
        const response = await fetch('/api/profile/preferences', { cache: 'no-store' })
        if (response.ok) {
          const payload = await response.json()
          preferenceData = payload.preferences
        }
      } catch (err) {
        console.warn('Preferences endpoint fallback active:', err)
      }

      if (mounted && userIdRef.current) {
        setMechanicProfile(mechData || null)

        setFormData((prev) => ({
          ...prev,
          fullName: baseProfile?.full_name || prev.fullName,
          // Fixed: Prioritize profiles table match, fallback directly onto live active user session metadata
          email: baseProfile?.email || user?.email || prev.email,
          phone: baseProfile?.phone || prev.phone,
          businessName: mechData?.business_name || prev.businessName,
          specializations: Array.isArray(mechData?.specializations) ? mechData.specializations.join(', ') : (mechData?.specializations || prev.specializations),
          serviceArea: mechData?.location_label || prev.serviceArea,
          serviceRadius: mechData?.service_radius_km || prev.serviceRadius,
          hourlyRate: mechData?.hourly_rate || prev.hourlyRate,
          currentStatus: mechData?.current_status || prev.currentStatus,
          yearsExperience: mechData?.years_experience || prev.yearsExperience,
          licenseNumber: mechData?.license_number || prev.licenseNumber,
          licenseExpiry: mechData?.license_expiry || prev.licenseExpiry,
          availability: Boolean(mechData?.is_available),
          
          // Map Extracted Preferences with fallback defaults
          theme: preferenceData?.theme || 'system',
          preferredLanguage: preferenceData?.preferred_language || 'en',
          secondaryPhone: preferenceData?.secondary_phone || '',
          notificationPreferences: preferenceData?.notification_preferences || { jobAlerts: true, messageAlerts: true, push: true },
          communicationPreferences: preferenceData?.communication_preferences || ['call', 'sms'],
        }))
      }
    }

    loadFullProfile()
    return () => { mounted = false }
  }, [user?.id, user?.email])

  const handleChange = (field, value) => setFormData((p) => ({ ...p, [field]: value }))

  const toggleNotification = (field) => {
    if (!isEditing) return
    setFormData((prev) => ({
      ...prev,
      notificationPreferences: {
        ...prev.notificationPreferences,
        [field]: !prev.notificationPreferences?.[field],
      },
    }))
  }

  const toggleCommunication = (value) => {
    if (!isEditing) return
    setFormData((prev) => ({
      ...prev,
      communicationPreferences: prev.communicationPreferences.includes(value)
        ? prev.communicationPreferences.filter((item) => item !== value)
        : [...prev.communicationPreferences, value],
    }))
  }

  const getUserInitials = () => {
    const name = formData.fullName || profile?.full_name || 'Mechanic'
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      
      // 1. Persist changes to basic profiles table
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: formData.fullName, phone: formData.phone })
        .eq('id', user?.id)

      if (error) throw error

      // 2. Persist workspace structural details
      const { error: mechanicError } = await supabase
        .from('mechanic_profiles')
        .update({
          years_experience: formData.yearsExperience ? parseInt(formData.yearsExperience, 10) || 0 : 0,
          service_radius_km: formData.serviceRadius ? parseInt(formData.serviceRadius, 10) || null : null,
          hourly_rate: formData.hourlyRate ? Number(formData.hourlyRate) || null : null,
          current_status: formData.currentStatus || (formData.availability ? 'online' : 'offline'),
          specializations: formData.specializations.split(',').map((s) => s.trim()).filter(Boolean),
          business_name: formData.businessName || null,
          location_label: formData.serviceArea || null,
          is_available: formData.availability,
        })
        .eq('user_id', user?.id)

      if (mechanicError) throw mechanicError

      // 3. Persist App preferences to API endpoint structure
      await fetch('/api/profile/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme: formData.theme,
          preferred_language: formData.preferredLanguage,
          secondary_phone: formData.secondaryPhone,
          notification_preferences: formData.notificationPreferences,
          communication_preferences: formData.communicationPreferences,
        }),
      })

      setMechanicProfile((prev) => ({
        ...prev,
        business_name: formData.businessName,
        specializations: formData.specializations.split(',').map((s) => s.trim()).filter(Boolean),
        location_label: formData.serviceArea,
        service_radius_km: formData.serviceRadius,
        hourly_rate: formData.hourlyRate,
        current_status: formData.currentStatus,
        years_experience: formData.yearsExperience,
        is_available: formData.availability,
      }))

      toast.success('Account preferences and parameters updated')
      setIsEditing(false)
    } catch (err) {
      toast.error(err?.message || 'Failed to complete profile synchronization')
    } finally {
      setLoading(false)
    }
  }

  if (!profile) return <PageWrapper title="Account"><div className="flex items-center justify-center py-12"><Spinner /></div></PageWrapper>

  return (
    <PageWrapper title="Profile Settings" description="Configure active workplace criteria, review verified deployment metrics, and manage system environment options.">
      <div className="mx-auto max-w-4xl space-y-6 pb-12">

        {/* ================= HERO IDENTITY INTERFACE ================= */}
        <Card className="rounded-2xl border-slate-200 bg-white p-6 shadow-sm relative overflow-hidden">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="h-20 w-20 rounded-2xl object-cover border-2 border-[#FFD700]" />
              ) : (
                <div className="h-20 w-20 rounded-2xl bg-[#FFD700] flex items-center justify-center font-black text-slate-900 text-2xl shadow-inner tracking-tight shrink-0">
                  {getUserInitials()}
                </div>
              )}
              <div className="min-w-0">
                {isEditing ? (
                  <div className="space-y-1.5">
                    <input 
                      type="text" 
                      value={formData.fullName} 
                      onChange={(e) => handleChange('fullName', e.target.value)}
                      className="text-xl font-black text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 outline-none focus:border-[#FFD700]" 
                    />
                  </div>
                ) : (
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight truncate">{formData.fullName || 'Service Provider'}</h2>
                )}
                <p className="text-sm font-semibold text-slate-500 mt-0.5 truncate">{formData.businessName || 'Independent Recovery Expert'}</p>
                <div className="mt-2.5 flex items-center gap-2">
                  <Badge label={mechanicProfile?.verification_status || 'Pending Verification'} variant={mechanicProfile?.verification_status || 'pending'} />
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${formData.availability ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'}`}>
                    {formData.availability ? 'Active in Pool' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)} className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-slate-900 font-bold uppercase tracking-wider text-xs px-5 py-2.5 rounded-xl transition-all">
                  Edit Profile Parameters
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsEditing(false)} className="rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider border-slate-200">Cancel</Button>
                  <Button loading={loading} onClick={handleSave} className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider">Save Configuration</Button>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* ================= READONLY LOCKED TRUST STATS GRID ================= */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="rounded-2xl border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5"><Award size={14} className="text-slate-400" /> Trust Rating</p>
            <p className="mt-2 text-3xl font-black text-slate-900 tracking-tight">
              {mechanicProfile?.average_rating ? `${Number(mechanicProfile.average_rating).toFixed(2)} / 5.0` : '—'}
            </p>
            <p className="mt-1 text-xs font-medium text-slate-500">Aggregated customer scorecard</p>
          </Card>

          <Card className="rounded-2xl border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5"><CheckCircle2 size={14} className="text-slate-400" /> Job Completions</p>
            <p className="mt-2 text-3xl font-black text-slate-900 tracking-tight">{mechanicProfile?.total_jobs_completed ?? '0'}</p>
            <p className="mt-1 text-xs font-medium text-slate-500">Successful corridor rescue logs</p>
          </Card>

          <Card className="rounded-2xl border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5"><Clock size={14} className="text-slate-400" /> System Age</p>
            <p className="mt-2 text-3xl font-black text-slate-900 tracking-tight">
              {mechanicProfile?.created_at ? new Date(mechanicProfile.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : '—'}
            </p>
            <p className="mt-1 text-xs font-medium text-slate-500">Account registration timestamp</p>
          </Card>
        </div>

        {/* ================= EDITABLE BLOCK: WORKPLACE OPTIONS ================= */}
        <Card className="rounded-2xl border-slate-200 bg-white p-6 shadow-sm relative">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-5">
            <Building2 size={16} className="text-[#FFD700]" /> Workplace Parameters
          </h3>

          {isEditing ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Business Registry Name" value={formData.businessName} onChange={(e) => handleChange('businessName', e.target.value)} placeholder="e.g. Accra Pro Overhaul Garage" />
                <Input label="Years of Active Experience" type="number" value={formData.yearsExperience} onChange={(e) => handleChange('yearsExperience', e.target.value)} placeholder="5" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Hourly Rate Assessment ($)" type="number" value={formData.hourlyRate} onChange={(e) => handleChange('hourlyRate', e.target.value)} placeholder="45" />
                <Input label="Service Radius Coverage (km)" type="number" value={formData.serviceRadius} onChange={(e) => handleChange('serviceRadius', e.target.value)} placeholder="30" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Primary Dispatch Area" value={formData.serviceArea} onChange={(e) => handleChange('serviceArea', e.target.value)} placeholder="e.g. Accra Metropolitan, Greater Accra" />
                <Input label="Specializations (Comma Separated)" value={formData.specializations} onChange={(e) => handleChange('specializations', e.target.value)} placeholder="Towing, Engine Diagnostics, Battery Jump" />
              </div>
            </div>
          ) : (
            <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">Service Area Node</span>
                <p className="mt-1 text-sm font-semibold text-slate-800 flex items-center gap-1.5"><MapPin size={14} className="text-slate-400" /> {formData.serviceArea || 'Not set'}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">Operational Range</span>
                <p className="mt-1 text-sm font-semibold text-slate-800">{formData.serviceRadius ? `${formData.serviceRadius} km response radius` : 'Not configured'}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">Skills & Specialties</span>
                <p className="mt-1 text-sm font-semibold text-slate-800 flex items-center gap-1.5"><Wrench size={14} className="text-slate-400" /> {formData.specializations || 'Not specified'}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">Experience Depth</span>
                <p className="mt-1 text-sm font-semibold text-slate-800">{formData.yearsExperience ? `${formData.yearsExperience} Years Professional` : 'Not documented'}</p>
              </div>
            </div>
          )}
        </Card>

        {/* ================= INTEGRATED BLOCK: PERSISTENT PREFERENCES ================= */}
        <Card className="rounded-2xl border-slate-200 bg-white p-6 shadow-sm relative">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-5">
            <Sliders size={16} className="text-[#FFD700]" /> App Preferences
          </h3>

          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input 
                label="System Theme" 
                value={formData.theme} 
                disabled={!isEditing} 
                onChange={(e) => handleChange('theme', e.target.value)} 
                placeholder="system, dark, or light" 
              />
              <Input 
                label="Preferred Language" 
                value={formData.preferredLanguage} 
                disabled={!isEditing} 
                onChange={(e) => handleChange('preferredLanguage', e.target.value)} 
                placeholder="en, fr, etc." 
              />
            </div>

            {/* Notification Alert Toggles */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2">
                <Bell size={12} className="inline mr-1" /> Alert Dispatch Routing Toggles
              </span>
              <div className="flex flex-wrap gap-2">
                {['jobAlerts', 'messageAlerts', 'push'].map((field) => {
                  const isChecked = formData.notificationPreferences?.[field]
                  return (
                    <button
                      key={field}
                      type="button"
                      disabled={!isEditing}
                      onClick={() => toggleNotification(field)}
                      className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider border transition-all ${
                        isChecked 
                          ? 'bg-[#FFD700] text-slate-900 border-[#FFD700] shadow-sm' 
                          : 'bg-slate-50 text-slate-400 border-slate-200 opacity-60'
                      } ${isEditing ? 'active:scale-95 cursor-pointer' : 'cursor-default'}`}
                    >
                      {field.replace('Alerts', ' Alerts')}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Communication Preference Toggles */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2">
                <MessageSquare size={12} className="inline mr-1" /> Active Comms Channels
              </span>
              <div className="flex flex-wrap gap-2">
                {['call', 'sms', 'whatsapp'].map((channel) => {
                  const isSelected = formData.communicationPreferences.includes(channel)
                  return (
                    <button
                      key={channel}
                      type="button"
                      disabled={!isEditing}
                      onClick={() => toggleCommunication(channel)}
                      className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider border transition-all ${
                        isSelected 
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm' 
                          : 'bg-slate-50 text-slate-400 border-slate-200 opacity-60'
                      } ${isEditing ? 'active:scale-95 cursor-pointer' : 'cursor-default'}`}
                    >
                      {channel}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </Card>

        {/* ================= VERIFICATION GATE DATA ================= */}
        <Card className="rounded-2xl border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <ShieldAlert size={16} className="text-amber-500" /> Gated System Records
            </h3>
            <span className="text-[10px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200/40 font-bold uppercase tracking-wider">Locked Verification Vector</span>
          </div>

          <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">Secure Core Account Email</span>
              <p className="mt-1 text-sm font-semibold text-slate-500 flex items-center gap-1.5"><Mail size={14} /> {formData.email || 'N/A'}</p>
              <p className="mt-0.5 text-[10px] text-slate-400">Core system email parameters cannot be modified.</p>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">Registered Dispatch Phone</span>
              {isEditing ? (
                <div className="mt-1"><Input value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} placeholder="+233..." /></div>
              ) : (
                <p className="mt-1 text-sm font-semibold text-slate-800 flex items-center gap-1.5"><Phone size={14} /> {formData.phone || 'No phone profile synced'}</p>
              )}
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">Backup Communications Line</span>
              {isEditing ? (
                <div className="mt-1"><Input value={formData.secondaryPhone} onChange={(e) => handleChange('secondaryPhone', e.target.value)} placeholder="Backup phone..." /></div>
              ) : (
                <p className="mt-1 text-sm font-semibold text-slate-800 flex items-center gap-1.5"><Phone size={14} className="text-slate-400" /> {formData.secondaryPhone || 'Not set'}</p>
              )}
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">Regulatory License Frame</span>
              <p className="mt-1 text-sm font-semibold text-slate-800 flex items-center gap-1.5"><FileText size={14} className="text-slate-400" /> {formData.licenseNumber || 'Unset / Under review'}</p>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">Credential Expiration Timestamp</span>
              <p className="mt-1 text-sm font-semibold text-slate-800">{formData.licenseExpiry ? new Date(formData.licenseExpiry).toLocaleDateString() : '—'}</p>
            </div>
          </div>
        </Card>
      </div>
    </PageWrapper>
  )
}