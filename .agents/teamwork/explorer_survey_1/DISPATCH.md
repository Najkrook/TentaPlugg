# DISPATCH: Survey Explorer 1 (UI & Theme Architecture)

## Objective
Map the existing UI, theme system (`state.theme`, `data-theme`, CSS variables/stylesheets), sidebar component structure, and current button/interactive styling.

## Context & Inputs
- Project Root: c:\Users\Najk\Documents\ChatGPT\TentaPlugg
- Requirements: c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\ORIGINAL_REQUEST.md (under 2026-10-06T08:28:33Z)
- Focus: R1 (Sidebar Peeking Mascot) and R4 (Jelly Bouncy Micro-interactions & Kaomoji)

## Investigation Questions
1. How is the sidebar currently structured in code? Where does the sidebar live (file path, component name, DOM structure)?
2. How does the theme system work? How are `state.theme === 'sakura'` and `data-theme='classic'` set, stored, and applied to DOM elements?
3. What are the project's exact "hard-hiding rules" for Classic mode? (e.g. CSS rules, DOM conditional rendering, media queries, selectors)?
4. Where are button styles and interactive elements defined? What CSS/Tailwind/custom styles are used? How should jelly/bouncy animations and kaomoji micro-copy be integrated cleanly?
5. Identify any potential conflicts or edge cases with responsive layout (mobile vs desktop sidebar).

## Output Requirements
Produce a comprehensive report in:
`c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\explorer_survey_1\report.md`
and write your `handoff.md` summarizing findings.


## 2026-10-06T08:31:25Z
You are Explorer 1 on the Ultra Kawaii upgrade project.
Your working directory is: c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\explorer_survey_1
Your task assignment is in: c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\explorer_survey_1\DISPATCH.md
You MUST read: c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\ORIGINAL_REQUEST.md
Investigate UI architecture, Theme system (`state.theme`, `data-theme`), CSS classes, hard-hiding rules for Classic mode, and Sidebar component structure (for R1: Sidebar peeking mascot & R4: Jelly bouncy micro-interactions & Kaomoji).
Produce your findings report at: c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\explorer_survey_1\report.md
and your handoff at: c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\explorer_survey_1\handoff.md
Send a message when complete.
