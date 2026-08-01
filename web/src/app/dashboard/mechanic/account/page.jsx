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
  Phone, Mail, FileText, CheckCircle2, Sliders, Bell, MessageSquare, Camera, Loader2 
} from 'lucide-react'
import Select from '@/components/ui/Select'
import { normalizeGeoPoint } from '@/lib/utils'

export default function MechanicAccountPage() {
  const { user, profile, setProfile } = useAuth()
  const [mechanicProfile, setMechanicProfile] = useState(null)
  const [completedRescuesCount, setCompletedRescuesCount] = useState(0)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const userIdRef = useRef(user?.id)
  const fileInputRef = useRef(null)
  const docInputRef = useRef(null)
  const [documents, setDocuments] = useState([])
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const [pinningLocation, setPinningLocation] = useState(false)

  // Unified application form schema state instance
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    avatarUrl: '',
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
    theme: 'system',
    preferredLanguage: 'en',
    secondaryPhone: '',
    notificationPreferences: { jobAlerts: true, messageAlerts: true, push: true },
    communicationPreferences: ['call', 'sms'],
    serviceMode: 'mobile',
  })

  useEffect(() => {
    userIdRef.current = user?.id
    if (!userIdRef.current) return

    let mounted = true
    async function loadFullProfile() {
      const currentUserId = userIdRef.current
      const supabase = createClient()
      
      // 1. Fetch authenticated core metadata elements
      const { data: baseProfile } = await supabase
        .from('profiles')
        .select('full_name, email, phone, avatar_url')
        .eq('id', currentUserId)
        .maybeSingle()

      // 2. Fetch specialized workplace fields using verified schema columns
      const { data: mechData } = await supabase
        .from('mechanic_profiles')
        .select('business_name, specializations, location_label, is_available, rating_avg, rating_count, years_experience, verification_status, created_at, service_mode')
        .eq('user_id', currentUserId)
        .maybeSingle()

      // 3. Query centralized application app profile preferences table
      let preferenceData = null
      try {
        const response = await fetch('/api/profile/preferences', { cache: 'no-store' })
        if (response.ok) {
          const payload = await response.json()
          preferenceData = payload.preferences
        }
      } catch (err) {
        console.warn('Preferences repository endpoint fallback initialized:', err)
      }

      // 4. Query completed rescues count
      const { count: completedCount, error: countErr } = await supabase
        .from('rescue_requests')
        .select('*', { count: 'exact', head: true })
        .eq('mechanic_id', currentUserId)
        .eq('status', 'completed')

      if (countErr) {
        console.warn('[COMPLETED RESCUES COUNT FETCH FAULT]:', countErr.message)
      }

      // 5. Fetch current verification documents
      const { data: docsData, error: docsErr } = await supabase
        .from('mechanic_documents')
        .select('id, document_name, file_url, created_at')
        .eq('mechanic_id', currentUserId)
        .order('created_at', { ascending: false })

      if (docsErr) {
        console.warn('[DOCUMENTS FETCH FAULT]:', docsErr.message)
      }

      if (mounted && userIdRef.current) {
        const resolvePhoneNumber = (profileVal, userObj) => {
          const isValidPhone = (val) => {
            if (!val) return false
            const clean = val.toString().trim()
            return clean.length > 0 && !/[a-zA-Z]/.test(clean)
          }
          
          const userMetaPhone = userObj?.user_metadata?.phone
          if (isValidPhone(userMetaPhone)) return userMetaPhone.toString().trim()

          const pPhone = typeof profileVal === 'object' ? profileVal?.phone : profileVal
          if (isValidPhone(pPhone)) return pPhone.toString().trim()

          const userPhone = userObj?.phone
          if (isValidPhone(userPhone)) return userPhone.toString().trim()

          return ''
        }

        setMechanicProfile(mechData || null)
        setCompletedRescuesCount(completedCount || 0)
        setDocuments(docsData || [])

        setFormData((prev) => ({
          ...prev,
          fullName: baseProfile?.full_name || prev.fullName,
          email: baseProfile?.email || user?.email || prev.email,
          phone: resolvePhoneNumber(baseProfile, user),
          avatarUrl: baseProfile?.avatar_url || prev.avatarUrl,
          businessName: mechData?.business_name || '',
          specializations: Array.isArray(mechData?.specializations) ? mechData.specializations.join(', ') : (mechData?.specializations || ''),
          serviceArea: mechData?.location_label || '',
          yearsExperience: mechData?.years_experience || '',
          availability: mechData?.is_available ?? false,
          theme: preferenceData?.theme || 'System',
          preferredLanguage: preferenceData?.preferred_language || 'English',
          secondaryPhone: preferenceData?.secondary_phone || '',
          notificationPreferences: preferenceData?.notification_preferences || { jobAlerts: true, messageAlerts: true, push: true },
          communicationPreferences: preferenceData?.communication_preferences || ['call', 'sms'],
          serviceMode: mechData?.service_mode || 'mobile',
        }))
      }
    }

    loadFullProfile()
    return () => { mounted = false }
  }, [user])

  const handleChange = (field, value) => {
    let cleanValue = value
    if (field === 'phone' || field === 'secondaryPhone') {
      cleanValue = value.replace(/[^0-9+]/g, '')
    }
    setFormData((p) => ({ ...p, [field]: cleanValue }))
  }

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image asset size threshold must be under 2MB')
      return
    }

    try {
      setUploadingAvatar(true)
      const supabase = createClient()
      
      const fileExt = file.name.split('.').pop()
      const filePath = `${user.id}/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id)

      if (updateError) throw updateError

      setProfile({ ...profile, avatar_url: publicUrl })
      setFormData(prev => ({ ...prev, avatarUrl: publicUrl }))
      toast.success('Profile avatar image updated successfully')
    } catch (err) {
      toast.error(err.message || 'Error processing profile image binary stream upload')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleDocumentUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only PDF or Image (PNG, JPG) documents are supported')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Document size must be under 5MB')
      return
    }

    try {
      setUploadingDoc(true)
      const supabase = createClient()

      const fileExt = file.name.split('.').pop()
      const filePath = `${user.id}/${Date.now()}_${file.name}`

      const { error: uploadError } = await supabase.storage
        .from('mechanic-documents')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: docRecord, error: dbError } = await supabase
        .from('mechanic_documents')
        .insert({
          mechanic_id: user.id,
          document_name: file.name,
          file_url: filePath
        })
        .select()
        .single()

      if (dbError) throw dbError

      const { error: profileError } = await supabase
        .from('mechanic_profiles')
        .update({ verification_status: 'pending' })
        .eq('user_id', user.id)

      if (profileError) {
        console.warn('Failed to reset verification_status in mechanic_profiles:', profileError.message)
      }

      const { error: verificationError } = await supabase
        .from('mechanic_verifications')
        .update({ status: 'pending' })
        .eq('mechanic_id', user.id)

      if (verificationError) {
        console.warn('Failed to reset status in mechanic_verifications:', verificationError.message)
      }

      setDocuments(prev => [docRecord, ...prev])
      toast.success('Document uploaded successfully! Profile verification re-queued.')
      
      if (mechanicProfile) {
        setMechanicProfile(prev => ({
          ...prev,
          verification_status: 'pending'
        }))
      }
    } catch (err) {
      toast.error(err.message || 'Failed to upload document')
    } finally {
      setUploadingDoc(false)
      if (docInputRef.current) docInputRef.current.value = ''
    }
  }

  const handleViewDocument = async (fileUrl) => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.storage
        .from('mechanic-documents')
        .createSignedUrl(fileUrl, 300)
      
      if (error) {
        const { data: pubData } = supabase.storage
          .from('mechanic-documents')
          .getPublicUrl(fileUrl)
        window.open(pubData.publicUrl, '_blank')
      } else {
        window.open(data.signedUrl, '_blank')
      }
    } catch (err) {
      toast.error('Failed to resolve document link')
    }
  }

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

  const pinShopLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser')
      return
    }
    setPinningLocation(true)
    const supabase = createClient()
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords
          const { error } = await supabase
            .from('mechanic_profiles')
            .update({
              current_location: `POINT(${longitude} ${latitude})`,
              location_updated_at: new Date().toISOString(),
            })
            .eq('user_id', user?.id)

          if (error) throw error
          
          // Re-fetch mechanic profile locally to display new coordinates
          const { data: updatedProfile } = await supabase
            .from('mechanic_profiles')
            .select('current_location')
            .eq('user_id', user?.id)
            .maybeSingle()
            
          setMechanicProfile((prev) => ({
            ...prev,
            current_location: updatedProfile?.current_location || prev?.current_location
          }))

          toast.success('Shop location pinned successfully!')
        } catch (err) {
          toast.error('Failed to pin shop location: ' + err.message)
        } finally {
          setPinningLocation(false)
        }
      },
      (err) => {
        toast.error('Error getting location: ' + err.message)
        setPinningLocation(false)
      },
      { enableHighAccuracy: true }
    )
  }

  const getUserInitials = () => {
    const name = formData.fullName || profile?.full_name || 'Mechanic'
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: formData.fullName.trim(), phone: formData.phone.trim() })
        .eq('id', user?.id)

      if (profileError) throw profileError

      const { error: mechanicError } = await supabase
         .from('mechanic_profiles')
         .update({
           years_experience: formData.yearsExperience ? parseInt(formData.yearsExperience, 10) || 0 : 0,
           is_available: formData.availability,
           specializations: formData.specializations.split(',').map((s) => s.trim()).filter(Boolean),
           business_name: formData.businessName.trim() || null,
           location_label: formData.serviceArea.trim() || null,
           service_mode: formData.serviceMode,
         })
         .eq('user_id', user?.id)
 
       if (mechanicError) throw mechanicError

      try {
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
      } catch (prefErr) {
        console.warn('Preferences middleware sync bypassed:', prefErr)
      }

      setMechanicProfile((prev) => ({
         ...prev,
         business_name: formData.businessName,
         specializations: formData.specializations.split(',').map((s) => s.trim()).filter(Boolean),
         location_label: formData.serviceArea,
         is_available: formData.availability,
         years_experience: formData.yearsExperience,
         service_mode: formData.serviceMode,
       }))

      toast.success('Profile configurations updated successfully')
      setIsEditing(false)
    } catch (err) {
      toast.error(err?.message || 'Failed to complete configuration synchronization logs')
    } finally {
      setLoading(false)
    }
  }

  if (!profile) return <PageWrapper title="Account"><div className="flex items-center justify-center py-12"><Spinner /></div></PageWrapper>

  return (
    <PageWrapper title="Profile Settings" description="Configure active workplace criteria, review verified deployment metrics, and manage system environment options.">
      <div className="mx-auto max-w-4xl space-y-6 pb-12">

        {/* ================= HERO IDENTITY INTERFACE ================= */}
        <Card className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm relative overflow-hidden">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              
              <div className="relative group cursor-pointer shrink-0" onClick={() => fileInputRef.current?.click()}>
                <div className="h-20 w-20 rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center shadow-inner">
                  {formData.avatarUrl ? (
                    <img src={formData.avatarUrl} alt="Avatar profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-amber-400 text-slate-950 font-black flex items-center justify-center text-xl tracking-tight">
                      {getUserInitials()}
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 bg-slate-950/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {uploadingAvatar ? (
                    <Loader2 size={16} className="text-white animate-spin" />
                  ) : (
                    <Camera size={18} className="text-white" />
                  )}
                </div>
                <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" disabled={uploadingAvatar} />
              </div>

              <div className="min-w-0">
                {isEditing ? (
                  <div className="space-y-1.5">
                    <input 
                      type="text" 
                      value={formData.fullName} 
                      onChange={(e) => handleChange('fullName', e.target.value)}
                      className="text-xl font-black text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1 outline-none focus:border-amber-400 transition-colors" 
                    />
                  </div>
                ) : (
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight truncate">{formData.fullName || 'Service Provider'}</h2>
                )}
                <p className="text-sm font-semibold text-slate-500 mt-0.5 truncate">{formData.businessName || 'Independent Recovery Expert'}</p>
                <div className="mt-2.5 flex items-center gap-2">
                  <Badge label="Profile Active" variant="success" />
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${formData.availability ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'}`}>
                    {formData.availability ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              {!isEditing ? (
                <button onClick={() => setIsEditing(true)} className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-black uppercase tracking-wider text-slate-800 shadow-xs hover:bg-slate-50 transition-all active:scale-98">
                  Edit Parameters
                </button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsEditing(false)} className="rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider border-slate-200">Cancel</Button>
                  <Button loading={loading} onClick={handleSave} className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider shadow-xs">Save Configuration</Button>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* ================= TRUST METRICS LEDGER ================= */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5"><Award size={14} className="text-slate-400" /> Trust Scorecard</p>
            <p className="mt-2 text-3xl font-black text-slate-900 tracking-tight">
              {mechanicProfile?.average_rating ? `${Number(mechanicProfile.average_rating).toFixed(2)} / 5.0` : '5.0'}
            </p>
            <p className="mt-1 text-xs font-medium text-slate-500">Aggregated customer evaluation</p>
          </Card>

          <Card className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5"><CheckCircle2 size={14} className="text-slate-400" /> Job Completions</p>
            <p className="mt-2 text-3xl font-black text-slate-900 tracking-tight">{completedRescuesCount}</p>
            <p className="mt-1 text-xs font-medium text-slate-500">Successful corridor rescue logs</p>
          </Card>

          <Card className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5"><Clock size={14} className="text-slate-400" /> Terminal Tenure</p>
            <p className="mt-2 text-3xl font-black text-slate-900 tracking-tight">
              {mechanicProfile?.created_at ? new Date(mechanicProfile.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : 'June 2026'}
            </p>
            <p className="mt-1 text-xs font-medium text-slate-500">Account registrated</p>
          </Card>
        </div>

        {/* ================= WORKPLACE OPTIONS ================= */}
        <Card className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs relative">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-5">
            <Building2 size={16} className="text-amber-400" /> Workplace Parameters
          </h3>

          {isEditing ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Business Registry Name" value={formData.businessName} onChange={(e) => handleChange('businessName', e.target.value)} placeholder="e.g. Accra Pro Garage" />
                <Input label="Years of Active Experience" type="number" value={formData.yearsExperience} onChange={(e) => handleChange('yearsExperience', e.target.value)} placeholder="5" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Hourly Labor Rate (₵)" type="number" value={formData.hourlyRate} onChange={(e) => handleChange('hourlyRate', e.target.value)} placeholder="45" />
                <Input label="Service Range Radius (km)" type="number" value={formData.serviceRadius} onChange={(e) => handleChange('serviceRadius', e.target.value)} placeholder="30" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Primary Dispatch Base Area" value={formData.serviceArea} onChange={(e) => handleChange('serviceArea', e.target.value)} placeholder="e.g. Accra Metropolitan, Greater Accra" />
                <Input label="Specializations (Comma Separated)" value={formData.specializations} onChange={(e) => handleChange('specializations', e.target.value)} placeholder="Towing, Engine Diagnostics, Brake Repair" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2 items-end">
                <Select
                  label="Service Engagement Mode"
                  value={formData.serviceMode}
                  onChange={(e) => handleChange('serviceMode', e.target.value)}
                  options={[
                    { value: 'mobile', label: 'Mobile Responder (Travels to Driver)' },
                    { value: 'fixed_location', label: 'Fixed Location (Driver Brings Vehicle to Shop)' },
                    { value: 'hybrid', label: 'Hybrid Mode (Both Mobile & Shop Operations)' },
                  ]}
                />
              </div>
              {['fixed_location', 'hybrid'].includes(formData.serviceMode) && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-amber-50/50 border border-amber-200/50 rounded-2xl p-4 mt-2">
                  <div className="flex-1">
                    <p className="text-xs font-bold text-amber-900 flex items-center gap-1.5"><MapPin size={14} className="text-amber-500" /> Shop Geo-Coordinates</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {mechanicProfile?.current_location 
                        ? `Pinned Coordinates: ${normalizeGeoPoint(mechanicProfile.current_location)[0].toFixed(6)}, ${normalizeGeoPoint(mechanicProfile.current_location)[1].toFixed(6)}` 
                        : 'No coordinates pinned. Please click the button to set your shop location.'}
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={pinShopLocation}
                    disabled={pinningLocation}
                    className="shrink-0 h-10 px-4 rounded-xl border border-amber-200 bg-white text-xs font-bold uppercase tracking-wider text-amber-800 hover:bg-[#F5F0E0] hover:border-[#BCA86A] transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    {pinningLocation ? (
                      <>
                        <Loader2 size={13} className="animate-spin" /> Pinning...
                      </>
                    ) : (
                      <>
                        <MapPin size={13} /> Pin Current Location
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">Service Area Node</span>
                <p className="mt-1 text-sm font-semibold text-slate-800 flex items-center gap-1.5"><MapPin size={14} className="text-slate-400" /> {formData.serviceArea || 'Not configured'}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">Operational Range</span>
                <p className="mt-1 text-sm font-semibold text-slate-800">{formData.serviceRadius ? `${formData.serviceRadius} km deployment radius` : 'Not configured'}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">Skills & Specialties</span>
                <p className="mt-1 text-sm font-semibold text-slate-800 flex items-center gap-1.5"><Wrench size={14} className="text-slate-400" /> {formData.specializations || 'Not specified'}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">Experience Depth</span>
                <p className="mt-1 text-sm font-semibold text-slate-800">{formData.yearsExperience ? `${formData.yearsExperience} Years Vetted Professional` : 'Not documented'}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">Service Mode</span>
                <p className="mt-1 text-sm font-semibold text-slate-800 capitalize">
                  {formData.serviceMode === 'fixed_location' 
                    ? 'Fixed Location (Shop-Based)' 
                    : formData.serviceMode === 'hybrid' 
                      ? 'Hybrid Mode' 
                      : 'Mobile Responder'}
                </p>
              </div>
              {['fixed_location', 'hybrid'].includes(formData.serviceMode) && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">Shop Coordinates</span>
                  <p className="mt-1 text-sm font-semibold text-slate-800 font-mono">
                    {mechanicProfile?.current_location 
                      ? `${normalizeGeoPoint(mechanicProfile.current_location)[0].toFixed(6)}, ${normalizeGeoPoint(mechanicProfile.current_location)[1].toFixed(6)}` 
                      : 'Not pinned'}
                  </p>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* ================= APPLICATION ENVIRONMENT OPTION SECTIONS ================= */}
        <Card className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs relative">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-5">
            <Sliders size={16} className="text-amber-400" /> App Preferences
          </h3>

          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="System Theme" value={formData.theme} disabled={!isEditing} onChange={(e) => handleChange('theme', e.target.value)} placeholder="system, dark, or light" />
              <Input label="Preferred Language" value={formData.preferredLanguage} disabled={!isEditing} onChange={(e) => handleChange('preferredLanguage', e.target.value)} placeholder="en, fr, etc." />
            </div>

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
                        isChecked ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-xs' : 'bg-slate-50 text-slate-400 border-slate-200 opacity-60'
                      } ${isEditing ? 'active:scale-95 cursor-pointer' : 'cursor-default'}`}
                    >
                      {field.replace('Alerts', ' Alerts')}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2">
                <MessageSquare size={12} className="inline mr-1" /> Active Communication Channels
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
                        isSelected ? 'bg-slate-900 text-white border-slate-900 shadow-xs' : 'bg-slate-50 text-slate-400 border-slate-200 opacity-60'
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

        {/* ================= IDENTITY & CLEARANCE CREDENTIALS ================= */}
        <Card className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <FileText size={16} className="text-amber-500" /> Identity & Clearance Credentials
            </h3>
            <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider border ${
              mechanicProfile?.verification_status === 'approved' || mechanicProfile?.verification_status === 'verified'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200/40'
                : mechanicProfile?.verification_status === 'more_info'
                ? 'bg-amber-50 text-amber-800 border-amber-200/40'
                : 'bg-blue-50 text-blue-800 border-blue-200/40'
            }`}>
              {mechanicProfile?.verification_status === 'approved' || mechanicProfile?.verification_status === 'verified'
                ? 'Verified'
                : mechanicProfile?.verification_status === 'more_info'
                ? 'More Info Requested'
                : mechanicProfile?.verification_status || 'Pending'}
            </span>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed mb-5">
            Upload your official credentials, such as a government-issued ID, business registry certificate, or certified mechanical credentials to authorize operations on the RoadRescue network.
          </p>

          <div className="space-y-4">
            {/* Upload Selector */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={uploadingDoc}
                onClick={() => docInputRef.current?.click()}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 text-xs font-bold uppercase tracking-wider text-white hover:bg-slate-800 disabled:opacity-40"
              >
                {uploadingDoc ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <FileText size={13} />
                )}
                {uploadingDoc ? 'Uploading...' : 'Upload Document'}
              </button>
              <input
                type="file"
                ref={docInputRef}
                onChange={handleDocumentUpload}
                accept="image/*,application/pdf"
                className="hidden"
                disabled={uploadingDoc}
              />
              <span className="text-[10px] font-medium text-slate-400">PDF, PNG, or JPG (Max 5MB)</span>
            </div>

            {/* Document List */}
            {documents.length > 0 ? (
              <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden bg-slate-50/50">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3.5 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-slate-100 text-slate-500">
                        <FileText size={16} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-700 truncate">{doc.document_name}</p>
                        <p className="text-[9px] text-slate-400 font-medium mt-0.5">
                          Uploaded {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : '—'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleViewDocument(doc.file_url)}
                      className="inline-flex h-7 items-center rounded-lg border border-slate-200 bg-white px-2.5 text-[10px] font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-all"
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/20 py-8 text-center">
                <span className="text-slate-300 mb-1">
                  <FileText size={22} />
                </span>
                <p className="text-[11px] text-slate-400 font-semibold">No verification documents uploaded</p>
              </div>
            )}
          </div>
        </Card>

        {/* ================= GATED SECURITY LOG VERIFICATION Snapshots ================= */}
        <Card className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <ShieldAlert size={16} className="text-amber-500" /> Gated System Records
            </h3>
            <span className="text-[10px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200/40 font-bold uppercase tracking-wider">Locked</span>
          </div>

          <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">Secure Core Account Email</span>
              <p className="mt-1 text-sm font-semibold text-slate-400 flex items-center gap-1.5"><Mail size={14} /> {formData.email || '—'}</p>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">Registered Dispatch Phone</span>
              {isEditing ? (
                <div className="mt-1"><Input value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} placeholder="+233..." /></div>
              ) : (
                <p className="mt-1 text-sm font-semibold text-slate-800 flex items-center gap-1.5"><Phone size={14} /> {formData.phone || 'No phone registered'}</p>
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
              <p className="mt-1 text-sm font-semibold text-slate-800 flex items-center gap-1.5"><FileText size={14} className="text-slate-400" /> {formData.licenseNumber || 'Under administrative review'}</p>
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