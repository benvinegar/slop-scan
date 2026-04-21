# defensive.empty-catch

Flags empty catch blocks that silently suppress failures.

- **Family:** `defensive`
- **Severity:** `strong`
- **Scope:** `file`
- **Requires:** `file.tryCatchSummaries`

## How it works

The rule reports small try/catch blocks when the catch body is empty.
It intentionally skips:

- common filesystem-existence probes
- documented local fallbacks where the try block only resolves local values and the catch explains that execution should fall through to another source
- larger try blocks where this structural approximation is less trustworthy

## Flagged example

```ts
export function parseConfig(raw: string) {
  try {
    return JSON.parse(raw);
  } catch {}

  return null;
}
```

## Usually ignored

```ts
export function loadTheme() {
  let stored: string | null = null;

  try {
    stored = localStorage.getItem("theme");
  } catch {
    // fall through to the default theme
  }

  return stored ?? "light";
}
```

## How to fix / do this better

An empty catch should usually become one of these instead:

- rethrow the error
- return a deliberate typed fallback with a comment explaining the boundary behavior
- log meaningful context and then rethrow
- validate earlier so the exceptional path is narrower and more intentional

```ts
export function parseConfig(raw: string) {
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error("Invalid config JSON", { cause: error });
  }
}
```

If swallowing the error is truly intentional, document why the fallback is safe and keep the scope local.

## Scoring

Each flagged catch uses the shared try/catch scoring helper, then the file total is capped at `8`.
Boundary-oriented catches are downweighted instead of fully ignored.

## Benchmark signal

Small pinned rule benchmark ([manifest](../../../benchmarks/sets/rule-signal-mini.json)):

- Signal rank: **#2 of 11**
- Signal score: **0.67 / 1.00**
- Best separating metric: **findings / file (0.93)**
- Hit rate: **6/6 AI repos** vs **5/5 mature OSS repos**
- Full results: [rule signal report](../../../reports/rule-signal-mini.md#defensiveempty-catch)
