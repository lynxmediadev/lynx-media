## 2026-02-12 - Smoke rendimiento autenticado (admin)

Track QA: `cmkx1ed3f000duq9glemziy2b`

Resumen (warm avg):

- GET `/admin/tracks`: `0.457s`
- GET `/admin/tracks/[id]/edit`: `0.414s`
- GET `/admin/tracks/[id]/edit/creative`: `0.353s`
- GET `/admin/tracks/[id]/edit/rights`: `0.384s`
- GET `/admin/tracks/[id]/edit/metadata`: `0.164s`
- GET `/admin/tracks/[id]/edit/deliverables`: `0.275s`
- GET `/admin/tracks/[id]/edit/review`: `0.471s`
- GET `/admin/tracks/[id]/edit/full`: `0.764s`

Tags/catalogo (warm avg):

- POST `/api/tracks/[id]/moods`: `0.495s`
- POST `/api/tracks/[id]/uses`: `0.492s`
- POST `/api/tracks/[id]/categories`: `0.561s`
- GET `/api/tracks/[id]/moods|uses|categories`: `~0.155s`
- GET `/catalog?mood=aggressive&use=documentary&cat=cinematic`: `0.344s`
- POST `/api/catalog/list` (sin waveform): `0.227s`

## 2026-02-12 - Benchmark synthetic dataset grande (I/O DB)

Dataset synthetic (autolimpiado al final):

- Tracks: `500`
- Tags: `900` (`300` MOOD, `300` USE, `300` CATALOG)
- TrackTag links: `4000`
- Prefijo: `__bench1770925662658__`
- Cleanup verificado: `leftTracks=0`, `leftTags=0`, `leftLinks=0`

Resultados (60 iteraciones por query, en ms):

- Q1 track moods assigned list: `avg=124.989`, `p50=124.876`, `p95=125.703`, `p99=126.159`, `max=126.159`
- Q2 track uses assigned list: `avg=126.188`, `p50=125.053`, `p95=125.951`, `p99=187.227`, `max=187.227`
- Q3 track categories assigned list: `avg=125.162`, `p50=125.280`, `p95=126.064`, `p99=128.334`, `max=128.334`
- Q4 catalog filter mood+use+cat: `avg=64.007`, `p50=62.884`, `p95=63.636`, `p99=124.026`, `max=124.026`
- Q5 tag list by type + order: `avg=62.511`, `p50=62.500`, `p95=62.949`, `p99=63.686`, `max=63.686`
- Q6 tag search contains: `avg=62.978`, `p50=63.006`, `p95=63.206`, `p99=63.925`, `max=63.925`
- Q7 replace mood links (deleteMany+createMany): `avg=253.611`, `p50=250.959`, `p95=259.006`, `p99=312.215`, `max=312.215`

## 2026-02-12 - Post cambio a guardado incremental de tags (smoke rápido)

Warm (runs 2-3):

- POST `/api/tracks/[id]/moods`: `0.504s`, `0.446s`
- POST `/api/tracks/[id]/uses`: `0.434s`, `0.419s`
- POST `/api/tracks/[id]/categories`: `0.510s`, `0.474s`

1/1

Next.js 15.5.9 (outdated)
Webpack
Console Error


DialogContent requires a DialogTitle for the component to be accessible for screen reader users.

If you want to hide the DialogTitle, you can wrap it with our VisuallyHidden component.

For more information, see https://radix-ui.com/primitives/docs/components/dialog

src/components/ui/sheet.tsx (58:7) @ SheetContent


  56 |     <SheetPortal>
  57 |       <SheetOverlay />
> 58 |       <SheetPrimitive.Content
     |       ^
  59 |         data-slot="sheet-content"
  60 |         className={cn(
  61 |           "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out fixed z-50 flex flex-col gap-4 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
Call Stack
75

Show 69 ignore-listed frame(s)
SheetContent
src/components/ui/sheet.tsx (58:7)
SheetPortal
src/components/ui/sheet.tsx (28:10)
SheetContent
src/components/ui/sheet.tsx (56:5)
DashboardShell
src/components/dashboard/DashboardShell.tsx (149:9)
AdminDashboardLayoutClient
src/components/admin/AdminDashboardLayoutClient.tsx (12:5)
AdminLayout
src/app/admin/layout.tsx (14:10)
