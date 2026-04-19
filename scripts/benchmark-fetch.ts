import { getOption } from "./lib/get-option";
import { ensurePinnedCheckouts } from "../src/benchmarks/checkouts";
import {
  DEFAULT_BENCHMARK_SET_PATH,
  loadBenchmarkSet,
  resolveProjectPath,
} from "../src/benchmarks/manifest";

const manifestPath = getOption(process.argv.slice(2), "--manifest", DEFAULT_BENCHMARK_SET_PATH);
const benchmarkSet = await loadBenchmarkSet(manifestPath);
const checkoutsDir = resolveProjectPath(benchmarkSet.artifacts.checkoutsDir);

await ensurePinnedCheckouts(checkoutsDir, benchmarkSet.repos);

console.log(`\nPinned benchmark checkouts are ready in ${checkoutsDir}`);
