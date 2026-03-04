// MegaLLM Integration Service
// Handles all AI-powered insights using the configured LLM endpoint
// Configuration - these would come from environment variables in production
const MEGALLM_API_URL = process.env.MEGALLM_API_URL || 'https://api.megallm.com/v1/chat';
const MEGALLM_API_KEY = process.env.MEGALLM_API_KEY || '';
const MEGALLM_MODEL = process.env.MEGALLM_MODEL || 'megallm-2.5';
// Default system prompts for each insight type
const SYSTEM_PROMPTS = {
    session: `You are a behavioural cognitive pattern analyst for MindLint, a developer cognitive observability platform.
Your role is to analyze aggregated telemetry metrics from coding sessions and provide structured insight.
IMPORTANT: Never diagnose medical conditions. Always frame as behavioural patterns and suggestions.
Never mention specific code content. Never diagnose - use "pattern" language.
Keep insights constructive and brief. Focus on behaviours, not personality.`,
    weekly: `You are generating a weekly cognitive health report for a developer.
This is their "weather report" for their coding mind.
Be warm, supportive, like a thoughtful coach. Use "cognitive" and "behavioural" framing.
Never clinical or diagnostic. Be specific with times and numbers from the data.`,
    recovery: `You are suggesting recovery strategies for a developer showing signs of cognitive strain.
Be actionable and specific. Respect the developer's context.
Frame as "helpful options" not mandates.`,
    forecast: `You are interpreting time-series forecast data for the next 24 hours.
This helps developers plan their day. Provide clear, actionable guidance.
Use weather metaphors for accessibility.`,
    nudge: `Generate a supportive micro-suggestion under 20 words.
Should feel like a helpful teammate, not a warning.
Encouraging, not chastising.`
};
// Call MegaLLM API
async function callMegaLLM(messages, temperature = 0.5) {
    try {
        const response = await fetch(MEGALLM_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${MEGALLM_API_KEY}`
            },
            body: JSON.stringify({
                model: MEGALLM_MODEL,
                messages,
                temperature,
                max_tokens: 1000
            })
        });
        if (!response.ok) {
            throw new Error(`MegaLLM API error: ${response.status}`);
        }
        const data = await response.json();
        return data.choices[0].message.content;
    }
    catch (error) {
        console.error('MegaLLM API call failed:', error);
        // Return fallback response
        return getFallbackResponse('session');
    }
}
// Fallback responses when API is unavailable
function getFallbackResponse(type) {
    const fallbacks = {
        session: JSON.stringify({ summary: "Session analyzed with standard patterns.", patterns: ["Consistent coding activity detected"], insight: "Take short breaks to maintain focus.", flow_assessment: "mixed" }),
        weekly: JSON.stringify({ metaphor: "A week of steady progress with some turbulent moments.", key_patterns: ["Morning sessions show highest stability", "Error rates spike in late afternoon"], strongest_window: { start: 9, end: 12 }, concerns: null, suggestions: ["Protect your morning hours for deep work", "Take breaks in late afternoon"], closing: "Overall a productive week!" }),
        recovery: JSON.stringify({ immediate: "Take a 2-minute stretch break.", short_term: "Step away for 10 minutes of movement.", strategic: "Consider ending this session soon for better tomorrow." }),
        forecast: JSON.stringify({ weather_summary: "Stable conditions expected for morning hours, with some afternoon turbulence.", optimal_window: { start: 9, end: 12 }, high_risk_windows: [{ start: 14, end: 16, reason: "post-lunch dip" }], key_insight: "Morning is your peak cognitive window." }),
        nudge: JSON.stringify({ message: "Taking a quick break might boost your productivity." })
    };
    return fallbacks[type] || fallbacks.session;
}
// Generate session analysis
export async function generateSessionInsight(context) {
    const systemPrompt = SYSTEM_PROMPTS.session;
    const userPrompt = `Analyze this coding session data and provide insights:

Hour: ${context.hour}
Stability Score: ${context.avg_stability}/100
Error Rate: ${context.error_rate}
Complexity Index: ${context.complexity_index}/10
Session Duration: ${context.session_duration} minutes
Typing Variance: ${context.typing_cadence_variance || 'N/A'}
Undo Spikes: ${context.undo_spikes || 0}
File Switches: ${context.file_switches || 0}

Provide JSON with: summary, patterns (array), insight, flow_assessment`;
    try {
        const response = await callMegaLLM([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ], 0.4);
        return parseJSONResponse(response, 'session');
    }
    catch (error) {
        return JSON.parse(getFallbackResponse('session'));
    }
}
// Generate weekly report
export async function generateWeeklyInsight(context) {
    const systemPrompt = SYSTEM_PROMPTS.weekly;
    const dailySummary = context.dailyData.map(d => `Day ${d.date}: Stability ${d.avg_daily_stability}, Time ${d.total_session_time}min, Errors: ${d.error_rate_trend}, Peak: ${d.peak_flow_hour}h`).join('\n');
    const userPrompt = `Generate a weekly narrative report from this data:

${dailySummary}

Provide JSON with: metaphor, key_patterns (array), strongest_window ({start, end}), concerns (array or null), suggestions (array), closing`;
    try {
        const response = await callMegaLLM([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ], 0.7);
        return parseJSONResponse(response, 'weekly');
    }
    catch (error) {
        return JSON.parse(getFallbackResponse('weekly'));
    }
}
// Generate recovery suggestions
export async function generateRecoveryInsight(context) {
    const systemPrompt = SYSTEM_PROMPTS.recovery;
    const userPrompt = `Generate recovery suggestions for:
- Current Stability: ${context.current_stability}/100
- Session Length: ${context.session_length} minutes
- Error Rate: ${context.error_rate}
- Time Since Break: ${context.time_since_last_break} minutes
- Hour: ${context.hour_of_day}:00

Provide JSON with: immediate, short_term, strategic (each under 15 words)`;
    try {
        const response = await callMegaLLM([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ], 0.5);
        return parseJSONResponse(response, 'recovery');
    }
    catch (error) {
        return JSON.parse(getFallbackResponse('recovery'));
    }
}
// Generate forecast interpretation
export async function generateForecastInterpretation(context) {
    const systemPrompt = SYSTEM_PROMPTS.forecast;
    const forecastSummary = context.hourly_forecast.slice(0, 12).map(f => `${f.hour}:00 - Stability: ${f.predicted_stability}, Risk: ${f.risk_score}`).join('\n');
    const userPrompt = `Interpret this 24-hour cognitive forecast:

${forecastSummary}

${context.last_3_days_avg_stability ? `3-day avg stability: ${context.last_3_days_avg_stability}` : ''}
${context.weekly_trend ? `Weekly trend: ${context.weekly_trend}` : ''}

Provide JSON with: weather_summary, optimal_window ({start, end}), high_risk_windows ([{start, end, reason}]), key_insight`;
    try {
        const response = await callMegaLLM([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ], 0.5);
        return parseJSONResponse(response, 'forecast');
    }
    catch (error) {
        return JSON.parse(getFallbackResponse('forecast'));
    }
}
// Generate micro-nudge
export async function generateNudge(context) {
    const systemPrompt = SYSTEM_PROMPTS.nudge;
    const userPrompt = `Generate a supportive message under 20 words.

Trigger: ${context.trigger_type}
Current Stability: ${context.current_stability}/100
Session Duration: ${context.session_duration} minutes

Provide JSON with: message`;
    try {
        const response = await callMegaLLM([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ], 0.3);
        return parseJSONResponse(response, 'nudge');
    }
    catch (error) {
        return JSON.parse(getFallbackResponse('nudge'));
    }
}
// Main export function for generating insights
export async function generateMegaLLMInsight(type, context) {
    let result;
    switch (type) {
        case 'session':
            result = await generateSessionInsight(context);
            break;
        case 'weekly':
            result = await generateWeeklyInsight(context);
            break;
        case 'recovery':
            result = await generateRecoveryInsight(context);
            break;
        case 'forecast':
            result = await generateForecastInterpretation(context);
            break;
        case 'nudge':
            result = await generateNudge(context);
            break;
        default:
            result = JSON.parse(getFallbackResponse('session'));
    }
    // Ensure result has message field
    if (!result.message) {
        result.message = typeof result === 'string' ? result : JSON.stringify(result);
    }
    return result;
}
// Helper to parse JSON from LLM response
function parseJSONResponse(response, fallbackType) {
    try {
        // Try to find JSON in response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        return JSON.parse(response);
    }
    catch (error) {
        console.error('Failed to parse LLM response as JSON:', error);
        return JSON.parse(getFallbackResponse(fallbackType));
    }
}
