# Pinned benchmark: Known AI repos vs older solid OSS repos

Date: 2026-04-17
Analyzer version: 0.3.0
Config mode: default

## Goal

Compare a cohort of known AI-generated JavaScript/TypeScript repos against well-regarded OSS repos, with the mature-OSS cohort pinned to the latest default-branch commit on or before 2025-01-01, using exact commit SHAs and normalized analyzer metrics.

## Reproduction

```bash
bun run benchmark:fetch
bun run benchmark:scan
bun run benchmark:report
```

Manifest: `benchmarks/sets/known-ai-vs-solid-oss.json`
Snapshot: `benchmarks/results/known-ai-vs-solid-oss.json`
Report: `reports/known-ai-vs-solid-oss-benchmark.md`

The pinned refs below are the exact commits used for the saved snapshot.

Blended score = geometric mean of the six normalized-metric ratios versus the mature OSS cohort medians, then rescaled so the mature OSS cohort median is 1.00. Higher means a repo is consistently noisier across the benchmark dimensions.

## AI cohort

| Repo | Ref | Age | Stars | Blended | Files | Logical LOC | Functions | Score/file | Score/KLOC | Score/function | Findings/file | Findings/KLOC | Findings/function |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| [garrytan/gstack](https://github.com/garrytan/gstack) | `6cc094c` | 0.1y | 65613 | **5.33** | 176 | 18958 | 832 | 2.34 | 21.71 | 0.49 | 0.52 | 4.85 | 0.11 |
| [redwoodjs/agent-ci](https://github.com/redwoodjs/agent-ci) | `4de00d6` | 0.2y | 120 | **3.57** | 94 | 8474 | 220 | 0.99 | 10.95 | 0.42 | 0.31 | 3.42 | 0.13 |
| [jiayun/DevWorkbench](https://github.com/jiayun/DevWorkbench) | `ea50862` | 0.8y | 17 | **3.39** | 32 | 2986 | 147 | 1.00 | 10.76 | 0.22 | 0.44 | 4.69 | 0.10 |
| [openclaw/openclaw](https://github.com/openclaw/openclaw) | `44cf747` | 0.4y | 350232 | **3.06** | 10465 | 1031409 | 40348 | 1.04 | 10.60 | 0.27 | 0.32 | 3.22 | 0.08 |
| [robinebers/openusage](https://github.com/robinebers/openusage) | `857f537` | 0.2y | 1715 | **3.02** | 139 | 22270 | 491 | 1.27 | 7.92 | 0.36 | 0.33 | 2.07 | 0.09 |
| [emdash-cms/emdash](https://github.com/emdash-cms/emdash) | `dbaf8c6` | 0.0y | 7842 | **2.17** | 1072 | 120432 | 3513 | 0.73 | 6.54 | 0.22 | 0.22 | 1.98 | 0.07 |
| [FullAgent/fulling](https://github.com/FullAgent/fulling) | `d95060f` | 0.5y | 2413 | **2.16** | 219 | 12154 | 574 | 0.53 | 9.51 | 0.20 | 0.16 | 2.96 | 0.06 |
| [cloudflare/vinext](https://github.com/cloudflare/vinext) | `28980b0` | 0.1y | 7709 | **1.99** | 1129 | 59523 | 2917 | 0.48 | 9.20 | 0.19 | 0.15 | 2.76 | 0.06 |
| [modem-dev/hunk](https://github.com/modem-dev/hunk) | `b37663f` | 0.1y | 352 | **1.18** | 166 | 13564 | 752 | 0.38 | 4.71 | 0.08 | 0.13 | 1.55 | 0.03 |

## Mature OSS cohort

| Repo | Ref | Age | Stars | Blended | Files | Logical LOC | Functions | Score/file | Score/KLOC | Score/function | Findings/file | Findings/KLOC | Findings/function |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| [withastro/astro](https://github.com/withastro/astro) | `f706899` | 5.1y | 58212 | **1.58** | 1949 | 80948 | 3018 | 0.28 | 6.75 | 0.18 | 0.10 | 2.31 | 0.06 |
| [payloadcms/payload](https://github.com/payloadcms/payload) | `f3f36d8` | 5.3y | 41856 | **1.47** | 4234 | 251992 | 3544 | 0.24 | 4.04 | 0.29 | 0.08 | 1.38 | 0.10 |
| [vitejs/vite](https://github.com/vitejs/vite) | `a492253` | 6.0y | 79637 | **1.47** | 1229 | 37251 | 1904 | 0.25 | 8.19 | 0.16 | 0.08 | 2.52 | 0.05 |
| [pmndrs/zustand](https://github.com/pmndrs/zustand) | `2e6d881` | 7.0y | 57758 | **1.45** | 48 | 7096 | 161 | 0.47 | 3.20 | 0.14 | 0.19 | 1.27 | 0.06 |
| [umami-software/umami](https://github.com/umami-software/umami) | `227b255` | 5.8y | 36012 | **1.00** | 512 | 20508 | 911 | 0.17 | 4.36 | 0.10 | 0.07 | 1.66 | 0.04 |
| [egoist/tsup](https://github.com/egoist/tsup) | `cd03e1e` | 6.1y | 11198 | **0.95** | 46 | 2668 | 140 | 0.22 | 3.83 | 0.07 | 0.09 | 1.50 | 0.03 |
| [sindresorhus/execa](https://github.com/sindresorhus/execa) | `99d1741` | 10.4y | 7481 | **0.89** | 580 | 20374 | 1007 | 0.17 | 4.86 | 0.10 | 0.05 | 1.37 | 0.03 |
| [mikaelbr/node-notifier](https://github.com/mikaelbr/node-notifier) | `b36c237` | 13.4y | 5843 | **0.41** | 24 | 2114 | 42 | 0.08 | 0.90 | 0.05 | 0.04 | 0.47 | 0.02 |
| [vercel/hyper](https://github.com/vercel/hyper) | `2a7bb18` | 9.8y | 44687 | **0.41** | 113 | 65075 | 5354 | 0.65 | 1.12 | 0.01 | 0.16 | 0.28 | 0.00 |

## Cohort medians

| Metric | AI median | Solid median | Ratio |
|---|---:|---:|---:|
| Blended score | **3.02** | **1.00** | **3.02x** |
| Score / file | **0.99** | **0.24** | **4.11x** |
| Score / KLOC | **9.51** | **4.04** | **2.35x** |
| Score / function | **0.22** | **0.10** | **2.28x** |
| Findings / file | **0.31** | **0.08** | **3.74x** |
| Findings / KLOC | **2.96** | **1.38** | **2.14x** |
| Findings / function | **0.08** | **0.04** | **2.21x** |

## Spot-check pairings

| AI repo | Solid repo | Score/file ratio | Score/KLOC ratio | Score/function ratio | Findings/file ratio | Findings/KLOC ratio | Findings/function ratio |
|---|---|---:|---:|---:|---:|---:|---:|
| `devworkbench` | `hyper` | 1.55x | 9.58x | 16.01x | 2.75x | 16.95x | 28.33x |
| `openusage` | `umami` | 7.27x | 1.82x | 3.66x | 4.98x | 1.25x | 2.51x |
| `vinext` | `vite` | 1.95x | 1.12x | 1.17x | 1.90x | 1.09x | 1.14x |

## Top rule families by cohort

### AI cohort
- `tests.duplicate-mock-setup` — 997 (25.2%)
- `structure.pass-through-wrappers` — 697 (17.6%)
- `defensive.empty-catch` — 463 (11.7%)
- `defensive.error-obscuring` — 456 (11.5%)
- `structure.barrel-density` — 455 (11.5%)
- `structure.duplicate-function-signatures` — 359 (9.1%)

### Mature OSS cohort
- `structure.duplicate-function-signatures` — 177 (24.4%)
- `structure.directory-fanout-hotspot` — 138 (19.1%)
- `defensive.empty-catch` — 93 (12.8%)
- `structure.barrel-density` — 75 (10.4%)
- `structure.pass-through-wrappers` — 73 (10.1%)
- `defensive.error-obscuring` — 67 (9.3%)

## Notes

- This benchmark is intentionally pinned to exact commit SHAs so future reruns can reproduce the same cohort.
- Why before 2025-01-01? The intent is to use a mature-OSS cutoff from before AI coding had materially changed mainstream repository shape and review norms.
- AI provenance in the set may come from README disclosures or user-provided provenance recorded in the manifest.
- The benchmark scanner uses the analyzer's default config for every repo to keep results comparable.
- The analyzer still only scans JS/TS-family files, so non-JS/TS portions of mixed-language repos are out of scope.
