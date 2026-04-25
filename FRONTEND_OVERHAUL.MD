# Trasck Frontend Overhaul

## Purpose

Trasck is intended to be an open source alternative to Jira and Rally with first-class support for AI agents that can take on work. The frontend should feel like a serious project management workspace first, and an agent operations console second. The current React application already exposes most backend surfaces, but the experience reads as a collection of implementation forms instead of a cohesive product.

This plan defines the redesign direction, the missing product pieces required for a Jira-like feel, and the implementation sequence for moving the existing Vite/React frontend toward a professional daily-use application without breaking the backend contract.

## Documentation Read

The redesign is based on the local documentation set:

- `../trasck/README.md`
- `README.md`
- `../trasck-test/README.md`
- `../trasck/TECH_SPECS.MD`
- `../trasck/NEXT_STEPS.MD`
- `../trasck/SECURITY_AUDIT.MD`
- `../trasck/MANUAL_TEST_CASES.MD`
- `../trasck/MANUAL_TEST_NOTES.MD`
- `../trasck/docs/LOCAL_RUNTIME.md`
- `../trasck/docs/WEBHOOK_SIGNATURES.md`
- `../trasck/docs/api/FRONTEND_API_CONTRACT.md`
- `../trasck/docs/import-samples/README.md`

## Product Direction From The Docs

Trasck is not a small ticket tracker. It is an enterprise-capable project management platform with a configurable work hierarchy, workflows, boards, planning, programs, dashboards, imports, automation, security administration, and provider-neutral AI agent execution.

The backend model separates container hierarchy from work hierarchy:

- Organization, workspace, program, project, and team define tenancy, portfolio grouping, delivery ownership, and access boundaries.
- Work items are universal artifacts. Themes, initiatives, capabilities, features, epics, stories, tasks, bugs, and subtasks are all `WorkItem` records with configurable types and hierarchy rules.
- Workflow, custom fields, screens, boards, notifications, automation, and reporting are workspace-configurable with project overrides.
- Work item changes create activity; security-sensitive changes create audit entries.
- Browser auth must remain cookie plus CSRF, with no browser access-token local storage.
- Frontend pages should use feature-specific API services rather than raw generated-client calls.
- Raw payload diagnostics should remain gated by `VITE_TRASCK_ENABLE_DIAGNOSTICS=true`.
- Product pages should favor structured tables, summaries, forms, and selectors.

The current implemented frontend surface includes setup/auth, overview, work items, planning, programs, configuration, automation, imports, saved filters/views, dashboards, agents, token administration, system administration, workspace settings, project settings, and anonymous public preview.

## Current Frontend Audit

### Architecture

The frontend is a Vite React application using:

- React 19
- React Router 7
- `react-icons`
- A generated OpenAPI client under `src/api/generated`
- Feature service wrappers under `src/api/services`
- Route-level pages under `src/pages`
- Shared UI primitives under `src/components`
- Global styles in `src/styles/app.css`

The architecture is workable and should be preserved. The biggest issues are not API boundaries or routing; they are information architecture, layout density, visual hierarchy, and route ergonomics.

### Strengths To Keep

- Route-based navigation already matches the documented direction.
- Workspace/project context is loaded through `/api/v1/auth/context`.
- Permission-aware route gates already prevent major access mistakes.
- The API client already fetches a fresh CSRF token for unsafe cookie-authenticated requests.
- Generated API client tooling exists and should remain the contract source.
- Feature-specific service wrappers exist and should remain the UI boundary.
- Secret display is already more careful than the first baseline.
- Raw diagnostics are mostly hidden behind `JsonPreview` and the diagnostics env flag.
- Planning has already been split into overview, backlog, active board, and admin routes.

### Problems To Fix

1. The shell feels like a demo console.
   - Primary and admin navigation are horizontal tab strips.
   - Important daily surfaces compete with rare admin surfaces.
   - The brand and context selectors do not create a persistent project workspace.
   - There is no Jira-like left navigation or project-level chrome.

2. The UI is too panel-heavy.
   - Most pages are grids of boxed sections.
   - Many panels contain forms, previews, and actions at the same visual weight.
   - Repeated panel shadows make the app feel cluttered instead of dense.

3. Daily work is not prioritized enough.
   - Work item list/detail exists, but the detail view shows every collaboration tool at once.
   - There is no strong issue navigator feel: key, type, status, metadata, activity, comments, files, labels, links, and time should be organized into predictable detail tabs.
   - Board cards are functional but visually thin.

4. Planning is split correctly but lacks the product polish of a sprint workflow.
   - Backlog and iteration scope are simple buckets rather than a structured sprint planning desk.
   - Active board columns do not clearly show counts, drag affordance, card metadata, or WIP state.
   - Sprint health exists only as summary rows, not as a scannable header.

5. Administration and operations overwhelm normal routes.
   - Automation, imports, agents, configuration, tokens, system, workspace settings, and project settings all sit close to daily work.
   - Agent provider setup and dispatch attempt administration are important, but they should feel like an operations area, not the center of the product.

6. JSON and expert controls still dominate some pages.
   - Search, dashboards, automation, imports, and configuration still need advanced JSON escape hatches, but those should be visually secondary and collapsed where possible.
   - The normal path should expose structured controls first.

7. Visual design is inconsistent.
   - The current palette is teal-heavy and does not resemble modern issue-tracking tools.
   - Spacing is generous in some places and cramped in others.
   - Buttons, pills, cards, tables, and detail sections do not share enough tokenized styling.

8. Missing Jira-like product pieces.
   - Persistent sidebar with grouped navigation.
   - Project header with active workspace/project, project key, account state, and quick actions.
   - Page-specific toolbar region.
   - Issue navigator with selected-row state.
   - Work item detail tabs.
   - Board column headers with card counts.
   - Compact cards with type/status/estimate metadata.
   - Clear separation between Project, Planning, Reports, Operations, and Administration.
   - Empty states that preserve layout without creating large visual holes.
   - Consistent table density and row actions.

## Target Experience

The first screen after sign-in should feel like a project workspace, not a landing page. The user should immediately understand:

- Which workspace and project they are in.
- Where daily work lives.
- Where sprint planning lives.
- Where reports and dashboards live.
- Where agent execution and automation operations live.
- Where administration lives.

The design should be quiet, dense, and operational:

- Neutral surfaces.
- Blue only as an action/accent color.
- Green, amber, red, and purple reserved for status and semantic indicators.
- No oversized hero sections.
- No decorative backgrounds.
- No marketing composition.
- No nested card piles.

## Information Architecture

### Shell

Replace the flat horizontal nav with a Jira-like workspace shell:

- Left sidebar:
  - Brand
  - Primary project routes
  - Operations routes
  - Administration routes
  - Account route
- Top project bar:
  - Active workspace selector
  - Active project selector
  - Signed-in user pill
  - Current route title
  - Current project key/name

### Navigation Groups

Project:

- Overview
- Work
- Planning
- Dashboards
- Filters
- Programs

Operations:

- Agents
- Automation
- Imports

Administration:

- Configuration
- Workspace
- Project
- Tokens
- System

Unauthenticated:

- Overview
- Setup, only when first-run setup is available
- Sign in

### Route Positioning

- Daily work routes must remain above operations/admin routes.
- Settings should be visible only when permissions allow them.
- Agent setup is grouped with operations, while agent assignment remains reachable from the work item and Agents page.
- Planning subnavigation remains route-based, but should look like a compact segmented subnav inside the Planning area.

## Visual System

### Layout Tokens

- Sidebar width: about 260px on desktop.
- Content max width: about 1440px.
- Page padding: 24px desktop, 16px tablet/mobile.
- Main background: neutral gray.
- Surfaces: white or near-white, flat border, minimal shadow only for overlays/toasts.
- Radius: 6px to 8px.

### Color Tokens

- Text: near black neutral.
- Muted text: slate gray.
- Border: light neutral gray.
- Background: cool neutral gray.
- Primary action: Atlassian-like blue.
- Success: green.
- Warning: amber.
- Danger: red.
- Agent/accent: purple only for agent-specific labels, not the whole app theme.

### Type

- Use system UI font stack.
- Keep page titles around 1.35rem to 1.6rem.
- Keep panel and card headings around 0.95rem to 1rem.
- Do not scale type with viewport width.
- Keep letter spacing at 0.

### Components

Core primitives should support the new system:

- `Shell`: sidebar, page header, context selectors.
- `RouteLink`: sidebar-aware navigation item with active state.
- `Panel`: flat section surface, not a floating card.
- `SummaryRows`: compact metadata grid.
- `StatusPill`: tone-aware status chip.
- `ResultList`: issue-list rows with selected state.
- `BoardCardColumns`: professional board columns and cards.
- `WorkItemDetail`: tabbed detail shell.
- `JsonPreview`: structured data first, raw diagnostics gated.

## Route Redesign Plan

### Overview

Goal: Make Overview a project home instead of a tile dump.

Required changes:

- Show active workspace/project context.
- Present core routes as compact project actions.
- Separate operations actions from project actions.
- Use summary strips for user/workspace/project state.
- Avoid marketing copy.

### Work

Goal: Create a Jira-like issue navigator.

Required changes:

- Keep the project work list and selected detail layout.
- Add selected-row styling.
- Show key, title, type/status, and compact metadata in rows.
- Keep custom-field filters in an advanced block.
- Move create controls into a compact toolbar.
- Redesign work item detail as tabbed sections:
  - Activity
  - Comments
  - Links
  - Watchers
  - Work logs
  - Labels
  - Attachments
- Keep all existing create/edit/delete/upload behaviors.

### Planning Overview

Goal: Make planning feel like a sprint control center.

Required changes:

- Keep Overview, Backlog, Active Board, Admin route split.
- Show active/planned/closed iteration counts and preferred board.
- Provide direct backlog/active-board/admin actions.
- Use compact iteration cards with status and scope count.

### Planning Backlog

Goal: Make backlog grooming and sprint scoping feel intentional.

Required changes:

- Keep iteration selector.
- Show sprint summary as a dense metric strip.
- Render Backlog Candidates and Iteration Scope as two work buckets.
- Preserve plan/remove/start sprint behavior.
- Improve row metadata and action affordances.

### Active Board

Goal: Make board cards feel like a usable agile board.

Required changes:

- Board column headers show name and count.
- Cards show key, title, type/status, estimate, assignee/team when available.
- Drag affordance should be obvious without noisy decoration.
- Empty columns stay compact.
- Preserve existing drag/drop relative insertion behavior.

### Planning Admin

Goal: Keep administrative planning setup functional but reduce visual chaos.

Required changes:

- Keep admin route separate from daily planning.
- Use grouped sections for teams, iterations, boards, releases, and roadmaps.
- Keep board layout editor.
- Keep raw record previews secondary through `JsonPreview`.

### Dashboards And Filters

Goal: Support reporting without forcing JSON first.

Required changes:

- Keep dashboard builder and saved filter APIs.
- Hide JSON-heavy fields behind advanced styling where possible.
- Make rendered data and catalog tables look like product reporting, not debug output.
- Keep import completion metrics visible.

### Agents

Goal: Make agents feel like a managed execution lane, not a vendor playground.

Required changes:

- Separate provider/profile/repository setup from task assignment and run inspection.
- Keep Codex and Claude presets.
- Keep provider credential secrecy controls.
- Keep runtime preview, dispatch attempts, and CLI artifact admin.
- Use tables and status chips for providers, profiles, attempts, and CLI runs.
- Keep external execution settings visually explicit but not alarming.

### Automation And Imports

Goal: Treat these as operations workflows.

Required changes:

- Keep the existing API surface.
- Improve table density and controls through shared styles.
- Keep worker controls grouped.
- Keep import record review tables readable and export artifacts discoverable.

### Workspace And Project Settings

Goal: Make security and role management trustworthy.

Required changes:

- Keep security policy controls visible.
- Keep member/invitation management and role management as structured admin sections.
- Use status chips and compact tables.
- Preserve public preview link.

## Implementation Sequence

1. Establish design tokens and global layout.
2. Replace shell navigation with sidebar plus project context header.
3. Restyle shared primitives: panel, buttons, forms, tables, empty states, pills, route tabs, action tiles.
4. Redesign Work page issue navigator.
5. Convert WorkItemDetail to tabbed detail sections while preserving existing behavior.
6. Redesign board columns/cards and selected list rows.
7. Improve Planning overview/backlog/active-board density.
8. Apply global table/form improvements to admin, automation, imports, dashboards, search, agents, and settings.
9. Update tests for the new shell labels where necessary.
10. Run `npm test` and `npm run build`.

## Risks And Controls

### Risk: Breaking API behavior while redesigning UI

Control:

- Keep service calls and request payloads unchanged.
- Avoid changes inside generated API code.
- Keep route paths unchanged.

### Risk: Hiding required advanced controls

Control:

- Do not delete any existing form controls.
- Move advanced controls into better-styled details blocks only when behavior remains reachable.

### Risk: Permission-gated navigation regressions

Control:

- Preserve existing permission checks in `Shell` and `App`.
- Keep route gates unchanged unless a route is intentionally moved.

### Risk: Tests depending on old headings

Control:

- Update tests only for intentional shell copy changes.
- Keep route-level headings stable where tests assert them.

### Risk: Responsive layout regressions

Control:

- Sidebar collapses to a top stacked layout on tablet/mobile.
- Two-column and data-column grids collapse to one column under 1180px and 760px.
- Buttons wrap instead of overflowing.

## Definition Of Done

The overhaul is complete when:

- `FRONTEND_OVERHAUL.MD` documents the product goals, audit, target architecture, visual system, route plan, risks, and verification.
- The app has a Jira-like persistent sidebar and project context header.
- Daily work routes are visually prioritized over operations/admin routes.
- Work items use a navigator/detail layout with selected row styling.
- Work item collaboration controls are organized into tabs.
- Planning pages have denser sprint/backlog/board affordances.
- Board cards and columns look like a real agile board.
- Shared styles produce a cohesive professional UI across all routes.
- Existing route paths and service boundaries remain intact.
- Tests and production build pass.

## Implementation Checklist

- [x] Add design tokens and shell layout styles.
- [x] Refactor `Shell.jsx` to sidebar plus project header.
- [x] Improve `RouteLink`, `StatusPill`, `Panel`, `SummaryRows`, and `ResultList`.
- [x] Redesign Work page layout and selected state.
- [x] Add tabs to `WorkItemDetail`.
- [x] Redesign board columns/cards.
- [x] Tighten planning page layouts through shared planning, board, metric, and panel styles.
- [x] Update tests for shell/navigation expectations.
- [x] Run frontend tests.
- [x] Run production build.

## Implemented Pass

The first overhaul pass implements the plan without changing backend route paths or service contracts:

- Replaced the flat top tab shell with a persistent Jira-like sidebar grouped into Project, Operations, and Administration.
- Added a sticky project context header with active route, workspace selector, project selector, and account state.
- Rebuilt `app.css` around shared design tokens, flat section surfaces, dense forms/tables, responsive grids, status tones, and professional issue/board styling.
- Preserved planning subnavigation while making it read as a compact segmented control inside the planning area.
- Added selected work-item row state and richer issue-list metadata.
- Added a compact Work page command bar with loaded/selected/project metrics.
- Converted the work item collaboration area into tabbed detail sections so comments, links, watchers, work logs, labels, files, and activity are not all visible at once.
- Improved board columns with card counts and more complete card metadata.
- Kept `JsonPreview` as the structured-first diagnostics boundary.
- Updated the app shell test for the new Operations navigation group.

Verification was run with Node 22.18.0 because the default shell Node 18.19.1 cannot run Vite 8 or Vitest 4:

```bash
PATH="$HOME/.nvm/versions/node/v22.18.0/bin:$PATH" npm test
PATH="$HOME/.nvm/versions/node/v22.18.0/bin:$PATH" npm run build
```
