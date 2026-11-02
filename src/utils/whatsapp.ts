/**
 * Belize Alerts Official WhatsApp Integration Utilities
 * Generates verified click-to-chat links for instant dispatch communication
 */

export function cleanWhatsAppPhone(phoneCountryCode?: string, phone?: string): string {
  if (!phone) return '';

  const rawPhoneDigits = phone.replace(/\D/g, '');
  const rawCodeDigits = (phoneCountryCode || '').replace(/\D/g, '');

  if (!rawPhoneDigits) return '';

  // If already starts with Belize country code (501) and is 10 digits
  if (rawPhoneDigits.startsWith('501') && rawPhoneDigits.length >= 10) {
    return rawPhoneDigits;
  }

  // If international country code was provided explicitly
  if (rawCodeDigits && !rawPhoneDigits.startsWith(rawCodeDigits)) {
    return `${rawCodeDigits}${rawPhoneDigits}`;
  }

  // Belize local numbers are 7 digits (e.g. 610-1234 or 223-1234)
  if (rawPhoneDigits.length === 7) {
    return `501${rawPhoneDigits}`;
  }

  // If already has country code or fallback to Belize
  return rawPhoneDigits.length > 7 ? rawPhoneDigits : `501${rawPhoneDigits}`;
}

export function createWhatsAppUrl(
  phoneCountryCode?: string,
  phone?: string,
  messageText?: string
): string {
  const cleanNumber = cleanWhatsAppPhone(phoneCountryCode, phone);
  if (!cleanNumber) return '';

  const encodedText = messageText ? encodeURIComponent(messageText) : '';
  return `https://wa.me/${cleanNumber}${encodedText ? `?text=${encodedText}` : ''}`;
}

/**
 * Pre-formatted templates for Belize Emergency Dispatch
 */
export const WhatsAppTemplates = {
  citizenVerification: (name: string, district?: string) =>
    `Hello ${name || 'Citizen'}, this is Belize Emergency Central Dispatch (Belize Alerts). We are contacting you regarding your citizen profile registered in ${district || 'Belize'} District. Please confirm if your contact details and active location are up to date.`,

  incidentFollowup: (incident: { id: string; title: string; district: string; reporterName: string }) =>
    `Hello ${incident.reporterName || 'Citizen'}, this is Belize Central Dispatch regarding your reported emergency: "${incident.title}" (ID: #${incident.id.slice(-6).toUpperCase()}) in ${incident.district} District. Please reply with any critical updates or on-scene status for responding units.`,

  emergencyAssistance: (name: string) =>
    `Hello Belize Central Dispatch, this is ${name || 'a citizen'}. I am contacting you directly via Belize Alerts regarding an emergency situation.`,
};
