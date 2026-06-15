'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Button from '@/components/ui/Button'
import { signUp } from '@/lib/auth'
import { USER_ROLE } from '@/lib/constants'
import { createClient } from '@/lib/supabase/client'

export default function RegisterForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [consentAccepted, setConsentAccepted] = useState(false)
  const [showOptionalDetails, setShowOptionalDetails] = useState(false)
  
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

  function updateField(field, value) {
    setFormData((current) => ({ ...current, [field]: value }))
    if (field === 'role') {
      setShowOptionalDetails(false)
    }
  }

  function parseSpecializations(value) {
    if (!value) return []
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }

  async function saveMechanicProfile(userId) {
    if (!formData.businessName && !formData.specializations && !formData.yearsExperience && !formData.serviceArea) {
      return
    }

    const supabase = createClient()
    const mechanicPayload = {}
    
    if (formData.businessName.trim()) mechanicPayload.business_name = formData.businessName.trim()
    if (formData.specializations.trim()) mechanicPayload.specializations = parseSpecializations(formData.specializations)
    if (formData.yearsExperience) mechanicPayload.years_experience = parseInt(formData.yearsExperience, 10) || 0
    if (formData.serviceArea.trim()) mechanicPayload.location_label = formData.serviceArea.trim()

    if (Object.keys(mechanicPayload).length === 0) return

    const { error } = await supabase
      .from('mechanic_profiles')
      .update(mechanicPayload)
      .eq('user_id', userId)

    if (error) throw error
  }

  async function saveDriverProfile(userId) {
    if (
      !formData.vehicleMake && !formData.vehicleModel && !formData.vehicleYear && 
      !formData.vehicleColor && !formData.vehiclePlate && !formData.serviceArea &&
      !formData.emergencyContactName && !formData.emergencyContactPhone
    ) {
      return
    }

    const supabase = createClient()
    const driverPayload = {}

    if (formData.vehicleMake.trim()) driverPayload.vehicle_make = formData.vehicleMake.trim()
    if (formData.vehicleModel.trim()) driverPayload.vehicle_model = formData.vehicleModel.trim()
    if (formData.vehicleYear) driverPayload.vehicle_year = parseInt(formData.vehicleYear, 10) || null
    if (formData.vehicleColor.trim()) driverPayload.vehicle_color = formData.vehicleColor.trim()
    if (formData.vehiclePlate.trim()) driverPayload.vehicle_plate = formData.vehiclePlate.trim().toUpperCase()
    if (formData.serviceArea.trim()) driverPayload.home_area = formData.serviceArea.trim()
    if (formData.emergencyContactName.trim()) driverPayload.emergency_contact_name = formData.emergencyContactName.trim()
    
    // FIXED: Form field map realigned back to snake_case schema to block payload drops
    if (formData.emergencyContactPhone.trim()) driverPayload.emergency_contact_phone = formData.emergencyContactPhone.trim()

    if (Object.keys(driverPayload).length === 0) return

    const { error } = await supabase
      .from('driver_profiles')
      .update(driverPayload)
      .eq('user_id', userId)

    if (error) throw error
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

      if (!consentAccepted) {
        toast.error('Please accept the consent terms to continue.')
        return
      }

      // Step 1: Sign up user into Supabase Auth.
      const data = await signUp({
        email,
        password: formData.password,
        fullName,
        phone,
        role: formData.role,
      })

      const userId = data?.user?.id || data?.session?.user?.id
      const role = data?.user?.user_metadata?.role || data?.session?.user?.user_metadata?.role || formData.role

      // Step 2: Update optional tables safely
      if (userId && showOptionalDetails) {
        if (role === USER_ROLE.MECHANIC) {
          await saveMechanicProfile(userId)
        }
        if (role === USER_ROLE.DRIVER) {
          await saveDriverProfile(userId)
        }
      }

      // Step 3: Trigger Transactional Email Template
      const roleLabel = formData.role.toLowerCase()
      const wrapperStyle = "background-color: #FFF8EA; padding: 32px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;"
      const containerStyle = "max-width: 540px; margin: 0 auto; background-color: #ffffff; border: 1px solid #DCCDA9; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(31, 27, 16, 0.03);"
      const headerStyle = "background: #1F1B10; padding: 32px 24px; text-align: center; border-bottom: 3px solid #F5D108;"
      const bodyStyle = "padding: 32px 24px; color: #1F1B10;"
      const greetingStyle = "font-size: 16px; font-weight: 800; margin-top: 0; margin-bottom: 12px; color: #1F1B10;"
      const textStyle = "font-size: 14px; line-height: 1.6; color: #5E5440; margin-top: 0; margin-bottom: 20px;"
      const parameterBoxStyle = "background-color: #FFF9EF; border: 1px solid #E0D5B7; border-radius: 12px; padding: 16px; margin: 24px 0;"
      const buttonStyle = "display: inline-block; background-color: #F5D108; color: #1F1B10; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; padding: 14px 28px; border-radius: 12px; text-decoration: none; text-align: center; box-shadow: 0 4px 10px rgba(245, 209, 8, 0.2);"
      const footerStyle = "text-align: center; padding: 24px; border-top: 1px solid #FFF1D6; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.15em; color: #7C6B44; background-color: #FFF9EF;"

      const structuredEmailContent = `
        <div style="${wrapperStyle}">
          <div style="${containerStyle}">
            <div style="${headerStyle}">
              <span style="font-size: 10px; font-weight: 900; color: #F5D108; text-transform: uppercase; letter-spacing: 0.2em; display: block; margin-bottom: 6px;">Clearance Authenticated</span>
              <h1 style="margin: 0; font-size: 20px; font-weight: 900; color: #ffffff;">Welcome to RoadRescue</h1>
            </div>
            <div style="${bodyStyle}">
              <p style="${greetingStyle}">Welcome aboard, ${fullName},</p>
              <p style="${textStyle}">Your security access token has been verified. Your platform identity configuration is now logged as an active <strong>${roleLabel}</strong> on our priority emergency dispatch network.</p>
              
              <div style="${parameterBoxStyle}">
                <p style="font-size: 13px; line-height: 1.6; color: #1F1B10; margin: 0; font-weight: 500;">
                  ${roleLabel === 'mechanic' 
                    ? 'Thank you for partnering with us to keep our community safe and moving. We connect you with nearby breakdowns so you can grow your workshop revenue efficiently.' 
                    : "Your safety is our top priority, and we're here to ensure help is always within reach. We are built to ensure every roadside connection is secure, reliable, and seamless."
                  }
                </p>
              </div>

              <p style="${textStyle}">Please log into your dashboard to update your profile picture, verify your direct contact lines, and prefill any vehicle or garage details to ensure perfect dispatch matching metrics.</p>
              
              <div style="text-align: center; margin-top: 28px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://roadrescue.com'}/auth/login" style="${buttonStyle}">Access Terminal Console</a>
              </div>
            </div>
            <div style="${footerStyle}">RoadRescue Operations Network</div>
          </div>
        </div>
      `

      // Fire off endpoint dispatch task explicitly after verifying DB profile writes completed
      await fetch('/api/notifications/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: email,
          subject: `Welcome to RoadRescue — Secure ${formData.role} Session`,
          htmlContent: structuredEmailContent,
        }),
      })

      toast.success('Account created successfully! Please log in to view your dashboard.')
      router.replace('/auth/login')
    } catch (err) {
      console.error('[SIGNUP PORTAL FAULT]', err)
      toast.error(err?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Role Selection Tabs */}
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

      {/* MECHANIC OPTIONAL WRAPPER */}
      {isMechanic && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-slate-500">
                Mechanic Details <span className="text-xs font-medium text-slate-400">(optional)</span>
              </p>
              <p className="mt-1 text-xs text-slate-400">These can be configured inside your profile settings panel later.</p>
            </div>
            <button 
              type="button" 
              onClick={() => setShowOptionalDetails((s) => !s)} 
              className="text-xs font-bold bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 hover:bg-slate-100"
            >
              {showOptionalDetails ? 'Hide Options' : 'Add Options Now'}
            </button>
          </div>

          {showOptionalDetails && (
            <div className="space-y-4 p-4 border-t border-slate-200 bg-white rounded-b-2xl">
              <div>
                <label className="mb-2 block font-mono text-[10px] font-black uppercase tracking-wider text-slate-400">Business Name</label>
                <Input placeholder="RoadRescue Pro Garage" value={formData.businessName} onChange={(e) => updateField('businessName', e.target.value)} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block font-mono text-[10px] font-black uppercase tracking-wider text-slate-400">Years of Experience</label>
                  <Input type="number" min="0" placeholder="5" value={formData.yearsExperience} onChange={(e) => updateField('yearsExperience', e.target.value)} />
                </div>
                <div>
                  <label className="mb-2 block font-mono text-[10px] font-black uppercase tracking-wider text-slate-400">Service Area Location</label>
                  <Input placeholder="Accra, Central Region..." value={formData.serviceArea} onChange={(e) => updateField('serviceArea', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="mb-2 block font-mono text-[10px] font-black uppercase tracking-wider text-slate-400">Specializations</label>
                <Textarea rows={3} placeholder="Towing, battery jump-start, diagnostics, tyre repair" value={formData.specializations} onChange={(e) => updateField('specializations', e.target.value)} />
                <p className="mt-1 text-[11px] text-slate-400">Separate values with commas.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* DRIVER OPTIONAL WRAPPER */}
      {isDriver && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-slate-500">
                Vehicle & Emergency Info <span className="text-xs font-medium text-slate-400">(optional)</span>
              </p>
              <p className="mt-1 text-xs text-slate-400">Skip this now if you do not have your vehicle data on hand.</p>
            </div>
            <button 
              type="button" 
              onClick={() => setShowOptionalDetails((s) => !s)} 
              className="text-xs font-bold bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 hover:bg-slate-100"
            >
              {showOptionalDetails ? 'Hide Options' : 'Add Options Now'}
            </button>
          </div>

          {showOptionalDetails && (
            <div className="space-y-4 p-4 border-t border-slate-200 bg-white rounded-b-2xl">
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
                  <Input type="number" min="1970" placeholder="2022" value={formData.vehicleYear} onChange={(e) => updateField('vehicleYear', e.target.value)} />
                </div>
                <div>
                  <label className="mb-2 block font-mono text-[10px] font-black uppercase tracking-wider text-slate-400">Vehicle Color</label>
                  <Input placeholder="Silver" value={formData.vehicleColor} onChange={(e) => updateField('vehicleColor', e.target.value)} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block font-mono text-[10px] font-black uppercase tracking-wider text-slate-400">Plate Number</label>
                  <Input placeholder="GW-4920-24" value={formData.vehiclePlate} onChange={(e) => updateField('vehiclePlate', e.target.value)} />
                </div>
                <div>
                  <label className="mb-2 block font-mono text-[10px] font-black uppercase tracking-wider text-slate-400">Home Residential Area</label>
                  <Input placeholder="Kasoa, Cantonments..." value={formData.serviceArea} onChange={(e) => updateField('serviceArea', e.target.value)} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 border-t border-slate-100 pt-3">
                <div>
                  <label className="mb-2 block font-mono text-[10px] font-black uppercase tracking-wider text-slate-400">Emergency Contact Name</label>
                  <Input placeholder="John Doe" value={formData.emergencyContactName} onChange={(e) => updateField('emergencyContactName', e.target.value)} />
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

      {/* Primary Required Inputs */}
      <div>
        <label className="mb-2 block font-mono text-[10px] font-black uppercase tracking-wider text-slate-400">Full Name</label>
        <Input placeholder="Kwame Mensah" value={formData.fullName} onChange={(e) => updateField('fullName', e.target.value)} />
      </div>

      <div>
        <label className="mb-2 block font-mono text-[10px] font-black uppercase tracking-wider text-slate-400">Phone Number</label>
        <Input placeholder="+233..." value={formData.phone} onChange={(e) => updateField('phone', e.target.value)} />
      </div>

      <div>
        <label className="mb-2 block font-mono text-[10px] font-black uppercase tracking-wider text-slate-400">Email Address</label>
        <Input type="email" placeholder="you@example.com" value={formData.email} onChange={(e) => updateField('email', e.target.value)} />
      </div>

      <div>
        <label className="mb-2 block font-mono text-[10px] font-black uppercase tracking-wider text-slate-400">Password</label>
        <Input type="password" placeholder="••••••••" value={formData.password} onChange={(e) => updateField('password', e.target.value)} />
      </div>

      {/* Consent Checkbox */}
      <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <input
          type="checkbox"
          checked={consentAccepted}
          onChange={(e) => setConsentAccepted(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
        />
        <span className="text-sm leading-6 text-slate-600">
          I consent to RoadRescue using my account details, location, and rescue activity to provide roadside assistance, notifications, and support.
        </span>
      </label>

      <Button
        type="submit"
        className="w-full bg-slate-900 text-xs font-black uppercase tracking-wider hover:bg-slate-800"
        disabled={loading || !consentAccepted}
      >
        {loading ? 'Creating account...' : isMechanic ? 'Submit Mechanic Registration' : 'Submit Driver Registration'}
      </Button>
    </form>
  )
}