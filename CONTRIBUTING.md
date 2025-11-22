
# Git Branching & Contribution Workflow

This project uses a **simple, PR‑based workflow** inspired by GitHub Flow and trunk‑based development.  
The goals are:

- Keep the `main` branch always stable and deployable.
- Encourage small, focused changes.
- Make it easy for new contributors to understand what to do.

> **TL;DR**  
> - Do **not** commit directly to `main`.  
> - Create a branch: `feature/<short-description>`  
> - Open a Pull Request (PR) into `main`.  
> - Wait for checks to pass, get a review, then **Squash & Merge**.

---

## 1. Branching Model

### 1.1 Long‑lived branch

- **`main`**
  - Always stable and should always build.
  - Represents the latest production‑ready (or demo‑ready) state.
  - Protected: direct pushes to `main` are not allowed.

### 1.2 Short‑lived branches

All work is done in **short‑lived branches** created from `main`.

- New feature:  
  `feature/<short-description>`
- (If enabled later) Bug fixes:  
  `bugfix/<short-description>`
- (If enabled later) Chores / maintenance:  
  `chore/<short-description>`

Examples:

- `feature/login-page`
- `feature/add-dark-mode`
- `feature/update-readme`

> Currently, only `feature/*` branches are **allowed** for PRs by the automated checks.  
> Other prefixes may be added in future (e.g. `bugfix/*`, `chore/*`).

---

## 2. Branch Naming Rules (Enforced)

To keep the repository tidy and predictable, we enforce a strict branch‑naming rule:

- ✅ **Allowed pattern (required):**

  ```text
  feature/<short-description>
  ```

- 🚫 **Not allowed (will fail checks):**

  ```text
  login-page
  bugfix/login-page
  my-temp-branch
  patch-1
  ```

### 2.1 Why this rule exists

- Makes it obvious what a branch is for.
- Simplifies searching and filtering in GitHub.
- Allows CI and other automation to make assumptions about branches.

### 2.2 What happens if I don’t follow it?

- You can still technically create the branch.
- But when you open a Pull Request:
  - A GitHub Action will run and **fail** for branches that don’t match `feature/*`.
  - Because this check is required for merging into `main`, the PR **cannot be merged** until the rule is followed.

If you accidentally used the wrong name, just:

1. Create a new correctly named branch from `main`.
2. Cherry‑pick or re‑apply your commits.
3. Open a new PR with the correct branch name.

---

## 3. Local Workflow: Step by Step

### 3.1 Set up the repository

Clone the repo (if you haven’t already):

```bash
git clone <REPO_URL>
cd <REPO_NAME>
git checkout main
git pull origin main
```

### 3.2 Start a new change

Always start from an up‑to‑date `main`:

```bash
git checkout main
git pull origin main
```

Create a feature branch:

```bash
git checkout -b feature/<short-description>
```

Example:

```bash
git checkout -b feature/login-page
```

### 3.3 Make commits

Make your code changes, then commit them in small, logical units:

```bash
git status
git add <files>
git commit -m "Short summary of what changed"
```

Guidelines:

- Use clear, imperative commit messages, e.g.:
  - `Add login page layout`
  - `Validate email address on login`
  - `Refactor user service`

### 3.4 Push your branch

When your work is ready (or you want to share progress):

```bash
git push -u origin feature/<short-description>
```

---

## 4. Opening a Pull Request (PR)

After pushing the branch:

1. Go to the repository on GitHub.
2. You’ll see a prompt to “Compare & pull request” for your branch — click it.
3. Make sure the base branch is **`main`** and the compare branch is your `feature/*` branch.
4. Fill in the PR title and description:
   - **Title**: short and clear (e.g. *Add login page*).
   - **Description**:
     - What you changed.
     - Why you changed it.
     - How to test it (if relevant).
5. Submit the PR.

### 4.1 PR review & checks

For each PR:

- Automated checks (CI, branch‑name check, etc.) will run.
- The PR should:
  - ✅ Have a descriptive title and summary.
  - ✅ Pass all required checks.
  - ✅ Be small and focused (easier to review).

For collaborative work:

- At least one other contributor should review the PR.
- Address review comments by pushing more commits to the same branch.

---

## 5. Merging a PR

Once:

- All required checks pass (including branch name enforcement), and
- The PR is approved (if required),

then you can merge it.

### 5.1 Merge strategy

We use **Squash & Merge**:

- All commits in the feature branch are squashed into **one commit** on `main`.
- The commit message on `main` should summarize the entire change.

This keeps `main` history clean and easier to read.

After merging:

- Delete the feature branch on GitHub (there’s a button for this on the PR page).
- You can also delete it locally:

  ```bash
  git branch -d feature/<short-description>
  ```

---

## 6. Releases (Optional)

If/when we want versioned releases, we’ll use **tags** on `main`:

```bash
git checkout main
git pull origin main
git tag -a v1.0.0 -m "First stable release"
git push origin v1.0.0
```

At that point, `v1.0.0` represents a snapshot of `main` that can be referenced and deployed.

---

## 7. CI: Branch Name Enforcement (Technical Details)

> You don’t need to modify this to contribute, but it is documented here for transparency.

Branch name enforcement is implemented using a **GitHub Action**.  
A workflow like the one below lives in: `.github/workflows/enforce-branch-name.yml`.

```yaml
name: Enforce branch naming

on:
  pull_request:
    branches:
      - main
  push:
    branches-ignore:
      - main

jobs:
  check-branch-name:
    runs-on: ubuntu-latest
    steps:
      - name: Check branch name matches allowed pattern
        run: |
          BRANCH_NAME="${GITHUB_HEAD_REF:-${GITHUB_REF#refs/heads/}}"
          echo "Branch name: $BRANCH_NAME"

          if [[ ! "$BRANCH_NAME" =~ ^feature/.+ ]]; then
            echo "❌ Branch name does not follow the required pattern: feature/<short-description>"
            echo "Please rename your branch to: feature/<short-description>"
            exit 1
          fi

          echo "✅ Branch name is valid."
```

Because this workflow is configured as a **required status check** for `main`:

- PRs from branches that do **not** match `feature/*` will have a failing check.
- Failing checks prevent merging into `main`.

---

## 8. Quick Checklist for Contributors

Before you start:

- [ ] You have cloned the repo and checked out `main`.
- [ ] You understand that `main` is protected; no direct pushes.

For each change:

- [ ] Create a branch from `main` named `feature/<short-description>`.
- [ ] Commit your work in small, logical chunks.
- [ ] Push the branch and open a PR into `main`.
- [ ] Ensure all checks pass and respond to any review comments.
- [ ] Use **Squash & Merge** when merging the PR.
- [ ] Delete the feature branch after merge.

That’s it! 🎉  
Following this workflow keeps the project history clean, makes collaboration easier, and avoids “branch chaos” as the project grows.
