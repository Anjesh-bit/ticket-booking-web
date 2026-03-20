import { execSync } from "child_process";

import { validateBranchName } from "./validateBranch.js";

try {
  const branchName: string = execSync("git rev-parse --abbrev-ref HEAD").toString().trim();
  const isValidBranch: boolean = validateBranchName(branchName);

  if (!isValidBranch) {
    console.error(
      `🚫 Invalid branch name: "${branchName}"\n` +
        "Branch name must follow this pattern: <type>/<short-description>\n" +
        "Allowed types: feat, fix, chore, docs, release, perf, hotfix, refactor, test, experiment\n" +
        "Examples:\n" +
        "  feat/add-login\n" +
        "  fix/fix-crash\n" +
        "  docs/update-readme",
    );
    process.exit(1);
  }

  console.log(`✅ Branch name "${branchName}" is valid.`);
} catch (err) {
  console.error(`Error validating branch name: ${(err as Error).message}`);
  process.exit(1);
}