import { mkdir } from 'node:fs/promises';
import path from 'node:path';

try {
  await mkdir(path.join(process.cwd(), '.tmp'), { recursive: true });
} catch (error) {
  console.error(`Could not prepare the temporary directory: ${error.message}`);
  process.exitCode = 1;
}
