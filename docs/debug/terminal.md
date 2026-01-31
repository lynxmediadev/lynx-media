ddfer@DESKTOP-8TCFJ8A:~/projects/lynx-media$ rm -rf .next
ddfer@DESKTOP-8TCFJ8A:~/projects/lynx-media$ npm run dev

> lynx-media@0.1.0 dev
> next dev

   ▲ Next.js 15.5.9
   - Local:        http://localhost:3000
   - Network:      http://172.29.69.123:3000
   - Environments: .env.local, .env

 ✓ Starting...
 ✓ Ready in 1779ms
 ⚠ Fast Refresh had to perform a full reload due to a runtime error.
 ✓ Compiled /middleware in 459ms (114 modules)
 ○ Compiling /admin/track/[id]/edit ...
 ⨯ ./src/components/admin/track/RightsFormClient.tsx:24:1
Module not found: Can't resolve '@dnd-kit/modifiers'
  22 | import { updateMasterShares } from "@/app/admin/track/actions/update-master-shares";
  23 | import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
> 24 | import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
     | ^
  25 | import {
  26 |   SortableContext,
  27 |   arrayMove,

https://nextjs.org/docs/messages/module-not-found

Import trace for requested module:
./src/components/admin/track/TrackEditForm.tsx
 ⨯ ./src/components/admin/track/RightsFormClient.tsx:24:1
Module not found: Can't resolve '@dnd-kit/modifiers'
  22 | import { updateMasterShares } from "@/app/admin/track/actions/update-master-shares";
  23 | import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
> 24 | import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
     | ^
  25 | import {
  26 |   SortableContext,
  27 |   arrayMove,

https://nextjs.org/docs/messages/module-not-found

Import trace for requested module:
./src/components/admin/track/TrackEditForm.tsx