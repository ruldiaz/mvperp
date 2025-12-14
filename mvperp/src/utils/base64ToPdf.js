import fs from "fs";

const base64Data =
  "JVBERi0xLjQKMSAwIG9iago8PAovVGl0bGUgKP7/AEYAYQBjAHQAdQByAGEAbQBhACAAUABEAEYAIAA1ADEAYQA0ADUAMAAxAGIALQA3AGQAOQAyAC0ANAAyADIAOAAtADgAMQAxADMALQA5ADUANgAzAGMAZAA3AGQAZQBiAGYANCkK...";

export function base64ToPdf(filePath) {
  const buffer = Buffer.from(base64Data, "base64");
  fs.writeFileSync(filePath, buffer);
}
