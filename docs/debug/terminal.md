## Error Type
Console Error

## Error Message
A tree hydrated but some attributes of the server rendered HTML didn't match the client properties. This won't be patched up. This can happen if a SSR-ed Client Component used:

- A server/client branch `if (typeof window !== 'undefined')`.
- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
- Date formatting in a user's locale which doesn't match the server.
- External changing data without sending a snapshot of it along with the HTML.
- Invalid HTML tag nesting.

It can also happen if the client has a browser extension installed which messes with the HTML before React loaded.

https://react.dev/link/hydration-mismatch

  ...
    <RightsFormClient trackId="cmkx1ed3f0..." track={{mfn:false, ...}} fieldErrors={{}}>
      <div className="space-y-4">
        <div>
        <div className="space-y-4">
          <div>
          <div className="space-y-3 ...">
            <h3>
            <p>
            <div>
            <p>
            <DndContext sensors={[...]} collisionDetection={function closestCenter} ...>
              <div className="overflow-x...">
                <SortableContext items={[...]} strategy={function verticalListSortingStrategy}>
                  <table className="min-w-full...">
                    <thead>
                    <tbody>
                      <SortableRow id="cml2gmr2i0...">
                        <tr
                          ref={function}
                          style={{transform:undefined,transition:undefined}}
                          role="button"
                          tabIndex={0}
                          aria-disabled={false}
                          aria-pressed={undefined}
                          aria-roledescription="sortable"
+                         aria-describedby="DndDescribedBy-2"
-                         aria-describedby="DndDescribedBy-1"
                          onPointerDown={function}
                          className="border-t border-border/60"
                        >
              ...
              ...
            ...
          ...
        ...



    at tr (<anonymous>:null:null)
    at SortableRow (src/components/admin/track/RightsFormClient.tsx:98:5)
    at eval (src/components/admin/track/RightsFormClient.tsx:735:27)
    at Array.map (<anonymous>:null:null)
    at RightsFormClient (src/components/admin/track/RightsFormClient.tsx:732:36)
    at TrackEditForm (src/components/admin/track/TrackEditForm.tsx:197:11)
    at AdminTrackEditPage (src/app/admin/track/[id]/edit/page.tsx:518:9)

## Code Frame
   96 |   };
   97 |   return (
>  98 |     <tr
      |     ^
   99 |       ref={setNodeRef}
  100 |       style={style}
  101 |       {...attributes}

Next.js version: 15.5.9 (Webpack)
