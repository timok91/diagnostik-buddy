import Anthropic from '@anthropic-ai/sdk';
import { cookies } from 'next/headers';
import { API_KEY_COOKIE_NAME } from '@/lib/api-key-utils';

export const maxDuration = 300;

export async function POST(request) {
  try {
    const { messages, systemPrompt, model } = await request.json();

    // API Key aus HTTP-Only Cookie lesen
    const cookieStore = await cookies();
    const apiKeyCookie = cookieStore.get(API_KEY_COOKIE_NAME);

    if (!apiKeyCookie || !apiKeyCookie.value) {
      return new Response(JSON.stringify({ error: 'Kein API-Key hinterlegt. Bitte in den Einstellungen eingeben.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const apiKey = apiKeyCookie.value;
    const anthropic = new Anthropic({ apiKey });

    console.log('Request - System prompt size:', Math.round(systemPrompt.length / 1024), 'KB');
    console.log('Request - Messages count:', messages.length);
    console.log('Request - Model:', model || 'claude-sonnet-4-5-20250929');

    // Streaming mit der offiziellen SDK
    const stream = await anthropic.messages.create({
      model: model || 'claude-sonnet-4-5-20250929',
      max_tokens: 8192,
      system: systemPrompt,
      messages,
      stream: true,
    });

    // Stream als plain text an Frontend senden
    const encoder = new TextEncoder();
    const abortController = new AbortController();

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            // Prüfen ob abgebrochen wurde
            if (abortController.signal.aborted) {
              break;
            }
            if (event.type === 'content_block_delta' && event.delta?.text) {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
          controller.close();
        } catch (error) {
          // Ignoriere Fehler bei Abbruch
          if (!abortController.signal.aborted) {
            console.error('Stream error:', error);
            controller.error(error);
          }
        }
      },
      cancel() {
        console.log('Stream cancelled by client');
        abortController.abort();
        // Anthropic Stream abbrechen falls möglich
        if (stream.controller) {
          stream.controller.abort();
        }
      },
    });

    return new Response(readableStream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (error) {
    console.error('Chat API Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
