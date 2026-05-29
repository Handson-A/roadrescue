'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import PageWrapper from '@/components/layout/PageWrapper'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import Badge from '@/components/ui/Badge'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { User, Mail, Phone, CarFront, BadgeCheck, Shield, MapPin } from 'lucide-react'

export default function DriverAccountPage() {
  const { user, profile } = useAuth()
  const [driverProfile, setDriverProfile] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: '',
    vehicleColor: '',
    vehiclePlate: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    homeArea: '',
  })

  useEffect(() => {
    if (!user?.id) return

    let mounted = true

    async function loadDriverProfile() {
      const supabase = createClient()
      const { data } = await supabase
        .from('driver_profiles')
        .select('vehicle_make, vehicle_model, vehicle_year, vehicle_color, vehicle_plate, emergency_contact_name, emergency_contact_phone, home_area')
        .eq('user_id', user.id)
        .single()

      if (mounted) {
        setDriverProfile(data || null)
      }
    }

    loadDriverProfile()

    return () => {
      mounted = false
    }
  }, [user?.id])

  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile?.full_name || '',
        email: profile?.email || '',
        phone: profile?.phone || '',
        vehicleMake: driverProfile?.vehicle_make || '',
        vehicleModel: driverProfile?.vehicle_model || '',
        vehicleYear: driverProfile?.vehicle_year || '',
        vehicleColor: driverProfile?.vehicle_color || '',
        vehiclePlate: driverProfile?.vehicle_plate || '',
        emergencyContactName: driverProfile?.emergency_contact_name || '',
        emergencyContactPhone: driverProfile?.emergency_contact_phone || '',
        homeArea: driverProfile?.home_area || '',
      })
    }
  }, [profile, driverProfile])

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const supabase = createClient()

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.fullName,
          phone: formData.phone,
        })
        .eq('id', user?.id)

      if (profileError) throw profileError

      const payload = {
        vehicle_make: formData.vehicleMake.trim() || null,
        vehicle_model: formData.vehicleModel.trim() || null,
        vehicle_year: formData.vehicleYear ? Number.parseInt(formData.vehicleYear, 10) || null : null,
        vehicle_color: formData.vehicleColor.trim() || null,
        vehicle_plate: formData.vehiclePlate.trim() || null,
        emergency_contact_name: formData.emergencyContactName.trim() || null,
        emergency_contact_phone: formData.emergencyContactPhone.trim() || null,
        home_area: formData.homeArea.trim() || null,
      }

      const { data: existingDriver, error: readError } = await supabase
        .from('driver_profiles')
        .select('user_id')
        .eq('user_id', user?.id)
        .single()

      if (readError && readError.code !== 'PGRST116') throw readError

      if (existingDriver) {
        const { error: updateError } = await supabase
          .from('driver_profiles')
          .update(payload)
          .eq('user_id', user?.id)

        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase
          .from('driver_profiles')
          .insert({ user_id: user?.id, ...payload })

        if (insertError) throw insertError
      }

      setDriverProfile(payload)
      toast.success('Profile updated successfully')
      setIsEditing(false)
    } catch (error) {
      toast.error(error.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  if (!profile) {
    return <PageWrapper title="Driver Profile"><div className="flex items-center justify-center py-12"><Spinner /></div></PageWrapper>
  }

  return (
    <PageWrapper title="Driver Profile" description="Editable personal details, verification-gated vehicle records, and locked trust data.">
      <div className="mx-auto max-w-4xl space-y-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <User size={20} className="text-[#FFD700]" />
              Fully Editable Now
            </h2>
            {!isEditing ? (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button size="sm" loading={loading} onClick={handleSave}>
                  Save
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-xs font-mono font-black uppercase tracking-[0.18em] text-[#7C7767]">Display Name</label>
              {isEditing ? (
                <Input value={formData.fullName} onChange={(e) => handleChange('fullName', e.target.value)} placeholder="Your full name" />
              ) : (
                <p className="font-medium text-[#111827]">{formData.fullName || 'Not set'}</p>
              )}
            </div>

            <div>
              <label className="mb-2 flex items-center gap-2 text-xs font-mono font-black uppercase tracking-[0.18em] text-[#7C7767]">
                <Mail size={14} /> Email
              </label>
              <p className="font-medium text-[#111827]">{formData.email || 'Not set'}</p>
              <p className="mt-1 text-xs text-[#7C7767]">Email cannot be changed</p>
            </div>

            <div>
              <label className="mb-2 flex items-center gap-2 text-xs font-mono font-black uppercase tracking-[0.18em] text-[#7C7767]">
                <Phone size={14} /> Phone Number
              </label>
              {isEditing ? (
                <Input value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} placeholder="+233..." />
              ) : (
                <p className="font-medium text-[#111827]">{formData.phone || 'Not set'}</p>
              )}
              <p className="mt-1 text-xs text-[#7C7767]">Requires OTP if changed</p>
            </div>

            <div>
              <label className="mb-2 block text-xs font-mono font-black uppercase tracking-[0.18em] text-[#7C7767]">Home / Work Location</label>
              {isEditing ? (
                <Input value={formData.homeArea} onChange={(e) => handleChange('homeArea', e.target.value)} placeholder="Accra, Tema, Kumasi..." />
              ) : (
                <p className="font-medium text-[#111827]">{formData.homeArea || 'Not set'}</p>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="mb-6 flex items-center gap-2 text-xl font-bold">
            <CarFront size={20} className="text-[#FFD700]" />
            Editable but Requires Verification
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#6E634B]">Make</label>
              {isEditing ? <Input value={formData.vehicleMake} onChange={(e) => handleChange('vehicleMake', e.target.value)} placeholder="Toyota" /> : <p className="font-medium text-[#111827]">{formData.vehicleMake || 'Not set'}</p>}
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#6E634B]">Model</label>
              {isEditing ? <Input value={formData.vehicleModel} onChange={(e) => handleChange('vehicleModel', e.target.value)} placeholder="Camry" /> : <p className="font-medium text-[#111827]">{formData.vehicleModel || 'Not set'}</p>}
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#6E634B]">Year</label>
              {isEditing ? <Input type="number" value={formData.vehicleYear} onChange={(e) => handleChange('vehicleYear', e.target.value)} placeholder="2020" /> : <p className="font-medium text-[#111827]">{formData.vehicleYear || 'Not set'}</p>}
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#6E634B]">Color</label>
              {isEditing ? <Input value={formData.vehicleColor} onChange={(e) => handleChange('vehicleColor', e.target.value)} placeholder="White" /> : <p className="font-medium text-[#111827]">{formData.vehicleColor || 'Not set'}</p>}
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#6E634B]">Plate Number</label>
              {isEditing ? <Input value={formData.vehiclePlate} onChange={(e) => handleChange('vehiclePlate', e.target.value)} placeholder="GR-2847-21" /> : <p className="font-medium text-[#111827]">{formData.vehiclePlate || 'Not set'}</p>}
              <p className="mt-1 text-xs text-[#7C7767]">Changes may be flagged for review</p>
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#6E634B]">Vehicle fingerprint</label>
              <p className="font-medium text-[#111827]">Make, model, year, color, and plate are used for dispatch matching.</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="mb-6 flex items-center gap-2 text-xl font-bold">
            <Shield size={20} className="text-[#FFD700]" />
            Fully Editable Contact Details
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#6E634B]">Contact Name</label>
              {isEditing ? <Input value={formData.emergencyContactName} onChange={(e) => handleChange('emergencyContactName', e.target.value)} placeholder="Jane Doe" /> : <p className="font-medium text-[#111827]">{formData.emergencyContactName || 'Not set'}</p>}
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#6E634B]">Contact Phone</label>
              {isEditing ? <Input value={formData.emergencyContactPhone} onChange={(e) => handleChange('emergencyContactPhone', e.target.value)} placeholder="+233..." /> : <p className="font-medium text-[#111827]">{formData.emergencyContactPhone || 'Not set'}</p>}
            </div>
          </div>

          {driverProfile?.vehicle_plate && (
            <div className="mt-5 rounded-2xl border border-[#7C7767]/25 bg-[#F3F4F6] px-4 py-3">
              <p className="flex items-center gap-2 text-sm font-semibold text-[#111827]">
                <BadgeCheck size={16} /> Saved vehicle profile
              </p>
              <p className="mt-1 text-xs text-[#7C7767]">Your default vehicle details will prefill future rescue requests.</p>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
            <Shield size={20} className="text-[#FFD700]" />
            Locked Trust Records
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6E634B]">User ID</label>
              <p className="mt-1 text-sm text-[#2D271C]">{profile?.id || '—'}</p>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6E634B]">Account status</label>
              <p className="mt-1 text-sm text-[#2D271C]">{profile?.status || 'active'}</p>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6E634B]">Registered at</label>
              <p className="mt-1 text-sm text-[#2D271C]">{profile?.created_at ? new Date(profile.created_at).toLocaleString() : '—'}</p>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6E634B]">Incident history</label>
              <p className="mt-1 text-sm text-[#2D271C]">Immutable operational history lives in rescue_requests.</p>
            </div>
          </div>
        </Card>
      </div>
    </PageWrapper>
  )
}