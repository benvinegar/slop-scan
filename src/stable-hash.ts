import { createHash } from "node:crypto";

export function stableSerialize(value: unknown): string {
  if (value === null) {
    return "null";
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableSerialize).join(",")}]`;
  }

  switch (typeof value) {
    case "bigint":
      return JSON.stringify(value.toString());
    case "boolean":
      return value ? "true" : "false";
    case "number":
      return Number.isFinite(value) ? JSON.stringify(value) : JSON.stringify(String(value));
    case "string":
      return JSON.stringify(value);
    case "undefined":
    case "function":
    case "symbol":
      return "null";
    case "object": {
      const entries = Object.entries(value)
        .filter(([, entryValue]) => entryValue !== undefined)
        .sort(([left], [right]) => left.localeCompare(right));

      return `{${entries
        .map(([key, entryValue]) => `${JSON.stringify(key)}:${stableSerialize(entryValue)}`)
        .join(",")}}`;
    }
  }
}

export function stableHash(value: unknown, length = 16): string {
  return createHash("sha256").update(stableSerialize(value)).digest("hex").slice(0, length);
}
