# 01. Statuslogik och markup för navigatorn vid tentagranskning

**Status:** ready-for-agent

**Workflow:** done

## Beskrivning

Uppdatera renderingen av `.question-jump` i `src/views/session.js` så att den skiljer på aktiv tentaskrivning och granskningsläge efter inlämning (`s.review || s.submittedAt`).

När tentan granskas ska knapparna tilldelas klasserna:
- `correct` för `s.grades[id] === true`
- `incorrect` för `s.grades[id] === false`
- `pending` för `typeof s.grades[id] !== 'boolean'` (självbedömning som väntar på kontroll)

Samt uppdatera `aria-label` för skärmläsare med statusbeskrivning (Rätt, Fel, Behöver kontrolleras).
Under aktiv skrivning behålls nuvarande beteende med enbart `.answered` och `.current`.
