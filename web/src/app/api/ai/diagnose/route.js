/**
 * AI Diagnostic Endpoint
 * Server-side route handler for OpenAI diagnosis
 * Accepts vehicle description and returns AI analysis
 */

import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    const { vehicleDescription, symptoms } = await request.json();

    if (!vehicleDescription || !symptoms) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400 }
      );
    }

    const message = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert automotive mechanic. Analyze the vehicle description and symptoms provided and give a brief, professional diagnosis.',
        },
        {
          role: 'user',
          content: `Vehicle: ${vehicleDescription}\n\nSymptoms: ${symptoms}\n\nProvide a brief diagnosis and recommended repair priority (High/Medium/Low).`,
        },
      ],
    });

    const diagnosis = message.choices[0].message.content;

    return new Response(JSON.stringify({ diagnosis }), { status: 200 });
  } catch (error) {
    console.error('AI Diagnostic error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate diagnosis' }),
      { status: 500 }
    );
  }
}
