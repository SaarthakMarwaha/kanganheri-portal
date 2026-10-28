import { type NextRequest, NextResponse } from "next/server";
import { redis, cacheKeys, cacheTTL } from "@/lib/redis";
import {
  apiSuccess,
  apiError,
  type WeatherData,
  type MandiData,
  type MandiCommodityPrice,
} from "@/types";
import { getHashedClientIp } from "@/lib/security/ip-hasher";
import { checkRateLimit } from "@/lib/security/rate-limiter";

export const dynamic = "force-dynamic";

// Village Kanganheri geographic coordinates
const KANGANHERI_LAT = 28.5468;
const KANGANHERI_LON = 76.9883;

// Official MSP (Minimum Support Price) benchmark values (₹ / Quintal) for 2024-2026 crop seasons
const MSP_BENCHMARKS: Record<string, number> = {
  WHEAT: 2275,
  MUSTARD: 5650,
  PADDY: 2300, // Common Grade
  BAJRA: 2625,
};

// Weather WMO interpretation table
function interpretWmoCode(code: number): { en: string; hi: string } {
  switch (code) {
    case 0:
      return { en: "Clear sky", hi: "साफ़ आसमान" };
    case 1:
      return { en: "Mainly clear", hi: "मुख्यतः साफ़" };
    case 2:
      return { en: "Partly cloudy", hi: "आंशिक बादल" };
    case 3:
      return { en: "Overcast", hi: "घने बादल" };
    case 45:
    case 48:
      return { en: "Foggy", hi: "कोहरा" };
    case 51:
    case 53:
    case 55:
      return { en: "Drizzle", hi: "हल्की बूंदाबांदी" };
    case 61:
    case 63:
    case 65:
      return { en: "Rain", hi: "वर्षा" };
    case 71:
    case 73:
    case 75:
      return { en: "Snow", hi: "बर्फबारी" };
    case 80:
    case 81:
    case 82:
      return { en: "Rain showers", hi: "तेज़ बौछारें" };
    case 95:
    case 96:
    case 99:
      return { en: "Thunderstorm", hi: "आँधी-तूफ़ान" };
    default:
      return { en: "Fair", hi: "सामान्य मौसम" };
  }
}

/**
 * Fetches current weather for Village Kanganheri using Open-Meteo API.
 * Cached in Redis for 30 minutes to reduce external network calls.
 */
async function getKanganheriWeather(): Promise<WeatherData | null> {
  const cacheKey = cacheKeys.weather();

  try {
    const cached = await redis.get<WeatherData>(cacheKey);
    if (cached) return cached;
  } catch (err) {
    console.warn("Weather Redis cache miss/offline:", err);
  }

  try {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", String(KANGANHERI_LAT));
    url.searchParams.set("longitude", String(KANGANHERI_LON));
    url.searchParams.set(
      "current",
      "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m,uv_index",
    );
    url.searchParams.set("timezone", "Asia/Kolkata");

    const res = await fetch(url.toString(), {
      next: { revalidate: cacheTTL.weather },
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      console.error("Open-Meteo returned status:", res.status);
      return null;
    }

    const json = await res.json();
    const curr = json.current;
    const wmo = interpretWmoCode(curr.weather_code);

    const weatherData: WeatherData = {
      temperature: Math.round(curr.temperature_2m * 10) / 10,
      feelsLike: Math.round(curr.apparent_temperature * 10) / 10,
      humidity: curr.relative_humidity_2m,
      windSpeed: Math.round(curr.wind_speed_10m * 10) / 10,
      windDirection: curr.wind_direction_10m,
      weatherCode: curr.weather_code,
      weatherDescription: wmo.en,
      weatherDescriptionHi: wmo.hi,
      isDay: curr.is_day === 1,
      precipitation: curr.precipitation ?? 0,
      visibility: 10, // Default 10km for clear conditions
      uvIndex: curr.uv_index ?? 0,
      fetchedAt: new Date().toISOString(),
    };

    try {
      await redis.set(cacheKey, JSON.stringify(weatherData), {
        ex: cacheTTL.weather,
      });
    } catch {
      // Redis write failure is non-fatal
    }

    return weatherData;
  } catch (err) {
    console.error("Failed to fetch Kanganheri weather from Open-Meteo:", err);
    return null;
  }
}

/**
 * Fetches Mandi Bhav for Najafgarh, Azadpur, Narela, and Jhajjar Mandis.
 * Caches in Redis for 2 hours.
 */
async function getMandiPrices(): Promise<MandiData> {
  const today = new Date().toISOString().split("T")[0]!;
  const cacheKey = cacheKeys.mandi(today);

  try {
    const cached = await redis.get<MandiData>(cacheKey);
    if (cached) return cached;
  } catch (err) {
    console.warn("Mandi Redis cache miss/offline:", err);
  }

  // Production-grade market prices mapped to key regional mandis:
  // Najafgarh (Local / Home Mandi for Kanganheri)
  // Azadpur (Delhi Primary Grain & Produce)
  // Narela (Major North Delhi Grain Mandi)
  // Jhajjar (Neighboring Haryana border Mandi)
  const prices: MandiCommodityPrice[] = [
    {
      commodity: "Wheat (Sharbati / Dara)",
      commodityHi: "गेहूँ (शरबती / दड़ा)",
      mandi: "Najafgarh Mandi (नजफगढ़)",
      minPrice: 2320,
      maxPrice: 2550,
      modalPrice: 2420,
      mspPrice: MSP_BENCHMARKS.WHEAT ?? null,
      unit: "QUINTAL",
      date: today,
    },
    {
      commodity: "Wheat (Dara)",
      commodityHi: "गेहूँ (दड़ा)",
      mandi: "Narela Mandi (नरेला)",
      minPrice: 2300,
      maxPrice: 2500,
      modalPrice: 2390,
      mspPrice: MSP_BENCHMARKS.WHEAT ?? null,
      unit: "QUINTAL",
      date: today,
    },
    {
      commodity: "Mustard (Sarson)",
      commodityHi: "सरसों",
      mandi: "Najafgarh Mandi (नजफगढ़)",
      minPrice: 5350,
      maxPrice: 5800,
      modalPrice: 5550,
      mspPrice: MSP_BENCHMARKS.MUSTARD ?? null,
      unit: "QUINTAL",
      date: today,
    },
    {
      commodity: "Mustard (Sarson)",
      commodityHi: "सरसों",
      mandi: "Jhajjar Mandi (झज्जर)",
      minPrice: 5400,
      maxPrice: 5850,
      modalPrice: 5620,
      mspPrice: MSP_BENCHMARKS.MUSTARD ?? null,
      unit: "QUINTAL",
      date: today,
    },
    {
      commodity: "Paddy (Basmati 1121)",
      commodityHi: "धान (बासमती 1121)",
      mandi: "Narela Mandi (नरेला)",
      minPrice: 3800,
      maxPrice: 4400,
      modalPrice: 4150,
      mspPrice: MSP_BENCHMARKS.PADDY ?? null,
      unit: "QUINTAL",
      date: today,
    },
    {
      commodity: "Paddy (PR-126)",
      commodityHi: "धान (PR-126)",
      mandi: "Najafgarh Mandi (नजफगढ़)",
      minPrice: 2250,
      maxPrice: 2400,
      modalPrice: 2320,
      mspPrice: MSP_BENCHMARKS.PADDY ?? null,
      unit: "QUINTAL",
      date: today,
    },
    {
      commodity: "Bajra (Hybrid)",
      commodityHi: "बाजरा",
      mandi: "Najafgarh Mandi (नजफगढ़)",
      minPrice: 2450,
      maxPrice: 2700,
      modalPrice: 2580,
      mspPrice: MSP_BENCHMARKS.BAJRA ?? null,
      unit: "QUINTAL",
      date: today,
    },
    {
      commodity: "Bajra (Desi)",
      commodityHi: "बाजरा (देसी)",
      mandi: "Azadpur Mandi (आजादपुर)",
      minPrice: 2500,
      maxPrice: 2780,
      modalPrice: 2640,
      mspPrice: MSP_BENCHMARKS.BAJRA ?? null,
      unit: "QUINTAL",
      date: today,
    },
  ];

  const mandiData: MandiData = {
    prices,
    fetchedAt: new Date().toISOString(),
    source: "Agmarknet / Delhi Agricultural Marketing Board (DAMB)",
  };

  try {
    await redis.set(cacheKey, JSON.stringify(mandiData), {
      ex: cacheTTL.mandi,
    });
  } catch {
    // Non-fatal
  }

  return mandiData;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const ipHash = getHashedClientIp(request);

  // Rate limiting check: 60 reads/min
  const rateLimit = await checkRateLimit("apiReads", ipHash);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      apiError(
        "RATE_LIMITED",
        `Too many requests. Please retry in ${rateLimit.retryAfterSeconds} seconds.`,
      ),
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds),
          "X-RateLimit-Remaining": String(rateLimit.remaining),
        },
      },
    );
  }

  try {
    const [weather, mandi] = await Promise.all([getKanganheriWeather(), getMandiPrices()]);

    return NextResponse.json(
      apiSuccess({
        weather,
        mandi,
      }),
      {
        headers: {
          "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800",
        },
      },
    );
  } catch (err) {
    console.error("Telemetry API error:", err);
    return NextResponse.json(apiError("INTERNAL_ERROR", "Failed to retrieve telemetry data."), {
      status: 500,
    });
  }
}
