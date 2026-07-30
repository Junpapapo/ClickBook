# CLAUDE.md - Technical & Build Guidelines

This document specifies the core compile/build commands, technical constraints, and modular standards for this project.

> [!IMPORTANT]
> All technical operations MUST comply with this document and the global [[common-rules.md](file:///c:/00_Workspace/00_Tools/00_프로젝트초기설정/.agents/rules/common-rules.md)] guidelines.

---

## 1. Technical Build & Command Reference

| Action | Command | Purpose |
| :--- | :--- | :--- |
| Install Dependencies | `npm install` / `rtk install` | Set up workspace libraries |
| Type/Compile Verification | `npx tsc --noEmit` | Strict pre-push compilation check |
| Start Dev Server | `npm run dev` | Run local development environment |
| Build Production | `npm run build` | Compile final bundle for distribution |

---

## 2. Project Architecture & Decoupling Limits

* **Module Architecture Enforcement**:
  * Proactively break down complex components and views into separate feature modules.
  * Files MUST NOT exceed **400 lines of code**. For detailed code scaffolding, refer to [[proactive-code-architect](file:///c:/00_Workspace/00_Tools/00_프로젝트초기설정/.gemini/skills/proactive-code-architect/SKILL.md)].
* **Surgical Edits Only**:
  * Only touch lines within the target scope. Do not clean up unrelated legacy files.
  * Clean up any unused imports or variables introduced *by your changes* before committing.
* **Mandatory AI Agent Synchronous Verification Rule**:
  * During pair programming with AI (Antigravity), immediately after implementing any feature or modifying source files, **always execute `npx tsc --noEmit` as a mandatory synchronous verification step**.
  * **Purpose & Effect**: Detects and resolves type errors immediately per task unit, preventing type errors from accumulating in the codebase.

---

## 3. Core Behavioral Guidelines (Karpathy Guidelines)

### 1) Think Before Coding
- State assumptions explicitly. Surface tradeoffs and present simple alternatives before implementing.

### 2) Simplicity First
- Minimum code that solves the problem. No speculative abstractions, unused features, or unnecessary flexibility.

### 3) Surgical Changes
- Touch only what you must. Match existing style and clean up only your own orphans.

### 4) Goal-Driven Execution
- Transform tasks into verifiable goals and define clear success criteria.

---

## 4. Skill Guides

This project uses a set of "skill" guides — focused how-to documents for common implementation tasks. When your task matches one of the descriptions below, **read the linked SKILL.md file before proceeding** and follow its instructions precisely.

| Skill | File | Description |
| :--- | :--- | :--- |
| proactive-code-architect | [[proactive-code-architect](file:///c:/00_Workspace/00_Tools/00_프로젝트초기설정/.gemini/skills/proactive-code-architect/SKILL.md)] | Enforces modular architecture. **NEVER use monolithic coding.** Refer to the skill guide before writing code to prevent file size exceeding 400 lines. |
