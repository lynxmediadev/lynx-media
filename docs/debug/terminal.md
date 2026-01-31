## Error Type
Runtime ReferenceError

## Error Message
savingWriter is not defined


    at eval (src/components/admin/track/RightsFormClient.tsx:743:70)
    at Array.map (<anonymous>:null:null)
    at RightsFormClient (src/components/admin/track/RightsFormClient.tsx:537:53)
    at TrackEditForm (src/components/admin/track/TrackEditForm.tsx:197:11)
    at AdminTrackEditPage (src/app/admin/track/[id]/edit/page.tsx:518:9)

## Code Frame
  741 |                               type="button"
  742 |                               onClick={() => handleAddShare(role)}
> 743 |                               disabled={pendingShares || (isWriter ? savingWriter : savingPublisher)}
      |                                                                      ^
  744 |                               className="inline-flex h-8 items-center justify-center rounded border border-border bg-card px-3 text-xs font-semibold text-foreground hover:border-foreground/70"
  745 |                             >
  746 |                               {isWriter

Next.js version: 15.5.9 (Webpack)





