import { globby } from "globby";
import path from "node:path";
import type { AnalyzerConfig } from "../config";
import type { DirectoryRecord, FileRecord, LanguagePlugin } from "../core/types";

function normalizePath(filePath: string): string {
  return filePath.split(path.sep).join("/");
}

export async function discoverSourceFiles(
  rootDir: string,
  config: AnalyzerConfig,
  languages: LanguagePlugin[],
): Promise<{ files: FileRecord[]; directories: DirectoryRecord[] }> {
  const matchedPaths = await globby(["**/*"], {
    cwd: rootDir,
    onlyFiles: true,
    dot: true,
    followSymbolicLinks: false,
    ignore: config.ignores,
    ignoreFiles: ".gitignore",
  });

  const files: FileRecord[] = [];
  for (const matchedPath of matchedPaths.sort((left, right) => left.localeCompare(right))) {
    const relativePath = normalizePath(matchedPath);
    const language = languages.find((plugin) => plugin.supports(relativePath));
    if (!language) {
      continue;
    }

    files.push({
      path: relativePath,
      absolutePath: path.join(rootDir, relativePath),
      extension: path.extname(relativePath),
      lineCount: 0,
      logicalLineCount: 0,
      languageId: language.id,
    });
  }

  const directoryMap = new Map<string, string[]>();
  for (const file of files) {
    const directoryPath = normalizePath(path.dirname(file.path));
    const list = directoryMap.get(directoryPath) ?? [];
    list.push(file.path);
    directoryMap.set(directoryPath, list);
  }

  const directories = [...directoryMap.entries()]
    .map(([directoryPath, filePaths]) => ({ path: directoryPath, filePaths: filePaths.sort() }))
    .sort((left, right) => left.path.localeCompare(right.path));

  return {
    files,
    directories,
  };
}
