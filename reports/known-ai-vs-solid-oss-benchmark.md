# Pinned benchmark: Known AI repos vs older solid OSS repos

Date: 2026-04-16
Analyzer version: 0.3.0
Config mode: default

## Goal

Compare a cohort of known AI-generated JavaScript/TypeScript repos against older, well-regarded OSS repos using pinned commit SHAs and normalized analyzer metrics.

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
| [garrytan/gstack](https://github.com/garrytan/gstack) | `6cc094c` | 0.1y | 65613 | **5.83** | 176 | 18958 | 832 | 2.34 | 21.71 | 0.49 | 0.52 | 4.85 | 0.11 |
| [redwoodjs/agent-ci](https://github.com/redwoodjs/agent-ci) | `4de00d6` | 0.2y | 120 | **3.90** | 94 | 8474 | 220 | 0.99 | 10.95 | 0.42 | 0.31 | 3.42 | 0.13 |
| [jiayun/DevWorkbench](https://github.com/jiayun/DevWorkbench) | `ea50862` | 0.8y | 17 | **3.70** | 32 | 2986 | 147 | 1.00 | 10.76 | 0.22 | 0.44 | 4.69 | 0.10 |
| [openclaw/openclaw](https://github.com/openclaw/openclaw) | `44cf747` | 0.4y | 350232 | **3.35** | 10465 | 1031409 | 40348 | 1.04 | 10.60 | 0.27 | 0.32 | 3.22 | 0.08 |
| [robinebers/openusage](https://github.com/robinebers/openusage) | `857f537` | 0.2y | 1715 | **3.30** | 139 | 22270 | 491 | 1.27 | 7.92 | 0.36 | 0.33 | 2.07 | 0.09 |
| [emdash-cms/emdash](https://github.com/emdash-cms/emdash) | `dbaf8c6` | 0.0y | 7842 | **2.38** | 1072 | 120432 | 3513 | 0.73 | 6.54 | 0.22 | 0.22 | 1.98 | 0.07 |
| [FullAgent/fulling](https://github.com/FullAgent/fulling) | `d95060f` | 0.5y | 2413 | **2.36** | 219 | 12154 | 574 | 0.53 | 9.51 | 0.20 | 0.16 | 2.96 | 0.06 |
| [cloudflare/vinext](https://github.com/cloudflare/vinext) | `28980b0` | 0.1y | 7709 | **2.17** | 1129 | 59523 | 2917 | 0.48 | 9.20 | 0.19 | 0.15 | 2.76 | 0.06 |
| [modem-dev/hunk](https://github.com/modem-dev/hunk) | `b37663f` | 0.1y | 352 | **1.29** | 166 | 13564 | 752 | 0.38 | 4.71 | 0.08 | 0.13 | 1.55 | 0.03 |

## Mature OSS cohort

| Repo | Ref | Age | Stars | Blended | Files | Logical LOC | Functions | Score/file | Score/KLOC | Score/function | Findings/file | Findings/KLOC | Findings/function |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| [vitejs/vite](https://github.com/vitejs/vite) | `bdc53ab` | 6.0y | 79637 | **1.63** | 1432 | 46589 | 2299 | 0.26 | 8.11 | 0.16 | 0.08 | 2.45 | 0.05 |
| [withastro/astro](https://github.com/withastro/astro) | `2c9bf5e` | 5.1y | 58212 | **1.60** | 2798 | 131228 | 4359 | 0.27 | 5.68 | 0.17 | 0.09 | 2.02 | 0.06 |
| [pmndrs/zustand](https://github.com/pmndrs/zustand) | `2e6d881` | 7.0y | 57758 | **1.58** | 48 | 7096 | 161 | 0.47 | 3.20 | 0.14 | 0.19 | 1.27 | 0.06 |
| [egoist/tsup](https://github.com/egoist/tsup) | `b906f86` | 6.1y | 11198 | **1.01** | 48 | 2813 | 140 | 0.21 | 3.61 | 0.07 | 0.08 | 1.42 | 0.03 |
| [umami-software/umami](https://github.com/umami-software/umami) | `0a83864` | 5.7y | 36012 | **0.99** | 674 | 24859 | 1209 | 0.15 | 4.17 | 0.09 | 0.06 | 1.61 | 0.03 |
| [sindresorhus/execa](https://github.com/sindresorhus/execa) | `f3a2e84` | 10.4y | 7481 | **0.97** | 581 | 20432 | 1008 | 0.17 | 4.85 | 0.10 | 0.05 | 1.37 | 0.03 |
| [mikaelbr/node-notifier](https://github.com/mikaelbr/node-notifier) | `b36c237` | 13.4y | 5843 | **0.45** | 24 | 2114 | 42 | 0.08 | 0.90 | 0.05 | 0.04 | 0.47 | 0.02 |
| [vercel/hyper](https://github.com/vercel/hyper) | `2a7bb18` | 9.8y | 44687 | **0.45** | 113 | 65075 | 5354 | 0.65 | 1.12 | 0.01 | 0.16 | 0.28 | 0.00 |

## Cohort medians

| Metric | AI median | Solid median | Ratio |
|---|---:|---:|---:|
| Blended score | **3.30** | **1.00** | **3.30x** |
| Score / file | **0.99** | **0.24** | **4.16x** |
| Score / KLOC | **9.51** | **3.89** | **2.45x** |
| Score / function | **0.22** | **0.09** | **2.44x** |
| Findings / file | **0.31** | **0.08** | **3.79x** |
| Findings / KLOC | **2.96** | **1.40** | **2.12x** |
| Findings / function | **0.08** | **0.03** | **2.67x** |

## Spot-check pairings

| AI repo | Solid repo | Score/file ratio | Score/KLOC ratio | Score/function ratio | Findings/file ratio | Findings/KLOC ratio | Findings/function ratio |
|---|---|---:|---:|---:|---:|---:|---:|
| `devworkbench` | `hyper` | 1.55x | 9.58x | 16.01x | 2.75x | 16.95x | 28.33x |
| `openusage` | `umami` | 8.25x | 1.90x | 4.19x | 5.58x | 1.28x | 2.83x |
| `vinext` | `vite` | 1.84x | 1.13x | 1.14x | 1.82x | 1.13x | 1.13x |

## Top rule families by cohort

### AI cohort
- `tests.duplicate-mock-setup` — 997 (25.2%)
- `structure.pass-through-wrappers` — 697 (17.6%)
- `defensive.empty-catch` — 463 (11.7%)
- `defensive.error-obscuring` — 456 (11.5%)
- `structure.barrel-density` — 455 (11.5%)
- `structure.duplicate-function-signatures` — 359 (9.1%)

### Mature OSS cohort
- `structure.pass-through-wrappers` — 94 (19.6%)
- `defensive.empty-catch` — 78 (16.3%)
- `structure.directory-fanout-hotspot` — 68 (14.2%)
- `structure.duplicate-function-signatures` — 60 (12.5%)
- `defensive.error-obscuring` — 55 (11.5%)
- `structure.barrel-density` — 49 (10.2%)

## Notes

- This benchmark is intentionally pinned to exact commit SHAs so future reruns can reproduce the same cohort.
- AI provenance in the set may come from README disclosures or user-provided provenance recorded in the manifest.
- The benchmark scanner uses the analyzer's default config for every repo to keep results comparable.
- The analyzer still only scans JS/TS-family files, so non-JS/TS portions of mixed-language repos are out of scope.
