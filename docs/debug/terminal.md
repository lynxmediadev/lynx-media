 ○ Compiling /track/[id] ...
 ✓ Compiled /track/[id] in 696ms (1194 modules)
prisma:error 
Invalid `prisma.track.findUnique()` invocation:

{
  where: {
    id: "cmkx1ed3f000duq9glemziy2b"
  },
  select: {
    id: true,
    title: true,
    artist: true,
    coverUrl: true,
    durationSec: true,
    bpm: true,
    key: true,
    trackType: true,
    genres: true,
    subgenres: true,
    assetKey: true,
    audioUrl: true,
    waveform: true,
    moods: true,
    ~~~~~
    uses: true,
    restrictions: true,
    master: true,
    isrc: true,
    iswc: true,
    licenseType: true,
    oneStop: true,
    clearedForSync: true,
    exclusiveTerritories: true,
    exclusiveTermMonths: true,
    restrictedTerritories: true,
    restrictedIndustries: true,
    restrictedPlatforms: true,
    restrictedBrands: true,
    mediaBuy: true,
    pricingTier: true,
    budgetMin: true,
    budgetMax: true,
    budgetCurrency: true,
    publishingSplit: true,
    publishingShares: {
      select: {
        role: true,
        name: true,
        sharePct: true,
        ipiNumber: true,
        pro: true,
        caeNumber: true
      }
    },
    versions: {
      select: {
        label: true,
        durationSec: true,
        kind: true,
        sortOrder: true
      },
      orderBy: {
        sortOrder: "asc"
      }
    },
    stems: {
      select: {
        name: true,
        group: true,
        sortOrder: true
      },
      orderBy: {
        sortOrder: "asc"
      }
    },
    updatedAt: true,
    tags: {
      select: {
        tag: {
          select: {
            slug: true,
            type: true,
            name: true
          }
        }
      }
    },
?   createdAt?: true,
?   upc?: true,
?   mfn?: true,
?   contentIdEnrolled?: true,
?   contentIdAdmin?: true,
?   contentIdWhitelist?: true,
?   assetMime?: true,
?   assetSize?: true,
?   loudnessLufs?: true,
?   loudnessRangeLu?: true,
?   lraLowLufs?: true,
?   lraHighLufs?: true,
?   truePeakDbfs?: true,
?   sampleRateHz?: true,
?   channels?: true,
?   bitrateKbps?: true,
?   analysisAt?: true,
?   masterShares?: true,
?   moodLinks?: true,
?   _count?: true
  }
}

Unknown field `moods` for select statement on model `Track`. Available options are marked with ?.
 ⨯ Error [PrismaClientValidationError]: 
Invalid `prisma.track.findUnique()` invocation:

{
  where: {
    id: "cmkx1ed3f000duq9glemziy2b"
  },
  select: {
    id: true,
    title: true,
    artist: true,
    coverUrl: true,
    durationSec: true,
    bpm: true,
    key: true,
    trackType: true,
    genres: true,
    subgenres: true,
    assetKey: true,
    audioUrl: true,
    waveform: true,
    moods: true,
    ~~~~~
    uses: true,
    restrictions: true,
    master: true,
    isrc: true,
    iswc: true,
    licenseType: true,
    oneStop: true,
    clearedForSync: true,
    exclusiveTerritories: true,
    exclusiveTermMonths: true,
    restrictedTerritories: true,
    restrictedIndustries: true,
    restrictedPlatforms: true,
    restrictedBrands: true,
    mediaBuy: true,
    pricingTier: true,
    budgetMin: true,
    budgetMax: true,
    budgetCurrency: true,
    publishingSplit: true,
    publishingShares: {
      select: {
        role: true,
        name: true,
        sharePct: true,
        ipiNumber: true,
        pro: true,
        caeNumber: true
      }
    },
    versions: {
      select: {
        label: true,
        durationSec: true,
        kind: true,
        sortOrder: true
      },
      orderBy: {
        sortOrder: "asc"
      }
    },
    stems: {
      select: {
        name: true,
        group: true,
        sortOrder: true
      },
      orderBy: {
        sortOrder: "asc"
      }
    },
    updatedAt: true,
    tags: {
      select: {
        tag: {
          select: {
            slug: true,
            type: true,
            name: true
          }
        }
      }
    },
?   createdAt?: true,
?   upc?: true,
?   mfn?: true,
?   contentIdEnrolled?: true,
?   contentIdAdmin?: true,
?   contentIdWhitelist?: true,
?   assetMime?: true,
?   assetSize?: true,
?   loudnessLufs?: true,
?   loudnessRangeLu?: true,
?   lraLowLufs?: true,
?   lraHighLufs?: true,
?   truePeakDbfs?: true,
?   sampleRateHz?: true,
?   channels?: true,
?   bitrateKbps?: true,
?   analysisAt?: true,
?   masterShares?: true,
?   moodLinks?: true,
?   _count?: true
  }
}

Unknown field `moods` for select statement on model `Track`. Available options are marked with ?.
    at async TrackPublicPage (src/app/track/[id]/page.tsx:343:17)
  341 |
  342 |   // 1) Datos del track (pública + ficha técnica)
> 343 |   const track = await db.track.findUnique({
      |                 ^
  344 |     where: { id },
  345 |     select: {
  346 |       id: true, {
  clientVersion: '6.19.2',
  digest: '1992053009'
}
 GET /track/cmkx1ed3f000duq9glemziy2b 500 in 1613ms
