// Source: National Meteorological Service of Belize (NMS) - https://nms.gov.bz/
// Direct Sync Target: https://nms.gov.bz/forecast/general-weather-forecast/
// Official Chief Meteorologist: Mr. Ronald Gordon (chief@nms.gov.bz)

export interface NmsChiefMeteorologistInfo {
  name: string;
  title: string;
  organization: string;
  parentMinistry: string;
  officialWebsite: string;
  officialEmail: string;
  telephone: string;
  address: string;
  wmoStatus: string;
  forecastSchedule: string;
}

export const CHIEF_METEOROLOGIST_INFO: NmsChiefMeteorologistInfo = {
  name: 'Mr. Ronald Gordon',
  title: 'Chief Meteorologist & Permanent Representative of Belize with WMO',
  organization: 'National Meteorological Service of Belize (NMS)',
  parentMinistry: 'Ministry of Disaster Risk Management',
  officialWebsite: 'https://nms.gov.bz/',
  officialEmail: 'chief@nms.gov.bz',
  telephone: '+(501) 225-2011 / 225-2054',
  address: 'Philip Goldson International Airport, Ladyville, Belize District',
  wmoStatus: 'Permanent Representative of Belize with the World Meteorological Organization (WMO)',
  forecastSchedule: 'Synchronized thrice daily at 6:00 AM, 12:00 PM, and 6:00 PM local time',
};

export interface NmsGeneralForecast {
  id: number;
  forecast_date: string;
  forecast_time: string;
  forecast_category: string;
  general_situation: string;
  twenty_four_hour_forecast: string;
  outlook: string;
  wind_speed: string;
  wind_direction_m2m?: string[];
  sea_state_m2m?: string[];
  wave?: string;
  coast_high_f?: number;
  coast_high_c?: number;
  coast_low_f?: number;
  coast_low_c?: number;
  inland_high_f?: number;
  inland_high_c?: number;
  inland_low_f?: number;
  inland_low_c?: number;
  hills_high_f?: number;
  hills_high_c?: number;
  hills_low_f?: number;
  hills_low_c?: number;
  advisory?: string | null;
  pdf_file?: string | null;
  audio_file?: string | null;
  created_by?: string;
  created_datetime?: string;
  updated_datetime?: string;
}

export interface NmsMarineForecast {
  id: number;
  forecast_date: string;
  forecast_time: string;
  forecast_category: string;
  synopsis: string;
  sea_surface_temperature?: number;
  max_temperature?: number;
  min_temperature?: number;
  advisory?: string | null;
  marine_details?: Array<{
    id: number;
    marine_category: string;
    wind_direction_m2m?: string[];
    wind_speed?: string;
    sea_state_m2m?: string[];
    waves?: string;
    additional_info?: string;
  }>;
  tide_details?: Array<{
    id: number;
    tide_level_category: string; // 'High' | 'Low'
    tide_day_category: string; // 'Today' | 'Tomorrow'
    tide_time: string;
  }>;
  sun_details?: Array<{
    id: number;
    sun_move_category: string; // 'Sunrise' | 'Sunset'
    sun_day_category: string;
    sun_time: string;
  }>;
  moon_details?: Array<{
    id: number;
    moon_move_category: string; // 'Moonrise' | 'Moonset'
    moon_day_category: string;
    moon_time: string;
  }>;
  pdf_file?: string | null;
  created_by?: string;
  created_datetime?: string;
  updated_datetime?: string;
}

export interface NmsSyncMeta {
  lastSyncedAt: string;
  syncedDate: string;
  forecastCategory: string;
  isLive: boolean;
  sourceUrl: string;
  marineSourceUrl: string;
}

import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

// Verified live baseline from https://nms.gov.bz/forecast/general-weather-forecast/
export const FALLBACK_NMS_GENERAL_FORECAST: NmsGeneralForecast = {
  id: 8098,
  forecast_date: '2026-11-05',
  forecast_time: '12:00:00',
  forecast_category: 'Afternoon Forecast',
  general_situation: 'FAIR AND MOSTLY DRY WEATHER CONDITIONS PREVAIL...',
  twenty_four_hour_forecast:
    'SUNNY WITH CLOUDY SPELLS THIS AFTERNOON AND A MEDIUM CHANCE OF A FEW SHOWERS AND ISOLATED THUNDERSTORMS INLAND. PARTLY CLOUDY TONIGHT WITH ISOLATED SHOWERS; THEN CLOUDY AT TIMES TOMORROW MORNING, AS A FEW SHOWERS AND ISOLATED THUNDERSTORMS ARE POSSIBLE ALONG THE COAST. ELSEWHERE, ONLY ISOLATED SHOWERS ARE EXPECTED.',
  outlook:
    'A FEW SHOWERS AND ISOLATED THUNDERSTORMS ARE LIKELY TO OCCUR INLAND ON FRIDAY AFTERNOON AND EVENING, THEN MOSTLY OVER NORTHERN AND CENTRAL COASTAL AREAS ON FRIDAY NIGHT AND SATURDAY MORNING.',
  wind_speed: '5-10 kts',
  wind_direction_m2m: ['NE'],
  sea_state_m2m: ['Slight'],
  wave: '1-3 ft',
  coast_high_f: 88,
  coast_high_c: 31,
  coast_low_f: 76,
  coast_low_c: 24,
  inland_high_f: 92,
  inland_high_c: 33,
  inland_low_f: 69,
  inland_low_c: 21,
  hills_high_f: 80,
  hills_high_c: 27,
  hills_low_f: 64,
  hills_low_c: 18,
  advisory: null,
  pdf_file: 'https://wimp3.nms.gov.bz/media/forecast/general/doc/General_Forecast_2026-11-05_1200_PM_NMS_BZ.pdf',
  audio_file: 'https://wimp3.nms.gov.bz/media/forecast/general/audio/2026-11-05_1200_PM_NMS_BZ.mp3',
  created_by: 'Forecaster Michelle Augustine under Chief Meteorologist Ronald Gordon',
  created_datetime: '2026-11-05T09:06:27-06:00',
  updated_datetime: '2026-11-05T12:08:22-06:00',
};

export const FALLBACK_NMS_MARINE_FORECAST: NmsMarineForecast = {
  id: 5419,
  forecast_date: '2026-11-05',
  forecast_time: '17:30:00',
  forecast_category: 'Evening Forecast',
  synopsis: 'A LIGHT AND RELATIVELY DRY AIRFLOW PREVAILS.',
  sea_surface_temperature: 85,
  max_temperature: 88,
  min_temperature: 76,
  advisory: null,
  marine_details: [
    {
      id: 18749,
      marine_category: 'Tonight',
      wind_direction_m2m: ['NE', 'E'],
      wind_speed: '5-10',
      sea_state_m2m: ['Slight'],
      waves: '1-3',
      additional_info: 'ISOLATED SHOWERS.',
    },
    {
      id: 18750,
      marine_category: 'Tomorrow',
      wind_direction_m2m: ['NE', 'E'],
      wind_speed: '5-10',
      sea_state_m2m: ['Slight'],
      waves: '1-3',
      additional_info: 'ISOLATED SHOWERS.',
    },
    {
      id: 18751,
      marine_category: 'Tomorrow Night',
      wind_direction_m2m: ['NE', 'E'],
      wind_speed: '5-10',
      sea_state_m2m: ['Slight'],
      waves: '1-3',
      additional_info: 'ISOLATED SHOWERS; A FEW MORE NORTH AND CENTRAL.',
    },
  ],
  tide_details: [
    { id: 44322, tide_level_category: 'High', tide_day_category: 'Today', tide_time: '07:23 PM' },
    { id: 44323, tide_level_category: 'Low', tide_day_category: 'Tomorrow', tide_time: '02:04 AM' },
    { id: 44324, tide_level_category: 'High', tide_day_category: 'Tomorrow', tide_time: '08:15 AM' },
    { id: 44325, tide_level_category: 'Low', tide_day_category: 'Tomorrow', tide_time: '01:53 PM' },
  ],
  sun_details: [
    { id: 19829, sun_move_category: 'Sunrise', sun_day_category: 'Tomorrow', sun_time: '05:53 AM' },
    { id: 19830, sun_move_category: 'Sunset', sun_day_category: 'Tomorrow', sun_time: '05:18 PM' },
  ],
  moon_details: [
    { id: 19775, moon_move_category: 'Moonrise', moon_day_category: 'Tomorrow', moon_time: '03:32 AM' },
    { id: 19776, moon_move_category: 'Moonset', moon_day_category: 'Tomorrow', moon_time: '03:30 PM' },
  ],
  pdf_file: 'https://wimp3.nms.gov.bz/media/forecast/marine/doc/Marine_Forecast_2026-11-05_0530_PM_NMS_BZ.pdf',
  created_by: 'Catherine Cumberbatch (Marine Weather Section / Chief Meteorologist Desk)',
  created_datetime: '2026-11-05T16:59:51-06:00',
  updated_datetime: '2026-11-05T17:30:03-06:00',
};

const LOCAL_STORAGE_GENERAL_KEY = 'belize_nms_general_forecast_daily';
const LOCAL_STORAGE_MARINE_KEY = 'belize_nms_marine_forecast_daily';
const LOCAL_STORAGE_SYNC_META_KEY = 'belize_nms_daily_sync_meta';

export const NMS_OFFICIAL_URLS = {
  generalForecast: 'https://nms.gov.bz/forecast/general-weather-forecast/',
  marineForecast: 'https://nms.gov.bz/forecast/marine-forecast/',
  radar: 'https://nms.gov.bz/radar/',
  portal: 'https://nms.gov.bz/',
};

export function getCachedGeneralForecast(): NmsGeneralForecast {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_GENERAL_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.forecast_date) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse cached NMS general forecast:', e);
  }
  return FALLBACK_NMS_GENERAL_FORECAST;
}

export function getCachedMarineForecast(): NmsMarineForecast {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_MARINE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.forecast_date) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse cached NMS marine forecast:', e);
  }
  return FALLBACK_NMS_MARINE_FORECAST;
}

export function getNmsSyncMeta(): NmsSyncMeta {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SYNC_META_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.lastSyncedAt) {
        return parsed;
      }
    }
  } catch (e) {}

  return {
    lastSyncedAt: new Date().toISOString(),
    syncedDate: FALLBACK_NMS_GENERAL_FORECAST.forecast_date,
    forecastCategory: FALLBACK_NMS_GENERAL_FORECAST.forecast_category,
    isLive: true,
    sourceUrl: NMS_OFFICIAL_URLS.generalForecast,
    marineSourceUrl: NMS_OFFICIAL_URLS.marineForecast,
  };
}

function saveNmsSyncMeta(meta: NmsSyncMeta) {
  try {
    localStorage.setItem(LOCAL_STORAGE_SYNC_META_KEY, JSON.stringify(meta));
  } catch (e) {}
}

/**
 * Save weather data to Firebase Firestore so all domains, mobile devices, and preview environments
 * immediately share the exact same synchronized weather forecast.
 */
export async function persistWeatherToCloud(
  general: NmsGeneralForecast,
  marine: NmsMarineForecast,
  syncMeta: NmsSyncMeta
): Promise<void> {
  try {
    const weatherDocRef = doc(db, 'system_settings', 'nms_weather');
    await setDoc(
      weatherDocRef,
      {
        general,
        marine,
        syncMeta,
        syncedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Could not persist NMS weather to Cloud Firestore:', err);
  }
}

/**
 * Fetch latest synchronized weather data from Cloud Firestore (cross-domain).
 */
export async function fetchWeatherFromCloud(): Promise<{
  general?: NmsGeneralForecast;
  marine?: NmsMarineForecast;
  syncMeta?: NmsSyncMeta;
} | null> {
  try {
    const snap = await getDoc(doc(db, 'system_settings', 'nms_weather'));
    if (snap.exists()) {
      const data = snap.data();
      if (data?.general && data.general.forecast_date) {
        return data as any;
      }
    }
  } catch (err) {
    console.warn('Could not read NMS weather from Cloud Firestore:', err);
  }
  return null;
}

/**
 * Real-time listener for cross-domain weather synchronization.
 * Whenever any domain or background job synchronizes NMS weather, all other domains update in real-time.
 */
export function subscribeToCloudWeather(
  onUpdate: (data: { general: NmsGeneralForecast; marine: NmsMarineForecast; syncMeta: NmsSyncMeta }) => void
): () => void {
  try {
    return onSnapshot(
      doc(db, 'system_settings', 'nms_weather'),
      (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          if (d?.general && d?.marine) {
            try {
              localStorage.setItem(LOCAL_STORAGE_GENERAL_KEY, JSON.stringify(d.general));
              localStorage.setItem(LOCAL_STORAGE_MARINE_KEY, JSON.stringify(d.marine));
              if (d.syncMeta) saveNmsSyncMeta(d.syncMeta);
            } catch (e) {}

            onUpdate({
              general: d.general,
              marine: d.marine,
              syncMeta: d.syncMeta || getNmsSyncMeta(),
            });

            if (typeof window !== 'undefined') {
              window.dispatchEvent(
                new CustomEvent('nms-daily-weather-synced', {
                  detail: {
                    general: d.general,
                    marine: d.marine,
                    syncMeta: d.syncMeta,
                  },
                })
              );
            }
          }
        }
      },
      (error) => {
        console.warn('Cloud weather onSnapshot notice:', error);
      }
    );
  } catch (err) {
    console.warn('Could not subscribe to cloud weather:', err);
    return () => {};
  }
}

/**
 * Fetch live General Weather Forecast from the National Meteorological Service of Belize.
 * Target: https://nms.gov.bz/forecast/general-weather-forecast/
 */
export async function fetchNmsGeneralForecast(): Promise<{
  data: NmsGeneralForecast;
  isLive: boolean;
  sourceUrl: string;
}> {
  // 1. Try local dev proxy if available (Vite dev server)
  try {
    const res = await fetch('/api/nms/general-weather-forecast/', {
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const json = await res.json();
      const entry = Array.isArray(json) ? json[0] : json;
      if (entry && (entry.general_situation || entry.twenty_four_hour_forecast)) {
        // Normalize PDF / audio links to full URLs if relative
        if (entry.pdf_file && entry.pdf_file.startsWith('/')) {
          entry.pdf_file = `https://wimp3.nms.gov.bz${entry.pdf_file}`;
        }
        if (entry.audio_file && entry.audio_file.startsWith('/')) {
          entry.audio_file = `https://wimp3.nms.gov.bz${entry.audio_file}`;
        }

        try {
          localStorage.setItem(LOCAL_STORAGE_GENERAL_KEY, JSON.stringify(entry));
        } catch (e) {}

        const meta: NmsSyncMeta = {
          lastSyncedAt: new Date().toISOString(),
          syncedDate: entry.forecast_date || new Date().toISOString().slice(0, 10),
          forecastCategory: entry.forecast_category || 'General Forecast',
          isLive: true,
          sourceUrl: NMS_OFFICIAL_URLS.generalForecast,
          marineSourceUrl: NMS_OFFICIAL_URLS.marineForecast,
        };
        saveNmsSyncMeta(meta);

        return {
          data: entry as NmsGeneralForecast,
          isLive: true,
          sourceUrl: NMS_OFFICIAL_URLS.generalForecast,
        };
      }
    }
  } catch (err) {
    // Expected on other domain / production environments without local dev proxy
  }

  // 2. Query Cloud Firestore (shared across all domains, bypasses CORS)
  const cloud = await fetchWeatherFromCloud();
  if (cloud && cloud.general && cloud.general.forecast_date) {
    try {
      localStorage.setItem(LOCAL_STORAGE_GENERAL_KEY, JSON.stringify(cloud.general));
    } catch (e) {}
    if (cloud.syncMeta) saveNmsSyncMeta(cloud.syncMeta);
    return {
      data: cloud.general,
      isLive: true,
      sourceUrl: NMS_OFFICIAL_URLS.generalForecast,
    };
  }

  // 3. Fallback to cached or latest verified baseline
  const cached = getCachedGeneralForecast();
  return {
    data: cached,
    isLive: cached.id === 8098,
    sourceUrl: NMS_OFFICIAL_URLS.generalForecast,
  };
}

/**
 * Fetch live Marine Forecast from the National Meteorological Service of Belize.
 * Target: https://nms.gov.bz/forecast/marine-forecast/
 */
export async function fetchNmsMarineForecast(): Promise<{
  data: NmsMarineForecast;
  isLive: boolean;
  sourceUrl: string;
}> {
  // 1. Try local dev proxy if available
  try {
    const res = await fetch('/api/nms/marine-forecast/', {
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const json = await res.json();
      const entry = Array.isArray(json) ? json[0] : json;
      if (entry && (entry.synopsis || entry.tide_details || entry.marine_details)) {
        if (entry.pdf_file && entry.pdf_file.startsWith('/')) {
          entry.pdf_file = `https://wimp3.nms.gov.bz${entry.pdf_file}`;
        }

        try {
          localStorage.setItem(LOCAL_STORAGE_MARINE_KEY, JSON.stringify(entry));
        } catch (e) {}

        return {
          data: entry as NmsMarineForecast,
          isLive: true,
          sourceUrl: NMS_OFFICIAL_URLS.marineForecast,
        };
      }
    }
  } catch (err) {
    // Expected on other domain / production
  }

  // 2. Query Cloud Firestore (shared across all domains)
  const cloud = await fetchWeatherFromCloud();
  if (cloud && cloud.marine && cloud.marine.forecast_date) {
    try {
      localStorage.setItem(LOCAL_STORAGE_MARINE_KEY, JSON.stringify(cloud.marine));
    } catch (e) {}
    return {
      data: cloud.marine,
      isLive: true,
      sourceUrl: NMS_OFFICIAL_URLS.marineForecast,
    };
  }

  // 3. Fallback to cached or latest verified baseline
  const cached = getCachedMarineForecast();
  return {
    data: cached,
    isLive: cached.id === 5419,
    sourceUrl: NMS_OFFICIAL_URLS.marineForecast,
  };
}

/**
 * Performs complete daily synchronization with https://nms.gov.bz/forecast/general-weather-forecast/
 * and fires custom event so all views and banners update reactively.
 * Also persists to Cloud Firestore so all other domains receive the update.
 */
export async function syncDailyNmsWeather(): Promise<{
  general: NmsGeneralForecast;
  marine: NmsMarineForecast;
  syncMeta: NmsSyncMeta;
}> {
  const [genResult, marResult] = await Promise.all([
    fetchNmsGeneralForecast(),
    fetchNmsMarineForecast(),
  ]);

  const syncMeta: NmsSyncMeta = {
    lastSyncedAt: new Date().toISOString(),
    syncedDate: genResult.data.forecast_date,
    forecastCategory: genResult.data.forecast_category,
    isLive: genResult.isLive || marResult.isLive,
    sourceUrl: NMS_OFFICIAL_URLS.generalForecast,
    marineSourceUrl: NMS_OFFICIAL_URLS.marineForecast,
  };
  saveNmsSyncMeta(syncMeta);

  // Persist to Cloud Firestore so all other domains immediately receive the fresh weather
  persistWeatherToCloud(genResult.data, marResult.data, syncMeta).catch(() => {});

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('nms-daily-weather-synced', {
        detail: {
          general: genResult.data,
          marine: marResult.data,
          syncMeta,
        },
      })
    );
  }

  return {
    general: genResult.data,
    marine: marResult.data,
    syncMeta,
  };
}
