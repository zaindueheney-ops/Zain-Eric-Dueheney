export interface BelizeDepartmentGroup {
  category: string;
  units: string[];
}

export const BELIZE_GOVERNMENT_RESPONSE_UNITS: BelizeDepartmentGroup[] = [
  {
    category: 'National Emergency & Disaster Management',
    units: [
      'NEMO (National Emergency Management Organization)',
      'NEMO Central Headquarters (Belmopan)',
      'NEMO Belize District Operations',
      'NEMO Cayo District EOC',
      'NEMO Orange Walk District EOC',
      'NEMO Corozal District EOC',
      'NEMO Stann Creek District EOC',
      'NEMO Toledo District EOC',
      'Belize Central Dispatch',
    ],
  },
  {
    category: 'First Responders & Security Forces',
    units: [
      'Belize National Fire Service',
      'Belize Police Department (BPD)',
      'BERT Ambulance (Belize Emergency Response Team)',
      'Belize Coast Guard (BCG - Maritime SAR)',
      'Belize Defence Force (BDF Disaster Task Force)',
      'Department of Transport (Highway Patrol)',
    ],
  },
  {
    category: 'Key Government Ministries',
    units: [
      'Ministry of Sustainable Development, Climate Change & Disaster Risk Management',
      'Ministry of Health & Wellness',
      'Ministry of Infrastructure Development & Housing (MIDH)',
      'Ministry of National Defence & Border Security',
      'Ministry of Home Affairs & New Growth Industries',
      'Ministry of Natural Resources, Petroleum & Mining',
      'Ministry of Agriculture, Food Security & Enterprise',
      'Ministry of Public Utilities, Energy, Logistics & E-Governance',
      'Ministry of Blue Economy & Civil Aviation',
      'Ministry of Tourism & Diaspora Relations',
      'Ministry of Education, Culture, Science & Technology',
      'Ministry of Human Development, Families & Indigenous Peoples Affairs',
    ],
  },
  {
    category: 'Public Utilities & Specialized Departments',
    units: [
      'National Meteorological Service of Belize (NMS - Chief Meteorologist Ronald Gordon • nms.gov.bz)',
      'National Meteorological Service of Belize (NMS)',
      'Belize Electricity Limited (BEL Emergency Crews)',
      'Belize Water Services (BWS Emergency Operations)',
      'Department of the Environment (DOE Hazmat Team)',
      'Forestry Department (Wildfire Response)',
      'Fisheries Department (Marine Patrol)',
      'Belize Port Authority (Coastal Safety)',
      'Karl Heusner Memorial Hospital Authority (KHMHA Trauma)',
    ],
  },
];

export const ALL_BELIZE_UNITS: string[] = BELIZE_GOVERNMENT_RESPONSE_UNITS.flatMap((g) => g.units);
