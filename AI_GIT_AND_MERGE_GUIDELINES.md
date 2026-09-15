# AI Agent & Team Git / Committing Guidelines

To ensure a smooth workflow for this 4-member project and prevent conflicts when merging small parts of the 4 epics into the `dev` branch, the AI Agent and team members must strictly follow these guidelines.

## 1. Branching Strategy
*   **Never Commit Directly to `dev` or `main`**: All work must be done on feature branches.
*   **Use Existing Branches**: Branch names are already made for each epic. Always use your pre-assigned branch; do not create new branches or use any branch naming conventions.
*   **Short-Lived Commits**: Since work is done in "small small parts", commit and merge back to `dev` frequently to minimize the delta between branches.

## 2. Preventing Merge Conflicts
*   **Frequent Pulls/Rebases**: Before starting a new task, and frequently during development, pull the latest changes from the `dev` branch into your feature branch (`git pull origin dev` or `git rebase dev`). This ensures you are always working on top of the latest team codebase.
*   **Isolate Shared Files**: Files that all 4 members might touch (e.g., `package.json`, main routing files, shared constants) are conflict hotspots. 
    *   *Rule for AI*: When modifying shared routing or configuration files, only append or insert your specific lines cleanly. Do not reformat the entire file.
    *   Communicate with the team if major architectural changes are needed in shared files.
*   **Scoped File Modifications**: Only edit files relevant to the current small task. Do not include random fixes or formatting changes to unrelated files in your commits.

## 3. Commit Practices
*   **Atomic Commits**: Make small, logical, and atomic commits. A commit should represent a single logical change.
*   **Descriptive Commit Messages**: Use clear and conventional commit messages.
    *   Format: `[Epic Name] action: description of change`
    *   Example: `[UserProfile] feat: add user avatar upload component`
    *   Example: `[Billing] fix: resolve alignment issue on invoice table`
*   **Review Before Committing**: The AI should thoroughly verify the `git diff` before proposing a commit to ensure no unintended files or style changes are included.

## 4. Merging into `dev`
*   **Pull Requests (PRs)**: All merges into `dev` should happen via Pull Requests (or Merge Requests).
*   **Review Process**: Have at least one other team member review the PR to spot potential integration issues with their epic.
*   **Conflict Resolution**: If conflicts occur during a PR, the author of the branch is responsible for resolving them by pulling `dev` into their branch locally, resolving the conflicts carefully, and pushing the resolution.
*   **Do Not Delete Branches**: After merging your work into `dev`, **do not delete** your branch. Keep the branch intact for future tasks.
