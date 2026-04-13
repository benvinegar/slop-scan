export interface CommentSummary {
  text: string;
  line: number;
}

export interface FunctionSummary {
  name: string;
  line: number;
  parameterCount: number;
  isAsync: boolean;
  hasAwait: boolean;
  statementCount: number;
  isPassThroughWrapper: boolean;
  passThroughTarget: string | null;
  hasReturnAwaitCall: boolean;
  duplicationFingerprint: string | null;
}

export interface ExportSummary {
  topLevelStatementCount: number;
  reExportCount: number;
  hasOnlyReExports: boolean;
}

export interface TryCatchSummary {
  line: number;
  enclosingSymbol: string;
  hasCatchClause: boolean;
  tryStatementCount: number;
  catchStatementCount: number;
  catchLogsOnly: boolean;
  catchReturnsDefault: boolean;
  catchHasLogging: boolean;
  catchHasDefaultReturn: boolean;
  catchIsEmpty: boolean;
  catchHasComment: boolean;
  catchThrowsGeneric: boolean;
  boundaryCategories: string[];
  boundaryOperationPaths: string[];
  isFilesystemExistenceProbe: boolean;
  tryResolvesLocalValues: boolean;
  isDocumentedLocalFallback: boolean;
}

export interface DirectoryMetrics {
  fileCount: number;
  tinyFileCount: number;
  wrapperFileCount: number;
  barrelFileCount: number;
  totalLineCount: number;
}

export interface TestMockSetupSummary {
  line: number;
  label: string;
  fingerprint: string;
}

export interface DuplicateTestSetupCluster {
  fingerprint: string;
  label: string;
  fileCount: number;
  occurrences: Array<{ path: string; line: number }>;
}

export interface DuplicateTestSetupIndex {
  byFile: Record<string, DuplicateTestSetupCluster[]>;
  clusters: DuplicateTestSetupCluster[];
}

export interface DuplicateFunctionCluster {
  fingerprint: string;
  label: string;
  fileCount: number;
  occurrences: Array<{ path: string; line: number; name: string }>;
}

export interface DuplicateFunctionIndex {
  byFile: Record<string, DuplicateFunctionCluster[]>;
  clusters: DuplicateFunctionCluster[];
}
