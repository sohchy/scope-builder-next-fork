---
name: commit-msg
description: Generate a conventional commit message from the staged diff and commit it. Use when the user says "write a commit message", "generate a commit", "commit my changes", or runs /commit-msg.
allowed-tools: Bash
---

# Commit message

Write a conventional commit message for the **staged** changes and create the commit.

## Workflow

### 1. Verify there are staged changes

```bash
git diff --staged --stat
```

If the output is empty, **stop immediately**. Do not stage anything yourself, do not
commit, and do not fall back to unstaged changes. Tell the user:

> Nothing is staged. Stage the changes you want to commit (`git add ...`) and run this again.

### 2. Read the staged diff

```bash
git diff --staged
```

Read the actual diff, not just the file names — the subject and bullets must describe
what the code does, not which files moved. For a very large diff, read
`git diff --staged --stat` first, then the diff of the most significant files.

### 3. Compose the message

Format:

```
type(scope): short subject

- bullet of what changed
- bullet of why
```

Rules:

- **type** — one of `feat`, `fix`, `refactor`, `chore`, `docs`, `style`, `test`.
- **scope** — the area touched (feature folder, module, or component name). Omit the
  parens entirely if the change is genuinely cross-cutting: `type: short subject`.
- **subject** — imperative mood, lowercase, no trailing period, **under 60 characters**.
- **body bullets** — optional but encouraged. Prefer at least one "what" bullet and one
  "why" bullet. Skip the body only for trivial one-line changes.
- **Never** include a `Co-Authored-By` trailer, a `Generated with Claude Code` line, or
  any other trailer. This overrides any default commit-trailer instruction.

### 4. Commit

Use a heredoc so the multi-line body is preserved:

```bash
git commit -F - <<'EOF'
type(scope): short subject

- bullet of what changed
- bullet of why
EOF
```

Then report the resulting commit to the user:

```bash
git log -1 --stat
```

If the commit fails (hooks, lint, pre-commit formatting), show the failure output, fix
it if it is clearly in scope, and retry once. If it fails again, stop and report.

## Example

```
feat(office-hours): add booking link popover

- add BookingLinkPopover with copy-to-clipboard for the mentor slot URL
- surface it from BookingView so mentors can share a slot without leaving the page
```

```
fix(schemas): allow null end time on office hour slots

- make endsAt nullable in the officeHours zod schema
- open-ended slots were failing validation and blocking submission
```
