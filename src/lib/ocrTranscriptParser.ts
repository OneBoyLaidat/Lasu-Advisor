import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { createWorker } from 'tesseract.js';

GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export { calculateGradeAndPoints, getDegreeClass, parseTranscriptText } from './transcriptTextParser';
export type { ParsedTranscriptCourse, ParsedTranscriptData } from './transcriptTextParser';

const OCR_BASE_URL = `${import.meta.env.BASE_URL}ocr/`;

export async function extractTextFromFile(file: File): Promise<{ text: string }> {
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    throw new Error('Please upload a PDF document.');
  }
  const loadingTask = getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  const pdf = await loadingTask.promise;
  try {
    const pages: string[] = [];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      pages.push(content.items.map((item) => ('str' in item ? item.str : '')).join(' '));
    }
    return { text: pages.join('\n') };
  } finally {
    await loadingTask.destroy();
  }
}

export async function runClientOcrOnPdf(file: File, onPage?: (page: number, total: number) => void): Promise<string> {
  const loadingTask = getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  const pdf = await loadingTask.promise;
  const worker = await createWorker('eng', 1, {
    workerPath: `${OCR_BASE_URL}worker.min.js`,
    corePath: `${OCR_BASE_URL}tesseract-core.wasm.js`,
    langPath: `${OCR_BASE_URL}tessdata`,
    gzip: true,
  });
  try {
    const pages: string[] = [];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      onPage?.(pageNumber, pdf.numPages);
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 4 });
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Could not prepare the document page for OCR.');
      await page.render({ canvas, canvasContext: context, viewport }).promise;
      const { data } = await worker.recognize(canvas);
      pages.push(data.text);
      canvas.width = 0;
      canvas.height = 0;
    }
    return pages.join('\n');
  } finally {
    await worker.terminate();
    await loadingTask.destroy();
  }
}
