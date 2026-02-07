import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ShadingType,
  LevelFormat,
  Header,
  ImageRun,
  VerticalAlign,
} from 'docx';

// Import der zentralen B6-Scale Bibliothek
import { B6_DIMENSIONS, getScaleLabel } from '@/lib/b6-scale';

// Helper: Fetch logo as ArrayBuffer
const fetchLogo = async () => {
  try {
    const response = await fetch('/logo.png');
    if (!response.ok) throw new Error('Logo not found');
    const arrayBuffer = await response.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  } catch (error) {
    console.warn('Logo konnte nicht geladen werden:', error);
    return null;
  }
};

// Helper: Parse text content into paragraphs
const parseContentToParagraphs = (content) => {
  if (!content) return [new Paragraph({ children: [new TextRun('')] })];
  
  const lines = content.split('\n');
  const paragraphs = [];
  
  lines.forEach((line) => {
    const trimmed = line.trim();

    // Heading detection
    if (trimmed.startsWith('#### ')) {
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: trimmed.replace('#### ', ''), bold: true, size: 22, color: '26358B' })],
        spacing: { before: 200, after: 100 },
      }));
    } else if (trimmed.startsWith('### ')) {
      paragraphs.push(new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun({ text: trimmed.replace('### ', ''), bold: true })],
        spacing: { before: 240, after: 120 },
      }));
    } else if (trimmed.startsWith('## ')) {
      paragraphs.push(new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: trimmed.replace('## ', ''), bold: true })],
        spacing: { before: 300, after: 120 },
      }));
    } else if (trimmed.startsWith('# ')) {
      paragraphs.push(new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: trimmed.replace('# ', ''), bold: true })],
        spacing: { before: 360, after: 180 },
      }));
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
      // Bullet point
      paragraphs.push(new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        children: [new TextRun(trimmed.replace(/^[-•]\s*/, ''))],
        spacing: { before: 60, after: 60 },
      }));
    } else if (/^\d+\.\s/.test(trimmed)) {
      // Numbered list
      paragraphs.push(new Paragraph({
        numbering: { reference: 'numbers', level: 0 },
        children: [new TextRun(trimmed.replace(/^\d+\.\s*/, ''))],
        spacing: { before: 60, after: 60 },
      }));
    } else if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      // Horizontal rule
      paragraphs.push(new Paragraph({
        children: [],
        border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: 'A2D8EF' } },
        spacing: { before: 240, after: 240 },
      }));
    } else if (trimmed === '') {
      // Empty line
      paragraphs.push(new Paragraph({ children: [] }));
    } else {
      // Regular paragraph with bold text support
      const children = [];
      const parts = trimmed.split(/(\*\*[^*]+\*\*)/g);
      parts.forEach((part) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          children.push(new TextRun({ text: part.slice(2, -2), bold: true }));
        } else if (part) {
          children.push(new TextRun(part));
        }
      });
      paragraphs.push(new Paragraph({
        children,
        spacing: { before: 120, after: 120 },
      }));
    }
  });
  
  return paragraphs;
};

// Base document config
const createDocumentConfig = () => ({
  styles: {
    default: {
      document: {
        run: { font: 'Arial', size: 24 }, // 12pt
      },
    },
    paragraphStyles: [
      {
        id: 'Heading1',
        name: 'Heading 1',
        basedOn: 'Normal',
        next: 'Normal',
        quickFormat: true,
        run: { size: 36, bold: true, font: 'Arial', color: '26358B' },
        paragraph: { spacing: { before: 360, after: 180 }, outlineLevel: 0 },
      },
      {
        id: 'Heading2',
        name: 'Heading 2',
        basedOn: 'Normal',
        next: 'Normal',
        quickFormat: true,
        run: { size: 28, bold: true, font: 'Arial', color: '26358B' },
        paragraph: { spacing: { before: 300, after: 120 }, outlineLevel: 1 },
      },
      {
        id: 'Heading3',
        name: 'Heading 3',
        basedOn: 'Normal',
        next: 'Normal',
        quickFormat: true,
        run: { size: 24, bold: true, font: 'Arial', color: '26358B' },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 2 },
      },
      {
        id: 'Heading4',
        name: 'Heading 4',
        basedOn: 'Normal',
        next: 'Normal',
        quickFormat: true,
        run: { size: 22, bold: true, font: 'Arial', color: '26358B' },
        paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 3 },
      },
    ],
  },
  numbering: {
    config: [
      {
        reference: 'bullets',
        levels: [{
          level: 0,
          format: LevelFormat.BULLET,
          text: '•',
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      },
      {
        reference: 'numbers',
        levels: [{
          level: 0,
          format: LevelFormat.DECIMAL,
          text: '%1.',
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      },
    ],
  },
});

// Create document header with logo
const createDocumentHeader = (logoData) => {
  if (!logoData) {
    // Fallback ohne Logo
    return new Header({
      children: [
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [
            new TextRun({ text: 'Balanced Six', color: '26358B', bold: true, size: 20 }),
            new TextRun({ text: ' | B6 Kompakt', color: '999999', size: 20 }),
          ],
        }),
      ],
    });
  }

  // Header mit Logo rechts
  return new Header({
    children: [
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.NONE },
          bottom: { style: BorderStyle.NONE },
          left: { style: BorderStyle.NONE },
          right: { style: BorderStyle.NONE },
          insideHorizontal: { style: BorderStyle.NONE },
          insideVertical: { style: BorderStyle.NONE },
        },
        rows: [
          new TableRow({
            children: [
              // Linke Zelle: Text
              new TableCell({
                width: { size: 80, type: WidthType.PERCENTAGE },
                verticalAlign: VerticalAlign.CENTER,
                borders: {
                  top: { style: BorderStyle.NONE },
                  bottom: { style: BorderStyle.NONE },
                  left: { style: BorderStyle.NONE },
                  right: { style: BorderStyle.NONE },
                },
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({ text: 'Balanced Six', color: '26358B', bold: true, size: 20 }),
                      new TextRun({ text: ' | B6 Kompakt Assistent', color: '999999', size: 20 }),
                    ],
                  }),
                ],
              }),
              // Rechte Zelle: Logo
              new TableCell({
                width: { size: 20, type: WidthType.PERCENTAGE },
                verticalAlign: VerticalAlign.CENTER,
                borders: {
                  top: { style: BorderStyle.NONE },
                  bottom: { style: BorderStyle.NONE },
                  left: { style: BorderStyle.NONE },
                  right: { style: BorderStyle.NONE },
                },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: [
                      new ImageRun({
                        type: 'png',
                        data: logoData,
                        transformation: { width: 45, height: 60 },
                        altText: {
                          title: 'Balanced Six Logo',
                          description: 'B6 Kompakt Logo',
                          name: 'logo',
                        },
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
};

// Create title section
const createTitleSection = (title, subtitle, date) => [
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({ text: title, bold: true, size: 40, color: '26358B', font: 'Arial' }),
    ],
    spacing: { after: 120 },
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: subtitle, size: 24, color: '666666' })],
    spacing: { after: 60 },
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: `Erstellt am ${date}`, size: 20, color: '999999' })],
    spacing: { after: 360 },
  }),
  new Paragraph({
    children: [],
    border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: 'A2D8EF' } },
    spacing: { after: 360 },
  }),
];

// Create footer
const createFooter = () => [
  new Paragraph({
    children: [],
    border: { top: { style: BorderStyle.SINGLE, size: 12, color: 'A2D8EF' } },
    spacing: { before: 360, after: 120 },
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({ text: 'Erstellt mit Balanced Six - B6 Kompakt Assistent', size: 18, color: '999999', italics: true }),
    ],
  }),
];

// =====================
// ANFORDERUNGSPROFIL
// =====================
export const generateRequirementsDocx = async (analysis) => {
  const date = new Date().toLocaleDateString('de-DE');
  const logoData = await fetchLogo();
  
  const doc = new Document({
    ...createDocumentConfig(),
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838 }, // A4
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      headers: {
        default: createDocumentHeader(logoData),
      },
      children: [
        ...createTitleSection('Anforderungsprofil', analysis.name || 'Unbenannte Analyse', date),
        
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun({ text: 'Anforderungen', bold: true })],
        }),
        
        ...parseContentToParagraphs(analysis.requirements || 'Keine Anforderungen definiert.'),
        
        ...createFooter(),
      ],
    }],
  });
  
  return await Packer.toBlob(doc);
};

// =====================
// INTERPRETATIONSBERICHT
// =====================
export const generateInterpretationDocx = async (data) => {
  const { name, analysisName, requirements, candidates, interpretation } = data;
  const date = new Date().toLocaleDateString('de-DE');
  const logoData = await fetchLogo();
  
  // Build candidate table if candidates exist
  const candidateSection = [];
  if (candidates && candidates.length > 0) {
    candidateSection.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: 'Kandidaten und B6 Kompakt Ergebnisse', bold: true })],
      })
    );
    
    // Table header - verwende die zentralen B6_DIMENSIONS
    const headerCells = [
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: 'Kandidat', bold: true, color: 'FFFFFF' })] })],
        shading: { fill: '26358B', type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
      }),
    ];
    
    // Kurze Labels für die Tabelle
    const shortLabels = ['ICH', 'WIR', 'DENKEN', 'TUN', 'Ich o.k.', 'Du o.k.', 'Regen.', 'Emotion.', 'Leist.'];
    shortLabels.forEach(dim => {
      headerCells.push(new TableCell({
        children: [new Paragraph({ 
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: dim, bold: true, size: 16, color: 'FFFFFF' })] 
        })],
        shading: { fill: '26358B', type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 60, right: 60 },
      }));
    });
    
    const rows = [new TableRow({ children: headerCells })];
    
    // Candidate rows - verwende getScaleLabel aus der zentralen Bibliothek
    candidates.forEach((candidate, idx) => {
      const cells = [
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: candidate.name, bold: true })] })],
          shading: { fill: idx % 2 === 0 ? 'F5F5F5' : 'FFFFFF', type: ShadingType.CLEAR },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
        }),
      ];
      
      // Verwende B6_DIMENSIONS aus der zentralen Bibliothek
      B6_DIMENSIONS.forEach(dim => {
        const value = candidate.dimensions?.[dim] || 4;
        const label = getScaleLabel(value); // Zentrale Funktion
        cells.push(new TableCell({
          children: [new Paragraph({ 
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: label, size: 20 })] 
          })],
          shading: { fill: idx % 2 === 0 ? 'F5F5F5' : 'FFFFFF', type: ShadingType.CLEAR },
          margins: { top: 80, bottom: 80, left: 60, right: 60 },
        }));
      });
      
      rows.push(new TableRow({ children: cells }));
    });
    
    candidateSection.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows,
    }));
    
    // Legende für die Skala
    candidateSection.push(new Paragraph({ children: [], spacing: { after: 120 } }));
    candidateSection.push(new Paragraph({
      children: [
        new TextRun({ text: 'Skalenlegende: ', bold: true, size: 18 }),
        new TextRun({ text: 'E3/E2 = unterdurchschnittlich | E1/S1 = durchschnittlich | S2/S3 = überdurchschnittlich | Ü = Übersteigerung', size: 18, color: '666666' }),
      ],
      spacing: { after: 240 },
    }));
  }
  
  const doc = new Document({
    ...createDocumentConfig(),
    sections: [{
      properties: {
        page: {
          size: { width: 16838, height: 11906 }, // A4 Landscape for table
          margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
        },
      },
      headers: {
        default: createDocumentHeader(logoData),
      },
      children: [
        ...createTitleSection('Interpretationsbericht', name || analysisName || 'Unbenannt', date),
        
        new Paragraph({
          children: [
            new TextRun({ text: 'Anforderungsanalyse: ', bold: true }),
            new TextRun(analysisName || 'Nicht angegeben'),
          ],
          spacing: { after: 240 },
        }),
        
        ...candidateSection,
        
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun({ text: 'Interpretation', bold: true })],
        }),
        
        ...parseContentToParagraphs(interpretation || 'Keine Interpretation vorhanden.'),
        
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun({ text: 'Wichtige Hinweise', bold: true })],
          spacing: { before: 360 },
        }),
        
        new Paragraph({
          numbering: { reference: 'bullets', level: 0 },
          children: [new TextRun('Diese Ergebnisse basieren auf Selbsteinschätzungen der Kandidaten.')],
        }),
        new Paragraph({
          numbering: { reference: 'bullets', level: 0 },
          children: [new TextRun('Testergebnisse sind immer mit Messfehler behaftet.')],
        }),
        new Paragraph({
          numbering: { reference: 'bullets', level: 0 },
          children: [new TextRun('Empfehlung: Ergebnisse im strukturierten Interview validieren.')],
        }),
        
        ...createFooter(),
      ],
    }],
  });
  
  return await Packer.toBlob(doc);
};

// =====================
// INTERVIEWLEITFADEN
// =====================
export const generateInterviewDocx = async (data) => {
  const { name, analysisName, requirements, interpretation, candidates, guide } = data;
  const date = new Date().toLocaleDateString('de-DE');
  const logoData = await fetchLogo();
  const hasInterpretation = interpretation && interpretation.length > 0;
  const hasCandidates = candidates && candidates.length > 0;
  
  const sections = [
    ...createTitleSection('Interviewleitfaden', name || analysisName || 'Unbenannt', date),
    
    new Paragraph({
      children: [
        new TextRun({ text: 'Anforderungsanalyse: ', bold: true }),
        new TextRun(analysisName || 'Nicht angegeben'),
      ],
      spacing: { after: hasCandidates ? 120 : 240 },
    }),
  ];
  
  if (hasCandidates) {
    sections.push(new Paragraph({
      children: [
        new TextRun({ text: 'Kandidaten: ', bold: true }),
        new TextRun(candidates.map(c => c.name).join(', ')),
      ],
      spacing: { after: 240 },
    }));
  }
  
  sections.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: 'Interviewleitfaden', bold: true })],
    }),
    ...parseContentToParagraphs(guide || 'Kein Leitfaden vorhanden.'),
    
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [new TextRun({ text: 'Best Practices', bold: true })],
      spacing: { before: 360 },
    }),
    
    new Paragraph({
      numbering: { reference: 'bullets', level: 0 },
      children: [new TextRun('Nutzen Sie verhaltensbasierte Fragen (mind. 70%).')],
    }),
    new Paragraph({
      numbering: { reference: 'bullets', level: 0 },
      children: [new TextRun('Fragen Sie nach konkreten Beispielen (STAR-Methode).')],
    }),
    new Paragraph({
      numbering: { reference: 'bullets', level: 0 },
      children: [new TextRun('Dokumentieren Sie die Antworten strukturiert.')],
    }),
    
    ...createFooter(),
  );
  
  const doc = new Document({
    ...createDocumentConfig(),
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838 }, // A4
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      headers: {
        default: createDocumentHeader(logoData),
      },
      children: sections,
    }],
  });
  
  return await Packer.toBlob(doc);
};

// =====================
// ONBOARDING-LEITFADEN
// =====================
export const generateOnboardingDocx = async (data) => {
  const { name, analysisName, requirements, interpretation, candidates, interviewGuide, guide } = data;
  const date = new Date().toLocaleDateString('de-DE');
  const logoData = await fetchLogo();
  const hasCandidates = candidates && candidates.length > 0;

  const sections = [
    ...createTitleSection('Onboarding-Leitfaden', name || analysisName || 'Unbenannt', date),

    new Paragraph({
      children: [
        new TextRun({ text: 'Anforderungsanalyse: ', bold: true }),
        new TextRun(analysisName || 'Nicht angegeben'),
      ],
      spacing: { after: hasCandidates ? 120 : 240 },
    }),
  ];

  if (hasCandidates) {
    sections.push(new Paragraph({
      children: [
        new TextRun({ text: 'Kandidaten: ', bold: true }),
        new TextRun(candidates.map(c => c.name).join(', ')),
      ],
      spacing: { after: 240 },
    }));
  }

  sections.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: 'Onboarding-Leitfaden', bold: true })],
    }),
    ...parseContentToParagraphs(guide || 'Kein Leitfaden vorhanden.'),

    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [new TextRun({ text: 'Hinweise zur Nutzung', bold: true })],
      spacing: { before: 360 },
    }),

    new Paragraph({
      numbering: { reference: 'bullets', level: 0 },
      children: [new TextRun('Dieser Leitfaden basiert auf B6-Profildaten und Gesprächserkenntnissen.')],
    }),
    new Paragraph({
      numbering: { reference: 'bullets', level: 0 },
      children: [new TextRun('Alle Empfehlungen sind Hypothesen und sollten an die reale Situation angepasst werden.')],
    }),
    new Paragraph({
      numbering: { reference: 'bullets', level: 0 },
      children: [new TextRun('Der Leitfaden ist als lebendiges Dokument gedacht – passen Sie ihn fortlaufend an.')],
    }),

    ...createFooter(),
  );

  const doc = new Document({
    ...createDocumentConfig(),
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838 }, // A4
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      headers: {
        default: createDocumentHeader(logoData),
      },
      children: sections,
    }],
  });

  return await Packer.toBlob(doc);
};

// =====================
// DOWNLOAD HELPER
// =====================
export const downloadDocx = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename.replace(/[^a-zA-Z0-9äöüÄÖÜß\s-]/g, '_')}.docx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};