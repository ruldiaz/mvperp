export interface ExtractedItem {
  description: string;
  quantity: number;
  /** All trailing numeric columns found after the description */
  numericColumns: number[];
}

export const extractTextFromPdf = async (file: File): Promise<ExtractedItem[]> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/parse-pdf", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(errorData.error || `Error HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.items;
};
