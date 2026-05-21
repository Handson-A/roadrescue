'use client';

/**
 * Admin Mechanics Verification Page
 * Queue of mechanic applications awaiting verification
 * Allows admin to approve/reject with documentation review
 */

import { useState } from 'react';

export default function MechanicsVerificationPage() {
  const [mechanics, setMechanics] = useState([
    {
      id: 1,
      name: 'John Smith',
      email: 'john@example.com',
      phone: '555-0101',
      license: 'Certified ASE',
      yearsExperience: 8,
      status: 'PENDING',
      documents: ['license.pdf', 'insurance.pdf', 'certifications.pdf'],
    },
    {
      id: 2,
      name: 'Maria Garcia',
      email: 'maria@example.com',
      phone: '555-0102',
      license: 'Master Technician',
      yearsExperience: 12,
      status: 'PENDING',
      documents: ['license.pdf', 'insurance.pdf'],
    },
  ]);

  const handleApprove = (id) => {
    setMechanics(mechanics.map((m) => (m.id === id ? { ...m, status: 'APPROVED' } : m)));
  };

  const handleReject = (id) => {
    setMechanics(mechanics.map((m) => (m.id === id ? { ...m, status: 'REJECTED' } : m)));
  };

  const pendingMechanics = mechanics.filter((m) => m.status === 'PENDING');

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Mechanic Verification</h1>

      <div className="space-y-6">
        {pendingMechanics.length > 0 ? (
          pendingMechanics.map((mechanic) => (
            <div key={mechanic.id} className="bg-white rounded-lg shadow p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">{mechanic.name}</h3>
                  <p className="text-sm text-gray-600">{mechanic.email}</p>
                  <p className="text-sm text-gray-600">{mechanic.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    <strong>License:</strong> {mechanic.license}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Experience:</strong> {mechanic.yearsExperience} years
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Documents:</strong>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {mechanic.documents.map((doc) => (
                      <button
                        key={doc}
                        className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                      >
                        📄 {doc}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 border-t pt-4">
                <button
                  onClick={() => handleApprove(mechanic.id)}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition"
                >
                  ✓ Approve
                </button>
                <button
                  onClick={() => handleReject(mechanic.id)}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition"
                >
                  ✕ Reject
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-lg shadow p-6 text-center text-gray-600">
            No pending mechanic verifications
          </div>
        )}
      </div>
    </div>
  );
}
