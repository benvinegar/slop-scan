# tests.duplicate-mock-setup

Flags repeated test mock/setup shapes across several test files.

- **Family:** `tests`
- **Severity:** `medium`
- **Scope:** `file`
- **Requires:** `repo.testMockDuplication`

## How it works

A repo-level fact fingerprints statement-level mock/setup shapes inside test files.
The rule reports a file when one of those shapes appears in **3 or more test files**.

Generic labels such as `vi.mock`, `jest.mock`, `vi.spyOn`, `jest.spyOn`, `sinon.stub`, and `sinon.spy` are filtered out so routine framework setup does not dominate the signal.
Cleanup-only statements like `mockReset` and `mockClear` are also ignored.

## Flagged example

```ts
// users.test.ts
vi.mocked(api.fetchUser).mockResolvedValue({ id: 1, name: "Ada" });

// teams.test.ts
vi.mocked(api.fetchUser).mockResolvedValue({ id: 2, name: "Lin" });

// accounts.test.ts
vi.mocked(api.fetchUser).mockResolvedValue({ id: 3, name: "Max" });
```

Once that same setup shape appears in 3 files, each participating file gets a finding.

## Usually ignored

```ts
vi.mock("./client");
vi.clearAllMocks();
```

Generic mock declarations and cleanup-only statements do not contribute to this rule.

## How to fix / do this better

When the same mock setup keeps reappearing, prefer shared test helpers over repeating the setup inline.

Better options:

- move repeated mock wiring into a factory or fixture helper
- centralize common setup in `beforeEach` when it is truly shared
- expose small scenario builders so tests vary only the interesting values

```ts
function mockUserFetch(overrides: Partial<User> = {}) {
  vi.mocked(api.fetchUser).mockResolvedValue({ id: 1, name: "Ada", ...overrides });
}
```

That keeps test intent focused on what changes per case instead of duplicating the same mock plumbing in every file.

## Scoring

Each duplicate setup cluster adds `1 + 0.5 * (fileCount - 2)` for the current file, capped at `5`.

## Benchmark signal

Small pinned rule benchmark ([manifest](../../../benchmarks/sets/rule-signal-mini.json)):

- Signal rank: **#5 of 11**
- Signal score: **0.63 / 1.00**
- Best separating metric: **findings / file (0.70)**
- Hit rate: **3/6 AI repos** vs **1/5 mature OSS repos**
- Full results: [rule signal report](../../../reports/rule-signal-mini.md#testsduplicate-mock-setup)
