# slop-scan

[![CI status](https://img.shields.io/github/actions/workflow/status/modem-dev/slop-scan/ci.yml?branch=main&style=for-the-badge&label=CI)](https://github.com/modem-dev/slop-scan/actions/workflows/ci.yml?query=branch%3Amain)
[![Latest release](https://img.shields.io/github/v/release/modem-dev/slop-scan?style=for-the-badge&label=release)](https://github.com/modem-dev/slop-scan/releases)
[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

Deterministic CLI for finding **AI-associated slop patterns** in JavaScript and TypeScript repositories.

Scan a repo, surface the hotspots, and compare codebases using normalized slop metrics.

> `slop-scan` is a **slop scanner**, not an authorship detector. It reports explainable patterns and suspicious density. It does **not** claim who wrote the code.

## Why use it

- **Find the hotspots fast** — see which files and directories concentrate the most suspicious patterns
- **Understand why something was flagged** — every finding includes a rule ID and evidence
- **Compare repos fairly** — normalize by file count, logical KLOC, and function count
- **Benchmark heuristics over time** — rerun the pinned benchmark set and watch movement

## Good fit for

- checking third-party repos that feel vibe-coded
- comparing known AI-generated repos to mature OSS baselines
- finding low-judgment boilerplate in your own codebase
- iterating on deterministic slop heuristics

## Install

Install globally with npm:

```bash
npm install -g slop-scan
```

Install it in a project and run it with npm tools:

```bash
npm install --save-dev slop-scan
npx slop-scan scan .
```

## Quick start

Scan the current repo:

```bash
slop-scan scan .
```

Scan the current repo in lint mode:

```bash
slop-scan scan . --lint
```

Scan another repo and get JSON:

```bash
slop-scan scan /path/to/repo --json
```

## Use it like a linter

Use `--lint` when you want human-readable findings in local runs, CI logs, or PR checks.

```bash
slop-scan scan . --lint
```

Example output:

```text
medium  Found 3 duplicated function signatures  structure.duplicate-function-signatures
  at src/users/normalize.ts:1:1
  at src/teams/normalize.ts:1:1
  at src/accounts/normalize.ts:1:1
```

## JSON output

Use `--json` when you want full-fidelity output for scripts, CI, or post-processing.

```bash
slop-scan scan . --json
```

Example CI check:

```bash
slop-scan scan . --json | jq -e '.summary.findingCount == 0'
```

The CLI currently exits non-zero for CLI/runtime errors, not for findings.

## Delta comparisons

Use `delta` when you want a machine-readable comparison between two scans.

Compare two paths directly:

```bash
slop-scan delta ../main .
slop-scan delta --base ../main --head . --json
```

Compare two saved reports:

```bash
slop-scan scan ../main --json > base.json
slop-scan scan . --json > head.json
slop-scan delta --base-report base.json --head-report head.json
```

Fail CI only when new or worse occurrence-level findings show up:

```bash
slop-scan delta --base ../main --fail-on added,worsened
```

`delta --json` emits a generic report format with:

- base/head scan summaries
- occurrence-level change classification (`added`, `resolved`, `worsened`, `improved`)
- per-path score deltas
- report metadata and config hashes so downstream tools can detect mismatched scan conditions
- stable per-occurrence fingerprints for built-in rules, so grouped findings can match across rescans without relying on rendered message text

## What it catches

Current checks focus on patterns that often show up in unreviewed generated code:

- [log-and-continue catch blocks](src/rules/error-swallowing/README.md)
- [error-obscuring catch blocks](src/rules/error-obscuring/README.md) (default-return or generic replacement error)
- [empty catch blocks](src/rules/empty-catch/README.md)
- [async wrapper / `return await` noise](src/rules/async-noise/README.md)
- [pass-through wrappers](src/rules/pass-through-wrappers/README.md)
- [barrel density](src/rules/barrel-density/README.md)
- [duplicate helper/function signatures across source files](src/rules/duplicate-function-signatures/README.md)
- [over-fragmentation](src/rules/over-fragmentation/README.md)
- [directory fan-out hotspots](src/rules/directory-fanout-hotspot/README.md)
- [placeholder comments](src/rules/placeholder-comments/README.md)
- [duplicated test mock/setup patterns](src/rules/duplicate-mock-setup/README.md)

## What you get back

- raw repo score
- normalized metrics:
  - score / file
  - score / KLOC
  - score / function
  - findings / file
  - findings / KLOC
  - findings / function
- top file hotspots
- top directory hotspots
- grouped lint-style findings with `--lint`
- full-fidelity findings with evidence in `--json`

## Supported files

Current language support:

- `.ts`
- `.tsx`
- `.js`
- `.jsx`
- `.mjs`
- `.cjs`

## Benchmarks

The repo ships with a **pinned, recreatable benchmark set** comparing known AI-generated repos against well-regarded OSS repos, with the mature-OSS cohort pinned to the latest default-branch commit on or before **2025-01-01**.

_Why before Jan 1, 2025?_ Because this cutoff aims to catch mature OSS before AI coding had materially changed mainstream repository shape and review norms.

**Blended score** = geometric mean of the six normalized-metric ratios versus the mature OSS cohort medians, then rescaled so the mature OSS cohort median is **1.00**. Higher means a repo is consistently noisier across the benchmark dimensions.

### Cohort medians

| Metric              | AI median | Mature OSS median |     Ratio |
| ------------------- | --------: | ----------------: | --------: |
| Blended score       |  **3.02** |          **1.00** | **3.02x** |
| Score / file        |  **0.99** |          **0.24** | **4.11x** |
| Score / KLOC        |  **9.51** |          **4.04** | **2.35x** |
| Score / function    |  **0.22** |          **0.10** | **2.28x** |
| Findings / file     |  **0.31** |          **0.08** | **3.74x** |
| Findings / KLOC     |  **2.96** |          **1.38** | **2.14x** |
| Findings / function |  **0.08** |          **0.04** | **2.21x** |

### Pinned benchmark snapshot

Ordered by blended score.

| Repository                                                            | Cohort     | Ref       |  Blended | Score/file | Score/KLOC | Findings/file | Findings/KLOC |
| --------------------------------------------------------------------- | ---------- | --------- | -------: | ---------: | ---------: | ------------: | ------------: |
| [`garrytan/gstack`](https://github.com/garrytan/gstack)               | ai         | `6cc094c` | **5.33** |       2.34 |      21.71 |          0.52 |          4.85 |
| [`redwoodjs/agent-ci`](https://github.com/redwoodjs/agent-ci)         | ai         | `4de00d6` | **3.57** |       0.99 |      10.95 |          0.31 |          3.42 |
| [`jiayun/DevWorkbench`](https://github.com/jiayun/DevWorkbench)       | ai         | `ea50862` | **3.39** |       1.00 |      10.76 |          0.44 |          4.69 |
| [`openclaw/openclaw`](https://github.com/openclaw/openclaw)           | ai         | `44cf747` | **3.06** |       1.04 |      10.60 |          0.32 |          3.22 |
| [`robinebers/openusage`](https://github.com/robinebers/openusage)     | ai         | `857f537` | **3.02** |       1.27 |       7.92 |          0.33 |          2.07 |
| [`emdash-cms/emdash`](https://github.com/emdash-cms/emdash)           | ai         | `dbaf8c6` | **2.17** |       0.73 |       6.54 |          0.22 |          1.98 |
| [`FullAgent/fulling`](https://github.com/FullAgent/fulling)           | ai         | `d95060f` | **2.16** |       0.53 |       9.51 |          0.16 |          2.96 |
| [`cloudflare/vinext`](https://github.com/cloudflare/vinext)           | ai         | `28980b0` | **1.99** |       0.48 |       9.20 |          0.15 |          2.76 |
| [`withastro/astro`](https://github.com/withastro/astro)               | mature-oss | `f706899` | **1.58** |       0.28 |       6.75 |          0.10 |          2.31 |
| [`payloadcms/payload`](https://github.com/payloadcms/payload)         | mature-oss | `f3f36d8` | **1.47** |       0.24 |       4.04 |          0.08 |          1.38 |
| [`vitejs/vite`](https://github.com/vitejs/vite)                       | mature-oss | `a492253` | **1.47** |       0.25 |       8.19 |          0.08 |          2.52 |
| [`pmndrs/zustand`](https://github.com/pmndrs/zustand)                 | mature-oss | `2e6d881` | **1.45** |       0.47 |       3.20 |          0.19 |          1.27 |
| [`modem-dev/hunk`](https://github.com/modem-dev/hunk)                 | ai         | `b37663f` | **1.18** |       0.38 |       4.71 |          0.13 |          1.55 |
| [`umami-software/umami`](https://github.com/umami-software/umami)     | mature-oss | `227b255` | **1.00** |       0.17 |       4.36 |          0.07 |          1.66 |
| [`egoist/tsup`](https://github.com/egoist/tsup)                       | mature-oss | `cd03e1e` | **0.95** |       0.22 |       3.83 |          0.09 |          1.50 |
| [`sindresorhus/execa`](https://github.com/sindresorhus/execa)         | mature-oss | `99d1741` | **0.89** |       0.17 |       4.86 |          0.05 |          1.37 |
| [`mikaelbr/node-notifier`](https://github.com/mikaelbr/node-notifier) | mature-oss | `b36c237` | **0.41** |       0.08 |       0.90 |          0.04 |          0.47 |
| [`vercel/hyper`](https://github.com/vercel/hyper)                     | mature-oss | `2a7bb18` | **0.41** |       0.65 |       1.12 |          0.16 |          0.28 |

Full benchmark assets:

- manifest: [`benchmarks/sets/known-ai-vs-solid-oss.json`](benchmarks/sets/known-ai-vs-solid-oss.json)
- snapshot: [`benchmarks/results/known-ai-vs-solid-oss.json`](benchmarks/results/known-ai-vs-solid-oss.json)
- report: [`reports/known-ai-vs-solid-oss-benchmark.md`](reports/known-ai-vs-solid-oss-benchmark.md)

## Configuration

The analyzer reads `slop-scan.config.ts`, `slop-scan.config.js`, `slop-scan.config.mjs`, `slop-scan.config.cjs`, or `slop-scan.config.json` from the scan root. Root `.gitignore` entries are also respected.

```json
{
  "ignores": ["dist/**", "coverage/**", "**/*.generated.ts"],
  "plugins": {
    "acme": "slop-scan-plugin-acme"
  },
  "extends": ["plugin:acme/recommended"],
  "rules": {
    "structure.over-fragmentation": { "enabled": true, "weight": 1.2 },
    "comments.placeholder-comments": { "enabled": false },
    "acme/no-generated-wrapper": { "enabled": true, "options": { "threshold": 3 } }
  },
  "overrides": [
    {
      "files": ["src/rules/**"],
      "rules": {
        "structure.directory-fanout-hotspot": { "enabled": false },
        "structure.over-fragmentation": { "enabled": false }
      }
    }
  ]
}
```

Supported today:

- `ignores`
- `plugins.<namespace>` as either a package/path string or a plugin object in module configs
- `extends: ["plugin:<namespace>/<config>"]`
- `rules.<id>.enabled`
- `rules.<id>.weight`
- `rules.<id>.options`
- `overrides[].files`
- `overrides[].rules.<id>.enabled`
- `overrides[].rules.<id>.weight`
- `overrides[].rules.<id>.options`

### Plugins

`slop-scan` can load third-party rule plugins and plugin preset configs from JSON or module configs.

For plugin setup, naming rules, and authoring examples, see [docs/plugins.md](docs/plugins.md).
Simple plugin rules can now declare stable delta behavior with helpers like `delta.byPath()` / `delta.byLocations()`, and clustered rules can attach lightweight `deltaKeys` instead of building fingerprints manually.

See also:

- [`examples/local-plugin/contains-word-plugin.mjs`](examples/local-plugin/contains-word-plugin.mjs)
- [`examples/local-plugin/slop-scan.config.ts`](examples/local-plugin/slop-scan.config.ts)

This repo also commits a root [`slop-scan.config.json`](slop-scan.config.json) for self-scans and local development. It keeps the scan focused on the tool itself by excluding heavyweight benchmark checkouts and intentionally disables directory-structure rules under `src/rules/**`.

## How it works

`slop-scan` is built as a pluggable engine:

- language plugins
- fact providers
- rule plugins
- reporters

That keeps the analyzer deterministic and extensible without turning it into one giant loop of ad hoc checks.

## Docs

- plugin guide: [`docs/plugins.md`](docs/plugins.md)
- built-in rule docs: browse [`src/rules/`](src/rules)
- benchmark guide: [`benchmarks/README.md`](benchmarks/README.md)
- pinned benchmark report: [`reports/known-ai-vs-solid-oss-benchmark.md`](reports/known-ai-vs-solid-oss-benchmark.md)
- exploratory note on non-JS/TS candidates: [`reports/exploratory-vite-astro-openclaw-beads.md`](reports/exploratory-vite-astro-openclaw-beads.md)
- contributing guide: [`CONTRIBUTING.md`](CONTRIBUTING.md)

## Contributing

Issues and pull requests are welcome.

For local development, validation, and benchmark reproduction, see [CONTRIBUTING.md](CONTRIBUTING.md).

## Sponsor

Sponsored by [Modem](https://modem.dev?utm_source=github&utm_medium=oss&utm_campaign=slop-scan).

<a href="https://modem.dev?utm_source=github&utm_medium=oss&utm_campaign=slop-scan">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://modem.dev/images/logo/svg/modem-combined-white.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://modem.dev/images/logo/svg/modem-combined-black.svg">
    <img src="https://modem.dev/images/logo/svg/modem-combined-black.svg" alt="Modem" width="220">
  </picture>
</a>


## License

MIT
