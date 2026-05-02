import { db } from './index';
import { users, entries, checklistItems, checklistCompletions } from './schema';
import { eq, and, desc, gte, lte } from 'drizzle-orm';
import type { NewUser, NewEntry } from './schema';

export async function getUserByEmail(email: string) {
  return db.query.users.findFirst({ where: eq(users.email, email) });
}

export async function getUserByGoogleId(googleId: string) {
  return db.query.users.findFirst({ where: eq(users.googleId, googleId) });
}

export async function createUser(data: NewUser) {
  const [user] = await db.insert(users).values(data).returning();
  return user;
}

export async function getEntryByDate(userId: string, date: string) {
  return db.query.entries.findFirst({
    where: and(eq(entries.userId, userId), eq(entries.date, date)),
  });
}

export async function upsertEntry(data: NewEntry) {
  const [entry] = await db
    .insert(entries)
    .values(data)
    .onConflictDoUpdate({
      target: [entries.userId, entries.date],
      set: {
        items:      data.items,
        promptText: data.promptText,
        promptType: data.promptType,
        updatedAt:  new Date(),
      },
    })
    .returning();
  return entry;
}

export async function getEntriesInRange(userId: string, from: string, to: string) {
  return db.query.entries.findMany({
    where: and(
      eq(entries.userId, userId),
      gte(entries.date, from),
      lte(entries.date, to),
    ),
    orderBy: [desc(entries.date)],
  });
}

export async function getAllEntries(userId: string) {
  return db.query.entries.findMany({
    where: eq(entries.userId, userId),
    orderBy: [desc(entries.date)],
  });
}

export async function deleteEntry(userId: string, date: string) {
  await db.delete(entries).where(and(eq(entries.userId, userId), eq(entries.date, date)));
}

export async function deleteAllUserData(userId: string) {
  await db.delete(users).where(eq(users.id, userId));
}

export async function getChecklistItems(userId: string) {
  return db.query.checklistItems.findMany({
    where: and(eq(checklistItems.userId, userId), eq(checklistItems.isActive, true)),
    orderBy: [checklistItems.createdAt],
  });
}

export async function createChecklistItem(userId: string, text: string, icon = '○') {
  const [item] = await db.insert(checklistItems).values({ userId, text, icon }).returning();
  return item;
}

export async function deleteChecklistItem(userId: string, id: string) {
  await db.delete(checklistItems).where(and(eq(checklistItems.id, id), eq(checklistItems.userId, userId)));
}

export async function getCompletionsInRange(userId: string, from: string, to: string) {
  return db.query.checklistCompletions.findMany({
    where: and(
      eq(checklistCompletions.userId, userId),
      gte(checklistCompletions.date, from),
      lte(checklistCompletions.date, to),
    ),
  });
}

export async function toggleCompletion(userId: string, checklistItemId: string, date: string) {
  const existing = await db.query.checklistCompletions.findFirst({
    where: and(
      eq(checklistCompletions.userId, userId),
      eq(checklistCompletions.checklistItemId, checklistItemId),
      eq(checklistCompletions.date, date),
    ),
  });
  if (existing) {
    await db.delete(checklistCompletions).where(eq(checklistCompletions.id, existing.id));
    return false;
  } else {
    await db.insert(checklistCompletions).values({ userId, checklistItemId, date });
    return true;
  }
}
