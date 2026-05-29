// /**
//  * AI Diagnostic Endpoint
//  * Server-side route handler for OpenAI diagnosis
//  * Accepts vehicle description and returns AI analysis
//  */

// import { OpenAI } from 'openai';

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// export async function POST(request) {
//   try {
//     const { vehicleDescription, symptoms } = await request.json();

//     if (!vehicleDescription || !symptoms) {
//       return new Response(
//         JSON.stringify({ error: 'Missing required fields' }),
//         { status: 400 }
//       );
//     }

//     const message = await openai.chat.completions.create({
//       model: 'gpt-4',
//       messages: [
//         {
//           role: 'system',
//           content:
//             'You are an expert automotive mechanic. Analyze the vehicle description and symptoms provided and give a brief, professional diagnosis.',
//         },
//         {
//           role: 'user',
//           content: `Vehicle: ${vehicleDescription}\n\nSymptoms: ${symptoms}\n\nProvide a brief diagnosis and recommended repair priority (High/Medium/Low).`,
//         },
//       ],
//     });

//     const diagnosis = message.choices[0].message.content;

//     return new Response(JSON.stringify({ diagnosis }), { status: 200 });
//   } catch (error) {
//     console.error('AI Diagnostic error:', error);
//     return new Response(
//       JSON.stringify({ error: 'Failed to generate diagnosis' }),
//       { status: 500 }
//     );
//   }
// }
// web/src/app/api/ai/diagnose/route.js

import { createClient } from '@/lib/supabase/server'
import { getOpenAI } from '@/lib/openai'
import { NextResponse } from 'next/server'
import { diagnoseLimiter } from '@/lib/rateLimit'

// the system prompt defines exactly how the AI behaves.
// we constrain it hard — no general conversation, only structured diagnosis.
// it must always return valid JSON matching our schema.
const DIAGNOSTIC_SYSTEM_PROMPT = `
You are an automotive fault diagnosis assistant for RoadRescue, a roadside emergency platform in Ghana.

A stranded driver will describe their vehicle problem in plain language.
Your job is to analyze their description and return a structured JSON diagnosis.

You must ALWAYS respond with valid JSON only. No explanation text. No markdown. No code blocks.
Just the raw JSON object.

Return exactly this structure:
{
  "fault_category": string,
  "urgency": "low" | "medium" | "high" | "critical",
  "recommended_service": "repair" | "towing" | "tyre_change" | "battery_jump" | "fuel_delivery" | "other",
  "summary": string,
  "safety_advice": string,
  "can_drive": boolean
}

Field rules:
- fault_category: short label e.g. "Engine Overheating", "Flat Tyre", "Dead Battery", "Transmission Failure"
- urgency: how dangerous is it to stay or attempt to move the vehicle
- recommended_service: maps to our platform service types — pick the most appropriate
- summary: 1-2 sentences explaining the likely fault in simple language the driver understands
- safety_advice: one clear safety instruction for the driver while they wait e.g. "Turn on hazard lights and move away from traffic"
- can_drive: true only if it is reasonably safe to drive slowly to a nearby mechanic

If the description is too vague to diagnose, still return the JSON with fault_category "Unknown" and urgency "medium".
Never refuse to return JSON. Never add text outside the JSON object.
`

export async function POST(req) {
  try {
    // 1. auth check — only logged in users can use the diagnostic
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // rate limit by user id — each user gets 5 diagnoses per minute
    const { allowed } = diagnoseLimiter(user.id)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait before trying again.' },
        { status: 429 }
      )
    }

    const body = await req.json()
    const { symptoms, vehicleMake, vehicleModel, vehicleYear } = body

    // 2. validate input
    if (!symptoms || symptoms.trim().length < 10) {
      return NextResponse.json(
        { error: 'Please describe your problem in more detail' },
        { status: 400 }
      )
    }

    // 3. build the user message
    // include vehicle context if available — improves diagnosis accuracy
    const vehicleContext = vehicleMake
      ? `Vehicle: ${vehicleYear || ''} ${vehicleMake} ${vehicleModel || ''}`.trim()
      : null

    const userMessage = vehicleContext
      ? `${vehicleContext}\n\nProblem description: ${symptoms}`
      : `Problem description: ${symptoms}`

    // 4. call OpenAI
    const openai = getOpenAI()
    if (!openai) {
      throw new Error('OPENAI_API_KEY is not configured')
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 500,    // diagnosis is short — cap tokens to control cost
      temperature: 0.2,   // low temperature = more consistent, less creative
      messages: [
        { role: 'system', content: DIAGNOSTIC_SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
    })

    const rawResponse = completion.choices[0]?.message?.content

    if (!rawResponse) {
      throw new Error('No response from OpenAI')
    }

    // 5. parse and validate the JSON response
    let diagnosis
    try {
      diagnosis = JSON.parse(rawResponse)
    } catch {
      // if GPT returned malformed JSON despite our prompt, return a safe fallback
      console.error('[AI Diagnose] Failed to parse GPT response:', rawResponse)
      diagnosis = {
        fault_category: 'Unknown',
        urgency: 'medium',
        recommended_service: 'repair',
        summary: 'We could not automatically diagnose your issue. A mechanic will assess on arrival.',
        safety_advice: 'Turn on your hazard lights and stay safely away from moving traffic.',
        can_drive: false,
      }
    }

    // 6. validate required fields exist — defensive check
    const requiredFields = [
      'fault_category',
      'urgency',
      'recommended_service',
      'summary',
      'safety_advice',
      'can_drive',
    ]

    const missingFields = requiredFields.filter(f => !(f in diagnosis))
    if (missingFields.length > 0) {
      // patch missing fields with safe defaults rather than erroring
      missingFields.forEach(field => {
        if (field === 'can_drive') diagnosis[field] = false
        else if (field === 'urgency') diagnosis[field] = 'medium'
        else if (field === 'recommended_service') diagnosis[field] = 'repair'
        else diagnosis[field] = 'Not available'
      })
    }

    return NextResponse.json({ diagnosis }, { status: 200 })

  } catch (err) {
    // if OpenAI is down or rate limited, return a graceful fallback
    // the driver can still submit their request without a diagnosis
    console.error('[POST /api/ai/diagnose]', err.message)

    const fallback = {
      fault_category: 'Unknown',
      urgency: 'medium',
      recommended_service: 'repair',
      summary: 'Diagnostic service is temporarily unavailable. A mechanic will assess your vehicle on arrival.',
      safety_advice: 'Turn on your hazard lights and stay safely away from moving traffic.',
      can_drive: false,
    }

    // return 200 with fallback so the frontend flow is not broken
    // the driver should never be blocked by an AI failure
    return NextResponse.json({ diagnosis: fallback, fallback: true }, { status: 200 })
  }
}



// Usage in a route handler — add to the diagnose route:
// web/src/app/api/ai/diagnose/route.js (updated top section)




