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

    // System-Prompt als Array mit Cache-Control
    const systemContent = [
      {
        type: 'text',
        text: systemPrompt,
        cache_control: { type: 'ephemeral' }
      }
    ];

    // Cache-Breakpoint auf der vorletzten User-Nachricht setzen
    // (damit alle bisherigen Nachrichten gecacht werden, nur die letzte ist neu)
    const userMessageCount = messages.filter(m => m.role === 'user').length;
    let lastUserSeen = false;
    const cachedMessages = messages.map((msg, idx) => {
      if (msg.role === 'user' && userMessageCount >= 2 && !lastUserSeen) {
        // Prüfen ob dies die vorletzte User-Nachricht ist
        const remainingUserMsgs = messages.slice(idx + 1).filter(m => m.role === 'user').length;
        if (remainingUserMsgs === 1) {
          lastUserSeen = true;
          return {
            role: msg.role,
            content: [
              {
                type: 'text',
                text: typeof msg.content === 'string' ? msg.content : msg.content,
                cache_control: { type: 'ephemeral' }
              }
            ]
          };
        }
      }
      return msg;
    });

    // Streaming mit der offiziellen SDK + Prompt Caching
    const stream = await anthropic.messages.create({
      model: model || 'claude-sonnet-4-5-20250929',
      max_tokens: 8192,
      system: systemContent,
      messages: cachedMessages,
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
            if (event.type === 'message_start') {
              const usage = event.message?.usage;
              if (usage) {
                console.log('Cache - Input:', usage.input_tokens,
                            '| Cache creation:', usage.cache_creation_input_tokens || 0,
                            '| Cache read:', usage.cache_read_input_tokens || 0);
              }
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
