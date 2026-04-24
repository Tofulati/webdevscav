import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash',
  generationConfig: {
    temperature: 0.9,
    topP: 0.95,
    maxOutputTokens: 16384,
  },
});

export async function generateContent(prompt: string): Promise<string> {
  const result = await model.generateContent(prompt);
  const response = result.response;
  return response.text();
}

export function isGeminiConfigured(): boolean {
  return apiKey.length > 0 && apiKey !== 'your_gemini_api_key_here';
}
