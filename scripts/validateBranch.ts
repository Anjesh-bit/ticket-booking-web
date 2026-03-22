export const validateBranchName = (branchName: string): boolean => {
  /**
   * Standard branch prefixes:
   *  - feat
   *  - fix
   *  - chore
   *  - docs
   *  - release
   *  - perf
   *  - hotfix
   *  - refactor
   *  - test
   *  - experiment
   *
   * Format: <type>/<short-description>
   * Example: feat/add-login, docs/update-readme
   */
  const branchPattern =
    /^(feat|fix|chore|docs|release|perf|hotfix|refactor|test|experiment)\/[a-z0-9-]+$/;

  return branchPattern.test(branchName) || branchName === "main";
};
