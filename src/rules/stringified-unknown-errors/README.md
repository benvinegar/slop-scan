# defensive.stringified-unknown-errors

Flags code that flattens unknown caught values into generic strings like `error.message` or `String(error)`.

- **Family:** `defensive`
- **Severity:** `strong`
- **Scope:** `file`
- **Requires:** `file.ast`

## How it works

The rule looks for conditional expressions like:

- `error instanceof Error ? error.message : String(error)`
- `err instanceof Error ? err.message : String(err)`
- equivalent forms assigned into `message` / `error` properties or returned directly

This pattern is common in generated wrapper code that wants a quick printable error value. It is sometimes reasonable, but repeated use often flattens richer failure objects into plain strings and makes downstream diagnostics more generic.

To avoid obvious vendored noise, the rule skips very large bundled/generated files over `5000` logical lines.

## Flagged examples

```ts
catch (error) {
  return { success: false, error: error instanceof Error ? error.message : String(error) };
}

setError(err instanceof Error ? err.message : String(err));

const message = error instanceof Error ? error.message : String(error);
```

## Usually ignored

```ts
catch (error) {
  throw error;
}

catch (error) {
  logger.error({ error });
  return { success: false, error };
}
```

## Scoring

Each unknown-error stringification site adds `2` points.
The file total is capped at `8`.

## Benchmark signal

Full pinned benchmark against the exact `known-ai-vs-solid-oss` cohort:

- Signal score: **0.88 / 1.00**
- Best separating metric: **findings / file (0.88)**
- Hit rate: **7/9 AI repos** vs **1/9 mature OSS repos**
- Full results: [experimental rule report](../../../reports/autoresearch-candidate-rule.md#defensivestringified-unknown-errors)
