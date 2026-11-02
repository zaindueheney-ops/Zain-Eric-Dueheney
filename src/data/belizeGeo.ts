import { BelizeDistrict, BelizeLocationPreset, EmergencyHotline } from '../types';

export const BELIZE_CENTER = {
  lat: 17.1899,
  lng: -88.4976,
  zoom: 8,
};

export const BELIZE_DISTRICTS: { id: BelizeDistrict; name: string; capital: string; lat: number; lng: number }[] = [
  { id: 'Belize', name: 'Belize District', capital: 'Belize City', lat: 17.5046, lng: -88.1962 },
  { id: 'Cayo', name: 'Cayo District', capital: 'San Ignacio / Belmopan', lat: 17.1600, lng: -89.0696 },
  { id: 'Orange Walk', name: 'Orange Walk District', capital: 'Orange Walk Town', lat: 18.0833, lng: -88.5667 },
  { id: 'Corozal', name: 'Corozal District', capital: 'Corozal Town', lat: 18.3938, lng: -88.3886 },
  { id: 'Stann Creek', name: 'Stann Creek District', capital: 'Dangriga', lat: 16.9692, lng: -88.2321 },
  { id: 'Toledo', name: 'Toledo District', capital: 'Punta Gorda', lat: 16.0990, lng: -88.8074 },
];

export const BELIZE_KEY_HUBS: BelizeLocationPreset[] = [
  { name: 'Belize City (Karl Heusner Memorial Hospital / Central Police)', district: 'Belize', latitude: 17.4988, longitude: -88.1882, description: 'National Referral Hospital & Hub' },
  { name: 'Belmopan (NEMO HQ / National Fire Station)', district: 'Cayo', latitude: 17.2510, longitude: -88.7671, description: 'National Emergency Operations Centre' },
  { name: 'San Ignacio / Santa Elena', district: 'Cayo', latitude: 17.1588, longitude: -89.0716, description: 'Western Hub / Macal River' },
  { name: 'San Pedro Town (Ambergris Caye)', district: 'Belize', latitude: 17.9214, longitude: -87.9611, description: 'Island Tourism & Marine Area' },
  { name: 'Caye Caulker Village', district: 'Belize', latitude: 17.7424, longitude: -88.0289, description: 'Barrier Reef Area' },
  { name: 'Dangriga Town', district: 'Stann Creek', latitude: 16.9692, longitude: -88.2321, description: 'Culture Capital & Southern Coast' },
  { name: 'Placencia Peninsula', district: 'Stann Creek', latitude: 16.5142, longitude: -88.3664, description: 'Coastal Lagoon & Village' },
  { name: 'Orange Walk Town', district: 'Orange Walk', latitude: 18.0746, longitude: -88.5633, description: 'Northern Sugar City & New River' },
  { name: 'Corozal Town', district: 'Corozal', latitude: 18.3938, longitude: -88.3886, description: 'Northern Border Bay Area' },
  { name: 'Punta Gorda Town', district: 'Toledo', latitude: 16.0990, longitude: -88.8074, description: 'Southern Marine & Rainforest Port' },
  { name: 'George Price Highway (Mile 8 Junction)', district: 'Belize', latitude: 17.4721, longitude: -88.2912, description: 'Major Western Highway Corridor' },
  { name: 'Hummingbird Highway (Middlesex Gap)', district: 'Stann Creek', latitude: 17.0225, longitude: -88.5411, description: 'Valley Corridor & Mountain Pass' },
];

export const BELIZE_EMERGENCY_HOTLINES: EmergencyHotline[] = [
  {
    name: 'Belize Police Department',
    organization: 'National Police Dispatch',
    number: '911',
    description: 'Immediate police response, crime in progress, armed threat, vehicular accidents.',
    iconType: 'police',
    available: '24/7 National Toll-Free',
  },
  {
    name: 'Belize National Fire Service',
    organization: 'Fire & Rescue Service',
    number: '990',
    description: 'Structure fire, brush fire, vehicle fire, entrapment, hazmat leaks.',
    iconType: 'fire',
    available: '24/7 National Emergency Hotline',
  },
  {
    name: 'BERT Ambulance (Belize Emergency Response Team)',
    organization: 'Pre-Hospital Emergency Care',
    number: '223-3292',
    description: 'Critical medical transport, advanced life support, trauma response.',
    iconType: 'medical',
    available: '24/7 (Belize City / Highway Corridors: 223-3292 or 90)',
  },
  {
    name: 'NEMO (National Emergency Management Org)',
    organization: 'Disaster Management & Preparedness',
    number: '822-0153',
    description: 'Hurricanes, tropical storms, severe flooding, shelter activation, evacuation alerts.',
    iconType: 'disaster',
    available: 'National EOC: 822-0153 / 822-2054',
  },
  {
    name: 'Belize Coast Guard',
    organization: 'Maritime Search and Rescue (SAR)',
    number: '222-5262',
    description: 'Vessel distress, capsized boat, diver rescue, territorial reef emergencies.',
    iconType: 'marine',
    available: '24/7 Operations Centre: 222-5262',
  },
];
