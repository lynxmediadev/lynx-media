import prisma from "@/lib/prisma";
import type {
  CatalogTagOptionDTO,
  MoodTagOptionDTO,
  TrackAudioHeaderDTO,
  TrackAudioModuleDTO,
  TrackDeliverablesModuleDTO,
  TrackEditCoreDTO,
  TrackRightsModuleDTO,
  UseTagOptionDTO,
} from "./types";

export async function getTrackEditCore(id: string): Promise<TrackEditCoreDTO | null> {
  return prisma.track.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      artist: true,
      isrc: true,
      iswc: true,
      upc: true,
      licenseType: true,
      mediaBuy: true,
      bpm: true,
      key: true,
      trackType: true,
      genres: true,
      subgenres: true,
      exclusiveTerritories: true,
      exclusiveTermMonths: true,
      restrictedTerritories: true,
      restrictedIndustries: true,
      restrictedPlatforms: true,
      restrictedBrands: true,
      restrictions: true,
      pricingTier: true,
      budgetMin: true,
      budgetMax: true,
      budgetCurrency: true,
      mfn: true,
      oneStop: true,
      clearedForSync: true,
      contentIdEnrolled: true,
      contentIdAdmin: true,
      contentIdWhitelist: true,
      tags: {
        select: {
          tag: { select: { id: true, slug: true, name: true, type: true } },
          assignedAt: true,
        },
        orderBy: { assignedAt: "asc" },
      },
    },
  });
}

export async function getTrackAudioModule(id: string): Promise<TrackAudioModuleDTO | null> {
  return prisma.track.findUnique({
    where: { id },
    select: {
      id: true,
      audioUrl: true,
      coverUrl: true,
      assetKey: true,
      assetMime: true,
      assetSize: true,
      durationSec: true,
      sampleRateHz: true,
      channels: true,
      bitrateKbps: true,
      loudnessLufs: true,
      loudnessRangeLu: true,
      lraLowLufs: true,
      lraHighLufs: true,
      truePeakDbfs: true,
      waveform: true,
      analysisAt: true,
    },
  });
}

export async function getTrackAudioHeaderModule(id: string): Promise<TrackAudioHeaderDTO | null> {
  return prisma.track.findUnique({
    where: { id },
    select: {
      id: true,
      audioUrl: true,
      coverUrl: true,
      assetKey: true,
    },
  });
}

export async function getTrackRightsModule(id: string): Promise<TrackRightsModuleDTO | null> {
  return prisma.track.findUnique({
    where: { id },
    select: {
      id: true,
      master: true,
      publishingShares: {
        select: {
          id: true,
          role: true,
          name: true,
          ipiNumber: true,
          pro: true,
          caeNumber: true,
          sharePct: true,
          sortOrder: true,
        },
        orderBy: { sortOrder: "asc" },
      },
      masterShares: {
        select: {
          id: true,
          name: true,
          sharePct: true,
          contact: true,
          notes: true,
          sortOrder: true,
        },
        orderBy: { sortOrder: "asc" },
      },
    },
  });
}

export async function getTrackDeliverablesModule(id: string): Promise<TrackDeliverablesModuleDTO | null> {
  return prisma.track.findUnique({
    where: { id },
    select: {
      id: true,
      versions: {
        select: {
          label: true,
          durationSec: true,
          kind: true,
          sortOrder: true,
        },
        orderBy: { sortOrder: "asc" },
      },
      stems: {
        select: {
          name: true,
          group: true,
          durationSec: true,
          sortOrder: true,
        },
        orderBy: { sortOrder: "asc" },
      },
    },
  });
}

export async function getCatalogTagOptions(): Promise<CatalogTagOptionDTO[]> {
  return prisma.tag.findMany({
    where: { type: "CATALOG" },
    select: { id: true, slug: true, name: true },
    orderBy: { name: "asc" },
  });
}

export async function getMoodTagOptions(): Promise<MoodTagOptionDTO[]> {
  return prisma.tag.findMany({
    where: { type: "MOOD" },
    select: { id: true, slug: true, name: true },
    orderBy: { name: "asc" },
  });
}

export async function getUseTagOptions(): Promise<UseTagOptionDTO[]> {
  return prisma.tag.findMany({
    where: { type: "USE" },
    select: { id: true, slug: true, name: true },
    orderBy: { name: "asc" },
  });
}
