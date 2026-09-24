import { NextResponse } from 'next/server'
import { GoogleGenAI, Type } from '@google/genai'
import { diagnoseLimiter } from '@/lib/rateLimit'
import { sanitizeInput } from '@/lib/validate'
import { createClient } from '@/lib/supabase/server'

const MODEL = 'gemini-2.5-flash'
const SEVERITIES = new Set(['low', 'medium', 'high', 'critical'])

let aiClient

function getAi() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) throw new Error('Missing GEMINI_API_KEY')
    aiClient = new GoogleGenAI({ apiKey })
  }

  return aiClient
}

function normalizeString(value, fallback = '') {
  return typeof value === 'string' ? value.trim() || fallback : fallback
}

function normalizeArray(value) {
  return Array.isArray(value)
    ? value.map((item) => normalizeString(item)).filter(Boolean).slice(0, 4)
    : []
}

function normalizeDiagnosticResult(value = {}) {
  const problem = normalizeString(value.problem || value.summary, 'Unable to diagnose vehicle issue')
  const severity = SEVERITIES.has(value.severity) ? value.severity : 'medium'

  return {
    problem,
    severity,
    recommendations: normalizeArray(value.recommendations),
    estimated_causes: normalizeArray(value.estimated_causes || value.estimatedCauses),
    isFallback: Boolean(value.isFallback),
    fallbackReason: value.fallbackReason || null,
  }
}

function buildFallbackDiagnosis(symptoms = '', reason = 'Full AI model temporarily unavailable. Showing standard preliminary checks.') {
  const text = (symptoms || '').toLowerCase().trim()

  if (/\b(brake|braking|grind|squeal|squeak|rotors?|pads?|pedal)\b/.test(text)) {
    return normalizeDiagnosticResult({
      problem: `Preliminary Check: Brake system wear or hydraulic pressure alert ("${symptoms}").`,
      severity: 'high',
      recommendations: [
        'Test braking responsiveness at low speeds in a safe area.',
        'Check the brake fluid reservoir under the bonnet for proper level.',
        'Do not drive if the brake pedal feels spongy or sinks to the floor.',
        'Dispatch a RoadRescue technician or tow service for a safety inspection.',
      ],
      estimated_causes: [
        'Worn brake pads or worn brake shoes',
        'Grooved or warped brake rotor/drum',
        'Low brake fluid or air in hydraulic lines',
        'Stuck or leaking brake caliper',
      ],
      isFallback: true,
      fallbackReason: reason,
    })
  }

  if (/\b(overheat|smoke|steam|coolant|radiator|temp|hot|boil|antifreeze)\b/.test(text)) {
    return normalizeDiagnosticResult({
      problem: `Preliminary Check: Engine overheating or thermal management alert ("${symptoms}").`,
      severity: 'critical',
      recommendations: [
        'Pull over safely and turn off the engine immediately.',
        'CAUTION: NEVER open the radiator cap while the engine is hot.',
        'Allow the engine to cool for at least 20-30 minutes before checking fluid levels.',
        'Dispatch roadside assistance to prevent severe engine damage.',
      ],
      estimated_causes: [
        'Low coolant level or radiator hose leak',
        'Failing radiator fan or stuck thermostat',
        'Worn water pump',
        'Blown head gasket',
      ],
      isFallback: true,
      fallbackReason: reason,
    })
  }

  if (/\b(start|crank|click|battery|dead|ignition|alternator|power)\b/.test(text)) {
    return normalizeDiagnosticResult({
      problem: `Preliminary Check: Electrical power or starter/ignition fault ("${symptoms}").`,
      severity: 'medium',
      recommendations: [
        'Check if dashboard lights and headlights turn on with normal brightness.',
        'Inspect battery terminals for loose clamps or white corrosion.',
        'Attempt a jump-start using booster cables or a jump starter pack.',
        'If clicking continues despite a full battery, the starter motor may need replacement.',
      ],
      estimated_causes: [
        'Depleted or dead 12V battery',
        'Corroded or loose battery cable terminals',
        'Faulty starter motor or starter solenoid',
        'Failing alternator or charging circuit',
      ],
      isFallback: true,
      fallbackReason: reason,
    })
  }

  if (/\b(tire|tyre|flat|puncture|blowout|wheel|wobble|vibrat|pulling|psi)\b/.test(text)) {
    return normalizeDiagnosticResult({
      problem: `Preliminary Check: Tire pressure, puncture, or wheel balance alert ("${symptoms}").`,
      severity: 'high',
      recommendations: [
        'Safely pull over to a level, solid surface away from moving traffic.',
        'Inspect tires for punctures, embedded nails, or sidewall bulges.',
        'Verify tire pressure against the PSI specification on the driver door jamb.',
        'Fit the spare tire or request RoadRescue roadside tire assistance.',
      ],
      estimated_causes: [
        'Punctured tire or leaking valve stem',
        'Low tire pressure (under-inflation)',
        'Wheel misalignment or unbalanced wheel',
        'Worn wheel bearing or suspension joint',
      ],
      isFallback: true,
      fallbackReason: reason,
    })
  }

  if (/\b(engine|check engine|stall|misfir|jerk|rough|idle|hesitat|sputter|cel)\b/.test(text)) {
    return normalizeDiagnosticResult({
      problem: `Preliminary Check: Powertrain or engine management alert ("${symptoms}").`,
      severity: 'medium',
      recommendations: [
        'Check if the Check Engine light is solid or flashing (flashing indicates active misfire).',
        'Inspect the engine oil level with the dipstick when the engine is off and cool.',
        'Avoid heavy acceleration or high-speed driving while the engine runs rough.',
        'Have the vehicle scanned for OBD-II error trouble codes.',
      ],
      estimated_causes: [
        'Worn spark plugs or failing ignition coils',
        'Clogged fuel injector, fuel filter, or weak fuel pump',
        'Dirty Mass Air Flow (MAF) or throttle body sensor',
        'Vacuum leak or intake sensor anomaly',
      ],
      isFallback: true,
      fallbackReason: reason,
    })
  }

  if (/\b(gear|transmiss|clutch|shift|slip|reverse|drive)\b/.test(text)) {
    return normalizeDiagnosticResult({
      problem: `Preliminary Check: Transmission or clutch engagement anomaly ("${symptoms}").`,
      severity: 'high',
      recommendations: [
        'Check transmission fluid level and condition if accessible.',
        'Avoid forcing gear shift levers if resistance is felt.',
        'Note whether the engine revs up without normal vehicle acceleration.',
        'Dispatch a transmission specialist before driving further distances.',
      ],
      estimated_causes: [
        'Low or degraded transmission fluid',
        'Worn clutch friction plate or pressure plate',
        'Transmission shift solenoid or linkage fault',
        'Torque converter wear',
      ],
      isFallback: true,
      fallbackReason: reason,
    })
  }

  if (/\b(fuel|petrol|gas|diesel|smell|leak|odor|fumes)\b/.test(text)) {
    return normalizeDiagnosticResult({
      problem: `Preliminary Check: Fluid leak or combustible fuel odor warning ("${symptoms}").`,
      severity: 'critical',
      recommendations: [
        'Park safely, shut off the engine, and exit the vehicle if fuel odor is strong.',
        'Do NOT light matches, smoke, or use open flames near the vehicle.',
        'Look beneath the vehicle for active dripping or puddles.',
        'Request immediate roadside technician inspection.',
      ],
      estimated_causes: [
        'Fuel line leak or loose fuel vapor cap',
        'Oil leaking onto hot exhaust components',
        'Exhaust manifold leak entering the ventilation system',
        'Coolant heater core leak',
      ],
      isFallback: true,
      fallbackReason: reason,
    })
  }

  return normalizeDiagnosticResult({
    problem: `Preliminary Assessment: "${symptoms || 'vehicle issue'}"`,
    severity: 'medium',
    recommendations: [
      'Inspect dashboard warning lights for active indicators.',
      'Check engine oil, coolant, and brake fluid levels before moving the vehicle.',
      'Verify battery terminal tightness and clean connections.',
      'Dispatch a RoadRescue mechanic for an in-person diagnostic scan.',
    ],
    estimated_causes: [
      'Ignition system or battery power fault',
      'Fluid level or mechanical pressure loss',
      'Electrical sensor anomaly',
    ],
    isFallback: true,
    fallbackReason: reason,
  })
}

function buildBusyDiagnosis(is503) {
  return normalizeDiagnosticResult({
    problem: is503
      ? 'The diagnostic system is experiencing high demand. Please retry shortly.'
      : 'Diagnostic module currently busy',
    severity: 'medium',
    recommendations: is503
      ? ['Retry submitting your symptom phrase in a few moments.', 'Check dashboard cluster warning lights.']
      : ['Retry the diagnosis in a moment.'],
    estimated_causes: is503 ? ['AI Infrastructure API congestion'] : [],
    isFallback: true,
    fallbackReason: is503 ? 'AI capacity congested' : 'Diagnostic service temporarily busy',
  })
}

function cleanJsonString(rawText) {
  if (!rawText) return '{}'
  let clean = rawText.trim()
  if (clean.startsWith('```')) {
    clean = clean.replace(/^```json\s*/i, '').replace(/```$/, '').trim()
  }
  return clean
}

function getResponseText(response) {
  return response?.text || response?.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

async function generateContentWithRetry(params, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i += 1) {
    try {
      return await getAi().models.generateContent(params)
    } catch (error) {
      const is503 = error?.status === 503 || error?.message?.includes('503') || error?.message?.includes('high demand')

      if (is503 && i < retries - 1) {
        console.warn(`[AI RETRY] Model busy. Retrying attempt ${i + 1} of ${retries} in ${delay}ms...`)
        await new Promise((resolve) => setTimeout(resolve, delay))
        delay *= 2
        continue
      }

      throw error
    }
  }
}

export async function POST(request) {
  try {
    const rawBody = await request.json()
    const body = sanitizeInput(rawBody)
    const symptoms = normalizeString(body.symptoms)
    const vehicleMake = normalizeString(body.vehicleMake)
    const vehicleModel = normalizeString(body.vehicleModel)
    const vehicleYear = normalizeString(body.vehicleYear)

    // Resolve rate limiting identifier: prioritize authenticated user ID
    let rateLimitKey = 'anonymous'
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.id) {
        rateLimitKey = `user:${user.id}`
      } else {
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'anonymous'
        rateLimitKey = `ip:${ip}`
      }
    } catch {
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anonymous'
      rateLimitKey = `ip:${ip}`
    }

    const limit = diagnoseLimiter(rateLimitKey)
    if (!limit.allowed) {
      console.warn(`[AI RATE LIMIT TRIGGERED] Key: ${rateLimitKey}`)
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit reached (20 req/min). Showing preliminary guidance.',
          diagnosis: buildFallbackDiagnosis(symptoms, 'Rate limit reached. Full AI diagnosis paused for 1 minute.'),
        },
        { status: 429 }
      )
    }

    if (!symptoms || !process.env.GEMINI_API_KEY) {
      console.warn('[AI DIAGNOSE] Missing symptoms or GEMINI_API_KEY. Using fallback.')
      return NextResponse.json({
        success: true,
        diagnosis: buildFallbackDiagnosis(symptoms, 'GEMINI_API_KEY not configured. Showing basic rules.'),
      })
    }

    const userContent = [
      `Symptoms: ${symptoms}`,
      vehicleMake ? `Vehicle Make: ${vehicleMake}` : '',
      vehicleModel ? `Vehicle Model: ${vehicleModel}` : '',
      vehicleYear ? `Vehicle Year: ${vehicleYear}` : '',
    ].filter(Boolean).join('\n')

    console.log(`[AI DIAGNOSE] Calling Gemini 2.5 Flash for: "${symptoms.slice(0, 50)}..." [Key: ${rateLimitKey}]`)

    const response = await generateContentWithRetry({
      model: MODEL,
      contents: userContent,
      config: {
        systemInstruction: `You are the RoadRescue diagnostic AI for Ghana. Review vehicle breakdown symptoms and provide a fast, reassuring, professional preliminary mechanical assessment. Return only structured JSON. Keep the problem concise and include safe, actionable recommendations.`,
        maxOutputTokens: 1024,
        temperature: 0.2,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            problem: {
              type: Type.STRING,
              description: 'A concise description of the primary vehicle problem.',
            },
            severity: {
              type: Type.STRING,
              enum: ['low', 'medium', 'high', 'critical'],
            },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Up to four safe actions the driver can take.',
            },
            estimated_causes: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Top probable mechanical or electrical causes.',
            },
          },
          required: ['problem', 'severity', 'recommendations', 'estimated_causes'],
        },
      },
    })

    let diagnosisData
    const aiReply = getResponseText(response)

    try {
      diagnosisData = JSON.parse(cleanJsonString(aiReply))
      diagnosisData.isFallback = false
      console.log(`[AI DIAGNOSE SUCCESS] Generated assessment for "${symptoms.slice(0, 40)}"`)
    } catch (parseError) {
      console.error('[AI PARSE ERROR]', parseError, 'Raw Reply:', aiReply)
      diagnosisData = buildFallbackDiagnosis(symptoms, 'Parse error on model response. Showing basic checks.')
    }

    return NextResponse.json({
      success: true,
      diagnosis: normalizeDiagnosticResult(diagnosisData),
    })
  } catch (error) {
    console.error('[AI FAULT INTERCEPTED]', error)
    const is503 = error?.status === 503 || error?.message?.includes('503') || error?.message?.includes('high demand')

    return NextResponse.json(
      {
        success: false,
        error: is503 ? 'High traffic load on diagnostic network' : 'Diagnostic module currently busy',
        diagnosis: buildBusyDiagnosis(is503),
      },
      { status: is503 ? 503 : 500 }
    )
  }
}
