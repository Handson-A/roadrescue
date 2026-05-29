'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Button from '@/components/ui/Button'
import { signUp, getCurrentUser } from '@/lib/auth'
import { USER_ROLE } from '@/lib/constants'
import { createClient } from '@/lib/supabase/client'

export default function RegisterForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    role: USER_ROLE.DRIVER,
    businessName: '',
    yearsExperience: '',
    serviceArea: '',
    specializations: '',
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: '',
    vehicleColor: '',
    vehiclePlate: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
  })

  const isMechanic = formData.role === USER_ROLE.MECHANIC
  const isDriver = formData.role === USER_ROLE.DRIVER
  const [showOptionalDetails, setShowOptionalDetails] = useState(false)

  // Modified to handle structural side effects safely during the user interaction event
  function updateField(field, value) {
    setFormData((current) => ({ ...current, [field]: value }))
    
    // If the user actively switches their role, reset the details toggle container cleanly
    if (field === 'role') {
      setShowOptionalDetails(false)
    }
  }

  function parseSpecializations(value) {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }

  async function saveMechanicProfile(userId) {
    const supabase = createClient()
    const mechanicPayload = {
      user_id: userId,
      business_name: formData.businessName.trim() || null,
      specializations: parseSpecializations(formData.specializations),
      years_experience: formData.yearsExperience ? Number.parseInt(formData.yearsExperience, 10) || 0 : 0,
      location_label: formData.serviceArea.trim() || null,
      is_available: false,
    }

    const { data: existingMechanic, error: readError } = await supabase
      .from('mechanic_profiles')
      .select('user_id')
      .eq('user_id', userId)
      .single()

    if (readError && readError.code !== 'PGRST116') {
      throw readError
    }

    if (existingMechanic) {
      const { error: updateError } = await supabase
        .from('mechanic_profiles')
        .update(mechanicPayload)
        .eq('user_id', userId)

      if (updateError) throw updateError
      return
    }

    const { error: insertError } = await supabase
      .from('mechanic_profiles')
      .insert(mechanicPayload)

    if (insertError) throw insertError
  }

  async function saveDriverProfile(userId) {
    const supabase = createClient()
    const driverPayload = {
      user_id: userId,
      vehicle_make: formData.vehicleMake.trim() || null,
      vehicle_model: formData.vehicleModel.trim() || null,
      vehicle_year: formData.vehicleYear ? Number.parseInt(formData.vehicleYear, 10) || null : null,
      vehicle_color: formData.vehicleColor.trim() || null,
      vehicle_plate: formData.vehiclePlate.trim() || null,
      emergency_contact_name: formData.emergencyContactName.trim() || null,
      emergency_contact_phone: formData.emergencyContactPhone.trim() || null,
      home_area: formData.serviceArea.trim() || null,
    }

    const { data: existingDriver, error: readError } = await supabase
      .from('driver_profiles')
      .select('user_id')
      .eq('user_id', userId)
      .single()

    if (readError && readError.code !== 'PGRST116') {
      throw readError
    }

    if (existingDriver) {
      const { error: updateError } = await supabase
        .from('driver_profiles')
        .update(driverPayload)
        .eq('user_id', userId)

      if (updateError) throw updateError
      return
    }

    const { error: insertError } = await supabase
      .from('driver_profiles')
      .insert(driverPayload)

    if (insertError) throw insertError
  }

  async function handleSubmit(e) {
    e.preventDefault()

    try {
      setLoading(true)
      const email = formData.email.trim()
      const fullName = formData.fullName.trim()
      const phone = formData.phone.trim()

      if (!fullName || !phone || !email || !formData.password) {
        toast.error('Please fill in your name, phone, email, and password.')
        return
      }

      if (formData.password.length < 6) {
        toast.error('Password must be at least 6 characters long.')
        return
      }

      const data = await signUp({
        email,
        password: formData.password,
        fullName,
        phone,
        role: formData.role,
      })

      const currentUser = await getCurrentUser()

      if ((currentUser?.role || formData.role) === USER_ROLE.MECHANIC) {
        const userId = currentUser?.id || data?.session?.user?.id
        if (userId) {
          await saveMechanicProfile(userId)
        }
      }

      if ((currentUser?.role || formData.role) === USER_ROLE.DRIVER) {
        const userId = currentUser?.id || data?.session?.user?.id
        if (userId) {
          await saveDriverProfile(userId)
        }
      }

      toast.success('Account created')

      if (currentUser?.role) {
        router.push(`/dashboard/${currentUser.role}`)
        return
      }

      if (data?.session?.user) {
        router.push(`/dashboard/${formData.role}`)
        return
      }

      router.push('/auth/login')
    } catch (err) {
      toast.error(err?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-2 block font-mono text-[10px] font-black uppercase tracking-wider text-slate-400">
          Your Role
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[USER_ROLE.DRIVER, USER_ROLE.MECHANIC].map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => updateField('role', role)}
              className={`rounded-xl border px-3 py-2 text-xs font-bold capitalize transition ${
                formData.role === role
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {isMechanic && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-slate-500">Mechanic Details <span className="text-xs font-medium text-slate-400">(optional)</span></p>
              <p className="mt-1 text-sm text-slate-500">These details help drivers trust your workshop profile and are editable later in your account screen.</p>
            </div>
            <button type="button" onClick={() => setShowOptionalDetails((s) => !s)} className="text-sm font-medium text-slate-700 px-4 py-2">
              {showOptionalDetails ? 'Hide' : 'expand'}
            </button>
          </div>

          {showOptionalDetails && (
            <div className="space-y-4 p-4">
              <div>
                <label className="mb-2 block font-mono text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Business Name
                </label>
                <Input
                  placeholder="RoadRescue Pro Garage"
                  value={formData.businessName}
                  onChange={(e) => updateField('businessName', e.target.value)}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block font-mono text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Years of Experience
                  </label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="5"
                    value={formData.yearsExperience}
                    onChange={(e) => updateField('yearsExperience', e.target.value)}
                  />
                </div>

                <div>
                  <label className="mb-2 block font-mono text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Service Area
                  </label>
                  <Input
                    placeholder="Accra, Tema, Kumasi..."
                    value={formData.serviceArea}
                    onChange={(e) => updateField('serviceArea', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block font-mono text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Specializations
                </label>
                <Textarea
                  rows={3}
                  placeholder="Towing, battery jump-start, diagnostics, tyre repair"
                  value={formData.specializations}
                  onChange={(e) => updateField('specializations', e.target.value)}
                />
                <p className="mt-2 text-xs text-slate-500">Separate multiple specializations with commas.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {isDriver && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-slate-500">Driver Details <span className="text-xs font-medium text-slate-400">(optional)</span></p>
              <p className="mt-1 text-sm text-slate-500">These fields help us prefill rescue requests and support you during dispatch.</p>
            </div>
            <button type="button" onClick={() => setShowOptionalDetails((s) => !s)} className="text-sm font-medium text-slate-700 px-4 py-2">
              {showOptionalDetails ? 'hide' : 'expand'}
            </button>
          </div>

          {showOptionalDetails && (
            <div className="space-y-4 p-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block font-mono text-[10px] font-black uppercase tracking-wider text-slate-400">Vehicle Make</label>
                  <Input placeholder="Toyota" value={formData.vehicleMake} onChange={(e) => updateField('vehicleMake', e.target.value)} />
                </div>
                <div>
                  <label className="mb-2 block font-mono text-[10px] font-black uppercase tracking-wider text-slate-400">Vehicle Model</label>
                  <Input placeholder="Camry" value={formData.vehicleModel} onChange={(e) => updateField('vehicleModel', e.target.value)} />
                </div>
                <div>
                  <label className="mb-2 block font-mono text-[10px] font-black uppercase tracking-wider text-slate-400">Vehicle Year</label>
                  <Input type="number" min="1970" placeholder="2020" value={formData.vehicleYear} onChange={(e) => updateField('vehicleYear', e.target.value)} />
                </div>
                <div>
                  <label className="mb-2 block font-mono text-[10px] font-black uppercase tracking-wider text-slate-400">Vehicle Color</label>
                  <Input placeholder="White" value={formData.vehicleColor} onChange={(e) => updateField('vehicleColor', e.target.value)} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block font-mono text-[10px] font-black uppercase tracking-wider text-slate-400">Plate Number</label>
                  <Input placeholder="GR-2847-21" value={formData.vehiclePlate} onChange={(e) => updateField('vehiclePlate', e.target.value)} />
                </div>
                <div>
                  <label className="mb-2 block font-mono text-[10px] font-black uppercase tracking-wider text-slate-400">Home Area</label>
                  <Input placeholder="Accra, Tema, Kumasi..." value={formData.serviceArea} onChange={(e) => updateField('serviceArea', e.target.value)} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block font-mono text-[10px] font-black uppercase tracking-wider text-slate-400">Emergency Contact Name</label>
                  <Input placeholder="Jane Doe" value={formData.emergencyContactName} onChange={(e) => updateField('emergencyContactName', e.target.value)} />
                </div>
                <div>
                  <label className="mb-2 block font-mono text-[10px] font-black uppercase tracking-wider text-slate-400">Emergency Contact Phone</label>
                  <Input placeholder="+233..." value={formData.emergencyContactPhone} onChange={(e) => updateField('emergencyContactPhone', e.target.value)} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div>
        <label className="mb-2 block font-mono text-[10px] font-black uppercase tracking-wider text-slate-400">
          Full Name
        </label>
        <Input
          placeholder="Kwame Mensah"
          value={formData.fullName}
          onChange={(e) => updateField('fullName', e.target.value)}
        />
      </div>

      <div>
        <label className="mb-2 block font-mono text-[10px] font-black uppercase tracking-wider text-slate-400">
          Phone Number
        </label>
        <Input
          placeholder="+233..."
          value={formData.phone}
          onChange={(e) => updateField('phone', e.target.value)}
        />
      </div>

      <div>
        <label className="mb-2 block font-mono text-[10px] font-black uppercase tracking-wider text-slate-400">
          Email
        </label>
        <Input
          type="email"
          placeholder="you@example.com"
          value={formData.email}
          onChange={(e) => updateField('email', e.target.value)}
        />
      </div>

      <div>
        <label className="mb-2 block font-mono text-[10px] font-black uppercase tracking-wider text-slate-400">
          Password
        </label>
        <Input
          type="password"
          placeholder="••••••••"
          value={formData.password}
          onChange={(e) => updateField('password', e.target.value)}
        />
      </div>

      <Button
        type="submit"
        className="w-full bg-slate-900 text-xs font-black uppercase tracking-wider hover:bg-slate-800"
        disabled={loading}
      >
        {loading ? 'Creating account...' : isMechanic ? 'Submit Mechanic Registration' : 'Submit Driver Registration'}
      </Button>
    </form>
  )
}