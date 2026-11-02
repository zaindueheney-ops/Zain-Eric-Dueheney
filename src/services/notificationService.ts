// Push and In-App Audio/Visual Notification Service for Belize Alerts Administrators

export function playEmergencyAlertSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    // Dual-tone high-low emergency beep (880Hz -> 660Hz)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.setValueAtTime(660, now + 0.15);
    osc.frequency.setValueAtTime(880, now + 0.3);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.65);
  } catch (err) {
    console.warn('Audio alert could not be synthesized:', err);
  }
}

export async function requestPushPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support desktop push notifications.');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (e) {
      console.warn('Error requesting notification permission:', e);
      return false;
    }
  }

  return false;
}

export function triggerAdminPushNotification(incident: {
  id: string;
  title: string;
  category: string;
  severity: string;
  district: string;
  locationName: string;
  hasPicture?: boolean;
}) {
  // 1. Synthesize audio chime alert
  playEmergencyAlertSound();

  // 2. Dispatch system browser push notification
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      const pictureInfo = incident.hasPicture ? '📷 Photo attached for review' : '📝 Text emergency report';
      const notification = new Notification('🚨 Belize Emergency Pending Approval', {
        body: `${incident.title.toUpperCase()} in ${incident.district} (${incident.locationName})\nSeverity: ${incident.severity.toUpperCase()} • ${pictureInfo}`,
        icon: '/assets/aistudio/image_ff7e619e.png',
        badge: '/assets/aistudio/image_ff7e619e.png',
        tag: `emergency_${incident.id}`,
        requireInteraction: true,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (e) {
      console.warn('System push notification failed to display:', e);
    }
  }
}
