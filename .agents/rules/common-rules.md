# Common Agent Behaviors & Coding Standards (common-rules.md)

This document specifies the mandatory behavioral guidelines, coding standards, and operational boundaries that all AI agents MUST enforce in this workspace.

> [!IMPORTANT]
> Evaluate these instructions before executing any task. If any requirements or configurations are ambiguous, STOP immediately and ask the user for clarification.

---

## 1. Collaboration & Communication Protocols

### 🔴 DO NOT (CRITICAL CONSTRAINTS)
* **DO NOT Make Assumptions (No Arbitrary Edits)**: Vague requirements, UI positioning, or business logic must NEVER be guessed. Stop immediately and verify with the user.
* **DO NOT Write Verbose Summaries**: Do not write long, repetitive chat summaries for changes that are already documented in artifacts or code. Keep chat communication concise, simple, and direct.

### 🟢 DO (MANDATORY ACTIONS)
* **Speak Korean in Conversation**: You **MUST** respond, report progress, and explain changes to the user in **Korean** at all times.
* **Propose Structured Alternatives**: Treat the pairing process as a collaborative brainstorm. When feedback is provided, actively suggest structured alternatives or improvements.

---

## 2. Coding Principles & Style

### 🔴 DO NOT (CRITICAL CONSTRAINTS)
* **DO NOT Make Unsolicited Changes**: Never perform refactoring or modify files, configurations, or lines of code unrelated to the approved task.
* **DO NOT Use Placeholders**: Do not insert `// TODO: Implement later` or mockups. Write production-ready, robust implementations immediately.
* **DO NOT Alter Adjacent Code**: Focus edits strictly on the minimal lines required. Never perform broad replaces or modify surrounding logic out of scope.

### 🟢 DO (MANDATORY ACTIONS)
* **Surgical Edits Only**: Modify the absolute minimum code paths needed to resolve the task. Maintain matching formatting, indentation, and variable naming styles.
* **Clean Up Redundancies**: Remove imports, variables, or utility methods that *your* modifications made redundant. Do not delete pre-existing dead code.

---

## 3. Verification & Sandbox Constraints

### 🔴 DO NOT (CRITICAL CONSTRAINTS)
* **DO NOT Use Browser Popups**: Never use browser-blocking UI elements like `alert()`, `confirm()`, or `prompt()`. Rely on custom modal overlays or shared toast contexts.
* **DO NOT Run Infinite Loops**: Never run polling loops (e.g. `while true; sleep 1; done`) to monitor logs or background tasks. Utilize the native `schedule` notifier tool instead.

### 🟢 DO (MANDATORY ACTIONS)
* **Synchronous Compilation Check**: Prior to delivering changes, always execute compilation/type verification commands (e.g., `npx tsc --noEmit` or the framework's build script) synchronously to ensure zero compile errors.

---

## 4. Token-Optimized CLI (RTK - Rust Token Killer)

> [!TIP]
> RTK is a token-optimized CLI proxy that automatically delivers 60-90% token savings on development operations.

* All standard shell operations (e.g. `git`) are automatically wrapped via hooks.
* Use the following meta commands directly when auditing performance or resolving conflicts:

| Command | Purpose |
| :--- | :--- |
| `rtk gain` | Show analytical reports on accumulated token savings. |
| `rtk gain --history` | Output command execution history along with token savings statistics. |
| `rtk discover` | Run analysis on past operations to identify optimization opportunities. |
| `rtk proxy <cmd>` | Bypass the filter hook and execute a raw shell command directly. |
