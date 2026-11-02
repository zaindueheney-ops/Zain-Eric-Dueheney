import { EmergencyIncident } from '../types';

// Zero notional/seed emergencies by default. Only genuine emergency incidents reported by users are displayed.
export const INITIAL_BELIZE_INCIDENTS: Omit<EmergencyIncident, 'id'>[] = [];
