import { promises as fsp, mkdirSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';

export const read = async (relativePath: string): Promise<string> => {
  const rootDirPath = join(resolve('dist', 'static', relativePath));
  return fsp.readFile(rootDirPath, 'utf-8');
};

export const write = async (
  relativePath: string,
  content: string,
): Promise<void> => {
  const rootDirPath = join(resolve('dist', 'static', relativePath));
  await fsp.writeFile(rootDirPath, content);
};

export const exists = (fileName: string) => {
  const toBool = [() => true, () => false];
  const exists = fsp.access(fileName).then(...toBool);
  return exists;
};

export const writeFileAsync = async (filePath: string) => {
  const data = await fsp.readFile(filePath, 'utf-8');
  const fileOutputPath = join(resolve('dist', 'static', filePath));
  fsp.writeFile(fileOutputPath, data);
};

export const saveFile = async ({
  fileBuffer,
  fileName,
  directory,
}: SaveFileParams): Promise<string> => {
  try {
    if (!existsSync(directory)) {
      mkdirSync(directory, { recursive: true });
    }

    const filePath = join(directory, fileName);

    await fsp.writeFile(filePath, fileBuffer);
    console.log({ filePath, directory });

    return filePath;
  } catch (error) {
    console.error('Error saving file:', error);
    throw new Error('Could not save the file');
  }
};

interface SaveFileParams {
  fileBuffer: Buffer;
  fileName: string;
  directory: string;
}
