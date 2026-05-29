'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import PageWrapper from '@/components/layout/PageWrapper'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Spinner from '@/components/ui/Spinner'
import Badge from '@/components/ui/Badge'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { User, Mail, Phone, Shield, Lock } from 'lucide-react'

export default function AdminAccountPage() {
  const { user, profile } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
  })

  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile?.full_name || '',
        email: profile?.email || '',
        phone: profile?.phone || '',
      })
    }
  }, [profile])

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('users')
        .update({
          full_name: formData.fullName,
          phone: formData.phone,
        })
        .eq('id', user?.id)

      if (error) throw error
      
      toast.success('Profile updated successfully')
      setIsEditing(false)
    } catch (error) {
      toast.error(error.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  if (!profile) {
    return <PageWrapper title="Admin Account"><div className="flex items-center justify-center py-12"><Spinner /></div></PageWrapper>
  }

  return (
    <PageWrapper 
      title="Admin Account" 
      description="Manage your administrator profile and access permissions."
    >
      <div className="mx-auto max-w-2xl space-y-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Shield size={20} className="text-[#FFD700]" />
              Administrator Profile
            </h2>
            {!isEditing ? (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
                <Button 
                  size="sm" 
                  loading={loading}
                  onClick={handleSave}
                >
                  Save
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-mono uppercase tracking-[0.18em] text-[#7C7767] mb-2 flex items-center gap-2">
                <User size={14} /> Full Name
              </label>
              {isEditing ? (
                <Input
                  value={formData.fullName}
                  onChange={(e) => handleChange('fullName', e.target.value)}
                  placeholder="Your full name"
                />
              ) : (
                <p className="font-medium text-[#111827]">{formData.fullName || 'Not set'}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-mono uppercase tracking-[0.18em] text-[#7C7767] mb-2 flex items-center gap-2">
                <Mail size={14} /> Email
              </label>
              <p className="font-medium text-[#111827]">{formData.email || 'Not set'}</p>
              <p className="mt-1 text-xs text-[#7C7767]">Email cannot be changed</p>
            </div>

            <div>
              <label className="text-xs font-mono uppercase tracking-[0.18em] text-[#7C7767] mb-2 flex items-center gap-2">
                <Phone size={14} /> Phone Number
              </label>
              {isEditing ? (
                <Input
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="+233..."
                />
              ) : (
                <p className="font-medium text-[#111827]">{formData.phone || 'Not set'}</p>
              )}
            </div>

            <div>
              <label className="mb-2 flex items-center gap-2 text-xs font-mono uppercase tracking-[0.18em] text-[#7C7767]">
                <Lock size={14} /> Role
              </label>
              <Badge label="Administrator" variant="primary" />
            </div>
          </div>
        </Card>

        <Card className="border border-[#7C7767]/25 bg-[#F3F4F6] p-6">
          <h3 className="mb-3 flex items-center gap-2 font-bold text-[#111827]">
            <Shield size={18} />
            Administrator Privileges
          </h3>
          <p className="mb-3 text-sm text-[#7C7767]">
            You have full access to the RoadRescue platform administration panel, including:
          </p>
          <ul className="ml-4 space-y-2 text-sm text-[#111827]">
            <li>✓ User management and account verification</li>
            <li>✓ Mechanic credential review and verification</li>
            <li>✓ Incident monitoring and escalation</li>
            <li>✓ Platform analytics and reporting</li>
            <li>✓ System settings and configuration</li>
          </ul>
        </Card>

        <Card className="border border-[#7C7767]/25 bg-[#F3F4F6] p-6">
          <h3 className="mb-3 flex items-center gap-2 font-bold text-[#111827]">
            <Lock size={18} />
            Account Security
          </h3>
          <p className="mb-4 text-sm text-[#7C7767]">
            Your account is protected with enterprise-grade security measures.
          </p>
          <Button variant="outline" fullWidth>
            Change Password
          </Button>
        </Card>
      </div>
    </PageWrapper>
  )
}
