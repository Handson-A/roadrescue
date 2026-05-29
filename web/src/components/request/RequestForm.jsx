'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
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
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          vehicleYear: form.vehicleYear ? Number(form.vehicleYear) : null,
          aiDiagnosticResult: diagnosis || null,
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
    <div className="space-y-4 lg:space-y-5">
      <Card className="overflow-hidden p-0">
        <div className="border-b border-border bg-surfaceAlt px-4 py-3 lg:px-6">
          <p className="text-xs uppercase tracking-[0.22em] text-muted">Step 1</p>
          <h2 className="mt-1 font-semibold">Pickup point</h2>
        </div>
        <div className="p-4 lg:p-6">
          <LocationPicker
            onSelect={({ lat, lng, address }) => {
              updateField('incidentLat', lat)
              updateField('incidentLng', lng)
              updateField('incidentAddress', address)
            }}
          />
          {form.incidentAddress && (
            <div className="mt-4 rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm text-foreground">
              Selected location: <span className="font-semibold">{form.incidentAddress}</span>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="border-b border-border bg-surfaceAlt px-4 py-3 lg:px-6">
          <p className="text-xs uppercase tracking-[0.22em] text-muted">Step 2</p>
          <h2 className="mt-1 font-semibold">Vehicle snapshot</h2>
        </div>
        <div className="grid gap-3 p-4 lg:grid-cols-2 lg:gap-4 lg:p-6">
          <Input label="Make" value={form.vehicleMake} onChange={(e) => updateField('vehicleMake', e.target.value)} placeholder="Toyota" />
          <Input label="Model" value={form.vehicleModel} onChange={(e) => updateField('vehicleModel', e.target.value)} placeholder="Corolla" />
          <Input label="Year" type="number" value={form.vehicleYear} onChange={(e) => updateField('vehicleYear', e.target.value)} placeholder="2018" />
          <Input label="Color" value={form.vehicleColor} onChange={(e) => updateField('vehicleColor', e.target.value)} placeholder="Silver" />
          <div className="lg:col-span-2">
            <Input label="Plate number" value={form.vehiclePlate} onChange={(e) => updateField('vehiclePlate', e.target.value)} placeholder="GR-1234-24" />
          </div>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="border-b border-border bg-surfaceAlt px-4 py-3 lg:px-6">
          <p className="text-xs uppercase tracking-[0.22em] text-muted">Step 3</p>
          <h2 className="mt-1 font-semibold">Incident details</h2>
        </div>
        <div className="space-y-4 p-4 lg:p-6">
          <Textarea
            label="What is happening?"
            value={form.problemDescription}
            onChange={(e) => updateField('problemDescription', e.target.value)}
            placeholder="Describe the symptoms, warning lights, sounds, smoke, tyre damage, or anything unusual."
            hint="The more specific the report, the better the AI diagnosis and mechanic match."
          />

          <Select
            label="Service type"
            value={form.serviceType}
            onChange={(e) => updateField('serviceType', e.target.value)}
            options={serviceOptions}
          />

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" onClick={runDiagnostic} loading={diagnosing}>
              Run AI diagnosis
            </Button>
            <span className="text-xs text-muted">{diagnosis ? `Suggested service: ${formatStatus(diagnosis.recommended_service || form.serviceType)}` : 'Optional, but recommended'}</span>
          </div>

          {diagnosis && <DiagnosticResult diagnosis={diagnosis} isFallback={isFallback} />}
        </div>
      </Card>

      <div className="sticky bottom-3 z-20 lg:static">
        <Button fullWidth size="lg" onClick={submitRequest} loading={submitting} disabled={!canSubmit}>
          Send emergency dispatch
        </Button>
      </div>
    </div>
  )
}
