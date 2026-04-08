# AGENTS.md

## Role

You are working in a repository for a generic sing-stream database application.

Your job is to make the smallest reasonable changes needed to implement the requested task while preserving the intended architecture, documentation quality, and reproducibility of the project.

## Core Product Definition

This repository is for a static index database that makes spreadsheet-managed sing-stream data searchable and easier to browse.

The intended core flow is:

1. Google Spreadsheet as the source of truth
2. Export or sync script to generate normalized JSON
3. JSON published to Cloudflare R2
4. Static HTML / CSS / JavaScript fetches and renders the JSON
5. End users search and browse from the browser

This is not a full backend application.

## Primary Goals

Optimize for the following, in this order:

1. reproducibility
2. simplicity
3. maintainability
4. readability
5. small operational burden
6. acceptable performance

Do not optimize for theoretical scalability unless explicitly instructed.

## Source of Truth

Unless explicitly documented otherwise, the source of truth is:

1. spreadsheet column definitions
2. exported JSON schema
3. published static assets
4. repository documents
5. latest `main` branch

If code and docs conflict, prefer explicit repository documents and explicit schema definitions over assumptions.

## Required Reading Before Changes

Before making non-trivial changes, review these files if they exist:

- `AGENTS.md`
- `README.md`
- `docs/repro-spec.md`
- `docs/build-log.md`

Do not ignore repository instructions in favor of your own preferred architecture.

## Architecture Rules

Preserve the intended structure:

- spreadsheet-managed data
- normalized JSON output
- R2 distribution
- static frontend rendering

Prefer:

- static data over dynamic server logic
- plain HTML / CSS / JavaScript over frameworks
- simple scripts over complex build pipelines
- explicit schemas over implicit inference
- small files with clear responsibilities
- deterministic search behavior

Do not change the basic structure without a clear documented reason.

## Hard Constraints

### 1. Do not over-engineer

Do not introduce unnecessary frameworks, services, or abstractions.

Avoid introducing unless explicitly required:

- React
- Next.js
- Vue
- Svelte
- SSR
- complex state libraries
- ORMs
- server frameworks
- unnecessary APIs
- unnecessary databases

Use plain HTML / CSS / JavaScript unless repository documents explicitly require something else.

### 2. Keep the system static-first

Prefer static JSON files fetched by the frontend.

Do not turn this project into a backend-heavy application unless explicitly instructed.

### 3. Make the smallest reasonable change

Prefer:

- narrow diffs
- direct edits
- incremental improvements
- compatibility with existing structure

Avoid:

- sweeping rewrites
- mixing refactor and feature work without need
- casually renaming files or directories
- introducing speculative features

### 4. Keep names predictable

Use straightforward names such as:

- `public-data/songs.json`
- `public-data/archives.json`
- `public-data/meta.json`
- `scripts/sync-gas.mjs`
- `docs/repro-spec.md`
- `docs/build-log.md`

Avoid vague names such as:

- `finalData2.json`
- `newCore.js`
- `handler-temp.js`
- `app-v2-final.js`

### 5. Respect existing conventions

Inspect the repository before changing structure or style.

Do not rewrite large areas of code just to modernize them.

### 6. Do not invent requirements

If the repository does not explicitly require something, do not fabricate it.

Do not assume the project needs:

- authentication
- admin UI
- user accounts
- realtime sync
- analytics dashboards
- multi-tenant support
- CMS behavior
- full-text search backend

## Data Handling Rules

Treat spreadsheet-derived data carefully.

Always consider:

- documented column names
- documented column order
- empty values
- null vs empty string
- duplicate rows
- stable IDs when available
- backward compatibility of JSON keys
- deterministic sort order
- Japanese text normalization
- full-width / half-width normalization
- whitespace normalization
- punctuation normalization

Do not silently rename JSON keys.

If you change a data contract, update documentation and log the reason.

## Frontend Rules

Frontend implementation should remain lightweight.

Preferred approach:

- static `index.html`
- minimal CSS
- plain JavaScript
- fetch static JSON
- render searchable lists and detail links

Avoid:

- large client frameworks
- hidden global state complexity
- unnecessary animations
- unclear rendering flow
- complicated component systems

## Documentation Rules

Documentation is a first-class deliverable.

Maintain these files when relevant:

- `README.md`
- `docs/repro-spec.md`
- `docs/build-log.md`

### `README.md`
Should explain:

- what the repository is
- how the project is structured
- how the data flows
- how to start working safely

### `docs/repro-spec.md`
Should explain:

- system overview
- required external services
- spreadsheet expectations
- JSON schema
- R2 placement
- frontend behavior
- search rules
- deployment and update flow
- non-goals

### `docs/build-log.md`
Should record:

- what changed
- why it changed
- affected files
- important cautions
- unresolved issues when relevant

## Build Log Policy

For non-trivial changes, update `docs/build-log.md`.

At minimum record:

- date
- change summary
- reason
- affected files
- caution points
- unresolved items if any

Do not skip the build log for meaningful architectural, schema, deployment, or search behavior changes.

## Secrets and Configuration

Never hardcode secrets, tokens, credentials, private bucket settings, or private URLs in source files.

Use environment variables for sensitive values.

If examples are needed:

- use placeholder values
- use `.env.example` when appropriate
- keep real credentials out of the repository

Do not commit:

- API keys
- service account credentials
- R2 access keys
- secret tokens
- private spreadsheet credentials

## Verification Rules

Verify what can actually be verified.

Do not claim something works unless that claim is supported by one of the following:

- repository evidence
- code inspection
- local execution
- explicit configuration already present in the repository

If you cannot verify something, say so clearly in the relevant output or documentation.

## Change Checklist

Before finalizing a non-trivial change, confirm:

1. Does this preserve the spreadsheet -> JSON -> R2 -> HTML model?
2. Is the data contract explicit?
3. Did I avoid unnecessary frameworks and abstractions?
4. Did I update docs if behavior or schema changed?
5. Did I update `docs/build-log.md` if the change is meaningful?
6. Did I avoid hardcoding secrets?
7. Did I avoid claiming unverifiable success?

If any answer is weak, simplify the change or document the limitation.

## Non-Goals

Do not steer the project toward becoming:

- a generic CMS
- a social platform
- a complex SaaS
- a backend-heavy search engine
- a dynamic authenticated application
- a dashboard product with unrelated features

## Coding Style

Write code that is easy to inspect and edit.

Prefer:

- small functions
- explicit variable names
- direct control flow
- defensive handling of input data
- comments only where they clarify intent

Avoid:

- deep nesting
- excessive abstraction
- magic constants without explanation
- clever one-liners that reduce readability

## Output Style

When responding to implementation tasks:

- be concrete
- be minimal
- be honest
- do not add speculative features
- do not over-explain in code comments
- do not claim completion beyond what the repository evidence supports

## Branch Assumptions

Assume:

- `main` is the canonical branch unless explicitly documented otherwise
- the latest `main` is the only source of truth
- changes should remain compatible with current `main`
- parallel architecture directions should not be created casually

## Less Is More

When multiple implementation options exist, choose the simplest one that:

- preserves the current architecture
- remains understandable to a non-expert
- can be reproduced by a third party
- does not add unnecessary moving parts

Less is more.
