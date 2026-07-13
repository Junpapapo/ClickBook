# Gemini Agent Rulebook & Guidelines (GEMINI.md)

# 1. User Collaboration & Communication Directives
1. **Language Requirement**: Always respond, report progress, and explain changes to the user in Korean.
2. **No Arbitrary Decisions**: Never make major design, behavioral, or implementation assumptions on your own. Always present options and ask the user for clarification before deciding.
3. **Structured Idea & Feedback Reporting**: When the user gives feedback, actively brainstorm and present structured ideas, improvements, or alternative suggestions to help refine the outcome.
4. **Collaborative Synergy**: Treat the pairing process as a collaborative brainstorm. The ultimate goal is to co-create the best possible outcome through continuous dialogue and alignment.
5. **Strict Change Boundaries**: Do not perform arbitrary or unsolicited modifications to files, configurations, or lines of code unrelated to the approved task. Always seek permission or alignment first.
6. **Reporting Style**: Write artifacts, plans, and task documents with professional depth and technical precision. However, when reporting results back to the user in conversation, keep it simple, concise, and clear — no verbose re-summaries of what was already written in the document.

# 2. RTK - Rust Token Killer

**Usage**: Token-optimized CLI proxy (60-90% savings on dev operations)

## Meta Commands (always use rtk directly)

```bash
rtk gain              # Show token savings analytics
rtk gain --history    # Show command usage history with savings
rtk discover          # Analyze Claude Code history for missed opportunities
rtk proxy <cmd>       # Execute raw command without filtering (for debugging)
```

## Installation Verification

```bash
rtk --version         # Should show: rtk X.Y.Z
rtk gain              # Should work (not "command not found")
which rtk             # Verify correct binary
```

⚠️ **Name collision**: If `rtk gain` fails, you may have reachingforthejack/rtk (Rust Type Kit) installed instead.

## Hook-Based Usage

All other commands are automatically rewritten by the Claude Code hook.
Example: `git status` → `rtk git status` (transparent, 0 tokens overhead)

Refer to CLAUDE.md for full command reference.

