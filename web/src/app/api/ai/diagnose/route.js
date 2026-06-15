// import { NextResponse } from 'next/server';
// import { GoogleGenAI, Type } from '@google/genai';

// let ai;
// function getAi() {
//   if (!ai) {
//     const apiKey = process.env.GEMINI_API_KEY;
//     if (!apiKey) {
//       throw new Error('Missing GEMINI_API_KEY');
//     }
//     ai = new GoogleGenAI({ apiKey });
//   }
//   return ai;
// }

// // Utility cleanup wrapper if there are any lingering markdown wrappers
// function cleanJsonString(rawText) {
//   if (!rawText) return '{}';
//   let clean = rawText.trim();
//   if (clean.startsWith('```')) {
//     clean = clean.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
//   }
//   return clean;
// }

// export async function POST(request) {
//   try {
//     const body = await request.json();
//     const symptoms = typeof body.symptoms === 'string' ? body.symptoms.trim() : '';
//     const vehicleMake = typeof body.vehicleMake === 'string' ? body.vehicleMake.trim() : '';
//     const vehicleModel = typeof body.vehicleModel === 'string' ? body.vehicleModel.trim() : '';
//     const vehicleYear = typeof body.vehicleYear === 'string' ? body.vehicleYear.trim() : '';

//     const fallbackDiagnosis = {
//       problem: `Unable to diagnose: "${symptoms || 'vehicle issue'}"`,
//       severity: 'medium',
//       recommendations: [
//         'Check battery terminal connections',
//         'Verify fuel levels',
//         'Inspect warning lights on dashboard',
//       ],
//       estimated_causes: [
//         'Ignition system components',
//         'Fuel system pressure loss',
//         'Electrical sensor fault',
//       ],
//     };

//     if (!symptoms || !process.env.GEMINI_API_KEY) {
//       return NextResponse.json({
//         success: true,
//         diagnosis: fallbackDiagnosis,
//       });
//     }

//     const systemInstruction = `
// You are the RoadRescue Expert AI Diagnostic System operating in Ghana.
// Your task is to review vehicle breakdown symptoms and provide a fast, reassuring,
// and highly accurate preliminary mechanical failure assessment.
// Keep answers punchy, structural (max 3 sentences), and format them clearly for mobile viewports.
// ${vehicleMake ? `Vehicle Make: ${vehicleMake}` : ''}
// ${vehicleModel ? `Vehicle Model: ${vehicleModel}` : ''}
// ${vehicleYear ? `Vehicle Year: ${vehicleYear}` : ''}
// `;

//     // Production Hardening: Enforce explicit structural outputs via native schema definitions
//     const response = await getAi().models.generateContent({
//       model: 'gemini-2.5-flash',
//       contents: symptoms,
//       config: {
//         systemInstruction: systemInstruction,
//         maxOutputTokens: 350,
//         temperature: 0.2, // Lowered temperature to reduce variations and increase reliability
//         responseMimeType: 'application/json',
//         responseSchema: {
//           type: Type.OBJECT,
//           properties: {
//             problem: { 
//               type: Type.STRING, 
//               description: 'A brief, punchy description of the primary structural vehicle problem.' 
//             },
//             severity: { 
//               type: Type.STRING, 
//               enum: ['low', 'medium', 'high', 'critical'] 
//             },
//             recommendations: {
//               type: Type.ARRAY,
//               items: { type: Type.STRING },
//               description: 'Up to three actionable security or diagnostic steps the driver can take safely.'
//             },
//             estimated_causes: {
//               type: Type.ARRAY,
//               items: { type: Type.STRING },
//               description: 'Top probable mechanical or electrical items causing this symptom.'
//             }
//           },
//           required: ['problem', 'severity', 'recommendations', 'estimated_causes'],
//         }
//       },
//     });

//     let diagnosisData;
//     const aiReply = response.text;
    
//     try {
//       // Run fallback cleanup step just in case of odd response streaming fragments
//       const safeJsonText = cleanJsonString(aiReply);
//       diagnosisData = JSON.parse(safeJsonText);
//     } catch (parseError) {
//       console.error('[AI PARSE ERROR]', parseError, 'Raw Reply:', aiReply);
//       diagnosisData = {
//         problem: symptoms ? `Assessment for: ${symptoms}` : 'Diagnostic parameters requiring attention',
//         severity: 'medium',
//         recommendations: ['Please consult a verified responder for standard diagnostics.'],
//         estimated_causes: ['Complex system diagnostics fault'],
//       };
//     }

//     return NextResponse.json({
//       success: true,
//       diagnosis: diagnosisData,
//     });

//   } catch (error) {
//     console.error('[AI FAULT]', error);
//     return NextResponse.json(
//       {
//         success: false,
//         error: 'Diagnostic module currently busy',
//         diagnosis: {
//           problem: 'Diagnostic module currently busy',
//           severity: 'medium',
//           recommendations: [],
//           estimated_causes: [],
//         },
//       },
//       { status: 500 }
//     );
//   }
// }
import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';

let ai;
function getAi() {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Missing GEMINI_API_KEY');
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
}

function cleanJsonString(rawText) {
  if (!rawText) return '{}';
  let clean = rawText.trim();
  if (clean.startsWith('```')) {
    clean = clean.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
  }
  return clean;
}

// Production Helper: Exponential backoff mechanism to handle 503 spikes gracefully
async function generateContentWithRetry(params, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await getAi().models.generateContent(params);
    } catch (error) {
      const is503 = error?.status === 503 || error?.message?.includes('503') || error?.message?.includes('high demand');
      
      if (is503 && i < retries - 1) {
        console.warn(`[AI RETRY] Model busy (503). Retrying attempt ${i + 1} of ${retries} in ${delay}ms...`);
        await new Promise((res) => setTimeout(res, delay));
        delay *= 2; // Double the wait time for the next attempt
        continue;
      }
      throw error; // Re-throw if it's not a 503 or we ran out of retry attempts
    }
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const symptoms = typeof body.symptoms === 'string' ? body.symptoms.trim() : '';
    const vehicleMake = typeof body.vehicleMake === 'string' ? body.vehicleMake.trim() : '';
    const vehicleModel = typeof body.vehicleModel === 'string' ? body.vehicleModel.trim() : '';
    const vehicleYear = typeof body.vehicleYear === 'string' ? body.vehicleYear.trim() : '';

    const fallbackDiagnosis = {
      problem: `Unable to diagnose: "${symptoms || 'vehicle issue'}"`,
      severity: 'medium',
      recommendations: [
        'Check battery terminal connections',
        'Verify fuel levels',
        'Inspect warning lights on dashboard',
      ],
      estimated_causes: [
        'Ignition system components',
        'Fuel system pressure loss',
        'Electrical sensor fault',
      ],
    };

    if (!symptoms || !process.env.GEMINI_API_KEY) {
      return NextResponse.json({
        success: true,
        diagnosis: fallbackDiagnosis,
      });
    }

    const systemInstruction = `
You are the RoadRescue Expert AI Diagnostic System operating in Ghana.
Your task is to review vehicle breakdown symptoms and provide a fast, reassuring,
and highly accurate preliminary mechanical failure assessment.
Keep answers punchy, structural (max 3 sentences), and format them clearly for mobile viewports.
${vehicleMake ? `Vehicle Make: ${vehicleMake}` : ''}
${vehicleModel ? `Vehicle Model: ${vehicleModel}` : ''}
${vehicleYear ? `Vehicle Year: ${vehicleYear}` : ''}
`;

    // Wrapped execution block with backoff resiliency strategy
    const response = await generateContentWithRetry({
      model: 'gemini-2.5-flash',
      contents: symptoms,
      config: {
        systemInstruction: systemInstruction,
        maxOutputTokens: 350,
        temperature: 0.2,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            problem: { 
              type: Type.STRING, 
              description: 'A brief, punchy description of the primary structural vehicle problem.' 
            },
            severity: { 
              type: Type.STRING, 
              enum: ['low', 'medium', 'high', 'critical'] 
            },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Up to three actionable security or diagnostic steps the driver can take safely.'
            },
            estimated_causes: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Top probable mechanical or electrical items causing this symptom.'
            }
          },
          required: ['problem', 'severity', 'recommendations', 'estimated_causes'],
        }
      },
    });

    let diagnosisData;
    const aiReply = response.text;
    
    try {
      const safeJsonText = cleanJsonString(aiReply);
      diagnosisData = JSON.parse(safeJsonText);
    } catch (parseError) {
      console.error('[AI PARSE ERROR]', parseError, 'Raw Reply:', aiReply);
      diagnosisData = {
        problem: symptoms ? `Assessment for: ${symptoms}` : 'Diagnostic parameters requiring attention',
        severity: 'medium',
        recommendations: ['Please consult a verified responder for standard diagnostics.'],
        estimated_causes: ['Complex system diagnostics fault'],
      };
    }

    return NextResponse.json({
      success: true,
      diagnosis: diagnosisData,
    });

  } catch (error) {
    console.error('[AI FAULT INTERCEPTED]', error);
    
    // Check if it ultimately failed with a 503 capacity rate-limit
    const is503 = error?.status === 503 || error?.message?.includes('503') || error?.message?.includes('high demand');

    return NextResponse.json(
      {
        success: false,
        error: is503 ? 'High traffic load on diagnostic network' : 'Diagnostic module currently busy',
        diagnosis: {
          problem: 'The diagnostic system is experiencing high demand. Please check alternative common symptoms options below.',
          severity: 'medium',
          recommendations: ['Re-try submitting your input symptom phrase in a few seconds.', 'Check dashboard cluster icons.'],
          estimated_causes: ['AI Infrastructure API congestion'],
        },
      },
      { status: is503 ? 503 : 500 }
    );
  }
}