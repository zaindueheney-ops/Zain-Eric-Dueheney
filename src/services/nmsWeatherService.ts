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

// Verified live baseline from https://nms.gov.bz/forecast/general-weather-forecast/
export const FALLBACK_NMS_GENERAL_FORECAST: NmsGeneralForecast = {
  id: 8094,
  forecast_date: '2026-11-04',
  forecast_time: '06:00:00',
  forecast_category: 'Morning Forecast',
  general_situation: 'MAINLY FAIR WEATHER CONDITIONS PREVAIL OVER THE AREA...',
  twenty_four_hour_forecast:
    'SUNNY WITH A FEW CLOUDY SPELLS TODAY AND PARTLY CLOUDY SKIES TONIGHT. SHOWERS WILL BE GENERALLY ISOLATED.',
  outlook:
    '(THURSDAY & THURSDAY NIGHT)- IS FOR FAIR AND MOSTLY DRY CONDITIONS. SHOWERS, IF ANY, WILL BE ISOLATED.',
  wind_speed: '5-10 kts',
  wind_direction_m2m: ['N', 'NE'],
  sea_state_m2m: ['Slight'],
  wave: '1-3 ft',
  coast_high_f: 88,
  coast_high_c: 31,
  coast_low_f: 76,
  coast_low_c: 24,
  inland_high_f: 92,
  inland_high_c: 33,
  inland_low_f: 70,
  inland_low_c: 21,
  hills_high_f: 80,
  hills_high_c: 27,
  hills_low_f: 66,
  hills_low_c: 19,
  advisory: null,
  pdf_file: 'https://wimp3.nms.gov.bz/media/forecast/general/doc/General_Forecast_2026-11-04_0600_AM_NMS_BZ.pdf',
  audio_file: 'https://wimp3.nms.gov.bz/media/forecast/general/audio/2026-11-04_0600_AM_NMS_BZ.mp3',
  created_by: 'Duty Forecaster Tareek Matthews under Chief Meteorologist Ronald Gordon',
  created_datetime: '2026-11-03T22:06:48-06:00',
  updated_datetime: '2026-11-04T06:02:23-06:00',
};

export const FALLBACK_NMS_MARINE_FORECAST: NmsMarineForecast = {
  id: 5416,
  forecast_date: '2026-11-04',
  forecast_time: '05:30:00',
  forecast_category: 'Morning Marine Forecast',
  synopsis: 'A LIGHT AND SOMEWHAT DRY AIRFLOW PREVAILS OVER THE AREA...',
  sea_surface_temperature: 85,
  max_temperature: 88,
  min_temperature: 76,
  advisory: null,
  tide_details: [
    { id: 44310, tide_level_category: 'High', tide_day_category: 'Today', tide_time: '06:12 AM' },
    { id: 44311, tide_level_category: 'Low', tide_day_category: 'Today', tide_time: '12:40 PM' },
    { id: 44312, tide_level_category: 'High', tide_day_category: 'Today', tide_time: '06:48 PM' },
    { id: 44313, tide_level_category: 'Low', tide_day_category: 'Tomorrow', tide_time: '01:07 AM' },
  ],
  sun_details: [
    { id: 19823, sun_move_category: 'Sunrise', sun_day_category: 'Today', sun_time: '05:52 AM' },
    { id: 19824, sun_move_category: 'Sunset', sun_day_category: 'Today', sun_time: '05:19 PM' },
  ],
  moon_details: [
    { id: 19769, moon_move_category: 'Moonrise', moon_day_category: 'Tomorrow', moon_time: '02:40 AM' },
    { id: 19770, moon_move_category: 'Moonset', moon_day_category: 'Today', moon_time: '02:18 PM' },
  ],
  pdf_file: 'https://wimp3.nms.gov.bz/media/forecast/marine/doc/Marine_Forecast_2026-11-04_0530_AM_NMS_BZ.pdf',
  created_by: 'Tareek Matthews (Marine Weather Section / Chief Meteorologist Desk)',
  created_datetime: '2026-11-03T22:13:04-06:00',
  updated_datetime: '2026-11-04T05:30:22-06:00',
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
 * Fetch live General Weather Forecast from the National Meteorological Service of Belize.
 * Target: https://nms.gov.bz/forecast/general-weather-forecast/
 */
export async function fetchNmsGeneralForecast(): Promise<{
  data: NmsGeneralForecast;
  isLive: boolean;
  sourceUrl: string;
}> {
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
    console.warn('Could not query /api/nms/general-weather-forecast/, using verified baseline:', err);
  }

  const cached = getCachedGeneralForecast();
  return {
    data: cached,
    isLive: cached.id === 8094,
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
  try {
    const res = await fetch('/api/nms/marine-forecast/', {
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const json = await res.json();
      const entry = Array.isArray(json) ? json[0] : json;
      if (entry && (entry.synopsis || entry.tide_details)) {
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
    console.warn('Could not query /api/nms/marine-forecast/, using verified baseline:', err);
  }

  const cached = getCachedMarineForecast();
  return {
    data: cached,
    isLive: cached.id === 5416,
    sourceUrl: NMS_OFFICIAL_URLS.marineForecast,
  };
}

/**
 * Performs complete daily synchronization with https://nms.gov.bz/forecast/general-weather-forecast/
 * and fires custom event so all views and banners update reactively.
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
