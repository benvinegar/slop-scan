# types.generic-record-casts

Flags `Record<string, unknown>` casts on vague parsed/payload variables like `data`, `payload`, and `parsed`.

- **Family:** `types`
- **Severity:** `strong`
- **Scope:** `file`
- **Requires:** `file.ast`

## How it works

The rule looks for `as Record<string, unknown>` casts assigned into generic object-bag variables such as:

- `parsed`
- `payload`
- `body`
- `data`
- `result`
- `config`

It gives extra detail when the cast comes directly from `JSON.parse(...)`.

This pattern often shows up in generated or hurried glue code that turns unknown structured input into a generic property bag instead of validating it into a domain-shaped type.

To avoid obvious vendored noise, the rule skips very large bundled/generated files over `5000` logical lines.

## Flagged examples

```ts
const parsed = JSON.parse(raw) as Record<string, unknown>;
const payload = response as Record<string, unknown>;
const data = value as Record<string, unknown>;
```

## Usually ignored

```ts
const parsed = JSON.parse(raw) as UserConfig;
const token = value as { token: string };
const metadata = input as Map<string, string>;
```

## Scoring

Each generic record cast adds `2` points.
The file total is capped at `8`.

## Benchmark signal

Full pinned benchmark against the exact `known-ai-vs-solid-oss` cohort:

- Signal score: **0.78 / 1.00**
- Best separating metric: **findings / file (0.78)**
- Hit rate: **5/9 AI repos** vs **0/9 mature OSS repos**
- Full results: [experimental rule report](../../../reports/autoresearch-candidate-rule.md#typesgeneric-record-casts)
