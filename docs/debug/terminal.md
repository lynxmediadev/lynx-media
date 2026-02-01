## Error Type
Runtime ReferenceError

## Error Message
handleMasterBlur is not defined


    at onBlur (src/components/admin/track/RightsFormClient.tsx:898:48)
    at input (<anonymous>:null:null)
    at Input (src/components/ui/input.tsx:7:5)
    at eval (src/components/admin/track/RightsFormClient.tsx:892:31)
    at Array.map (<anonymous>:null:null)
    at RightsFormClient (src/components/admin/track/RightsFormClient.tsx:872:36)
    at TrackEditForm (src/components/admin/track/TrackEditForm.tsx:197:11)
    at AdminTrackEditPage (src/app/admin/track/[id]/edit/page.tsx:518:9)

## Code Frame
  896 |                                 value={ms.sharePct ?? ""}
  897 |                                 onChange={(e) => handleMasterChange(idx, "sharePct", e.target.value)}
> 898 |                                 onBlur={(e) => handleMasterBlur(idx, "sharePct", e.target.value)}
      |                                                ^
  899 |                                 className="h-8 text-xs text-right"
  900 |                               />
  901 |                             </td>

Next.js version: 15.5.9 (Webpack)
