// Source: National Meteorological Service of Belize (NMS) - https://nms.gov.bz/
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
  forecastSchedule: 'Issued thrice daily at 6:00 AM, 12:00 PM, and 6:00 PM local time',
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
}

// Verified live baseline from https://nms.gov.bz/
export const FALLBACK_NMS_GENERAL_FORECAST: NmsGeneralForecast = {
  id: 8085,
  forecast_date: '2026-11-01',
  forecast_time: '06:00:00',
  forecast_category: 'Morning Forecast',
  general_situation: 'A GENTLE AND RELATIVELY MOIST AIRFLOW PREVAILS ACROSS BELIZE...',
  twenty_four_hour_forecast:
    'SUNNY WITH CLOUDY SPELLS TODAY AND CLOUDY AT TIMES TONIGHT. A FEW SHOWERS, ALONG WITH A MEDIUM CHANCE OF ISOLATED THUNDERSTORMS, ARE EXPECTED MAINLY OVER COASTAL AND OFFSHORE AREAS THIS MORNING, THEN OVER CENTRAL AND SOUTHERN INLAND AREAS BY THIS AFTERNOON. ACTIVITY SHOULD DECREASE BY EVENING, BEFORE REDEVELOPING OVER CENTRAL AND NORTHERN COASTAL AND OFFSHORE AREAS TONIGHT.',
  outlook:
    'MONDAY AND MONDAY NIGHT:- CLOUDY SPELLS WITH A FEW MORNING SHOWERS POSSIBLE OVER SOME COASTAL AREAS, DECREASING AND BECOMING ISOLATED BY AFTERNOON.',
  wind_speed: '5-10 kts',
  wind_direction_m2m: ['NE'],
  sea_state_m2m: ['Slight', 'Light Chop'],
  wave: '1-4 ft',
  coast_high_f: 87,
  coast_high_c: 31,
  coast_low_f: 77,
  coast_low_c: 25,
  inland_high_f: 91,
  inland_high_c: 33,
  inland_low_f: 70,
  inland_low_c: 21,
  hills_high_f: 76,
  hills_high_c: 26,
  hills_low_f: 64,
  hills_low_c: 18,
  advisory: null,
  pdf_file: 'https://wimp3.nms.gov.bz/media/forecast/general/doc/General_Forecast_2026-11-01_0600_AM_NMS_BZ.pdf',
  audio_file: 'https://wimp3.nms.gov.bz/media/forecast/general/audio/2026-11-01_0600_AM_NMS_BZ.mp3',
  created_by: 'Duty Forecaster under Chief Meteorologist Ronald Gordon',
  created_datetime: '2026-11-01T06:10:01-06:00',
};

export const FALLBACK_NMS_MARINE_FORECAST: NmsMarineForecast = {
  id: 5410,
  forecast_date: '2026-11-01',
  forecast_time: '05:30:00',
  forecast_category: 'Morning Marine Forecast',
  synopsis: 'A GENTLE AND RELATIVELY MOIST AIRFLOW PREVAILS OVER BELIZE COASTAL WATERS...',
  sea_surface_temperature: 85,
  max_temperature: 87,
  min_temperature: 77,
  advisory: null,
  tide_details: [
    { id: 44286, tide_level_category: 'Low', tide_day_category: 'Today', tide_time: '09:52 AM' },
    { id: 44287, tide_level_category: 'High', tide_day_category: 'Today', tide_time: '04:15 PM' },
    { id: 44288, tide_level_category: 'Low', tide_day_category: 'Today', tide_time: '08:49 PM' },
    { id: 44289, tide_level_category: 'High', tide_day_category: 'Tomorrow', tide_time: '03:21 AM' },
  ],
  sun_details: [
    { id: 19811, sun_move_category: 'Sunrise', sun_day_category: 'Today', sun_time: '05:51 AM' },
    { id: 19812, sun_move_category: 'Sunset', sun_day_category: 'Today', sun_time: '05:20 PM' },
  ],
  moon_details: [
    { id: 19757, moon_move_category: 'Moonrise', moon_day_category: 'Today', moon_time: '11:55 PM' },
    { id: 19758, moon_move_category: 'Moonset', moon_day_category: 'Today', moon_time: '12:18 PM' },
  ],
  pdf_file: 'https://wimp3.nms.gov.bz/media/forecast/marine/doc/Marine_Forecast_2026-11-01_0530_AM_NMS_BZ.pdf',
  created_by: 'Marine Weather Section / Chief Meteorologist Desk',
  created_datetime: '2026-11-01T05:24:51-06:00',
};

/**
 * Fetch live General Weather Forecast from the National Meteorological Service of Belize.
 * Tries the local proxied endpoint /api/nms/general-weather-forecast/ and falls back to cached baseline.
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
        return {
          data: entry as NmsGeneralForecast,
          isLive: true,
          sourceUrl: 'https://nms.gov.bz/forecast/general-weather-forecast',
        };
      }
    }
  } catch (err) {
    console.warn('Could not query /api/nms/general-weather-forecast/, using official verified baseline:', err);
  }

  return {
    data: FALLBACK_NMS_GENERAL_FORECAST,
    isLive: false,
    sourceUrl: 'https://nms.gov.bz/forecast/general-weather-forecast',
  };
}

/**
 * Fetch live Marine Forecast from the National Meteorological Service of Belize.
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
        return {
          data: entry as NmsMarineForecast,
          isLive: true,
          sourceUrl: 'https://nms.gov.bz/forecast/marine-forecast',
        };
      }
    }
  } catch (err) {
    console.warn('Could not query /api/nms/marine-forecast/, using official verified baseline:', err);
  }

  return {
    data: FALLBACK_NMS_MARINE_FORECAST,
    isLive: false,
    sourceUrl: 'https://nms.gov.bz/forecast/marine-forecast',
  };
}
