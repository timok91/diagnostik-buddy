import { cookies } from 'next/headers';
import { validateApiKeyFormat, API_KEY_COOKIE_NAME } from '@/lib/api-key-utils';

const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 Tage in Sekunden

/**
 * POST /api/set-key
 * Speichert den API Key in einem HTTP-Only Cookie
 */
export async function POST(request) {
  try {
    const { apiKey } = await request.json();

    // Validierung
    const validation = validateApiKeyFormat(apiKey);
    if (!validation.valid) {
      return Response.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Cookie setzen
    const cookieStore = await cookies();
    cookieStore.set(API_KEY_COOKIE_NAME, apiKey.trim(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Set-Key Error:', error);
    return Response.json(
      { error: 'Fehler beim Speichern des API-Keys' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/set-key
 * Prüft ob ein API Key gesetzt ist (gibt true/false zurück, nicht den Key selbst)
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const apiKeyCookie = cookieStore.get(API_KEY_COOKIE_NAME);

    const hasKey = !!(apiKeyCookie && apiKeyCookie.value);

    return Response.json({ hasApiKey: hasKey });
  } catch (error) {
    console.error('Get-Key Status Error:', error);
    return Response.json(
      { error: 'Fehler beim Prüfen des API-Key Status' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/set-key
 * Löscht den API Key Cookie (Logout)
 */
export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(API_KEY_COOKIE_NAME);

    return Response.json({ success: true });
  } catch (error) {
    console.error('Delete-Key Error:', error);
    return Response.json(
      { error: 'Fehler beim Löschen des API-Keys' },
      { status: 500 }
    );
  }
}
