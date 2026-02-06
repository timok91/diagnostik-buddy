import Anthropic from '@anthropic-ai/sdk';
import { cookies } from 'next/headers';
import { API_KEY_COOKIE_NAME } from '@/lib/api-key-utils';
import { PDFDocument } from 'pdf-lib';
import { B6_DIMENSIONS } from '@/lib/b6-scale';

export const maxDuration = 60;

export async function POST(request) {
  try {
    // API Key aus HTTP-Only Cookie lesen
    const cookieStore = await cookies();
    const apiKeyCookie = cookieStore.get(API_KEY_COOKIE_NAME);

    if (!apiKeyCookie || !apiKeyCookie.value) {
      return Response.json(
        { error: 'Kein API-Key hinterlegt. Bitte in den Einstellungen eingeben.' },
        { status: 401 }
      );
    }

    const apiKey = apiKeyCookie.value;
    const { fileData, fileName } = await request.json();

    if (!fileData) {
      return Response.json({ error: 'Keine Datei übermittelt' }, { status: 400 });
    }

    // Base64-Daten extrahieren (data:application/pdf;base64,... entfernen)
    const base64Data = fileData.includes(',') ? fileData.split(',')[1] : fileData;
    const pdfBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    // PDF laden und Seite 2 extrahieren
    let page2Base64;
    try {
      const sourcePdf = await PDFDocument.load(pdfBytes);
      const pageCount = sourcePdf.getPageCount();

      if (pageCount < 2) {
        return Response.json(
          { error: 'Das PDF hat weniger als 2 Seiten. Die Ergebnisse werden auf Seite 2 erwartet.' },
          { status: 400 }
        );
      }

      // Neues PDF mit nur Seite 2 erstellen
      const singlePagePdf = await PDFDocument.create();
      const [copiedPage] = await singlePagePdf.copyPages(sourcePdf, [1]);
      singlePagePdf.addPage(copiedPage);
      const singlePageBytes = await singlePagePdf.save();
      page2Base64 = Buffer.from(singlePageBytes).toString('base64');
    } catch (pdfError) {
      console.error('PDF-Verarbeitungsfehler:', pdfError);
      return Response.json(
        { error: 'Die PDF-Datei konnte nicht verarbeitet werden. Bitte prüfen Sie das Dateiformat.' },
        { status: 400 }
      );
    }

    // Claude Vision API aufrufen
    const anthropic = new Anthropic({ apiKey });

    const extractionPrompt = `Analysiere dieses B6 Kompakt Testergebnis-PDF und extrahiere die Profilwerte.

AUFGABE:
1. Lies den Kandidatennamen aus der Textzeile, die mit "Kennung:" beginnt. Der Text nach "Kennung:" ist der Name.
2. Extrahiere die Werte für alle 9 B6-Dimensionen.

DIE 9 DIMENSIONEN (verwende exakt diese Namen):
${B6_DIMENSIONS.map(d => `- "${d}"`).join('\n')}

SKALENZUORDNUNG (von links nach rechts im Diagramm):
- E3 = 1
- E2 = 2
- E1 = 3
- S1 = 4
- S2 = 5
- S3 = 6
- Ü = 7

WICHTIG:
- Gib NUR valides JSON zurück, keine Erklärungen
- Wenn das Dokument keine B6-Ergebnisse enthält oder nicht lesbar ist, gib ein leeres candidates-Array zurück mit einer Warnung
- Gib eine Konfidenz pro Kandidat an: "high" wenn alle Werte klar lesbar, "medium" wenn einige Werte geschätzt, "low" wenn viele Werte unklar

ANTWORTFORMAT (NUR dieses JSON, nichts anderes):
{
  "candidates": [
    {
      "name": "Name des Kandidaten",
      "dimensions": {
        "ICH": 5,
        "WIR": 3,
        "DENKEN": 4,
        "TUN": 6,
        "Ich bin o.k.": 4,
        "Du bist o.k.": 5,
        "Regeneration": 3,
        "Umgang mit Emotionen": 4,
        "Leistungsmotivation": 5
      },
      "confidence": "high"
    }
  ],
  "warnings": []
}`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: page2Base64,
              },
            },
            {
              type: 'text',
              text: extractionPrompt,
            },
          ],
        },
      ],
    });

    // Antwort parsen
    const responseText = response.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('');

    let result;
    try {
      // Direktes JSON-Parsing versuchen
      result = JSON.parse(responseText);
    } catch {
      // Fallback: JSON aus Markdown-Code-Block extrahieren
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[1].trim());
      } else {
        console.error('Konnte JSON nicht parsen:', responseText);
        return Response.json(
          { error: 'Die KI-Antwort konnte nicht verarbeitet werden. Bitte versuchen Sie es erneut.' },
          { status: 500 }
        );
      }
    }

    // Validierung: Dimensionswerte auf 1-7 clampen
    if (result.candidates && Array.isArray(result.candidates)) {
      result.candidates = result.candidates.map(candidate => {
        const clampedDimensions = {};
        for (const [key, val] of Object.entries(candidate.dimensions || {})) {
          clampedDimensions[key] = Math.max(1, Math.min(7, Math.round(Number(val) || 4)));
        }
        return { ...candidate, dimensions: clampedDimensions };
      });
    }

    if (!result.candidates || result.candidates.length === 0) {
      return Response.json(
        { error: 'Keine B6-Profile auf Seite 2 gefunden. Bitte prüfen Sie, ob es sich um ein B6 Kompakt Testergebnis handelt.' },
        { status: 400 }
      );
    }

    return Response.json(result);
  } catch (error) {
    console.error('Extract Profile Error:', error);
    return Response.json(
      { error: error.message || 'Ein unerwarteter Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}
