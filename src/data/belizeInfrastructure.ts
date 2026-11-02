import {
  EvacuationCentre,
  ResponseTeam,
  SchoolSafetyProfile,
  ParticipatingCommunity,
  RegisteredOrganization,
  NationalEmergencyStatus,
  BelizeDistrict
} from '../types';

export const INITIAL_NATIONAL_EMERGENCY_STATUS: NationalEmergencyStatus = {
  phase: 'green_normal',
  phaseLabel: 'Green Alert (Phase 1) - Normal Preparedness',
  declaredBy: 'NEMO National Emergency Coordinator & Central Dispatch',
  declaredAt: new Date().toISOString(),
  activeEocLocations: [
    'NEMO Belmopan Central Command',
    'Belize City Operations Centre',
    'San Ignacio Cayo Regional Hub'
  ],
  bulletinSummary:
    'All national emergency systems are functioning normally under Phase 1 baseline readiness. Monitoring daily NMS weather bulletins and regional coastal observations.',
};

import { NATIONAL_SHELTERS_2026 } from './nationalShelters2026';

export const INITIAL_EVACUATION_CENTRES: EvacuationCentre[] = NATIONAL_SHELTERS_2026.map((s) => ({
  id: s.id,
  name: s.name,
  district: s.district,
  community: s.community,
  address: s.address,
  capacity: s.capacity,
  currentOccupancy: s.currentOccupancy,
  status: s.status,
  hasGenerator: s.hasGenerator,
  hasWaterReserve: s.hasWaterReserve,
  hasMedicalPost: s.hasMedicalPost,
  isWheelchairAccessible: s.isWheelchairAccessible,
  managerName: s.managerName,
  managerPhone: s.managerPhone,
  latitude: s.latitude,
  longitude: s.longitude,
  notes: `${s.classType} - ${s.windRating}. ${s.notes}`,
}));

export const INITIAL_RESPONSE_TEAMS: ResponseTeam[] = [
  {
    id: 'team_nemo_hq',
    name: 'NEMO National Strike Team 1 (Alpha)',
    organization: 'NEMO National Headquarters',
    district: 'National',
    category: 'nemo',
    status: 'available',
    leadOfficer: 'Capt. Marcus Leslie',
    contactPhone: '+501 822-0153',
    personnelCount: 16,
    equipmentSummary: '4x4 Rescue Vehicles, Satellite SAT-Phones, Drones, Rapid Assessment Kits',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'team_fire_bz',
    name: 'Belize National Fire Service (Station 1 Heavy Rescue)',
    organization: 'Belize National Fire Service',
    district: 'Belize',
    category: 'fire',
    status: 'available',
    leadOfficer: 'Station Officer Kenneth Mortis',
    contactPhone: '+501 990',
    personnelCount: 12,
    equipmentSummary: 'Class-A Pumper Fire Engines, Jaws of Life, Hazmat Containment Gear',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'team_bert_als',
    name: 'BERT Paramedic ALS Unit 1',
    organization: 'Belize Emergency Response Team (BERT)',
    district: 'Belize',
    category: 'medical',
    status: 'available',
    leadOfficer: 'Paramedic Supervisor Darren Davis',
    contactPhone: '+501 223-3292',
    personnelCount: 6,
    equipmentSummary: 'Advanced Life Support Ambulance, Cardiac Defibrillators, Trauma Stabilization Units',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'team_police_rapid',
    name: 'Belize Police Department Mobile Interceptor Unit',
    organization: 'Belize Police Department',
    district: 'Belize',
    category: 'police',
    status: 'available',
    leadOfficer: 'Inspector Aaron Gamboa',
    contactPhone: '+501 911',
    personnelCount: 18,
    equipmentSummary: 'All-Terrain Patrol Vehicles, Tactical Radios, Highway Traffic Control Units',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'team_coast_guard',
    name: 'Belize Coast Guard Search & Rescue Flotilla',
    organization: 'Belize Coast Guard',
    district: 'National',
    category: 'marine',
    status: 'available',
    leadOfficer: 'Lt. Cmdr. Alma Pinelo',
    contactPhone: '+501 222-5262',
    personnelCount: 14,
    equipmentSummary: '38-ft Defender Class Patrol Cutters, Marine Sonar, Offshore Rescue Divers',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'team_cayo_nemo',
    name: 'Cayo District Flood & Swiftwater Unit',
    organization: 'NEMO Cayo District',
    district: 'Cayo',
    category: 'nemo',
    status: 'available',
    leadOfficer: 'Field Coordinator Jason Jones',
    contactPhone: '+501 824-2111',
    personnelCount: 10,
    equipmentSummary: 'Rigid Inflatable Boats (RIB), Swiftwater Rescue Harnesses, Mud Pumps',
    updatedAt: new Date().toISOString()
  }
];

export const INITIAL_SCHOOL_PROFILES: SchoolSafetyProfile[] = [
  {
    id: 'school_galen',
    name: 'Galen University (Central Campus)',
    district: 'Cayo',
    community: 'Central Farm / San Ignacio',
    principalName: 'Dr. Rene Villanueva (Provost)',
    contactPhone: '+501 824-3226',
    emergencyEmail: 'safety@galen.edu.bz',
    studentCount: 1450,
    status: 'normal',
    isDesignatedShelter: true,
    shelterCapacity: 500,
    lastReportedAt: new Date().toISOString(),
    safetyNotes: 'Campus wide emergency alert system operational. Elevated academic buildings.'
  },
  {
    id: 'school_sjc',
    name: "St. John's College & Junior College",
    district: 'Belize',
    community: 'Belize City',
    principalName: 'Mirtha Peralta',
    contactPhone: '+501 223-3731',
    emergencyEmail: 'administration@sjc.edu.bz',
    studentCount: 1800,
    status: 'normal',
    isDesignatedShelter: true,
    shelterCapacity: 650,
    lastReportedAt: new Date().toISOString(),
    safetyNotes: 'Northside primary evacuation facility with auxiliary electrical generation.'
  },
  {
    id: 'school_bhs',
    name: 'Belize High School & Belize Prep',
    district: 'Belize',
    community: 'Belize City',
    principalName: 'Jamie Usher',
    contactPhone: '+501 223-2741',
    emergencyEmail: 'admin@belizehighschool.edu.bz',
    studentCount: 650,
    status: 'normal',
    isDesignatedShelter: false,
    lastReportedAt: new Date().toISOString(),
    safetyNotes: 'Direct digital notification channel connected to central emergency dispatch.'
  },
  {
    id: 'school_muffles',
    name: 'Muffles College High School',
    district: 'Orange Walk',
    community: 'Orange Walk Town',
    principalName: 'Maria Johnston',
    contactPhone: '+501 322-2144',
    emergencyEmail: 'mufflescollege@btl.net',
    studentCount: 920,
    status: 'normal',
    isDesignatedShelter: true,
    shelterCapacity: 550,
    lastReportedAt: new Date().toISOString(),
    safetyNotes: 'Designated hurricane shelter for northern municipal cluster.'
  },
  {
    id: 'school_ccc',
    name: 'Corozal Community College',
    district: 'Corozal',
    community: 'Corozal Town',
    principalName: 'Jose Mai',
    contactPhone: '+501 422-2111',
    emergencyEmail: 'ccc_admin@btl.net',
    studentCount: 840,
    status: 'normal',
    isDesignatedShelter: true,
    shelterCapacity: 600,
    lastReportedAt: new Date().toISOString(),
    safetyNotes: 'Concrete reinforced campus with water cistern reserves.'
  },
  {
    id: 'school_ihs',
    name: 'Independence High School',
    district: 'Stann Creek',
    community: 'Independence Village / Mango Creek',
    principalName: 'Omar Longsworth',
    contactPhone: '+501 523-2055',
    emergencyEmail: 'independencehigh@gmail.com',
    studentCount: 780,
    status: 'normal',
    isDesignatedShelter: true,
    shelterCapacity: 450,
    lastReportedAt: new Date().toISOString(),
    safetyNotes: 'Southern peninsula hub shelter accessible from Southern Highway.'
  },
  {
    id: 'school_tcc',
    name: 'Toledo Community College',
    district: 'Toledo',
    community: 'Punta Gorda Town',
    principalName: 'Cynthia Ellis Topsey',
    contactPhone: '+501 722-2052',
    emergencyEmail: 'tcc_admin@pg.bz',
    studentCount: 710,
    status: 'normal',
    isDesignatedShelter: true,
    shelterCapacity: 480,
    lastReportedAt: new Date().toISOString(),
    safetyNotes: 'Toledo central shelter site with emergency solar battery bank.'
  }
];

export const INITIAL_COMMUNITIES: ParticipatingCommunity[] = [
  {
    id: 'comm_caye_caulker',
    name: 'Caye Caulker Village',
    district: 'Belize',
    populationEstimate: 2200,
    vulnerabilityLevel: 'high',
    primaryHazards: ['Storm Surge', 'Tropical Cyclones', 'Reef Maritime Emergencies'],
    liaisonOfficer: 'Selena Marin',
    liaisonPhone: '+501 226-0388',
    nearestShelter: 'Caye Caulker Community Centre',
    activePreparednessAlerts: 0
  },
  {
    id: 'comm_san_pedro',
    name: 'San Pedro Town (Ambergris Caye)',
    district: 'Belize',
    populationEstimate: 18500,
    vulnerabilityLevel: 'high',
    primaryHazards: ['Coastal Surges', 'Tropical Storms', 'Structure Fires in High Density Areas'],
    liaisonOfficer: 'Vanessa Parham',
    liaisonPhone: '+501 226-2525',
    nearestShelter: 'San Pedro High School',
    activePreparednessAlerts: 0
  },
  {
    id: 'comm_placencia',
    name: 'Placencia Peninsula & Seine Bight',
    district: 'Stann Creek',
    populationEstimate: 4200,
    vulnerabilityLevel: 'high',
    primaryHazards: ['Coastal Inundation', 'Lagoon Flooding', 'Highway Cutoff'],
    liaisonOfficer: 'Jolene Villanueva',
    liaisonPhone: '+501 523-3383',
    nearestShelter: 'Placencia Community Centre',
    activePreparednessAlerts: 0
  },
  {
    id: 'comm_bullet_tree',
    name: 'Bullet Tree Falls Village',
    district: 'Cayo',
    populationEstimate: 2800,
    vulnerabilityLevel: 'moderate',
    primaryHazards: ['Mopan River Flash Floods', 'Bridge Inundation'],
    liaisonOfficer: 'Oscar Ramirez',
    liaisonPhone: '+501 824-4011',
    nearestShelter: 'Bullet Tree Community School',
    activePreparednessAlerts: 0
  },
  {
    id: 'comm_hopkins',
    name: 'Hopkins Coastal Village',
    district: 'Stann Creek',
    populationEstimate: 1950,
    vulnerabilityLevel: 'moderate',
    primaryHazards: ['Coastal Erosion', 'Squalls', 'High Tide Flooding'],
    liaisonOfficer: 'Ted McKoy',
    liaisonPhone: '+501 523-7020',
    nearestShelter: 'Holy Family RC School Shelter',
    activePreparednessAlerts: 0
  },
  {
    id: 'comm_sarteneja',
    name: 'Sarteneja Village',
    district: 'Corozal',
    populationEstimate: 3100,
    vulnerabilityLevel: 'moderate',
    primaryHazards: ['Corozal Bay Inundation', 'Road Access Flooding'],
    liaisonOfficer: 'Ramon Verde',
    liaisonPhone: '+501 423-2005',
    nearestShelter: 'Sarteneja Community Hall',
    activePreparednessAlerts: 0
  }
];

export const INITIAL_ORGANIZATIONS: RegisteredOrganization[] = [
  {
    id: 'org_nemo',
    name: 'National Emergency Management Organization (NEMO)',
    code: 'NEMO-BZ',
    type: 'government_agency',
    district: 'National',
    contactEmail: 'nemo@nemo.org.bz',
    contactPhone: '+501 822-0153',
    leadOfficial: 'National Emergency Coordinator',
    memberCount: 148,
    status: 'active',
    registeredAt: '2024-01-15T00:00:00Z',
    notes: 'Primary national statutory coordinator for disaster risk reduction and civil defense.'
  },
  {
    id: 'org_bnfs',
    name: 'Belize National Fire Service',
    code: 'BNFS',
    type: 'first_responder',
    district: 'National',
    contactEmail: 'fire.headquarters@fireservice.gov.bz',
    contactPhone: '+501 990',
    leadOfficial: 'Fire Chief Colin Gillett',
    memberCount: 220,
    status: 'active',
    registeredAt: '2024-01-15T00:00:00Z',
    notes: 'National firefighting, vehicular extrication, and industrial hazardous materials response.'
  },
  {
    id: 'org_bpd',
    name: 'Belize Police Department',
    code: 'BPD',
    type: 'first_responder',
    district: 'National',
    contactEmail: 'police.commissioner@police.gov.bz',
    contactPhone: '+501 911',
    leadOfficial: 'Commissioner of Police',
    memberCount: 850,
    status: 'active',
    registeredAt: '2024-01-15T00:00:00Z',
    notes: 'National law enforcement, highway emergency response, public safety and cordon security.'
  },
  {
    id: 'org_bert',
    name: 'Belize Emergency Response Team (BERT)',
    code: 'BERT-EMS',
    type: 'first_responder',
    district: 'Belize',
    contactEmail: 'dispatch@bertambulance.org',
    contactPhone: '+501 223-3292',
    leadOfficial: 'Executive Director Darren Davis',
    memberCount: 65,
    status: 'active',
    registeredAt: '2024-02-01T00:00:00Z',
    notes: 'Pre-hospital paramedical and advanced life support ambulance network across Belize.'
  },
  {
    id: 'org_bcg',
    name: 'Belize Coast Guard',
    code: 'BCG',
    type: 'first_responder',
    district: 'National',
    contactEmail: 'operations@coastguard.gov.bz',
    contactPhone: '+501 222-5262',
    leadOfficial: 'Rear Admiral Elton Bennett',
    memberCount: 180,
    status: 'active',
    registeredAt: '2024-02-10T00:00:00Z',
    notes: 'Maritime search and rescue, territorial waters defense, barrier reef accident response.'
  },
  {
    id: 'org_moecst',
    name: 'Ministry of Education, Culture, Science & Technology (School Safety)',
    code: 'MOECST',
    type: 'educational',
    district: 'National',
    contactEmail: 'safety@moe.gov.bz',
    contactPhone: '+501 822-2698',
    leadOfficial: 'Chief Education Officer',
    memberCount: 95,
    status: 'active',
    registeredAt: '2024-02-15T00:00:00Z',
    notes: 'Institutional coordination of school safety protocols, shelter designation, and delayed opening advisories.'
  },
  {
    id: 'org_bcc',
    name: 'Belize City Council (City EOC)',
    code: 'BCC-CEMO',
    type: 'municipality',
    district: 'Belize',
    contactEmail: 'cemo@belizecitycouncil.org',
    contactPhone: '+501 227-2308',
    leadOfficial: 'Mayor of Belize City / CEMO Liaison',
    memberCount: 72,
    status: 'active',
    registeredAt: '2024-03-01T00:00:00Z',
    notes: 'Municipal emergency operations, drainage maintenance, urban shelter management.'
  }
];
