# Ärende 01: Tillgängliggör PDF och sidbilder

Status: ready-for-agent
Workflow: done

## Beskrivning
Kopiera den rena mock-tentan från användarens uppladdade fil till `Material/goto-mock.pdf` och `public/material/goto-mock.pdf`.
Generera skarpa JPEG-bilder för varje sida: `public/material/goto-mock-1.jpg` till `public/material/goto-mock-6.jpg`.

## Acceptanskriterier
- `Material/goto-mock.pdf` existerar och motsvarar den 6-sidiga mocktentan.
- `public/material/goto-mock.pdf` är identisk och serveras som statisk tillgång.
- `public/material/goto-mock-1.jpg` t.o.m. `public/material/goto-mock-6.jpg` finns och kan renderas som bakgrund till frågorna.
