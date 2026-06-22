import { NextResponse } from 'next/server'
import { GoogleGenAI, Type } from '@google/genai'
import { diagnoseLimiter } from '@/lib/rateLimit'

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
    ? value.map((item) => normalizeString(item)).filter(Boolean).slice(0, 3)
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
  }
}

function buildFallbackDiagnosis(symptoms) {
  return normalizeDiagnosticResult({
    problem: `Unable to diagnose: "${symptoms || 'vehicle issue'}"`,
    severity: 'medium',
    recommendations: [
      'Check battery terminal connections',
      'Verify fuel levels',
      'Inspect warning lights on the dashboard',
    ],
    estimated_causes: [
      'Ignition system components',
      'Fuel system pressure loss',
      'Electrical sensor fault',
    ],
  })
}

function buildBusyDiagnosis(is503) {
  return normalizeDiagnosticResult({
    problem: is503
      ? 'The diagnostic system is experiencing high demand. Please retry shortly.'
      : 'Diagnostic module currently busy',
    severity: 'medium',
    recommendations: is503
      ? ['Retry submitting your symptom phrase in a few seconds.', 'Check dashboard cluster icons.']
      : ['Retry the diagnosis shortly.'],
    estimated_causes: is503 ? ['AI Infrastructure API congestion'] : [],
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
        console.warn(`[AI RETRY] AI model busy. Retrying attempt ${i + 1} of ${retries} in ${delay}ms...`)
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
    const ip = request.headers.get('x-forwarded-for') || 'anonymous'
    const limit = diagnoseLimiter(ip)
    if (!limit.allowed) {
      return NextResponse.json(
        { error: 'Too many diagnostic requests. Please try again in a minute.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const symptoms = normalizeString(body.symptoms)
    const vehicleMake = normalizeString(body.vehicleMake)
    const vehicleModel = normalizeString(body.vehicleModel)
    const vehicleYear = normalizeString(body.vehicleYear)

    if (!symptoms || !process.env.GEMINI_API_KEY) {
      return NextResponse.json({
        success: true,
        diagnosis: buildFallbackDiagnosis(symptoms),
      })
    }

    const userContent = [
      `Symptoms: ${symptoms}`,
      vehicleMake ? `Vehicle Make: ${vehicleMake}` : '',
      vehicleModel ? `Vehicle Model: ${vehicleModel}` : '',
      vehicleYear ? `Vehicle Year: ${vehicleYear}` : '',
    ].filter(Boolean).join('\n')

    const response = await generateContentWithRetry({
      model: MODEL,
      contents: userContent,
      config: {
        systemInstruction: `You are the RoadRescue diagnostic AI for Ghana. Review vehicle breakdown symptoms and provide a fast, reassuring, professional preliminary mechanical assessment. Return only structured JSON. Keep the problem concise and include safe, actionable recommendations.`,
        maxOutputTokens: 350,
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
              description: 'Up to three safe actions the driver can take.',
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
    } catch (parseError) {
      console.error('[AI PARSE ERROR]', parseError, 'Raw Reply:', aiReply)
      diagnosisData = buildFallbackDiagnosis(symptoms)
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
