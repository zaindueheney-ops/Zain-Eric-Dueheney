import { BelizeDistrict } from '../types';

export interface NemoCoordinator {
  id: string;
  name: string;
  post: string;
  isRegional: boolean;
  region: 'North' | 'Central' | 'South';
  district: BelizeDistrict;
  contactNumber: string;
  officeNumber?: string;
  email?: string;
  jurisdiction: string;
}

export interface EmergencyPartnerService {
  name: string;
  acronym: string;
  description: string;
  url: string;
  category: 'meteorology' | 'regional_disaster' | 'cyclone_monitoring';
}

export const NEMO_DISTRICT_COORDINATORS: NemoCoordinator[] = [
  {
    id: 'coord_carballo_north',
    name: 'Mr. Jose Carballo',
    post: 'REGIONAL COORDINATOR NORTH',
    isRegional: true,
    region: 'North',
    district: 'Orange Walk',
    contactNumber: '614-6913',
    officeNumber: '302-3228',
    email: 'northreg_coordinator@site.nemo.org.bz',
    jurisdiction: 'Northern Region Command (Corozal & Orange Walk Districts)'
  },
  {
    id: 'coord_leslie_south',
    name: 'Mr. Charles Leslie',
    post: 'REGIONAL COORDINATOR SOUTH',
    isRegional: true,
    region: 'South',
    district: 'Stann Creek',
    contactNumber: '610-1733',
    officeNumber: '522-0061',
    email: 'southreg_coordinator@site.nemo.org.bz',
    jurisdiction: 'Southern Region Command (Stann Creek & Toledo Districts)'
  },
  {
    id: 'coord_corozal_hernandez',
    name: 'Mr. Ronnie Hernandez',
    post: 'Corozal District Coordinator',
    isRegional: false,
    region: 'North',
    district: 'Corozal',
    contactNumber: '614-7140',
    officeNumber: '422-0262',
    jurisdiction: 'Corozal District & Municipal Environs'
  },
  {
    id: 'coord_ow_leiva',
    name: 'Mr. Juan Leiva',
    post: 'Orange Walk District Coordinator',
    isRegional: false,
    region: 'North',
    district: 'Orange Walk',
    contactNumber: '614-7177',
    officeNumber: '302-3228 / 2322',
    jurisdiction: 'Orange Walk District & Sugar Belt Communities'
  },
  {
    id: 'coord_bz_rural_north_malic',
    name: 'Ms. Crystal Malic',
    post: 'Belize Rural North Coordinator',
    isRegional: false,
    region: 'Central',
    district: 'Belize',
    contactNumber: '614-8382',
    officeNumber: '205-9058',
    jurisdiction: 'Belize Rural North (Ladyville, Sandhill, Maskall, Crooked Tree)'
  },
  {
    id: 'coord_bz_rural_central_pollard',
    name: 'Mr. Kevin Pollard',
    post: 'Belize Rural Central Coordinator',
    isRegional: false,
    region: 'Central',
    district: 'Belize',
    contactNumber: '614-0785',
    officeNumber: '205-9058',
    jurisdiction: 'Belize Rural Central (Hattieville, Burrell Boom, Western Paradise)'
  },
  {
    id: 'coord_bz_city_rhaburn',
    name: 'Mr. Dennis Rhaburn',
    post: 'Belize City Coordinator',
    isRegional: false,
    region: 'Central',
    district: 'Belize',
    contactNumber: '611-6793',
    officeNumber: '207-0544',
    jurisdiction: 'Belize City Metropolitan Area (Southside & Northside)'
  },
  {
    id: 'coord_bz_city_jones',
    name: 'Ms. Cassandra Jones',
    post: 'Belize City Coordinator',
    isRegional: false,
    region: 'Central',
    district: 'Belize',
    contactNumber: '614-5891',
    officeNumber: '207-0544',
    jurisdiction: 'Belize City Operations, Shelter Allocation & Urban Evacuation'
  },
  {
    id: 'coord_san_pedro_parham',
    name: 'Ms. Vanessa Parham',
    post: 'Belize Rural South / San Pedro Coordinator',
    isRegional: false,
    region: 'Central',
    district: 'Belize',
    contactNumber: '614-5865',
    officeNumber: '226-4824 / 4821 / 4358',
    jurisdiction: 'San Pedro Town & Ambergris Caye Island Chain'
  },
  {
    id: 'coord_caye_caulker_wolfe',
    name: 'Ms. Kristylane Wolfe',
    post: 'Asst. Belize Rural South / Caye Caulker Coordinator',
    isRegional: false,
    region: 'Central',
    district: 'Belize',
    contactNumber: '611-6603',
    jurisdiction: 'Caye Caulker Village & Cayes Marine Emergency Operations'
  },
  {
    id: 'coord_belmopan_acosta',
    name: 'Mr. Santiago Acosta',
    post: 'Belmopan Coordinator',
    isRegional: false,
    region: 'Central',
    district: 'Cayo',
    contactNumber: '610-8574',
    jurisdiction: 'City of Belmopan (Capital), Roaring Creek & Valley of Peace'
  },
  {
    id: 'coord_cayo_habet',
    name: 'Mr. Javier Habet',
    post: 'Cayo District Coordinator',
    isRegional: false,
    region: 'Central',
    district: 'Cayo',
    contactNumber: '614-5891',
    officeNumber: '824-3201',
    jurisdiction: 'Cayo District (San Ignacio, Santa Elena, Benque Viejo del Carmen)'
  },
  {
    id: 'coord_stann_creek_cruz',
    name: 'Mr. David Cruz',
    post: 'Stann Creek District Coordinator',
    isRegional: false,
    region: 'South',
    district: 'Stann Creek',
    contactNumber: '614-8514',
    officeNumber: '522-0061 / 0218',
    jurisdiction: 'Stann Creek District (Dangriga, Placencia, Hopkins, Seine Bight)'
  },
  {
    id: 'coord_toledo_pop',
    name: 'Mr. Jamael Pop',
    post: 'Toledo District Coordinator',
    isRegional: false,
    region: 'South',
    district: 'Toledo',
    contactNumber: '614-2158',
    officeNumber: '722-0384 / 2354',
    jurisdiction: 'Toledo District (Punta Gorda Town & 52 Indigenous Maya Rural Villages)'
  }
];

export const NEMO_REGIONAL_COORDINATORS = NEMO_DISTRICT_COORDINATORS.filter((c) => c.isRegional);

export const NEMO_AFFILIATED_SERVICES: EmergencyPartnerService[] = [
  {
    name: 'National Meteorological Service of Belize',
    acronym: 'NMS Belize',
    description: 'Official Belize Weather Bulletins, Tropical Cyclone Watches, River Flood Bulletins & Marine Advisories.',
    url: 'https://nms.gov.bz/',
    category: 'meteorology'
  },
  {
    name: 'National Hurricane Center',
    acronym: 'NOAA NHC',
    description: 'Real-time North Atlantic & Caribbean Basin Tropical Cyclone Advisories, Cone Forecasts & Storm Surge Models.',
    url: 'https://www.nhc.noaa.gov/',
    category: 'cyclone_monitoring'
  },
  {
    name: 'Caribbean Disaster Emergency Management Agency',
    acronym: 'CDERA / CDEMA',
    description: 'CARICOM inter-governmental agency for disaster management, regional swift-response deployments, and relief warehousing.',
    url: 'https://www.cdema.org/',
    category: 'regional_disaster'
  },
  {
    name: 'Coordination Centre for Natural Disaster Prevention in Central America',
    acronym: 'CEPREDENAC',
    description: 'Central American Integration System (SICA) regional platform for seismic, geological, and climate risk reduction.',
    url: 'https://www.cepredenac.org/',
    category: 'regional_disaster'
  }
];
