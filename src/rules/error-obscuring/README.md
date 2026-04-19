# defensive.error-obscuring

Flags catch blocks that replace the original failure with a default value or generic error.

- **Family:** `defensive`
- **Severity:** `strong`
- **Scope:** `file`
- **Requires:** `file.tryCatchSummaries`

## How it works

The rule reports small try/catch blocks when the catch clause does one of these things:

- returns a default literal
- throws a generic replacement error
- logs and then returns a default

Those patterns make downstream diagnosis harder because the original failure is flattened or hidden.

## Flagged examples

```ts
export function readConfig(raw: string) {
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function loadProfile(id: string) {
  try {
    return fetchProfile(id);
  } catch {
    throw new Error("failed to load profile");
  }
}
```

## Usually ignored

```ts
export function readConfig(raw: string) {
  try {
    return JSON.parse(raw);
  } catch (error) {
    logger.error({ error });
    throw error;
  }
}
```

## Scoring

Each flagged catch uses the shared try/catch scoring helper, then the file total is capped at `8`.
Generic rethrows are still noisy, but scored slightly lower than silent default-return patterns.

## Benchmark signal

Small pinned rule benchmark ([manifest](../../../benchmarks/sets/rule-signal-mini.json)):

- Signal rank: **#4 of 11**
- Signal score: **0.66 / 1.00**
- Best separating metric: **findings / file (0.83)**
- Hit rate: **5/6 AI repos** vs **5/5 mature OSS repos**
- Full results: [rule signal report](../../../reports/rule-signal-mini.md#defensiveerror-obscuring)
