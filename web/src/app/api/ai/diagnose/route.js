// // /**
// //  * AI Diagnostic Endpoint
// //  * Server-side route handler for GoogleGenAI diagnosis
// //  * Accepts vehicle description and returns AI analysis

import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

let ai
function getAi() {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error('Missing GEMINI_API_KEY')
    }
    ai = new GoogleGenAI({ apiKey })
  }
  return ai
}

export async function POST(request) {
  try {
    const { message, history } = await request.json();

    // System prompt engineering to keep the AI focused exclusively on mechanical aid
    const systemInstruction = `
      You are the RoadRescue Expert AI Diagnostic System operating in Ghana. 
      Your task is to review vehicle breakdown symptoms and provide a fast, reassuring, 
      and highly accurate preliminary mechanical failure assessment. 
      Keep answers punchy, structural (max 3 sentences), and format them clearly for mobile viewports.
    `;

    // Safe fallback check if your key is not configured in local environment configs yet
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({
        reply: `Pre-compiled Assessment: The symptoms for "${message}" almost resembles battery current drops or fuel system pressure losses. Please check terminal connections.`
      });
    }

    // Gemini Free Tier model engine layer
    const response = await getAi().models.generateContent({
      model: 'gemini-2.5-flash',
      contents: message,
      config: {
        systemInstruction: systemInstruction,
        maxOutputTokens: 250,
        temperature: 0.7
      }
    });

    const aiReply = response.text || "Diagnostic system recalculating parameters. Please try again.";

    return NextResponse.json({ reply: aiReply });
  } catch (error) {
    console.error("[AI FAULT]", error);
    return NextResponse.json(
      { error: "Diagnostic module currently busy" }, 
      { status: 500 }
    );
  }
}