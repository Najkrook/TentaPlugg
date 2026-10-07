# Issue tracker: Local Markdown

Specifikationer och ärenden för projektet sparas som lokala Markdown-filer under `.scratch/`. Detta val godkändes av användaren 2026-10-07. Publicering till denna tracker kräver inga externa tjänster.

## Conventions

- En funktion eller sammanhängande åtgärd per katalog: `.scratch/<feature-slug>/`.
- Specifikationen sparas i `.scratch/<feature-slug>/spec.md`.
- Implementationstickets sparas en per fil i `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, från `01` i beroendeordning. Skapa aldrig en enda kombinerad ärendefil.
- Ange `Status:` nära början av varje specifikation och ärende. Triage-vokabulären finns i `triage-labels.md`.
- Ange verkliga blockerande ärenden under `Blocked by:` med deras nummer och titel. Ett ärende får påbörjas när alla dess blockerare är färdiga; `ready-for-agent` innebär att beskrivningen är genomförbar, inte att blockerare kan ignoreras.
- Skilj genomförandestatus från triage: `Workflow: open`, `in-progress` eller `done` kan användas separat. Markera inte ett föräldraärende som färdigt när underärenden endast har skapats.
- Utkast som väntar på ett uttryckligt godkännande ligger i `.scratch/<feature-slug>/drafts/`, med `Status: draft`, och är inte publicerade implementationstickets.
- Lägg eventuella kommentarer sist under `## Comments`.

## When a skill says "publish to the issue tracker"

Skriv den godkända specifikationen eller ärendefilen på dess slutliga plats ovan. Publicera med `ready-for-agent` när den anropade skillen kräver det. Genomför ingen implementation eller extern publicering enbart för att ett ärende skapas.

## When a skill says "fetch the relevant ticket"

Läs hela filen, inklusive kommentarer, via angiven sökväg eller dess nummer inom rätt funktionskatalog.

## Wayfinding operations

Om en skill använder en beslutsöversikt sparas den som `.scratch/<effort>/map.md`, med en underordnad fil per undersökning i `issues/`. Ange `Type: research`, `prototype`, `grilling` eller `task` samt separat `Workflow: claimed` eller `resolved` för denna undersökning. Ett blockerat undersökningsärende blir tillgängligt när samtliga blockerare är `resolved`. Lägg resultat under `## Answer` och uppdatera översikten med beslut och en länk.
