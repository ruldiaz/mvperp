import { NextRequest, NextResponse } from "next/server";

const pdfParse = require("pdf-parse");

export interface ExtractedItem {
  description: string;
  quantity: number;
  numericColumns: number[];
}

interface TextItem {
  str: string;
  transform: number[];
}

const Y_TOLERANCE = 5;

// The Geometry Builder restores flawless table structure parsing
function groupIntoLines(items: TextItem[]): TextItem[][] {
  if (items.length === 0) return [];
  const sorted = [...items].sort((a, b) => b.transform[5] - a.transform[5]);
  const lines: TextItem[][] = [];
  let currentLine: TextItem[] = [sorted[0]];
  let currentY = sorted[0].transform[5];

  for (let i = 1; i < sorted.length; i++) {
    const itemY = sorted[i].transform[5];
    if (Math.abs(itemY - currentY) <= Y_TOLERANCE) {
      currentLine.push(sorted[i]);
    } else {
      lines.push(currentLine);
      currentLine = [sorted[i]];
      currentY = itemY;
    }
  }
  lines.push(currentLine);
  return lines.map(line => line.sort((a, b) => a.transform[4] - b.transform[4]));
}

function customPageRender(pageData: any) {
  return pageData.getTextContent().then(function(textContent: { items: TextItem[] }) {
    const rawItems = textContent.items as any[];
    const items: TextItem[] = rawItems.filter(
      (item) => 'str' in item && 'transform' in item && typeof item.str === 'string'
    );

    const lines = groupIntoLines(items);
    let fullText = "";

    for (const line of lines) {
      const lineText = line.map(li => li.str).join(' ').trim();
      if (lineText) {
        fullText += lineText + "\n";
      }
    }
    return fullText;
  });
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Using stable pdf-parse with custom geometric injection
    const options = {
      pagerender: customPageRender
    };
    
    const pdfData = await pdfParse(buffer, options);
    const text = pdfData.text;

    const allItems: ExtractedItem[] = [];
    const plainLines = text.split('\n');

    for (let rawLine of plainLines) {
      const lineText = rawLine.trim();
      if (!lineText) continue;

      const parts = lineText.split(/\s+/);
      if (parts.length < 2) continue;

      const numericParts = parts.map((p: string) => {
        const clean = p.replace(/[$,]/g, '');
        return isNaN(Number(clean)) ? null : Number(clean);
      });

      const qty = numericParts[0];
      if (qty === null || qty <= 0) continue;

      const trailingNumbers: number[] = [];
      let startedCollecting = false;
      for (let j = numericParts.length - 1; j >= 1; j--) {
        if (numericParts[j] !== null) {
          trailingNumbers.unshift(numericParts[j] as number);
          startedCollecting = true;
        } else if (startedCollecting) {
          break;
        }
      }

      if (trailingNumbers.length === 0) continue;

      let trailingEndIndex = parts.length - 1;
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

    return NextResponse.json({ items: allItems });
  } catch (error: any) {
    console.error("[parse-pdf route] Error:", error);
    // Explicitly send the exact error text so the frontend can display it if it fails!
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
  }
}
