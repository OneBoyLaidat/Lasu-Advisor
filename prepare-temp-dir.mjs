import { copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

try {
  await mkdir(path.join(process.cwd(), '.tmp'), { recursive: true });
  const ocrDirectory = path.join(process.cwd(), 'public', 'ocr');
  await mkdir(path.join(ocrDirectory, 'tessdata'), { recursive: true });
  await Promise.all([
    copyFile(
      path.join(process.cwd(), 'node_modules', 'tesseract.js', 'dist', 'worker.min.js'),
      path.join(ocrDirectory, 'worker.min.js')
    ),
    copyFile(
      path.join(process.cwd(), 'node_modules', 'tesseract.js-core', 'tesseract-core.wasm.js'),
      path.join(ocrDirectory, 'tesseract-core.wasm.js')
    ),
  ]);
} catch (error) {
  console.error(`Could not prepare build assets: ${error.message}`);
  process.exitCode = 1;
}
