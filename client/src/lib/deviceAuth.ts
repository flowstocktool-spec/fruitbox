
// Device-based authentication without OTP or third-party APIs
import { nanoid } from 'nanoid';

interface DeviceFingerprint {
  userAgent: string;
  language: string;
  platform: string;
  screenResolution: string;
  timezone: string;
  cookieEnabled: boolean;
}

function generateFingerprint(): DeviceFingerprint {
  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    screenResolution: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    cookieEnabled: navigator.cookieEnabled,
  };
}

function fingerprintToString(fp: DeviceFingerprint): string {
  return JSON.stringify(fp);
}

export function getDeviceId(): string {
  // Check if device ID exists in localStorage
  let deviceId = localStorage.getItem('deviceId');
  
  if (!deviceId) {
    // Generate new device ID
    deviceId = nanoid(32);
    localStorage.setItem('deviceId', deviceId);
  }
  
  return deviceId;
}

export function getDeviceFingerprint(): string {
  const fingerprint = generateFingerprint();
  return btoa(fingerprintToString(fingerprint)); // Base64 encode
}

export function verifyDevice(storedFingerprint: string): boolean {
  const currentFingerprint = getDeviceFingerprint();
  return currentFingerprint === storedFingerprint;
}

export function clearDeviceAuth() {
  localStorage.removeItem('deviceId');
  localStorage.removeItem('customerCode');
}
