# PROMPT PARA SIGUIENTE CHAT (MODIFICAR SEGÚN NECESIDAD)
- Lee y respeta `docs/AI_CONTEXT.md` en este repo y trabaja estrictamente bajo sus reglas (contiene reglas, estado UI actual, estética y naming del waveform Artlist-style). No repitas cambios ya asentados. No expongas secretos. Prioriza UX minimalista y accesible.
- Objetivo actual: rehacer la ficha pública `/track/[id]` con la estética vigente (tokens bg-background/text-foreground/bg-card/border, radios 2px salvo íconos circulares).
- Waveforms: usar SIEMPRE el “waveform Artlist-style” (WaveformScrubber/PublicAudioBar), base gris + progreso foreground, responsive a light/dark, sin bordes.
- Catálogo base (referencia de consistencia): tabla con colgroup 22/48/10/20, bordes 2px, buttons actions redondos con tooltips shadcn (delay 200ms, bg-card/text-foreground/border, arrow size-2).
- Fondos y bordes: `bg-background` general, `bg-card` para superficies, `border` para delinear; radios 2px en cards/inputs/pills; tooltips y modals alineados a estos tokens.
- Mantén accesibilidad (labels, focus visibles), copy sobrio, UX cinematográfica/minimal, dark-by-default pero bien en light.
