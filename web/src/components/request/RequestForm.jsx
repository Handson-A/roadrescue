'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Camera, ImagePlus } from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Select from '@/components/ui/Select'
import LocationPicker from '@/components/map/LocationPicker'
import DiagnosticResult from '@/components/ai/DiagnosticResult'
import { useDiagnostic } from '@/hooks/useDiagnostic'
import { useToast } from '@/components/ui/Toast'
import { SERVICE_TYPE } from '@/lib/constants'
import { createClient } from '@/lib/supabase/client'
import { formatStatus } from '@/lib/utils'

const serviceOptions = [
  { value: SERVICE_TYPE.REPAIR, label: 'General Repair' },
  { value: SERVICE_TYPE.TOWING, label: 'Towing' },
  { value: SERVICE_TYPE.TYRE_CHANGE, label: 'Tyre Change' },
  { value: SERVICE_TYPE.BATTERY_JUMP, label: 'Battery Jump' },
  { value: SERVICE_TYPE.FUEL_DELIVERY, label: 'Fuel Delivery' },
  { value: SERVICE_TYPE.OTHER, label: 'Other' },
]

export default function RequestForm() {
  const router = useRouter()
  const { toast } = useToast()
  const { diagnose, diagnosis, diagnosing, isFallback } = useDiagnostic()

  const [submitting, setSubmitting] = useState(false)
  const [snapshotUploading, setSnapshotUploading] = useState(false)
  const [vehicleImageFile, setVehicleImageFile] = useState(null)
  const [vehicleImagePreview, setVehicleImagePreview] = useState('')
  const [form, setForm] = useState({
    incidentLat: null,
    incidentLng: null,
    incidentAddress: '',
    serviceType: SERVICE_TYPE.REPAIR,
    problemDescription: '',
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: '',
    vehicleColor: '',
    vehiclePlate: '',
  })

  const canSubmit = useMemo(() => {
    return !!(
      form.incidentLat &&
      form.incidentLng &&
      form.problemDescription.trim().length >= 8 &&
      form.vehicleMake.trim() &&
      form.vehicleModel.trim()
    )
  }, [form])

  function updateField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function onVehicleSnapshotChange(event) {
    const file = event.target.files?.[0]
    if (!file) {
      setVehicleImageFile(null)
      setVehicleImagePreview('')
      return
    }

    if (!file.type.startsWith('image/')) {
      toast({ message: 'Please choose an image file', type: 'warning' })
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({ message: 'Snapshot must be 10MB or less', type: 'warning' })
      return
    }

    if (vehicleImagePreview) {
      URL.revokeObjectURL(vehicleImagePreview)
    }

    setVehicleImageFile(file)
    setVehicleImagePreview(URL.createObjectURL(file))
  }

  async function uploadVehicleSnapshot() {
    if (!vehicleImageFile) return null

    const supabase = createClient()
    if (!supabase?.storage?.from) {
      throw new Error('Snapshot upload is unavailable in this environment')
    }

    setSnapshotUploading(true)

    try {
      const { data: authData } = await supabase.auth.getUser()
      const userId = authData?.user?.id || 'driver'
      const fileExtension = vehicleImageFile.name.split('.').pop() || 'jpg'
      const filePath = `${userId}/${Date.now()}-${crypto.randomUUID()}.${fileExtension}`

      const { error: uploadError } = await supabase.storage
        .from('vehicle-snapshots')
        .upload(filePath, vehicleImageFile, {
          upsert: false,
          contentType: vehicleImageFile.type,
        })

      if (uploadError) {
        throw uploadError
      }

      const { data: publicUrlData } = supabase.storage
        .from('vehicle-snapshots')
        .getPublicUrl(filePath)

      return publicUrlData?.publicUrl || null
    } finally {
      setSnapshotUploading(false)
    }
  }

  async function runDiagnostic() {
    if (!form.problemDescription.trim()) {
      toast({ message: 'Describe the issue first', type: 'warning' })
      return
    }

    const result = await diagnose({
      symptoms: form.problemDescription,
      vehicleMake: form.vehicleMake,
      vehicleModel: form.vehicleModel,
      vehicleYear: form.vehicleYear,
    })

    if (result?.recommended_service) {
      updateField('serviceType', result.recommended_service)
    }
  }

  async function submitRequest() {
    if (!canSubmit) {
      toast({ message: 'Please complete the required fields', type: 'warning' })
      return
    }

    setSubmitting(true)
    try {
      let vehicleImageUrl = null
      try {
        vehicleImageUrl = await uploadVehicleSnapshot()
      } catch (uploadError) {
        toast({
          message: uploadError.message || 'Snapshot upload failed. Dispatch will continue without image.',
          type: 'warning',
        })
      }

      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          vehicleYear: form.vehicleYear ? Number(form.vehicleYear) : null,
          aiDiagnosticResult: diagnosis || null,
          vehicleImageUrl,
          vehicle_image_url: vehicleImageUrl,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Unable to send request')
      }

      toast({ message: 'Dispatch sent. Matching mechanic...', type: 'success' })
      router.push(`/dashboard/driver/request/${data.request.id}`)
    } catch (error) {
      toast({ message: error.message || 'Failed to submit request', type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-5">
      
      {/* STEP 1: LOCATION HARNESS CARD */}
      <div className="overflow-hidden rounded-2xl border border-[#DCCDA9] bg-white shadow-sm">
        <div className="border-b border-[#E0D5B7] bg-[#FFF9EF] px-4 py-3.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#7C6B44]">Step 1</p>
          <h3 className="mt-0.5 text-sm font-black text-[#1F1B10]">Pickup Point</h3>
        </div>
        <div className="p-4">
          <LocationPicker
            onSelect={({ lat, lng, address }) => {
              updateField('incidentLat', lat)
              updateField('incidentLng', lng)
              updateField('incidentAddress', address)
            }}
          />
          {form.incidentAddress && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-[#FFF9EF] px-4 py-3 text-xs font-bold text-slate-700 leading-relaxed">
              📍 Selected Coordinate Asset: <span className="text-[#1F1B10] font-mono">{form.incidentAddress}</span>
            </div>
          )}
        </div>
      </div>

      {/* STEP 2: VEHICLE INFORMATION CARD */}
      <div className="overflow-hidden rounded-2xl border border-[#DCCDA9] bg-white shadow-sm">
        <div className="border-b border-[#E0D5B7] bg-[#FFF9EF] px-4 py-3.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#7C6B44]">Step 2</p>
          <h3 className="mt-0.5 text-sm font-black text-[#1F1B10]">Vehicle Snapshot</h3>
        </div>
        <div className="grid gap-4 p-4 sm:grid-cols-2">
          <Input label="Make" value={form.vehicleMake} onChange={(e) => updateField('vehicleMake', e.target.value)} placeholder="Toyota" />
          <Input label="Model" value={form.vehicleModel} onChange={(e) => updateField('vehicleModel', e.target.value)} placeholder="Corolla" />
          <Input label="Year" type="number" value={form.vehicleYear} onChange={(e) => updateField('vehicleYear', e.target.value)} placeholder="2018" />
          <Input label="Color" value={form.vehicleColor} onChange={(e) => updateField('vehicleColor', e.target.value)} placeholder="Silver" />
          <div className="sm:col-span-2">
            <Input label="Plate Number" value={form.vehiclePlate} onChange={(e) => updateField('vehiclePlate', e.target.value)} placeholder="GR-1234-24" />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-[#7C6B44]">
              Optional Vehicle Camera Snapshot
            </label>
            <label className="group flex cursor-pointer flex-col gap-3 rounded-2xl border border-dashed border-[#C8B98E] bg-[#FFF9EF] p-4 transition hover:border-slate-900">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={onVehicleSnapshotChange}
                className="sr-only"
              />

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-slate-900 p-2 text-white">
                    <Camera size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-[#1F1B10]">Tap to upload from gallery or camera</p>
                    <p className="text-xs text-[#7C6B44]">Helps your mechanic prepare parts and reduce wait time.</p>
                  </div>
                </div>
                <ImagePlus size={18} className="text-[#7C6B44]" />
              </div>

              {vehicleImagePreview && (
                <div className="overflow-hidden rounded-xl border border-[#E0D5B7] bg-white">
                  <Image
                    src={vehicleImagePreview}
                    alt="Vehicle snapshot preview"
                    width={1024}
                    height={768}
                    unoptimized
                    className="h-48 w-full object-cover"
                  />
                </div>
              )}
            </label>
          </div>
        </div>
      </div>

      {/* STEP 3: INCIDENT DISPATCH CORE CARD */}
      <div className="overflow-hidden rounded-2xl border border-[#DCCDA9] bg-white shadow-sm">
        <div className="border-b border-[#E0D5B7] bg-[#FFF9EF] px-4 py-3.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#7C6B44]">Step 3</p>
          <h3 className="mt-0.5 text-sm font-black text-[#1F1B10]">Incident Details</h3>
        </div>
        <div className="space-y-4 p-4">
          <Textarea
            label="What is happening?"
            value={form.problemDescription}
            onChange={(e) => updateField('problemDescription', e.target.value)}
            placeholder="Describe any warning lights, sounds, or sudden component failures..."
            hint="Detailed descriptions improve the precision of the AI diagnostic engine."
          />

          <Select
            label="Service Type"
            value={form.serviceType}
            onChange={(e) => updateField('serviceType', e.target.value)}
            options={serviceOptions}
          />

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={runDiagnostic}
              disabled={diagnosing}
              className="rounded-xl border border-slate-900 bg-white px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-900 transition hover:bg-slate-50 disabled:opacity-50"
            >
              {diagnosing ? 'Analyzing parameters...' : 'Run AI Diagnosis'}
            </button>
            <span className="text-[11px] font-bold text-[#7C6B44]">
              {diagnosis ? `Suggested Node: ${formatStatus(diagnosis.recommended_service || form.serviceType)}` : 'Recommended baseline scan'}
            </span>
          </div>

          {diagnosis && <DiagnosticResult diagnosis={diagnosis} isFallback={isFallback} />}
        </div>
      </div>

      {/* EMERGENCY PRIMARY ACTION DISPATCH TRIGGER BUTTON */}
      <div className="pt-2">
        <Button 
          fullWidth 
          size="lg" 
          onClick={submitRequest} 
          loading={submitting} 
          disabled={!canSubmit || snapshotUploading}
          className="bg-slate-900 text-xs font-black uppercase tracking-widest text-white hover:bg-slate-800 rounded-xl py-3.5 shadow-md disabled:opacity-40"
        >
          {submitting || snapshotUploading ? 'Initializing Dispatch Gateway...' : 'Send Emergency Dispatch'}
        </Button>
      </div>
      
    </div>
  )
}