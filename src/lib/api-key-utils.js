/**
 * API Key Utilities
 * Validierungsfunktionen für Anthropic API Keys
 */

/**
 * Validiert das Format eines Anthropic API Keys
 * @param {string} key - Der zu validierende API Key
 * @returns {{ valid: boolean, error?: string }} Validierungsergebnis
 */
export function validateApiKeyFormat(key) {
  if (!key || typeof key !== 'string') {
    return { valid: false, error: 'API-Key ist erforderlich' };
  }

  const trimmedKey = key.trim();

  if (trimmedKey.length === 0) {
    return { valid: false, error: 'API-Key darf nicht leer sein' };
  }

  // Anthropic API Keys beginnen mit "sk-ant-"
  if (!trimmedKey.startsWith('sk-ant-')) {
    return { valid: false, error: 'API-Key muss mit "sk-ant-" beginnen' };
  }

  // Mindestlänge prüfen (sk-ant- + mindestens 20 Zeichen)
  if (trimmedKey.length < 27) {
    return { valid: false, error: 'API-Key ist zu kurz' };
  }

  // Maximallänge prüfen (typische Keys sind ~100-150 Zeichen)
  if (trimmedKey.length > 200) {
    return { valid: false, error: 'API-Key ist zu lang' };
  }

  // Nur erlaubte Zeichen (alphanumerisch, Bindestriche, Unterstriche)
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmedKey)) {
    return { valid: false, error: 'API-Key enthält ungültige Zeichen' };
  }

  return { valid: true };
}

/**
 * Cookie-Name für den API Key
 */
export const API_KEY_COOKIE_NAME = 'b6-api-key';
