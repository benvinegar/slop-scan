# structure.over-fragmentation

Flags directories dominated by tiny files and structural ceremony.

- **Family:** `structure`
- **Severity:** `strong`
- **Scope:** `directory`
- **Requires:** `directory.metrics`

## How it works

A directory is considered suspicious when all of these are true:

- it has at least `6` files
- at least `60%` of its files are tiny (`<= 25` lines)
- it is not mostly tests
- it is not an asset-like directory such as `icons/` or `assets/`

The rule also looks at ceremony density by counting wrapper files and pure barrel files inside the directory.
If the directory is small-file-heavy but those files still contain substantial implementation, the rule backs off.

## Flagged example

```text
src/payments/
├── index.ts
├── create-payment.ts
├── update-payment.ts
├── delete-payment.ts
├── get-payment.ts
├── payment-types.ts
├── payment-errors.ts
└── payment-client.ts
```

If most of those files are tiny wrappers or barrels, the directory is likely over-fragmented rather than intentionally modular.

## Usually ignored

```text
src/icons/
├── add.tsx
├── remove.tsx
├── search.tsx
└── ...
```

Asset buckets and test-heavy directories are suppressed, and a directory full of small but substantial implementation files can also avoid a finding.

## How to fix / do this better

Prefer module boundaries that follow behavior, not just naming.

Better options:

- merge ultra-thin wrapper files back into a cohesive module
- split by domain or workflow only when each file has meaningful independent behavior
- keep supporting types/helpers near the implementation they actually serve

```text
src/payments/
├── service.ts
├── types.ts
└── gateways/
```

The goal is not fewer files at all costs. It is to avoid architecture that looks modular on disk while forcing readers to jump through many tiny files to understand one behavior.

## Scoring

The score is `4 + tinyRatio * 3 + ceremonyRatio * 2`.
That weights tiny-file prevalence most heavily and adds extra pressure when wrappers and barrels make up a large share of the directory.

## Benchmark signal

Small pinned rule benchmark ([manifest](../../../benchmarks/sets/rule-signal-mini.json)):

- Signal rank: **#11 of 11**
- Signal score: **0.17 / 1.00**
- Best separating metric: **findings / file (0.18)**
- Hit rate: **1/6 AI repos** vs **4/5 mature OSS repos**
- Full results: [rule signal report](../../../reports/rule-signal-mini.md#structureover-fragmentation)
