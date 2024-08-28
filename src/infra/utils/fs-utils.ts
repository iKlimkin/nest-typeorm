import {
  promises as fsp,
  mkdirSync,
  existsSync,
  createWriteStream,
} from 'node:fs';
import { resolve, join } from 'node:path';

export enum LogEnum {
  LOG_DIRECTORY = 'logs',
  LOG_FILE_NAME = 'app.log',
}

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

const safeStringify = (obj: any, replacer = null, space = 2): string => {
  const seen = new Set();

  return JSON.stringify(
    obj,
    (_, value) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular]';
        }
        seen.add(value);
      }
      return value;
    },
    space,
  );
};

const ensureLogDirectoryExists = async () => {
  const logDirPath = resolve(LogEnum.LOG_DIRECTORY);
  try {
    await fsp.access(logDirPath);
  } catch {
    await fsp.mkdir(logDirPath, { recursive: true });
  }
};
export const writeLogAsync = async (data: any) => {
  try {
    data = safeStringify(data)
    await ensureLogDirectoryExists();
    const fileOutputPath = join(
      resolve(LogEnum.LOG_DIRECTORY),
      LogEnum.LOG_FILE_NAME,
    );

    await fsp.appendFile(
      fileOutputPath,
      `${new Date().toISOString()} - ${data}\n`,
    );

    console.log(`Log successfully written to ${fileOutputPath}`);
  } catch (error) {
    console.error('Error writing to log file:', error);
  }
};
export const writeLogWithStream = async (data: any) => {
  try {
    await ensureLogDirectoryExists();
    const fileOutputPath = join(
      resolve(LogEnum.LOG_DIRECTORY),
      LogEnum.LOG_FILE_NAME,
    );

    const writeStream = createWriteStream(fileOutputPath, { flags: 'a' });

    const jsonData = JSON.stringify(data, null, 2);

    writeStream.write(`${new Date().toISOString()} - ${jsonData}\n`);
    writeStream.end();

    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });

    console.log(`Log successfully written to ${fileOutputPath}`);
  } catch (error) {
    console.error('Error writing to log file:', error);
  }
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
