/**
 * UUID utility functions for generating unique identifiers
 */

/**
 * Generates a UUID v4 string
 * @returns A UUID v4 string in the format xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Generates a short UUID (8 characters) for cases where a shorter ID is needed
 * @returns A short UUID string
 */
export function generateShortUUID(): string {
  return Math.random().toString(36).substring(2, 10);
}

/**
 * Validates if a string is a valid UUID v4 format
 * @param uuid The string to validate
 * @returns True if the string is a valid UUID v4 format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Generates a UUID with a timestamp prefix for sorting purposes
 * @returns A UUID with timestamp prefix
 */
export function generateTimestampUUID(): string {
  const timestamp = Date.now().toString(36);
  const uuid = generateUUID();
  return `${timestamp}-${uuid}`;
}
