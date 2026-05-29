'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import PageWrapper from '@/components/layout/PageWrapper'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Spinner from '@/components/ui/Spinner'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { Building2, MapPin, Wrench, Award, Clock, DollarSign } from 'lucide-react'

export default function MechanicAccountPage() {
  const { user, profile } = useAuth()
  const [mechanicProfile, setMechanicProfile] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
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
  })

  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile?.full_name || '',
        email: profile?.email || '',
        phone: profile?.phone || '',
        businessName: mechanicProfile?.business_name || '',
        specializations: Array.isArray(mechanicProfile?.specializations)
          ? mechanicProfile.specializations.join(', ')
          : '',
        serviceArea: mechanicProfile?.location_label || '',
        serviceRadius: mechanicProfile?.service_radius_km || '',
        hourlyRate: mechanicProfile?.hourly_rate || '',
        currentStatus: mechanicProfile?.current_status || 'offline',
        yearsExperience: mechanicProfile?.years_experience || '',
        licenseNumber: mechanicProfile?.license_number || '',
        licenseExpiry: mechanicProfile?.license_expiry || '',
        availability: Boolean(mechanicProfile?.is_available),
      })
    }
  }, [profile, mechanicProfile])

  useEffect(() => {
    if (!user?.id) return

    let mounted = true

    async function loadMechanicProfile() {
      const supabase = createClient()
      const { data } = await supabase
        .from('mechanic_profiles')
        .select('business_name, specializations, location_label, service_radius_km, hourly_rate, current_status, years_experience, license_number, license_expiry, is_available, verification_status, verified_at, rating_avg, total_jobs_completed, total_earnings, average_rating, created_at')
        .eq('user_id', user.id)
        .single()

      if (mounted) {
        setMechanicProfile(data || null)
      }
    }

    loadMechanicProfile()

    return () => {
      mounted = false
    }
  }, [user?.id])

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.fullName,
          phone: formData.phone,
        })
        .eq('id', user?.id)

      if (error) throw error

      const { error: mechanicError } = await supabase
        .from('mechanic_profiles')
        .update({
          license_number: formData.licenseNumber || null,
          license_expiry: formData.licenseExpiry || null,
          years_experience: formData.yearsExperience ? parseInt(formData.yearsExperience, 10) || 0 : 0,
          service_radius_km: formData.serviceRadius ? parseInt(formData.serviceRadius, 10) || null : null,
          hourly_rate: formData.hourlyRate ? Number(formData.hourlyRate) || null : null,
          current_status: formData.currentStatus || (formData.availability ? 'online' : 'offline'),
          specializations: formData.specializations
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
          business_name: formData.businessName || null,
          location_label: formData.serviceArea || null,
          is_available: formData.availability,
        })
        .eq('user_id', user?.id)

      if (mechanicError) throw mechanicError

      setMechanicProfile({
        business_name: formData.businessName,
        specializations: formData.specializations
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        location_label: formData.serviceArea,
        service_radius_km: formData.serviceRadius,
        hourly_rate: formData.hourlyRate,
        current_status: formData.currentStatus,
        service_radius_km: formData.serviceRadius,
        hourly_rate: formData.hourlyRate,
        current_status: formData.currentStatus,
        years_experience: formData.yearsExperience,
        license_number: formData.licenseNumber,
        license_expiry: formData.licenseExpiry,
        is_available: formData.availability,
      })
      
      toast.success('Profile updated successfully')
      setIsEditing(false)
    } catch (error) {
      toast.error(error.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  if (!profile) {
    return <PageWrapper title="Account"><div className="flex items-center justify-center py-12"><Spinner /></div></PageWrapper>
  }

  return (
    <PageWrapper title="Mechanic Profile" description="Editable workplace details, verification-gated credentials, and locked trust records.">
      <div className="mx-auto max-w-4xl space-y-5">
        <Card className="rounded-xl border-[#D7CCAD] bg-white p-5">
          <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr] items-start">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-2xl border-2 border-[#FFD700] bg-[#F3F4F6]" />
              <div>
                <p className="text-3xl font-black text-[#2D271C]">{formData.fullName || 'Mechanic'}</p>
                <p className="text-sm text-[#6E634B]">{formData.businessName || 'RoadRescue Recovery Specialist'}</p>
                <div className="mt-2 flex gap-2">
                  <Badge label={mechanicProfile?.verification_status || 'pending'} variant={mechanicProfile?.verification_status || 'pending'} />
                  <Badge label={formData.currentStatus || 'offline'} variant="default" />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[#7C7767]/25 bg-[#F3F4F6] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6E634B]">Current status</p>
              <p className="mt-2 text-4xl font-black text-[#2D271C]">{formData.currentStatus || 'offline'}</p>
              <p className="mt-2 text-sm text-[#6E634B]">Availability syncs to dispatch</p>
            </div>

            <div className="md:col-span-2">
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)} className="w-full md:w-auto">
                  Edit Profile
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEditing(false)}
                    className="flex-1 md:flex-initial"
                  >
                    Cancel
                  </Button>
                  <Button 
                    loading={loading}
                    onClick={handleSave}
                    className="flex-1 md:flex-initial"
                  >
                    Save Changes
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="rounded-xl border-[#D7CCAD] bg-white p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6E634B] flex items-center gap-2">
              <Award size={14} /> Trust record
            </p>
            <p className="mt-2 text-4xl font-black text-[#2D271C]">{mechanicProfile?.average_rating ? Number(mechanicProfile.average_rating).toFixed(2) : '—'}</p>
            <p className="mt-1 text-sm text-[#6E634B]">{mechanicProfile?.total_jobs_completed ? `${mechanicProfile.total_jobs_completed} completed rescues` : 'No completed rescues yet'}</p>
          </Card>
          <Card className="rounded-xl border-[#D7CCAD] bg-white p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6E634B] flex items-center gap-2">
              <Clock size={14} /> Verified on
            </p>
            <p className="mt-2 text-4xl font-black text-[#2D271C]">{mechanicProfile?.verified_at ? new Date(mechanicProfile.verified_at).toLocaleDateString() : '—'}</p>
            <p className="mt-1 text-sm text-[#6E634B]">Registration created {mechanicProfile?.created_at ? new Date(mechanicProfile.created_at).toLocaleDateString() : '—'}</p>
          </Card>
        </div>

        <Card className="rounded-xl border-[#D7CCAD] bg-white p-5">
          <h2 className="text-xl font-semibold text-[#2D271C] flex items-center gap-2 mb-4">
            <Building2 size={20} className="text-[#FFD700]" />
            Fully Editable Now
          </h2>
          {isEditing ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Availability status"
                  value={formData.currentStatus}
                  onChange={(e) => handleChange('currentStatus', e.target.value)}
                  placeholder="online"
                />
                <Input
                  label="Service radius (km)"
                  type="number"
                  value={formData.serviceRadius}
                  onChange={(e) => handleChange('serviceRadius', e.target.value)}
                  placeholder="25"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Hourly rate estimate"
                  type="number"
                  value={formData.hourlyRate}
                  onChange={(e) => handleChange('hourlyRate', e.target.value)}
                  placeholder="50"
                />
                <Input
                  label="Service area"
                  value={formData.serviceArea}
                  onChange={(e) => handleChange('serviceArea', e.target.value)}
                  placeholder="Accra Metropolitan"
                />
              </div>
              <div>
                <Input
                  label="Specialties"
                  value={formData.specializations}
                  onChange={(e) => handleChange('specializations', e.target.value)}
                  placeholder="e.g., Engine repair, Tire replacement, Battery service"
                />
              </div>
              <div>
                <Input
                  label="Years of Experience"
                  type="number"
                  value={formData.yearsExperience}
                  onChange={(e) => handleChange('yearsExperience', e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6E634B]">Availability status</label>
                <p className="mt-1 text-sm text-[#2D271C]">{formData.currentStatus || 'offline'}</p>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6E634B]">Service radius</label>
                <p className="mt-1 text-sm text-[#2D271C]">{formData.serviceRadius || '—'} km</p>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6E634B] flex items-center gap-1">
                  <Wrench size={12} /> Specialties
                </label>
                <p className="mt-1 text-sm text-[#2D271C]">{formData.specializations || 'Not set'}</p>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6E634B] flex items-center gap-1">
                  <MapPin size={12} /> Service area
                </label>
                <p className="mt-1 text-sm text-[#2D271C]">{formData.serviceArea || 'Not set'}</p>
              </div>
            </div>
          )}
        </Card>

        <Card className="rounded-xl border-[#D7CCAD] bg-white p-5">
          <h2 className="text-xl font-semibold text-[#2D271C] mb-4">Editable but Verification-Gated</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6E634B]">Email</label>
              <p className="mt-1 text-sm text-[#2D271C]">{formData.email || 'N/A'}</p>
              <p className="mt-1 text-xs text-[#7C7767]">Cannot be changed</p>
            </div>
            {isEditing ? (
              <Input
                label="Phone"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+233..."
              />
            ) : (
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6E634B]">Phone</label>
                <p className="mt-1 text-sm text-[#2D271C]">{formData.phone || 'Not set'}</p>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6E634B]">License Number</label>
              {isEditing ? (
                <Input
                  value={formData.licenseNumber}
                  onChange={(e) => handleChange('licenseNumber', e.target.value)}
                  placeholder="MECH-2048"
                />
              ) : (
                <p className="mt-1 text-sm text-[#2D271C]">{formData.licenseNumber || 'Not set'}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6E634B]">License Expiry</label>
              {isEditing ? (
                <Input
                  type="date"
                  value={formData.licenseExpiry}
                  onChange={(e) => handleChange('licenseExpiry', e.target.value)}
                />
              ) : (
                <p className="mt-1 text-sm text-[#2D271C]">{formData.licenseExpiry || 'Not set'}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6E634B]">Availability</label>
              {isEditing ? (
                <div className="mt-2 flex items-center gap-3 rounded-2xl border border-[#E0D5B7] bg-[#F8F4EA] px-4 py-3">
                  <button
                    type="button"
                    onClick={() => handleChange('availability', !formData.availability)}
                    className={`h-10 rounded-full px-4 text-sm font-semibold transition ${formData.availability ? 'bg-[#F5D108] text-[#2D271C]' : 'bg-white text-[#6E634B]'}`}
                  >
                    {formData.availability ? 'Available' : 'Offline'}
                  </button>
                  <p className="text-sm text-[#6E634B]">Toggle when you are ready to receive jobs.</p>
                </div>
              ) : (
                <p className="mt-1 text-sm text-[#2D271C]">{formData.availability ? 'Available for dispatch' : 'Offline'}</p>
              )}
            </div>
          </div>
        </Card>

        <Card className="rounded-xl border-[#D7CCAD] bg-white p-5">
          <h2 className="mb-4 text-xl font-semibold text-[#2D271C]">Locked Trust Records</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6E634B]">Verification status</label>
              <p className="mt-1 text-sm text-[#2D271C]">{mechanicProfile?.verification_status || 'pending'}</p>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6E634B]">Total jobs completed</label>
              <p className="mt-1 text-sm text-[#2D271C]">{mechanicProfile?.total_jobs_completed ?? '—'}</p>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6E634B]">Average rating</label>
              <p className="mt-1 text-sm text-[#2D271C]">{mechanicProfile?.average_rating ? Number(mechanicProfile.average_rating).toFixed(2) : '—'}</p>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6E634B]">Verified at</label>
              <p className="mt-1 text-sm text-[#2D271C]">{mechanicProfile?.verified_at ? new Date(mechanicProfile.verified_at).toLocaleString() : '—'}</p>
            </div>
          </div>
        </Card>
      </div>
    </PageWrapper>
  )
}
