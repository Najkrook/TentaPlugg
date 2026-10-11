# Specifikation: Färgkodad navigationsöversikt vid tentagenomgång

**Status:** ready-for-agent

**Workflow:** done

**Datum:** 2026-10-11

## 1. Bakgrund och syfte

Vid genomgång av en inlämnad tenta (granskningsläge / review) visar applikationen en numrerad navigeringsrad längst ner (`.question-jump`) med knappar för alla tentans frågor (t.ex. 1–55). Tidigare visades alla besvarade frågor med grön färg (`.answered`), oavsett om svaret var rätt, fel eller väntade på självbedömning. Detta gjorde det svårt för användaren att snabbt få en visuell helhetsöversikt över sitt resultat och identifiera vilka frågor som kräver uppmärksamhet.

Syftet med denna åtgärd är att i granskningsläge efter inlämning (`s.review` eller inlämnad tenta):
1. **Rödmarkera** frågor där användaren svarat fel (`s.grades[id] === false`).
2. **Gulmarkera** frågor som kräver självbedömning/kontroll av eget svar (`typeof s.grades[id] !== 'boolean'`).
3. **Grönmarkera** frågor som besvarats korrekt (`s.grades[id] === true`).
4. Bevara befintligt neutralt utseende (grått/grönt beroende på svarad) under aktiv tentaskrivning före inlämning så att facit inte avslöjas i förtid.

## 2. Krav och arkitektur

1. **Aktiv tentaskrivning (`!s.review && !s.submittedAt`):**
   - Knappar behåller status quo: `.current` för aktiv fråga, `.answered` om svar finns ifyllt.

2. **Granskningsläge efter inlämning (`s.review || s.submittedAt`):**
   - Varje knapp tilldelas statusklass och beskrivande `aria-label`:
     - Rätt svar: klass `correct` (grön), `aria-label="Fråga N (Rätt)"`.
     - Fel svar: klass `incorrect` (röd), `aria-label="Fråga N (Fel)"`.
     - Kräver kontroll: klass `pending` (gul), `aria-label="Fråga N (Behöver kontrolleras)"`.
   - Den aktiva frågan behåller `.current` (tydlig ram) ovanpå respektive bakgrundsfärg.
   - När en användare bedömer ett fritextsvar (t.ex. klickar "Jag kunde detta" eller "Behöver öva mer") uppdateras knappens färg omedelbart från gul till grön respektive röd.

3. **Stil och tillgänglighet (CSS):**
   - Både Classic- och Sakura-tema stödjs med godkänd kontrast enligt WCAG AA (>= 4.5:1).
   - Tydliga färger:
     - Grön (rätt): mjuk grön bakgrund med mörkgrön text.
     - Röd (fel): mjuk röd/korall bakgrund med mörkröd text.
     - Gul (självbedömning): mjuk bärnstensgul bakgrund med mörkbrun/bärnsten text.
