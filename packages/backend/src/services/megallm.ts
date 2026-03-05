import { GoogleGenerativeAI } from "@google/generative-ai";

// Configuration for Gemini
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

// Default system prompts for each insight type
const SYSTEM_PROMPTS = {
  session: `You are a behavioural cognitive pattern analyst for MindLint, a developer cognitive observability platform.
Analyze aggregated telemetry metrics from coding sessions and provide structured insight.
IMPORTANT: Never diagnose medical conditions. Always frame as behavioural patterns and suggestions.
Never mention specific code content. Never diagnose - use "pattern" language.
Keep insights constructive and brief. Focus on behaviours, not personality.
Your output MUST be a valid JSON object.`,

  weekly: `You are generating a weekly cognitive health report for a developer.
This is their "weather report" for their coding mind.
Be warm, supportive, like a thoughtful coach. Use "cognitive" and "behavioural" framing.
Never clinical or diagnostic. Be specific with times and numbers from the data.
Your output MUST be a valid JSON object.`,

  recovery: `You are suggesting recovery strategies for a developer showing signs of cognitive strain.
Be actionable and specific. Respect the developer's context.
Frame as "helpful options" not mandates.
Your output MUST be a valid JSON object.`,

  forecast: `You are interpreting time-series forecast data for the next 24 hours.
This helps developers plan their day. Provide clear, actionable guidance.
Use weather metaphors for accessibility.
Your output MUST be a valid JSON object.`,

  nudge: `Generate a supportive micro-suggestion under 20 words.
Should feel like a helpful teammate, not a warning.
Encouraging, not chastising.
Your output MUST be a valid JSON object.`
};

// Call Gemini API
async function callGemini(messages: Array<{ role: string; content: string }>, type: string): Promise<string> {
  if (!genAI) {
    console.warn('GEMINI_API_KEY not set, using fallback responses');
    return getFallbackResponse(type);
  }

  try {
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

    // Combine system prompt and user history for Gemini
    const systemPrompt = messages.find(m => m.role === 'system')?.content || '';
    const userPrompt = messages.find(m => m.role === 'user')?.content || '';

    const prompt = `SYSTEM INSTRUCTIONS: ${systemPrompt}\n\nUSER DATA: ${userPrompt}\n\nRespond only with the JSON object as requested.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    return responseText;
  } catch (error) {
    console.error('Gemini API call failed:', error);
    return getFallbackResponse(type);
  }
}

// Fallback responses when API is unavailable
function getFallbackResponse(type: string): string {
  const fallbacks: Record<string, string> = {
    session: JSON.stringify({ summary: "Session analyzed with standard patterns.", patterns: ["Consistent coding activity detected"], insight: "Take short breaks to maintain focus.", flow_assessment: "mixed" }),
    weekly: JSON.stringify({ metaphor: "A week of steady progress with some turbulent moments.", key_patterns: ["Morning sessions show highest stability", "Error rates spike in late afternoon"], strongest_window: { start: 9, end: 12 }, concerns: null, suggestions: ["Protect your morning hours for deep work", "Take breaks in late afternoon"], closing: "Overall a productive week!" }),
    recovery: JSON.stringify({ immediate: "Take a 2-minute stretch break.", short_term: "Step away for 10 minutes of movement.", strategic: "Consider ending this session soon for better tomorrow." }),
    forecast: JSON.stringify({ weather_summary: "Stable conditions expected for morning hours, with some afternoon turbulence.", optimal_window: { start: 9, end: 12 }, high_risk_windows: [{ start: 14, end: 16, reason: "post-lunch dip" }], key_insight: "Morning is your peak cognitive window." }),
    nudge: JSON.stringify({ message: "Taking a quick break might boost your productivity." })
  };
  return fallbacks[type] || fallbacks.session;
}

// Helper to sanitize and parse JSON
function parseJSONResponse(response: string, fallbackType: string): any {
  try {
    // Handle Markdown code blocks often returned by LLMs
    const cleaned = response.replace(/```json/g, '').replace(/```/g, '').trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('Failed to parse LLM response as JSON:', error, 'Original response:', response);
    return JSON.parse(getFallbackResponse(fallbackType));
  }
}

// Generate session analysis
export async function generateSessionInsight(context: any) {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPTS.session },
    { role: 'user', content: `Analyze session: Stability ${context.avg_stability}, Errors ${context.error_rate}, Duration ${context.session_duration}m.` }
  ];
  const response = await callGemini(messages, 'session');
  return parseJSONResponse(response, 'session');
}

// Generate weekly report
export async function generateWeeklyInsight(context: any) {
  const dailySummary = context.dailyData.map((d: any) =>
    `Date ${d.date}: Stability ${d.avg_daily_stability}, Time ${d.total_session_time}min, Peak ${d.peak_flow_hour}h`
  ).join('\n');

  const messages = [
    { role: 'system', content: SYSTEM_PROMPTS.weekly },
    { role: 'user', content: `Daily summary data:\n${dailySummary}` }
  ];
  const response = await callGemini(messages, 'weekly');
  return parseJSONResponse(response, 'weekly');
}

// Generate recovery suggestions
export async function generateRecoveryInsight(context: any) {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPTS.recovery },
    { role: 'user', content: `Status: Stability ${context.current_stability}, Session ${context.session_length}m, Errors ${context.error_rate}.` }
  ];
  const response = await callGemini(messages, 'recovery');
  return parseJSONResponse(response, 'recovery');
}

// Generate forecast interpretation
export async function generateForecastInterpretation(context: any) {
  const forecastSummary = context.hourly_forecast.slice(0, 12).map((f: any) =>
    `${f.hour}:00 - Stability ${f.predicted_stability}, Risk ${f.risk_score}`
  ).join('\n');

  const messages = [
    { role: 'system', content: SYSTEM_PROMPTS.forecast },
    { role: 'user', content: `Interpret 24h forecast:\n${forecastSummary}` }
  ];
  const response = await callGemini(messages, 'forecast');
  return parseJSONResponse(response, 'forecast');
}

// Generate micro-nudge
export async function generateNudge(context: any) {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPTS.nudge },
    { role: 'user', content: `Trigger ${context.trigger_type}, Stability ${context.current_stability}, Duration ${context.session_duration}m.` }
  ];
  const response = await callGemini(messages, 'nudge');
  return parseJSONResponse(response, 'nudge');
}

// Main export function
export async function generateMegaLLMInsight(type: string, context: object) {
  let result;
  switch (type) {
    case 'session': result = await generateSessionInsight(context); break;
    case 'weekly': result = await generateWeeklyInsight(context); break;
    case 'recovery': result = await generateRecoveryInsight(context); break;
    case 'forecast': result = await generateForecastInterpretation(context); break;
    case 'nudge': result = await generateNudge(context); break;
    default: result = await generateSessionInsight(context);
  }
  return { message: result.message || result.summary || JSON.stringify(result), data: result };
}
