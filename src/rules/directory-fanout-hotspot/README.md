# structure.directory-fanout-hotspot

Flags directories whose file count is unusually large relative to nearby siblings or, when sibling context is weak, the repo-wide average.

- **Family:** `structure`
- **Severity:** `medium`
- **Scope:** `directory`
- **Requires:** `directory.metrics`

## How it works

The rule prefers a sibling-directory baseline when there is enough local context.
Otherwise it falls back to a repo-wide average.
A directory is reported only when its file count clears a dynamic threshold:

- sibling baseline: `ceil(medianSiblingCount * 2.25)`
- repo-wide fallback: `ceil(globalAverage * 2.5)`
- absolute minimum threshold: `6` files

It skips directories that are mostly tests and asset-like directories such as `icons/` or `assets/`.

## Flagged example

```text
src/
├── api/                 # 3 files
├── auth/                # 4 files
├── billing/             # 3 files
└── generated-actions/   # 16 files
    ├── action-01.ts
    ├── action-02.ts
    ├── action-03.ts
    └── ...
```

With siblings clustered around 3–4 files, `generated-actions/` becomes a local fan-out hotspot.

## Usually ignored

```text
src/icons/
├── add.tsx
├── remove.tsx
├── search.tsx
└── ...
```

Asset-like buckets and test-matrix directories are intentionally suppressed because wide directory shapes are expected there.

## How to fix / do this better

A wide directory is usually a sign that one of these is missing:

- a stronger domain split
- a deeper subdirectory boundary
- a more cohesive module with fewer one-file-per-concept fragments

Better patterns:

- group related files into subdomains once a folder becomes a grab bag
- merge ultra-thin files when the split adds naming overhead but not conceptual clarity
- separate generated output from hand-written source when possible

```text
src/
└── billing/
    ├── invoices/
    ├── subscriptions/
    └── shared/
```

The goal is not tiny directories everywhere. It is to avoid a single hotspot folder becoming the dumping ground for too many loosely related files.

## Scoring

The rule starts at `2` and adds a bounded amount based on how far the directory is above the computed threshold.
The total directory contribution stays capped at `6`.

## Benchmark signal

Small pinned rule benchmark ([manifest](../../../benchmarks/sets/rule-signal-mini.json)):

- Signal rank: **#10 of 11**
- Signal score: **0.22 / 1.00**
- Best separating metric: **findings / file (0.50)**
- Hit rate: **6/6 AI repos** vs **5/5 mature OSS repos**
- Full results: [rule signal report](../../../reports/rule-signal-mini.md#structuredirectory-fanout-hotspot)
