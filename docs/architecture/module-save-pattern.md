# Module Save Pattern (Core/Heavy/Save)

## Objetivo
Estandarizar como se disena un formulario modular en admin para:
- carga inicial liviana,
- guardado por modulo sin refresh global,
- escalabilidad a nuevas pantallas.

## Convenciones de nombres

- `get<Entity>EditCore(id)`:
  - solo campos minimos para primera pintura.
- `get<Entity><Modulo>Module(id)`:
  - datos de modulo especifico (especialmente heavy).
- `get<Entity><Modulo>Options()`:
  - catalogos de soporte (tags, listas auxiliares).

- Tipos DTO:
  - `<Entity>EditCoreDTO`
  - `<Entity><Modulo>ModuleDTO`
  - `<Entity><Modulo>OptionDTO`

## Contrato de guardado por modulo

Respuesta estandar:

```ts
type SaveResult<TItem = unknown> = {
  ok: boolean;
  message?: string;
  items?: TItem[];
  fieldErrors?: Record<string, string[]>;
};
```

Reglas:
- El backend debe devolver `items` normalizados para hidratar estado local.
- El frontend no debe depender de `router.refresh()` para reflejar el guardado local.
- Solo usar invalidacion global cuando haya navegacion cruzada que realmente lo requiera.

## Patron frontend recomendado

- `TagChips` (UI base)
- `useTagCatalog` (hook de datos y persistencia)
- Wrapper por dominio:
  - `MoodChips`
  - `UseChips`
  - `CategoryChips`

Cada wrapper define:
- `normalizeLabel`
- `normalizeSlug`
- `buildCreateBody`
- `buildSaveBody`
- labels/textos del modulo

## Separacion Core vs Heavy

- `CORE`:
  - identidad, campos de alta frecuencia, chips asignados.
- `HEAVY`:
  - waveform, listas extensas, bloques poco usados al abrir.

Render:
- shell server liviano con `Suspense`.
- modulos heavy con carga diferida y skeleton.

## Checklist de adopcion (nueva pantalla)

- [ ] Definir `CoreDTO` y `ModuleDTO`.
- [ ] Implementar queries por modulo con `select` minimo.
- [ ] Crear UI shell con `Suspense`.
- [ ] Implementar guardado por modulo con contrato `SaveResult`.
- [ ] Evitar `router.refresh()` en guardado local.
- [ ] Agregar skeleton por modulo heavy.
- [ ] Documentar baseline before/after en `docs/debug/terminal.md`.
- [ ] Ejecutar smoke funcional y de persistencia.
