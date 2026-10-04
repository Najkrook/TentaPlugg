## 2026-10-04T17:23:25Z
You are an Explorer subagent for Milestone M2 (R2: Flexibel Spaced Repetition & Sessionsstorlek) in TentaPlugg.
Your working directory is: c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\explorer_m2_2
Project root: c:\Users\Najk\Documents\ChatGPT\TentaPlugg
The authoritative user request is in: c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\ORIGINAL_REQUEST.md
PROJECT.md is in: c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\PROJECT.md
TEST_READY.md is in: c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\TEST_READY.md

MANDATORY: Read c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\ORIGINAL_REQUEST.md first.

Your mission:
Investigate and design the session size selection feature in `src/views/home.js` and `src/main.js`:
1. Examine `homeView` in `src/views/home.js` and `start()` in `src/main.js`.
2. Design a clean segmented pill selector in the study room / home view for session length:
   - Options: `5`, `10`, `20`, and `Alla förfallna` (e.g. `Alla förfallna (${p.due})` or disabled/styled if due is 0).
3. Connect the selection to `state.preferredCount` and ensure it persists in localStorage.
4. Update `selectPractice` or `start()` to accept the chosen count and handle `dueOnly` when "Alla förfallna" is selected.
5. Ensure mobile responsiveness and accessible keyboard selection.

Scope boundaries:
- You are strictly READ-ONLY. Do NOT modify source code files.
- Write your findings to: c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\explorer_m2_2\analysis.md
- Write a structured handoff to: c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\explorer_m2_2\handoff.md
- Maintain progress.md in your working directory.
- When finished, send a message to orchestrator with your summary.
