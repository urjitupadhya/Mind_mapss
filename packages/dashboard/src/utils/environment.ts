export interface EnvironmentContext {
  location: {
    timezone: string;
    hour: number;
    dayOfWeek: number;
    latitude?: number;
    longitude?: number;
  };
  weather?: {
    temperature: number;
    condition: string;
    aqi?: number;
    aqiLevel?: string;
  };
  calendar?: {
    eventsNext2Hours: number;
    meetingsToday: number;
    focusTimeAvailable: number;
  };
  contextualFactors: string[];
  combinedRiskScore: number;
}

export async function getEnvironmentContext(): Promise<EnvironmentContext> {
  const factors: string[] = [];
  let combinedRisk = 0;

  const now = new Date();
  const hour = now.getHours();
  const dayOfWeek = now.getDay();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  let lat = 40.71;
  let lon = -74.01;

  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
    });
    lat = position.coords.latitude;
    lon = position.coords.longitude;
  } catch (e) {
    // Fallback to NY or handle as needed
  }

  if (hour >= 22 || hour < 6) {
    factors.push('late_night');
    combinedRisk += 25;
  } else if (hour >= 20 || hour < 8) {
    factors.push('evening_early_morning');
    combinedRisk += 10;
  }

  if (dayOfWeek === 0 || dayOfWeek === 6) {
    factors.push('weekend');
    combinedRisk -= 10;
  }

  let weather = undefined;
  try {
    const weatherData = await getWeatherData(lat, lon);
    if (weatherData) {
      weather = weatherData;
      if (weatherData.aqi && weatherData.aqi > 100) {
        factors.push('poor_air_quality');
        combinedRisk += 15;
      }
      if (weatherData.temperature > 30 || weatherData.temperature < 15) {
        factors.push('extreme_temperature');
        combinedRisk += 10;
      }
    }
  } catch (e) {
    // Weather API unavailable
  }

  return {
    location: {
      timezone,
      hour,
      dayOfWeek,
      latitude: lat,
      longitude: lon
    },
    weather,
    contextualFactors: factors,
    combinedRiskScore: Math.min(100, Math.max(0, combinedRisk))
  };
}

async function getWeatherData(lat: number, lon: number): Promise<{ temperature: number; condition: string; aqi?: number } | null> {
  try {
    // Fetch both weather and air quality in parallel
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
    const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi`;

    const [weatherRes, aqiRes] = await Promise.all([
      fetch(weatherUrl, { signal: AbortSignal.timeout(3000) }),
      fetch(aqiUrl, { signal: AbortSignal.timeout(3000) })
    ]);

    if (!weatherRes.ok) return null;

    const weatherData = await weatherRes.json();
    const temp = weatherData.current_weather?.temperature;

    let aqi = undefined;
    if (aqiRes.ok) {
      const aqiData = await aqiRes.json();
      aqi = aqiData.current?.us_aqi;
    }

    return {
      temperature: temp,
      condition: getWeatherCondition(temp),
      aqi
    };
  } catch (e) {
    return null;
  }
}

function getWeatherCondition(temp: number): string {
  if (temp > 30) return 'hot';
  if (temp > 22) return 'warm';
  if (temp > 15) return 'mild';
  if (temp > 5) return 'cool';
  return 'cold';
}

async function getCalendarData(): Promise<{ eventsNext2Hours: number; meetingsToday: number; focusTimeAvailable: number } | null> {
  try {
    if (!window.google?.calendar) {
      return null;
    }

    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const response = await window.google.calendar.events.list({
      timeMin: now.toISOString(),
      timeMax: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
      singleEvents: true,
      maxResults: 10
    });

    const todayResponse = await window.google.calendar.events.list({
      timeMin: now.toISOString(),
      timeMax: endOfDay.toISOString(),
      singleEvents: true,
      maxResults: 50
    });

    const meetingsToday = (todayResponse.result?.items || []).filter(
      (event: { summary?: string }) => event.summary?.toLowerCase().includes('meeting') ||
        event.summary?.toLowerCase().includes('sync') ||
        event.summary?.toLowerCase().includes('1:1')
    ).length;

    return {
      eventsNext2Hours: (response.result?.items || []).length,
      meetingsToday,
      focusTimeAvailable: Math.max(0, 8 - meetingsToday)
    };
  } catch (e) {
    return null;
  }
}

export function getTimeOfDayLabel(hour: number): string {
  if (hour >= 5 && hour < 8) return 'early_morning';
  if (hour >= 8 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 14) return 'lunch';
  if (hour >= 14 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 20) return 'evening';
  if (hour >= 20 && hour < 22) return 'night';
  return 'late_night';
}

export function getEnvironmentRecommendation(context: EnvironmentContext): string {
  const { hour, dayOfWeek } = context.location;
  const risk = context.combinedRiskScore;

  if (context.contextualFactors.includes('late_night') && risk > 30) {
    return "You're coding late at night with additional environmental stressors. Consider stopping soon.";
  }

  if (context.contextualFactors.includes('upcoming_meetings')) {
    return "You have meetings coming up. Consider a quick break before they start.";
  }

  if (context.contextualFactors.includes('poor_air_quality')) {
    return "Air quality is poor in your area. Ensure good ventilation while coding.";
  }

  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return "Weekend coding - enjoy! Just remember to balance work and rest.";
  }

  if (hour >= 14 && hour <= 16) {
    return "Post-lunch dip zone. Coffee or a short walk might help maintain focus.";
  }

  if (risk < 20) {
    return "Great conditions for deep focus work. Maximize this window!";
  }

  return "Conditions are okay. Stay mindful of your energy levels.";
}
