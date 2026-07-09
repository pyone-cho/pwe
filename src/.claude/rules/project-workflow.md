# Project Workflow Rules

- Use only subagents and skills defined in this project's `.claude/agents/` and `.claude/skills/` directories. Do not use generic or built-in agents when a project-specific one exists.
- If a task doesn't match any existing subagent or skill, create a new one in the appropriate directory before proceeding. Follow the existing agent/skill file format (YAML frontmatter + markdown body).
- Always read the root `CLAUDE.md` and `src/CLAUDE.md` for project conventions before delegating to a subagent.
- When scaffolding new features, use the `scaffold-feature` skill rather than manually creating files.
- When adding API endpoints, use the `scaffold-api` skill.
- When adding database models, use the `scaffold-model` skill.

## Before Implementation

- Read `docs/pwe/Feature-spec.md` to understand the feature's user stories, acceptance criteria, API endpoints, and UI screens.
- Read `docs/pwe/tech-stack.md` to confirm technology choices and versions relevant to the task.
- Read `docs/pwe/dev-deployment.md` to understand the current deployment state and infrastructure setup.

## After Every Implementation

- Update `docs/pwe/Feature-spec.md` — mark completed acceptance criteria, adjust hours/estimates, add notes on scope changes.
- Update `docs/pwe/tech-stack.md` — add any new libraries introduced, update versions, remove unused dependencies.
- Update `docs/pwe/dev-deployment.md` — record new services, environment variables, infrastructure changes, deployment steps.
- Update `docs/pwe/README.md` — write or update user-facing documentation as a user guide. Include: what the feature does, how to use it (step-by-step), any new API endpoints, screenshots or UI descriptions, and prerequisites. Write for someone who has never used the system.

## Frontend Review

- Use the `ui-ux-pro-max` agent to review all frontend components for accessibility, responsive design, and UX quality.
