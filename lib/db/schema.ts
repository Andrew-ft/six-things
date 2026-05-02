import { pgTable, uuid, text, timestamp, date, boolean, unique } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id:           uuid('id').primaryKey().defaultRandom(),
  email:        text('email').notNull().unique(),
  name:         text('name').notNull(),
  passwordHash: text('password_hash'),
  avatarUrl:    text('avatar_url'),
  createdAt:    timestamp('created_at').defaultNow().notNull(),
});

export const entries = pgTable('entries', {
  id:          uuid('id').primaryKey().defaultRandom(),
  userId:      uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  date:        date('date').notNull(),
  promptText:  text('prompt_text').notNull(),
  promptType:  text('prompt_type').notNull(),
  items:       text('items').array().notNull().default([]),
  createdAt:   timestamp('created_at').defaultNow().notNull(),
  updatedAt:   timestamp('updated_at').defaultNow().notNull(),
}, t => [
  unique('entries_user_date').on(t.userId, t.date),
]);

export const checklistItems = pgTable('checklist_items', {
  id:        uuid('id').primaryKey().defaultRandom(),
  userId:    uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  text:      text('text').notNull(),
  icon:      text('icon').notNull().default('○'),
  isActive:  boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const checklistCompletions = pgTable('checklist_completions', {
  id:              uuid('id').primaryKey().defaultRandom(),
  userId:          uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  checklistItemId: uuid('checklist_item_id').notNull().references(() => checklistItems.id, { onDelete: 'cascade' }),
  date:            date('date').notNull(),
}, t => [
  unique('checklist_completions_unique').on(t.userId, t.checklistItemId, t.date),
]);

export type User = typeof users.$inferSelect;
export type Entry = typeof entries.$inferSelect;
export type ChecklistItem = typeof checklistItems.$inferSelect;
export type ChecklistCompletion = typeof checklistCompletions.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type NewEntry = typeof entries.$inferInsert;
