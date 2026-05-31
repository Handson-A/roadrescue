'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { User, Mail, Phone, CarFront, BadgeCheck, Shield, ArrowLeft } from 'lucide-react'

export default function DriverAccountPage() {
  const { user, profile } = useAuth()
  const [driverProfile, setDriverProfile] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [dataInitialized, setDataInitialized] = useState(false)
  
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
    if (!user?.id || !profile || dataInitialized) return

    let mounted = true

    async function loadFullProfile() {
      const supabase = createClient()
      const { data } = await supabase
        .from('driver_profiles')
        .select('vehicle_make, vehicle_model, vehicle_year, vehicle_color, vehicle_plate, emergency_contact_name, emergency_contact_phone, home_area')
        .eq('user_id', user.id)
        .maybeSingle()

      if (mounted) {
        setDriverProfile(data || null)
        setFormData({
          fullName: profile?.full_name || '',
          email: profile?.email || '',
          phone: profile?.phone || '',
          vehicleMake: data?.vehicle_make || '',
          vehicleModel: data?.vehicle_model || '',
          vehicleYear: data?.vehicle_year || '',
          vehicleColor: data?.vehicle_color || '',
          vehiclePlate: data?.vehicle_plate || '',
          emergencyContactName: data?.emergency_contact_name || '',
          emergencyContactPhone: data?.emergency_contact_phone || '',
          homeArea: data?.home_area || '',
        })
        setDataInitialized(true)
      }
    }

    loadFullProfile()

    return () => {
      mounted = false
    }
  }, [user?.id, profile, dataInitialized])

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
        .maybeSingle()

      if (readError) throw readError

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

  if (!profile || !dataInitialized) {
    return (
      <div className="w-full min-h-screen bg-[#FFF8EA] flex items-center justify-center lg:pl-64">
        <div className="text-center space-y-3">
          <Spinner />
          <p className="text-xs font-bold text-[#7C6B44] uppercase tracking-widest animate-pulse">Synchronizing Security Records...</p>
        </div>
      </div>
    )
  }

  return (
    // FIXED: Added lg:pl-64 layout alignment constraint configuration
    <div className="w-full min-h-screen bg-[#FFF8EA] text-[#1F1B10] p-4 sm:p-6 lg:pl-64 flex justify-center items-start pb-24 lg:pb-8">
      <div className="w-full max-w-2xl flex flex-col gap-5">
        
        <div className="flex items-center gap-3 rounded-2xl border border-[#DCCDA9] bg-[#FFF9EF] p-4 shadow-sm">
          <div>
            <h1 className="text-lg font-black tracking-tight text-[#1F1B10]">My Profile</h1>
            <p className="text-xs text-[#7C6B44] font-medium">Manage verification data and emergency links</p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#DCCDA9] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[#E0D5B7] bg-[#FFF9EF] px-4 py-3.5">
            <h2 className="text-sm font-black flex items-center gap-2 text-[#1F1B10]">
              <User size={16} className="text-[#F5D108]" />
              Personal Details
            </h2>
            {!isEditing ? (
              <button onClick={() => setIsEditing(true)} className="rounded-xl border border-[#DCCDA9] bg-white px-4 py-1.5 text-xs font-black uppercase tracking-wider text-[#1F1B10] shadow-sm hover:bg-slate-50">
                Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => setIsEditing(false)} className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-500">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={loading} className="rounded-xl bg-slate-900 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-white shadow-sm hover:bg-slate-800">
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            )}
          </div>

          <div className="p-4 space-y-4">
            <div>
              <label className="mb-1.5 block text-[10px] font-mono font-black uppercase tracking-wider text-[#7C6B44]">Full Display Name</label>
              {isEditing ? (
                <Input value={formData.fullName} onChange={(e) => handleChange('fullName', e.target.value)} placeholder="Your full name" />
              ) : (
                <p className="text-sm font-bold text-[#1F1B10]">{formData.fullName || 'Not configured'}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-mono font-black uppercase tracking-wider text-[#7C6B44]">
                <Mail size={12} /> Registered Email Address
              </label>
              <p className="text-sm font-bold text-slate-500">{formData.email || 'Not configured'}</p>
              <p className="mt-1 text-[10px] font-medium text-slate-400">Security parameter locked to session configuration</p>
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-mono font-black uppercase tracking-wider text-[#7C6B44]">
                <Phone size={12} /> Contact Phone Number
              </label>
              {isEditing ? (
                <Input value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} placeholder="+233..." />
              ) : (
                <p className="text-sm font-bold text-[#1F1B10]">{formData.phone || 'Not configured'}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-[10px] font-mono font-black uppercase tracking-wider text-[#7C6B44]">Primary Operation Base Area</label>
              {isEditing ? (
                <Input value={formData.homeArea} onChange={(e) => handleChange('homeArea', e.target.value)} placeholder="Accra, East Legon, Tema..." />
              ) : (
                <p className="text-sm font-bold text-[#1F1B10]">{formData.homeArea || 'Not configured'}</p>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#DCCDA9] bg-white shadow-sm">
          <div className="border-b border-[#E0D5B7] bg-[#FFF9EF] px-4 py-3.5">
            <h2 className="text-sm font-black flex items-center gap-2 text-[#1F1B10]">
              <CarFront size={16} className="text-[#F5D108]" />
              Vehicle Snapshot Profile
            </h2>
          </div>

          <div className="grid gap-4 p-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold text-[#7C6B44]">Vehicle Make</label>
              {isEditing ? <Input value={formData.vehicleMake} onChange={(e) => handleChange('vehicleMake', e.target.value)} placeholder="Toyota" /> : <p className="text-sm font-bold text-[#1F1B10]">{formData.vehicleMake || '—'}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-[#7C6B44]">Vehicle Model</label>
              {isEditing ? <Input value={formData.vehicleModel} onChange={(e) => handleChange('vehicleModel', e.target.value)} placeholder="Camry" /> : <p className="text-sm font-bold text-[#1F1B10]">{formData.vehicleModel || '—'}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-[#7C6B44]">Production Year</label>
              {isEditing ? <Input type="number" value={formData.vehicleYear} onChange={(e) => handleChange('vehicleYear', e.target.value)} placeholder="2020" /> : <p className="text-sm font-bold text-[#1F1B10]">{formData.vehicleYear || '—'}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-[#7C6B44]">Chassis Color</label>
              {isEditing ? <Input value={formData.vehicleColor} onChange={(e) => handleChange('vehicleColor', e.target.value)} placeholder="White" /> : <p className="text-sm font-bold text-[#1F1B10]">{formData.vehicleColor || '—'}</p>}
            </div>
            <div className="sm:col-span-2 border-t border-slate-100 pt-3">
              <label className="mb-1 block text-xs font-bold text-[#7C6B44]">License Plate Number</label>
              {isEditing ? <Input value={formData.vehiclePlate} onChange={(e) => handleChange('vehiclePlate', e.target.value)} placeholder="GR-2847-21" /> : <p className="text-sm font-mono font-bold text-slate-800">{formData.vehiclePlate || '—'}</p>}
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#DCCDA9] bg-white shadow-sm">
          <div className="border-b border-[#E0D5B7] bg-[#FFF9EF] px-4 py-3.5">
            <h2 className="text-sm font-black flex items-center gap-2 text-[#1F1B10]">
              <Shield size={16} className="text-[#F5D108]" />
              Emergency Contact (SOS Link)
            </h2>
          </div>

          <div className="grid gap-4 p-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold text-[#7C6B44]">Next of Kin Name</label>
              {isEditing ? <Input value={formData.emergencyContactName} onChange={(e) => handleChange('emergencyContactName', e.target.value)} placeholder="Jane Doe" /> : <p className="text-sm font-bold text-[#1F1B10]">{formData.emergencyContactName || '—'}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-[#7C6B44]">SOS Phone Number</label>
              {isEditing ? <Input value={formData.emergencyContactPhone} onChange={(e) => handleChange('emergencyContactPhone', e.target.value)} placeholder="+233..." /> : <p className="text-sm font-bold text-[#1F1B10]">{formData.emergencyContactPhone || '—'}</p>}
            </div>
          </div>

          {driverProfile?.vehicle_plate && (
            <div className="m-4 mt-0 rounded-xl border border-amber-200 bg-[#FFF9EF] p-3 flex items-start gap-2.5">
              <BadgeCheck size={16} className="text-emerald-600 mt-0.5 shrink-0" />
              <p className="text-[11px] font-medium text-slate-600 leading-relaxed">
                <span className="font-bold text-slate-900">Verified System Ledger:</span> Your default vehicle parameters are active and will prefill future assistance dispatches.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}