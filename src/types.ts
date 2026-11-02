export type BelizeDistrict =
  | 'Belize'
  | 'Cayo'
  | 'Corozal'
  | 'Orange Walk'
  | 'Stann Creek'
  | 'Toledo';

export type UserRole = 'citizen' | 'responder' | 'dispatcher' | 'admin';

export interface UserProfile {
  id?: string;
  firstName?: string;
  lastName?: string;
  displayName: string;
  email: string;
  phoneCountryCode?: string;
  phone?: string;
  fullPhone?: string;
  dateOfBirth?: string;
  nationality?: string;
  role: UserRole;
  district: BelizeDistrict | string;
  organization?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type EmergencyCategory =
  | 'fire'
  | 'medical'
  | 'flood_weather'
  | 'accident'
  | 'crime_security'
  | 'marine_coastal'
  | 'infrastructure'
  | 'other';

export type EmergencySeverity = 'critical' | 'high' | 'medium' | 'low';

export type EmergencyStatus =
  | 'reported'
  | 'dispatched'
  | 'in_progress'
  | 'resolved'
  | 'false_alarm';

export interface EmergencyIncident {
  id: string;
  title: string;
  category: EmergencyCategory;
  severity: EmergencySeverity;
  status: EmergencyStatus;
  description: string;
  district: BelizeDistrict;
  locationName: string;
  latitude: number;
  longitude: number;
  imageUrl?: string;
  reporterId: string;
  reporterName: string;
  reporterPhone?: string;
  assignedUnit?: string;
  responderNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IncidentLog {
  id?: string;
  emergencyId: string;
  authorId: string;
  authorName: string;
  authorRole?: string;
  previousStatus?: string;
  newStatus: EmergencyStatus;
  note: string;
  createdAt: string;
}

export interface BelizeLocationPreset {
  name: string;
  district: BelizeDistrict;
  latitude: number;
  longitude: number;
  description?: string;
}

export interface EmergencyHotline {
  name: string;
  organization: string;
  number: string;
  description: string;
  iconType: 'police' | 'fire' | 'medical' | 'disaster' | 'marine';
  available: string;
}

export type AdvisoryUrgency = 'critical' | 'warning' | 'watch' | 'advisory' | 'all_clear';

export interface OfficialAdvisory {
  id: string;
  title: string;
  urgencyLevel: AdvisoryUrgency;
  district: BelizeDistrict | 'all';
  summary: string;
  fileUrl?: string; // base64 data URL of image or pdf
  fileType?: 'image' | 'pdf';
  fileName?: string;
  publishedBy: string;
  publisherEmail: string;
  publishedAt: string;
  active: boolean;
}

export interface DispatchConversation {
  id?: string;
  citizenId: string;
  citizenName: string;
  citizenEmail: string;
  citizenPhone?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadByAdmin?: boolean;
  unreadByCitizen?: boolean;
  updatedAt?: string;
}

export interface DispatchChatMessage {
  id?: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  message: string;
  incidentId?: string;
  createdAt: string;
}

