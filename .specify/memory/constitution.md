<!--
Sync Impact Report
Version change: (unfilled template) → 1.0.0
Modified principles: none renamed (all five principles newly defined)
Added sections: Core Principles (I–V), Technical Constraints, Quality Gates, Governance
Removed sections: none
Deferred TODOs: none
-->

# Mkeni Spec Constitution

## Core Principles

### I. Simplicity First
Build only what the current spec asks for. Speculative features, "just in case" abstractions,
and unrequested options MUST NOT be added.
Rationale: this is a tiny practice app; extra scope hides what the spec process is teaching.

### II. Client-Only
All data MUST live in the browser (localStorage). The app MUST NOT introduce a backend,
database, or login/authentication.
Rationale: keeps the app small and removes entire classes of complexity.

### III. Minimal Dependencies
A new library MUST NOT be added unless the plan explains why the browser or Next.js cannot
do the job.
Rationale: fewer dependencies mean fewer upgrades, less breakage, and less to learn.

### IV. Never Lose or Break User Data
Invalid, corrupted, or missing stored data MUST NOT crash the app. Reads MUST fall back to a
safe default, and the app MUST NOT overwrite stored data it could not parse without the
user's action.
Rationale: users trust notes will still be there; a crash on bad data is the worst failure.

### V. Spec Before Code
No implementation may begin without an approved spec, plan, and tasks for the work.
Rationale: the project exists to practice the Spec Kit workflow.

## Technical Constraints

- Stack: Next.js (App Router) with TypeScript and Tailwind, as already configured.
- Persistence is limited to localStorage (see Principle II).

## Quality Gates

- `npm run lint` and `npx tsc --noEmit` MUST both pass before a task is marked done.

## Governance

This constitution supersedes other project practices. Amendments MUST be made through
`/speckit-constitution` and MUST include a version bump:
- MAJOR: a principle is removed or redefined incompatibly.
- MINOR: a principle or section is added or materially expanded.
- PATCH: clarifications and wording fixes.

Specs, plans, and tasks MUST be checked against these principles; any deviation MUST be
justified in the plan.

**Version**: 1.0.0 | **Ratified**: 2026-11-13 | **Last Amended**: 2026-11-13
