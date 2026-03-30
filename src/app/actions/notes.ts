"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function getUserId() {
  const session = await auth();
  if (!session?.spotifyId) throw new Error("Not authenticated");
  return session.spotifyId;
}

export async function getNotes(trackIds: string[]) {
  if (trackIds.length === 0) return [];
  const userId = await getUserId();
  return prisma.note.findMany({
    where: {
      spotifyUserId: userId,
      spotifyTrackId: { in: trackIds },
    },
    select: {
      spotifyTrackId: true,
      body: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function upsertNote(trackId: string, body: string) {
  const userId = await getUserId();
  return prisma.note.upsert({
    where: {
      spotifyUserId_spotifyTrackId: {
        spotifyUserId: userId,
        spotifyTrackId: trackId,
      },
    },
    update: { body },
    create: {
      spotifyUserId: userId,
      spotifyTrackId: trackId,
      body,
    },
  });
}

export async function deleteNote(trackId: string) {
  const userId = await getUserId();
  await prisma.note.delete({
    where: {
      spotifyUserId_spotifyTrackId: {
        spotifyUserId: userId,
        spotifyTrackId: trackId,
      },
    },
  });
}

export async function countNotes() {
  const userId = await getUserId();
  return prisma.note.count({
    where: { spotifyUserId: userId },
  });
}
