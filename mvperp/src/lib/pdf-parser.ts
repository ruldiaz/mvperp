import * as pdfjsLib from 'pdfjs-dist';

// Configure the worker using unpkg with HTTPS for better reliability
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export interface ExtractedItem {
  description: string;
  quantity: number;
  /** All trailing numeric columns found after the description */
  numericColumns: number[];
}

interface TextItem {
  str: string;
  transform: number[];
}

/** Tolerance in PDF units for grouping text items into the same line */
const Y_TOLERANCE = 5;

/**
 * Groups text items into lines using Y-coordinate bucketing with tolerance.
 * Items within Y_TOLERANCE of each other are considered part of the same line.
 */
function groupIntoLines(items: TextItem[]): TextItem[][] {
  if (items.length === 0) return [];

  // Sort by Y descending (top of page first)
  const sorted = [...items].sort((a, b) => b.transform[5] - a.transform[5]);

  const lines: TextItem[][] = [];
  let currentLine: TextItem[] = [sorted[0]];
  let currentY = sorted[0].transform[5];

  for (let i = 1; i < sorted.length; i++) {
    const itemY = sorted[i].transform[5];
    if (Math.abs(itemY - currentY) <= Y_TOLERANCE) {
      // Same line
      currentLine.push(sorted[i]);
    } else {
      // New line
      lines.push(currentLine);
      currentLine = [sorted[i]];
      currentY = itemY;
    }
  }
  lines.push(currentLine);

  // Sort items within each line left-to-right (by X)
  return lines.map(line => line.sort((a, b) => a.transform[4] - b.transform[4]));
}

export const extractTextFromPdf = async (file: File): Promise<ExtractedItem[]> => {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  
  const allItems: ExtractedItem[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();

    // Filter: only keep items that have str and transform (skip TextMarkedContent)
    const rawItems = textContent.items as any[];
    const items: TextItem[] = rawItems.filter(
      (item) => 'str' in item && 'transform' in item && typeof item.str === 'string'
    );

    console.log(`[PDF Parser] Page ${i}: ${items.length} text items`);

    // Group into lines using Y-tolerance bucketing
    const lines = groupIntoLines(items);

    console.log(`[PDF Parser] Page ${i}: ${lines.length} lines reconstructed`);
    
    // Log first 15 lines for debugging
    lines.slice(0, 15).forEach((line, idx) => {
      const text = line.map(li => li.str).join(' ').trim();
      console.log(`[PDF Parser] Page ${i} Line ${idx}: "${text}"`);
    });

    for (const line of lines) {
      const lineText = line.map(li => li.str).join(' ').trim();
      if (!lineText) continue;

      const parts = lineText.split(/\s+/);
      if (parts.length < 2) continue;

      // Parse each part: null if not a number, otherwise its numeric value
      const numericParts = parts.map(p => {
        const clean = p.replace(/[$,]/g, '');
        return isNaN(Number(clean)) ? null : Number(clean);
      });

      // First number = quantity
      const qty = numericParts[0];
      if (qty === null || qty <= 0) continue;

      // Collect trailing numeric values (right to left), skipping non-numeric
      // trailing parts like "Inmediato", "Disponible", etc.
      const trailingNumbers: number[] = [];
      let startedCollecting = false;
      for (let j = numericParts.length - 1; j >= 1; j--) {
        if (numericParts[j] !== null) {
          trailingNumbers.unshift(numericParts[j] as number);
          startedCollecting = true;
        } else if (startedCollecting) {
          // We found text AFTER already collecting numbers — stop here
          break;
        }
        // If !startedCollecting and null, we skip trailing text (e.g. "Inmediato")
      }

      if (trailingNumbers.length === 0) continue;

      // Figure out where the trailing numbers start in the parts array
      // by finding the rightmost consecutive numeric block
      let trailingEndIndex = parts.length - 1;
      // Skip trailing non-numeric
      while (trailingEndIndex >= 1 && numericParts[trailingEndIndex] === null) {
        trailingEndIndex--;
      }
      const trailingStartIndex = trailingEndIndex - trailingNumbers.length + 1;

      const description = parts.slice(1, trailingStartIndex).join(' ').trim();

      if (description.length > 1) {
        allItems.push({
          description,
          quantity: qty,
          numericColumns: trailingNumbers,
        });
      }
    }
  }

  console.log("[PDF Parser] Final extracted items:", allItems.length, allItems);
  return allItems;
};
