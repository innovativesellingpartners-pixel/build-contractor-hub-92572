/**
 * Formats a phone number to a readable format
 * Converts E.164 format (+15551234567) to (555) 123-4567
 */
export const formatPhoneNumber = (phoneNumber: string): string => {
  if (!phoneNumber) return '';

  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');

  // Handle US phone numbers (10 or 11 digits)
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    const match = cleaned.match(/^1(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
  } else if (cleaned.length === 10) {
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
  }

  // Return original if format doesn't match
  return phoneNumber;
};

/**
 * Calculates call duration in seconds between two timestamps
 */
export const calculateCallDuration = (startTime: string, endTime: string): number => {
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  return Math.floor((end - start) / 1000);
};

/**
 * Formats duration in seconds to a readable string (e.g., "3m 45s")
 */
export const formatDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
};
