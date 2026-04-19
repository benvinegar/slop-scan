# comments.placeholder-comments

Flags filler comments that gesture at future work without explaining current behavior.

- **Family:** `comments`
- **Severity:** `weak`
- **Scope:** `file`
- **Requires:** `file.comments`

## How it works

The rule scans parsed comments in a file and looks for intentionally strong placeholder-style phrasing, including patterns like:

- `add more validation`
- `handle more cases`
- `extend this logic`
- `customize this behavior`
- `implement ... here`

The patterns are conservative on purpose so routine TODOs and descriptive maintenance notes do not create noise.

## Flagged example

```ts
// Add more validation if needed
export function normalizeName(input: string) {
  return input.trim();
}

// Handle additional cases here later
export function parseMode(value: string) {
  return value === "fast" ? "fast" : "safe";
}
```

## Usually ignored

```ts
// Keep in sync with the upstream API contract.
export function normalizeName(input: string) {
  return input.trim();
}

// TODO(ben): remove after the v2 rollout.
export function legacyMode() {
  return "safe";
}
```

## Scoring

Each matching comment adds `0.75` to the file score, capped at `1.5`.

## Benchmark signal

Small pinned rule benchmark ([manifest](../../../benchmarks/sets/rule-signal-mini.json)):

- Signal rank: **#6 of 11**
- Signal score: **0.50 / 1.00**
- Best separating metric: **findings / file (0.50)**
- Hit rate: **0/6 AI repos** vs **0/5 mature OSS repos**
- Full results: [rule signal report](../../../reports/rule-signal-mini.md#commentsplaceholder-comments)
