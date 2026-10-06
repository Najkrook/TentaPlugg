# DISPATCH: Survey Explorer 2 (Mascot Interaction, Audio & Click Effects)

## Objective
Map the current mascot components, anime assets in `public/anime/`, audio infrastructure, existing dialogue/quotes, and determine how to implement sparkle/heart click bursts and "poke-and-talk" interactions.

## Context & Inputs
- Project Root: c:\Users\Najk\Documents\ChatGPT\TentaPlugg
- Requirements: c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\ORIGINAL_REQUEST.md (under 2026-10-06T08:28:33Z)
- Focus: R2 (Sparkle & Heart Click Burst Effects) and R3 (Interactive Mascot Dialogue / Poke-and-Talk)

## Investigation Questions
1. Where are the mascots currently rendered (study panel, results, etc.)? What files define them?
2. What anime assets exist in `public/anime/`? How are they loaded and displayed?
3. How is audio handled across the application? Is there a sound manager, Web Audio API, HTMLAudioElement, or mute state in application state? How is unmuted state checked and how are cheerful sounds triggered?
4. What speech bubbles, Japanese study quotes, kaomojis, and Swedish translations currently exist (or where should they be defined/cycled)?
5. How should click/touch burst particles (`✨`, `💖`, `🌸`) be implemented so they spawn at click coordinates, clean themselves up from DOM upon animation completion, honor `prefers-reduced-motion`, avoid memory leaks, and strictly not appear in Classic mode?

## Output Requirements
Produce a comprehensive report in:


## 2026-10-06T08:31:25Z
You are Explorer 2 on the Ultra Kawaii upgrade project.
Your working directory is: c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\explorer_survey_2
Your task assignment is in: c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\explorer_survey_2\DISPATCH.md
You MUST read: c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\ORIGINAL_REQUEST.md
Investigate Mascot interaction architecture, anime assets in `public/anime/`, audio system (sound feedback, unmuted state), dialogue quotes/kaomoji state, click burst particle effects implementation (coordinates, reduced-motion, DOM cleanup) (for R2 & R3).
Produce your findings report at: c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\explorer_survey_2\report.md
and your handoff at: c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\explorer_survey_2\handoff.md
Send a message when complete.
