import Anthropic from '@anthropic-ai/sdk';

export const maxDuration = 300;

export async function POST(request) {
  try {
    const { messages, systemPrompt, apiKey, model } = await request.json();

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
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta?.text) {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
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
