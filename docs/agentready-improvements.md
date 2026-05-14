# AgentReady Improvement Actions

**Score**: 77.4/100 (Gold) — assessed 2026-05-14, agentready v2.37.0

## Remaining Failures (by tier)

| # | Attribute | Tier | Status | Action |
|---|-----------|------|--------|--------|
| 1 | CI Quality Gates | T1 | FAIL | Add lint + test + type-check jobs to GH Actions on PRs |
| 2 | Architecture Decisions | T3 | FAIL | Create `docs/adr/` with at least one ADR |
| 3 | Deterministic Enforcement | T2 | Partial | Husky + lint-staged present; may need additional hook config |
| 4 | Code Smells | T4 | FAIL | Add markdownlint or actionlint (needs ≥60% linters) |
| 5 | Concise Documentation | T2 | FAIL | Add more bullet points, reduce heading density |
| 6 | .gitignore Completeness | T2 | FAIL | At 7/11 patterns; need ≥8 (70%) |
| 7 | File Size Limits | T2 | FAIL | 3 files >1000 lines (generated types, acceptable) |
| 8 | Design Intent | T3 | FAIL | Add docs/design/ with preconditions/invariants |
| 9 | Repomix Config | T3 | FAIL | Add repomix.config.json for AI context generation |

## Current Passes (16/24 assessed)

- CLAUDE.md/AGENTS.md (100), Lock files (100), Standard layout (100)
- Separation of concerns (100), Test execution (100), Single-file verification (100)
- README structure (100), One-command setup (100), OpenAPI specs (100)
- Issue/PR templates (100), Conventional commits (100)
- Container setup (70), Progressive disclosure (70)
- Pattern references (60), Dependency security (35)

## Not Actionable

- Type annotations: ERROR (tsconfig.json has comments, agentready's parser can't handle them)
- Branch protection: requires GitHub API integration
- File size limits: largest file is auto-generated (`gitea.d.ts`, 10787 lines)
