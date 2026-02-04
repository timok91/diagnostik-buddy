import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { messages, systemPrompt, apiKey } = await request.json();

    // System-Prompt mit Prompt Caching
    // Wird als Array mit cache_control gesendet, damit der (oft lange)
    // System-Prompt bei Folge-Nachrichten aus dem Cache gelesen wird.
    // Cache-Read: 90% günstiger als reguläre Input-Tokens.
    const system = [
      {
        type: 'text',
        text: systemPrompt,
        cache_control: { type: 'ephemeral' }
      }
    ];

    // Cache-Breakpoint in der Konversation setzen
    const processedMessages = withCacheBreakpoint(messages);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 4000,
        system,
        messages: processedMessages
      })
    });

    // API-Fehler prüfen
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error?.message || `API Error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Setzt einen Cache-Breakpoint auf der letzten Assistant-Nachricht
 * vor der neuen User-Nachricht.
 *
 * Effekt: Der gesamte Gesprächsverlauf bis zum Breakpoint wird beim
 * nächsten API-Call aus dem Cache gelesen (90% günstiger).
 *
 * Cache-TTL: 5 Minuten (reicht für typische Chat-Interaktionen).
 */
function withCacheBreakpoint(messages) {
  // Unter 3 Nachrichten lohnt sich kein Breakpoint
  if (messages.length < 3) return messages;

  const result = [...messages];

  // Letzte Assistant-Nachricht vor der neuen User-Nachricht finden
  for (let i = result.length - 2; i >= 0; i--) {
    if (result[i].role === 'assistant') {
      result[i] = {
        role: 'assistant',
        content: [
          {
            type: 'text',
            text: typeof result[i].content === 'string' ? result[i].content : result[i].content[0]?.text || '',
            cache_control: { type: 'ephemeral' }
          }
        ]
      };
      break;
    }
  }

  return result;
}