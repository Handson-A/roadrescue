// /**
//  * OpenAI Client Setup
//  * Configuration for OpenAI API integration
//  */

// import OpenAI from 'openai';

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
//   organization: process.env.OPENAI_ORG_ID,
// });

// /**
//  * DiagnoseVehicleIssue - Get AI diagnosis for vehicle problems
//  * @param {string} vehicleDescription - Description of the vehicle
//  * @param {string} symptoms - Symptoms experienced by driver
//  * @returns {Promise<string>} - AI generated diagnosis
//  */
// export async function diagnoseVehicleIssue(vehicleDescription, symptoms) {
//   try {
//     const message = await openai.chat.completions.create({
//       model: 'gpt-4',
//       messages: [
//         {
//           role: 'system',
//           content:
//             'You are an expert automotive mechanic providing diagnostics. Be concise and professional. Focus on likely issues and severity.',
//         },
//         {
//           role: 'user',
//           content: `Vehicle: ${vehicleDescription}\n\nSymptoms: ${symptoms}\n\nProvide a brief diagnosis with priority level (HIGH/MEDIUM/LOW).`,
//         },
//       ],
//       max_tokens: 500,
//       temperature: 0.7,
//     });

//     return message.choices[0].message.content;
//   } catch (error) {
//     console.error('OpenAI API error:', error);
//     throw error;
//   }
// }

// export default openai;
// web/src/lib/openai.js
// Server-side only. Never import this in a component.
// OPENAI_API_KEY has no NEXT_PUBLIC_ prefix — stays on the server.

import OpenAI from 'openai'

let openaiClient = null

export function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) return null
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return openaiClient
}

export default getOpenAI