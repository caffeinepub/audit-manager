#!/usr/bin/env node
// Patches main.mo to add comparator functions to all bare .sort() calls.
import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
const __dirname = dirname(fileURLToPath(import.meta.url));

const moFile = join(__dirname, "../src/backend/main.mo");
let src = readFileSync(moFile, "utf8");

// Strip any explicit comparator arguments that were previously injected.
// This Motoko version uses implicit comparators — .sort() must have no argument.
src = src
  .replace(/userEngagements\.sort\([^)]*\)/g, "userEngagements.sort()")
  .replace(/engagementSections\.sort\([^)]*\)/g, "engagementSections.sort()")
  .replace(/sectionWorkpapers\.sort\([^)]*\)/g, "sectionWorkpapers.sort()")
  .replace(/filteredIssues\.sort\([^)]*\)/g, "filteredIssues.sort()")
  .replace(/engagementTests\.sort\([^)]*\)/g, "engagementTests.sort()");

writeFileSync(moFile, src, "utf8");
console.log("Backend patch applied: implicit sort (no comparator argument).");
