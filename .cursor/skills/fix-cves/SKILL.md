---
name: fix-cves
description: >-
  Fix CVE vulnerabilities in console-plugin across release branches, or triage
  FedRAMP image CVEs against base container images. Use when the user asks to
  fix CVEs, resolve security vulnerabilities, patch SRVKP Jira tickets, run
  dependency security fixes, or check if OS-level CVEs are fixed in base images.
---

# Fix CVEs in Console Plugin

Batch-fix CVE vulnerabilities across one or more release branches, creating one
PR per branch with full verification evidence.

## Phase 1: Input

Three input modes are supported. Modes A and B handle **npm dependency CVEs** (proceed to Phase 2). Mode C handles **FedRAMP image CVEs** (self-contained, does not proceed to Phase 2).

### Mode A: Paste Jira descriptions (no auth required)

The user pastes one or more Jira ticket descriptions directly into the chat.
Also expect:

- **Primary branch** (e.g. `release-v1.15.x`)
- **Additional branches** (optional)

Parse each pasted description to extract:

- **SRVKP ticket ID** — look for `SRVKP-\d+` in the text
- **CVE ID** — look for `CVE-\d{4}-\d{4,}` pattern
- **Vulnerable package name** — look for npm package names near keywords like
  "package", "component", "dependency", "module", or in a structured field
- **Fixed version** — look for version strings near "fixed in", "patched in",
  "upgrade to", ">=", or in a structured field
- **Primary branch** — infer from Jira title suffixes such as [pipelines-1.20] → release-v1.20.x, [pipelines-1.21] → release-v1.21.x

If the fixed version is not present in the pasted Jira description, inspect any advisory links, CVE references, release notes, attachments, or external URLs included in the pasted content and determine the minimum fixed version from those sources.

### Mode B: Fetch from Jira

The user provides one or more SRVKP ticket IDs.

Use the Jira integration available in the current environment to retrieve the corresponding issue details.

Extract the following information from each Jira issue:

- SRVKP ticket ID
- CVE ID
- Vulnerable package name
- Required fixed version
- Primary branch — infer from Jira title suffixes such as [pipelines-1.20] → release-v1.20.x, [pipelines-1.21] → release-v1.21.x
- Reporter account ID 
- Reporter display name (used for Jira notifications)

If the fixed version is not present in the Jira issue description, inspect any referenced advisories, CVE links, attachments, or external resources referenced by the Jira issue and determine the minimum fixed version from those sources.

### Mode C: FedRAMP image CVE triage

The user provides one or more CVE IDs (e.g. `CVE-2026-43618, CVE-2026-29518`) for OS-level vulnerabilities reported by FedRAMP against the console-plugin container image.

These are system package CVEs (rsync, expat, libpng, etc.), not npm dependencies. The goal is to determine whether fixes are available in the base container images and whether a rebuild will resolve them.

#### C1. Fetch CVE details

For each CVE, query the Red Hat Security Data API:

```
https://access.redhat.com/hydra/rest/securitydata/cve/<CVE-ID>.json
```

Extract:

- Severity and CVSS score
- Affected package name
- RHEL 9 fix state: check `affected_release` for entries where `product_name` contains "Enterprise Linux 9"
- Fixed package version and advisory ID (if available)
- If no RHEL 9 entry exists in `affected_release`, check `package_state` for the fix state (Affected, Not Affected, Will not fix)

If the API returns "Not Found", search the web for the CVE to determine if it applies to RHEL/UBI packages or is specific to a different vendor (e.g. Oracle bundled libraries).

#### C2. Check base images

Query the Pyxis API to inspect the latest `ubi9/nodejs-24` and `ubi9/nginx-124` images.

**Step 1 — Get the latest image ID for each repo:**

```
https://catalog.redhat.com/api/containers/v1/images?filter=repositories.repository%3D%3Dubi9/nodejs-24%3Barchitecture%3D%3Damd64&sort_by=creation_date%5Bdesc%5D&page_size=1
```

Note the `_id` and `creation_date` from the response.

**Step 2 — Get the RPM manifest to check installed package versions:**

```
https://catalog.redhat.com/api/containers/v1/images/id/<image-id>/rpm-manifest
```

For each CVE, search the RPM list for the affected package. Compare the installed version against the fixed version from C1.

**Step 3 — Check outstanding vulnerabilities:**

```
https://catalog.redhat.com/api/containers/v1/images/id/<image-id>/vulnerabilities
```

Check if any of the target CVEs appear in the outstanding vulnerabilities list.

#### C3. Present results

Present a summary table:

```
| CVE | Component | Severity | Fixed Package | nodejs-24 (built <date>) | nginx-124 (built <date>) | Status |
|-----|-----------|----------|---------------|--------------------------|--------------------------|--------|
| CVE-2026-43618 | rsync | Important (8.1) | rsync-3.2.5-7.el9_8.2 | Has 3.2.5-7.el9_8 (OLD) | Has 3.2.5-7.el9_8 (OLD) | Rebuild needed |
| CVE-2026-45186 | expat | Important (7.5) | expat-2.5.0-6.el9_8.1 | Has 2.5.0-6.el9_8.1 (FIXED) | Has 2.5.0-6.el9_8.1 (FIXED) | Already fixed |
| CVE-2026-22020 | libpng | Important (7.1) | Not tracked for UBI9 | Not installed | Has system libpng (not affected) | Not applicable |
```

Status values:

- **Already fixed** — the installed version matches or exceeds the fixed version
- **Rebuild needed** — the fix errata is published but the base image hasn't been rebuilt yet; rebuilding the console-plugin image will pick up the fix
- **Awaiting upstream** — the fix errata has not been released yet; no action possible until Red Hat publishes the fix
- **Not applicable** — the CVE does not affect UBI9/RHEL9 system packages (e.g. vendor-bundled libraries), or the package is not installed in the image
- **Not installed** — the affected package is not present in the image

#### C4. Recommend action

Based on the results:

- **If all CVEs are "Already fixed" or "Not applicable"**: report that a rebuild will resolve the FedRAMP findings, no code changes needed.
- **If any CVE is "Rebuild needed"**: the fix RPM is available in the content sets. Rebuilding the container image will pick it up.
- **If any CVE is "Awaiting upstream"**: report that the fix is not yet available and the ticket should remain open until the errata is published.

Mode C is self-contained. Do not proceed to Phase 2, 3, or 4.

### After parsing (Modes A and B only)

If the fixed version cannot be determined from any source, ask the user for clarification before proceeding.

Collect all CVEs into a tracking table and present it to the user for
confirmation before proceeding:

```
| SRVKP      | CVE ID          | Package     | Fixed Version | Status             |
|------------|-----------------|-------------|--------------:|--------------------|
| SRVKP-1234 | CVE-2024-12345 | micromatch  | 4.0.8         | pending            |
```

Possible status values: `pending`, `fixed`, `already-remediated`, `triaged`.

## Phase 2: Branch Setup and Fix Loop

Process branches one at a time. For each branch:

### 2a. Checkout, sync, and clean install

Before switching branches, verify the working tree is clean with `git status --porcelain`. If it returns any output, stop and ask the user before proceeding.

```bash
git checkout <branch>
git pull upstream <branch>
rm -rf node_modules yarn.lock
yarn install
```

**Critical**: Always remove both `node_modules` and `yarn.lock` and reinstall to regenerate the dependency graph from scratch and avoid stale resolutions.

### 2b. Analyze each CVE

For each CVE, run the analysis script:

```bash
npx ts-node --project scripts/fix-cves/tsconfig.json \
  scripts/fix-cves/analyze-deps.ts \
  --package <pkg> \
  --fixed-version <ver>
```

The script outputs JSON containing a `strategy` field. Act on the returned strategy and track the outcome for each CVE:

| Strategy             | Outcome            |
| -------------------- | ------------------ |
| `already-remediated` | already-remediated |
| `triage-needed`      | triaged            |
| `direct-upgrade`     | fix-required       |
| `parent-upgrade`     | fix-required       |
| `resolution`         | fix-required       |

If all CVEs are marked `already-remediated` or `triaged`, do not create a fix branch or PR for this branch.

### 2c. Create fix branch

Only create a fix branch if at least one CVE is marked `fix-required`.

```bash
git checkout -b fix/cve-batch-<branch>
```

Proceed with processing each CVE according to the strategy returned by the analysis script.

### Jira Mentions

When posting Jira comments in Mode B, notify the reporter using a native Jira mention. Extract the reporter's account ID and display name from the Jira issue, then insert a mention node at the beginning of the comment:

```json
{"type": "mention", "attrs": {"id": "<reporter-account-id>", "text": "@<reporter-display-name>"}}
```

All automated Jira comments (already-remediated, triaged, remediation-completed) should begin with a reporter mention.

Render the evidence sections (yarn why / npm ls output) as ADF `codeBlock` nodes with language `bash`.

#### Strategy: `already-remediated`

The installed version already meets or exceeds the required fixed version. No remediation is required for this CVE on the current branch.

**If Jira integration is available (Mode B)**, add a comment to the corresponding Jira issue:

```text
<mention reporter>

[CVE Bot] Automated analysis for <CVE-ID> on branch <branch>:

Package: <pkg>
Installed version: <current-version>
Required fixed version: <fixed-version>

Verification:
The installed version meets or exceeds the required fixed version.

Result:
This CVE is already remediated on the branch and no code changes are required.

Evidence:

$ yarn why <pkg>
<yarn why output>

$ npm ls --all <pkg>
<npm ls output>
```

The evidence comes from the analyze-deps script output (`yarnWhyRaw` field).

**If using paste mode (Mode A)**, print the comment to the user so they can manually post it on the Jira ticket.

Mark this CVE as `already-remediated` in the tracking table.

Skip this CVE — no code changes, no commits, no inclusion in PR. Continue processing the remaining CVEs for the branch.

#### Strategy: `direct-upgrade`

The package is a direct dependency (in `dependencies` or `devDependencies`).
Upgrade it:

```bash
yarn up <pkg>@<fixed-version>
```

Or edit the version in `package.json` directly if `yarn up` does not respect the
exact version, then run `yarn install`.

#### Strategy: `parent-upgrade`

The vulnerable package is transitive, but upgrading a direct parent to its
latest version pulls in the fix. The script provides `parentUpgradeSuggestions`
showing which parent to upgrade. For example:

```json
"parentUpgradeSuggestions": ["eslint@9.0.0 (pulls glob@10.3.0, satisfies 10.3.0)"]
```

Upgrade the suggested parent:

```bash
yarn up <parent-pkg>@<latest>
```

Then verify the transitive dep resolved to the fixed version.

#### Strategy: `resolution`

The package is transitive and no parent upgrade resolves it. Add or update the
`resolutions` field in `package.json`:

```json
"resolutions": {
  "<pkg>": "<fixed-version>"
}
```

Merge with existing resolutions (currently: `webpack`, `@types/d3-dispatch`,
`@types/d3-selection`). Then run `yarn install`.

**Resolutions are a last resort.** Only use when neither direct-upgrade nor
parent-upgrade is possible.

#### Strategy: `triage-needed`

The fixed version is not published on npm, or the SDK pins an incompatible range.

**If Jira integration is available (Mode B)**, add a comment to the corresponding Jira issue:

```text
<mention reporter>

[CVE Bot] Automated analysis for <CVE-ID> on branch <branch>:

Package: <pkg>
Installed version: <current-version>
Requested fixed version: <fixed-version>

Result:
The required fixed version is not currently available on npm, or an SDK dependency constraint prevents the upgrade.

This package is a transitive dependency of @openshift-console/dynamic-plugin-sdk.

Evidence:

$ yarn why <pkg>
<yarn why output>

$ npm ls --all <pkg>
<npm ls output>

Please advise on next steps:
- Wait for an upstream dependency update
- Accept a resolution override
- Use an alternative remediation approach
```

**If using paste mode (Mode A)**, print the triage comment to the user so they can manually post it on the Jira ticket or forward it to the reporter.

Mark this CVE as `triaged` in the tracking table and skip it.

### 2d. Verify fixes

After all remediation changes have been applied for the branch, verify each fixed package:

```bash
yarn why <pkg>
npm ls --all <pkg> 2>/dev/null || true
```

Capture the verification output for each remediated CVE. This evidence should be included in the PR description.

Verification should confirm that:

* The vulnerable version is no longer present.
* The required fixed version is installed.
* The dependency tree reflects the expected remediation.

If verification shows the vulnerable version is still present:

* Check if another dependency re-introduces it.
* Add an additional resolution if required.
* Re-run the analysis script.
* Re-apply the remediation if necessary.
* Re-verify the package.

After dependency verification succeeds, validate that the branch still builds and tests successfully:

```bash
yarn build
yarn test
```

Record the result of each command for inclusion in the PR description.

If a validation step fails:

* Investigate whether the failure is related to the dependency update.
* Fix the issue if possible.
* Do not mark the CVE as `fixed` until the remediation has been verified and the validation results have been reviewed.
* If build or test failures are unrelated to the remediation, record the results and continue based on user approval.

After successful verification and validation, update the status of each remediated CVE from `pending` to `fixed`.

## Phase 3: Create PR

Only create a PR if at least one CVE resulted in an actual dependency change. If all CVEs for a branch are `already-remediated` or `triaged`, add the appropriate Jira comments, report the branch status to the user, and continue to the next branch. Only include remediated CVEs in commit messages, PR titles, PR descriptions, and Jira comments.

### 3a. Commit and push

```bash
git add package.json yarn.lock

git commit -m "$(cat <<'EOF'
fix(deps): resolve CVEs [<fixed-SRVKP-1>, <fixed-SRVKP-2>] on <branch>

Fixes:
- <CVE-ID-1> (<pkg1>)
- <CVE-ID-2> (<pkg2>)
EOF
)"

git push -u origin fix/cve-batch-<branch>
```

### 3b. Create the PR

Use `gh pr create` with a descriptive body:

```bash
gh pr create \
  --base <branch> \
  --title "fix(deps): resolve CVEs [<fixed-SRVKP-1>, <fixed-SRVKP-2>] on <branch>" \
  --body "$(cat <<'EOF'
## CVE Fixes

| SRVKP | CVE ID | Package | Old Version | New Version | Strategy |
|--------|--------|----------|-------------|-------------|----------|
| <fixed-SRVKP-1> | <CVE-ID-1> | <pkg1> | <old-ver> | <new-ver> | direct-upgrade |
| <fixed-SRVKP-2> | <CVE-ID-2> | <pkg2> | <old-ver> | <new-ver> | resolution |

## Validation

| Check      | Result                      |
| ---------- | --------------------------- |
| yarn build | <Passed / Failed / Not Run> |
| yarn test  | <Passed / Failed / Not Run> |

## Verification Evidence

### <pkg1>

<details>
<summary>yarn why <pkg1></summary>

~~~text
<paste yarn why output>
~~~

</details>

### <pkg2>

<details>
<summary>yarn why <pkg2> / npm ls --all <pkg2></summary>

~~~text
<paste verification output>
~~~

</details>

EOF
)"
```

### 3c. Update Jira with PR Information

After creating the PR, perform the following for each remediated CVE that was included in the PR.

**If Jira integration is available (Mode B):**

1. **Add a comment** to the corresponding Jira issue:

```text
<mention reporter>

[CVE Bot] Remediation completed for <CVE-ID> on branch <branch>.

Package: <pkg>
Fixed version: <fixed-version>
Pull Request: <pr-url>

Verification:
The vulnerable version is no longer present and the required fixed version has been verified.

Status:
Remediation completed and PR created for review.
```

2. **Add the PR to the Pull Request field.** Use `getJiraIssue` with `fields: ["*all"]` to find the custom field ID for the "Pull Request" or "Pull Requests" field. Then use `editJiraIssue` to set that field with the PR URL. This ensures the PR appears in the dedicated Pull Request field, not just in Web Links.

3. **Transition the issue to Code Review.** Use `getTransitionsForJiraIssue` to list available transitions, find the transition whose name matches "Code Review" (case-insensitive), then call `transitionJiraIssue` with that transition ID.

**If using paste mode (Mode A)**, print the comment to the user and instruct them to link the PR and move the ticket to Code Review manually.

## Phase 4: Repeat for Additional Branches

For each additional branch the user specified:

1. Go back to Phase 2 (checkout, sync, clean install, analyze, fix, verify).
2. Create a separate PR for each branch (Phase 3).

Fixes may differ between branches because dependency trees diverge across releases. Always re-run the dependency analysis for every branch. Do not assume the same fix applies across branches.

## Shared Packages with OpenShift Console

The analysis script automatically detects packages shared with the console by
checking if they appear in the transitive dependency tree of:

- `@openshift-console/dynamic-plugin-sdk`
- `@openshift-console/dynamic-plugin-sdk-internal`
- `@openshift-console/dynamic-plugin-sdk-webpack`

When a vulnerable package is shared with the SDK:

1. **Check if the fixed version is available on npm** — the script does this
2. **If available**: use `resolution` to force it (the SDK will pick up the
   hoisted version)
3. **If not available**: triage with the Jira reporter (`triage-needed` strategy)
4. **Resolution is the last resort** — only when direct upgrade cannot work

## Checklist

Copy this checklist and track progress per branch:

```text
Branch: release-vX.Y.x

- [ ] Verified working tree is clean
- [ ] Synchronized branch with upstream
- [ ] Performed clean install
- [ ] Analyzed all CVEs
- [ ] Created fix branch, if remediation was required
- [ ] Applied fixes (direct-upgrade / parent-upgrade / resolution), if required
- [ ] Recorded outcomes for all CVEs (fixed / already-remediated / triaged)
- [ ] Verified all remediated packages with yarn why / npm ls
- [ ] Ran yarn build
- [ ] Ran yarn test
- [ ] Committed and pushed changes, if remediation was required
- [ ] Created PR with evidence, if remediation was required
- [ ] Updated Jira with remediation results
```

### Mode C Checklist

```text
FedRAMP Image CVE Triage

- [ ] Fetched CVE details from Red Hat Security Data API
- [ ] Queried latest ubi9/nodejs-24 image from Pyxis
- [ ] Queried latest ubi9/nginx-124 image from Pyxis
- [ ] Checked RPM manifests for affected packages
- [ ] Compared installed versions against fixed versions
- [ ] Presented summary table with status per CVE
- [ ] Recommended action (rebuild / wait / not applicable)
```