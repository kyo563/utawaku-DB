# AGENTS.md

## Purpose

This repository hosts a generic sing-stream database application.

The core idea is simple:

- Spreadsheet is the primary source of truth
- Data is exported to JSON
- JSON is published on R2
- A static HTML app reads the JSON and renders a searchable index

This project must remain lightweight, understandable, and reproducible by third parties.

## Product Definition

This app is not a full backend system.

It is a static index database that helps users search song archive data from spreadsheet-managed records more intuitively.

Primary responsibilities:

- read normalized song/archive metadata
- expose it as static JSON
- render searchable/filterable views in HTML
- keep deployment and maintenance simple

## Source of Truth

Unless explicitly overridden in repository documents, the source of truth is:

1. spreadsheet column definition
2. exported JSON schema
3. published static assets
4. main branch

If implementation and documentation conflict, prefer the explicit schema and repository docs over assumptions.

## Architecture Principles

Keep the architecture minimal.

Preferred flow:

1. Google Spreadsheet
2. export / sync script
3. R2 static JSON
4. static HTML / CSS / JavaScript
5. end user browser

Default stance:

- prefer static data over dynamic fetching
- prefer simple scripts over frameworks
- prefer explicit schemas over implicit inference
- prefer readable code over clever abstractions
- prefer small files and clear responsibilities

## Hard Constraints

You must follow these rules.

### 1. Do not over-engineer
Do not add unnecessary frameworks, build tools, servers, or databases.

Avoid introducing:

- React
- Next.js
- Vue
- Svelte
- heavy state libraries
- server-side rendering
- ORMs
- unnecessary APIs

Use plain HTML / CSS / JavaScript unless a repository document explicitly requires otherwise.

### 2. Preserve the core flow
Do not change the basic structure without a strong documented reason.

The intended structure is:

- spreadsheet-managed data
- exported JSON
- R2 distribution
- static frontend rendering

### 3. Keep files and naming predictable
Use straightforward names.

Examples:

- `public-data/songs.json`
- `public-data/archives.json`
- `scripts/sync-gas.mjs`
- `docs/build-log.md`
- `docs/repro-spec.md`

Avoid vague names like:

- `data2-final-v3.json`
- `newAppCore.js`
- `tmp-handler.js`

### 4. Respect existing repository conventions
Before changing anything, inspect the current repository structure and follow the existing style.

Do not rewrite large areas just to make the code look more modern.

### 5. Log meaningful changes
When implementing non-trivial changes, update `docs/build-log.md`.

Log at least:

- what changed
- why it changed
- affected files
- important cautions

### 6. Do not invent requirements
If a requirement is not stated in the repository docs, do not fabricate it.

Do not assume:

- authentication is needed
- admin UI is needed
- user accounts are needed
- database migrations are needed
- real-time sync is needed

## What to Optimize For

Optimize for the following, in this order:

1. reproducibility
2. simplicity
3. maintainability
4. readability
5. small operational burden
6. acceptable performance

Do not optimize for theoretical scalability unless the repository explicitly asks for it.

## Spreadsheet and Data Handling Rules

Treat spreadsheet data carefully.

### Required attitude
- column names matter
- column order may matter if documented
- empty values must be handled explicitly
- Japanese text normalization matters
- search behavior must be deterministic

### Always consider:
- full-width / half-width normalization
- whitespace normalization
- optional fields
- null / empty string handling
- duplicate rows
- stable IDs when available
- schema compatibility with existing JSON consumers

Do not silently rename JSON keys without updating documentation.

## Frontend Rules

The frontend should remain lightweight.

### Preferred implementation
- static `index.html`
- minimal CSS
- plain JavaScript
- fetch static JSON
- render list / filters / detail views as needed

### Avoid
- large client-side frameworks
- unnecessary component systems
- hidden global state complexity
- fancy animations that hurt readability
- tightly coupled rendering logic with unclear data flow

## Documentation Rules

This repository is intended to be reproducible by third parties using tools such as Codex or Gemini.

Therefore documentation is a first-class deliverable.

Maintain these files when relevant:

- `README.md`
- `docs/repro-spec.md`
- `docs/build-log.md`

### `README.md`
Should explain:
- what this repository is
- how to run it
- how data flows
- where key files are

### `docs/repro-spec.md`
Should explain:
- system overview
- required services
- data model
- JSON schema
- deployment flow
- operational cautions
- non-goals

### `docs/build-log.md`
Should record:
- implementation decisions
- changes during development
- pitfalls
- unresolved issues

## Change Policy

Make the smallest reasonable change that satisfies the task.

Prefer:
- narrow diffs
- explicit edits
- compatibility with current structure

Avoid:
- sweeping rewrites
- mixing refactor and feature work in one step
- changing file layout without need
- changing naming conventions casually

## When Adding New Features

Before implementing, confirm:

1. Does this fit the spreadsheet -> JSON -> R2 -> HTML model?
2. Can this be done without introducing a new framework?
3. Is the data contract explicit?
4. Does the change need a documentation update?
5. Does the change preserve reproducibility?

If the answer to these questions is weak, simplify the plan.

## Non-Goals

This repository is not intended to become:

- a generic CMS
- a social platform
- a complex multi-tenant SaaS
- a full-text search engine backend
- a highly dynamic authenticated application

Do not steer the project in those directions unless explicitly instructed.

## Coding Style

Write code that is easy to inspect and edit.

Naming conventions must follow these fixed rules:
- Class names, struct names, and type alias names: `PascalCase`
- Variable names: `snake_case`
- Function names and method names: `snake_case`

Prefer:
- small pure functions
- explicit variable names
- direct control flow
- defensive handling of input data
- comments only where they clarify intent

Avoid:
- deeply nested logic
- excessive abstraction
- magic constants without explanation
- clever one-liners that reduce readability

## Output Style for AI Agents

When making changes:

- be concrete
- be minimal
- do not over-explain in code
- do not add speculative features
- do not claim something works unless the code supports it

If you make an assumption, state it clearly in the relevant document or task output.

## Branch and Merge Assumptions

This repository is effectively operated with `main` as the canonical branch unless explicitly documented otherwise.

Assume:

- latest `main` is the only source of truth
- changes should stay compatible with current `main`
- do not create parallel architecture directions

## Less Is More

This rule is important.

When several implementation options exist, choose the simplest one that:

- preserves current architecture
- remains understandable to a non-expert
- can be reproduced by a third party
- does not add unnecessary moving parts

Less is more.
