export type BelizeDistrict =
  | 'Belize'
  | 'Cayo'
  | 'Corozal'
  | 'Orange Walk'
  | 'Stann Creek'
  | 'Toledo';

export type UserRole = 'citizen' | 'responder' | 'dispatcher' | 'admin';

export type AdminRole =
  | 'super_admin'
  | 'national_admin'
  | 'district_admin'
  | 'dispatcher'
  | 'school_admin';

export interface AdminPermissions {
  canVerifyIncidents: boolean;
  canIssueAlerts: boolean;
  canDispatchTeams: boolean;
  canManageSchools: boolean;
  canManageUsers: boolean;
  canViewAuditLogs: boolean;
  canManageSystemSettings: boolean;
}

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
  adminRole?: AdminRole;
  assignedDistricts?: BelizeDistrict[] | 'all';
  permissions?: AdminPermissions;
  appointedBy?: string;
  appointedAt?: string;
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
  | 'under_verification'
  | 'verified'
  | 'dispatched'
  | 'in_progress'
  | 'responding'
  | 'resolved'
  | 'closed'
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
  assignedTeamId?: string;
  responderNotes?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  closedAt?: string;
  closureResolution?: string;
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
  affectedCommunities?: string[];
  summary: string;
  safetyInstructions?: string;
  issuingAuthority?: string;
  expiresAt?: string;
  publicationUrl?: string;
  fileUrl?: string; // base64 data URL of image or pdf
  fileType?: 'image' | 'pdf';
  fileName?: string;
  publishedBy: string;
  publisherEmail: string;
  publishedAt: string;
  active: boolean;
  channels?: {
    inApp: boolean;
    email: boolean;
    sms: boolean;
    push: boolean;
    community: boolean;
    schools: boolean;
  };
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

// --- Response Operations ---
export interface ResponseTeam {
  id: string;
  name: string;
  organization: string;
  district: BelizeDistrict | 'National';
  category: 'nemo' | 'fire' | 'police' | 'medical' | 'marine' | 'transport' | 'other';
  status: 'available' | 'deployed' | 'standby' | 'maintenance';
  activeIncidentId?: string;
  activeIncidentTitle?: string;
  leadOfficer: string;
  contactPhone: string;
  personnelCount: number;
  equipmentSummary: string;
  updatedAt: string;
}

// --- Evacuation Centres ---
export interface EvacuationCentre {
  id: string;
  name: string;
  district: BelizeDistrict;
  community: string;
  address: string;
  capacity: number;
  currentOccupancy: number;
  status: 'open' | 'standby' | 'full' | 'closed';
  hasGenerator: boolean;
  hasWaterReserve: boolean;
  hasMedicalPost: boolean;
  isWheelchairAccessible: boolean;
  managerName: string;
  managerPhone: string;
  latitude: number;
  longitude: number;
  notes?: string;
  updatedAt?: string;
}

// --- School Safety Profiles ---
export interface SchoolSafetyProfile {
  id: string;
  name: string;
  district: BelizeDistrict;
  community: string;
  principalName: string;
  contactPhone: string;
  emergencyEmail: string;
  studentCount: number;
  status: 'normal' | 'delayed' | 'closed' | 'evacuating' | 'designated_shelter';
  isDesignatedShelter: boolean;
  shelterCapacity?: number;
  lastReportedAt: string;
  safetyNotes?: string;
  updatedAt?: string;
}

// --- Participating Communities ---
export interface ParticipatingCommunity {
  id: string;
  name: string;
  district: BelizeDistrict;
  populationEstimate: number;
  vulnerabilityLevel: 'low' | 'moderate' | 'high' | 'severe';
  primaryHazards: string[];
  liaisonOfficer: string;
  liaisonPhone: string;
  nearestShelter: string;
  activePreparednessAlerts: number;
}

// --- Multi-Organization Management ---
export interface RegisteredOrganization {
  id: string;
  name: string;
  code: string;
  type: 'government_agency' | 'first_responder' | 'municipality' | 'educational' | 'ngo' | 'commercial';
  district: BelizeDistrict | 'National';
  contactEmail: string;
  contactPhone: string;
  leadOfficial: string;
  memberCount: number;
  status: 'active' | 'pending' | 'suspended';
  registeredAt: string;
  notes?: string;
}

// --- Tamper-Resistant Audit Log ---
export interface AuditLogEntry {
  id: string;
  action: string;
  actionCategory: 'auth' | 'incident' | 'alert' | 'dispatch' | 'admin' | 'system';
  actorId: string;
  actorName: string;
  actorEmail: string;
  actorRole: string;
  targetId?: string;
  targetType?: string;
  details: string;
  district?: BelizeDistrict | 'National' | 'all';
  timestamp: string;
}

// --- National Emergency DEFCON / Alert Phase ---
export type EOCAlertPhase =
  | 'green_normal'
  | 'yellow_advisory'
  | 'orange_watch'
  | 'red_warning';

export interface NationalEmergencyStatus {
  phase: EOCAlertPhase;
  phaseLabel: string;
  declaredBy: string;
  declaredAt: string;
  activeEocLocations: string[];
  bulletinSummary: string;
}

// --- Central Notification Management Centre Types ---
export type NotificationCategory =
  | 'Flood Warning'
  | 'Tropical Storm and Hurricane'
  | 'Fire Emergency'
  | 'Road Closure'
  | 'Public Safety Advisory'
  | 'Community Notice'
  | 'School Safety Alert'
  | 'General Announcement';

export type NotificationPriority = 'Critical' | 'High' | 'Moderate' | 'Informational';

export type NotificationDeliveryChannel = 'push' | 'email' | 'sms';

export type NotificationStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'scheduled'
  | 'sent'
  | 'cancelled';

export interface NotificationDeliveryReport {
  intendedRecipients: number;
  pushAttempts: number;
  pushDelivered: number;
  emailAttempts: number;
  emailAccepted: number;
  smsAttempts: number;
  smsAccepted: number;
  failedCount: number;
  acknowledgedCount: number;
  completedAt?: string;
}

export interface CentralNotification {
  id: string;
  title: string;
  message: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  district: BelizeDistrict | 'all';
  communities: string[];
  targetAudience: string;
  channels: NotificationDeliveryChannel[];
  publicationDate: string;
  expirationDate?: string;
  linkUrl?: string;
  status: NotificationStatus;
  isTest: boolean;
  creatorId: string;
  creatorName: string;
  approvedBy?: string;
  approvedAt?: string;
  deliveryReport?: NotificationDeliveryReport;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriberPreferences {
  userId: string;
  email: string;
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  phone?: string;
  district: BelizeDistrict | 'all';
  communities: string[];
  subscribedCategories: NotificationCategory[];
  consentGivenAt: string;
  updatedAt: string;
}

// --- Sidebar Menu Identifiers (15 operational modules) ---
export type CommandViewTab =
  | 'command_dashboard'
  | 'our_initiative'
  | 'national_map'
  | 'satellite_fire_monitoring'
  | 'incident_management'
  | 'emergency_alerts'
  | 'response_operations'
  | 'community_safety'
  | 'school_safety'
  | 'evacuation_centres'
  | 'analytics_reports'
  | 'user_management'
  | 'administrator_management'
  | 'organization_management'
  | 'audit_logs'
  | 'system_settings';


