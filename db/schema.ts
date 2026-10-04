import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const realms=sqliteTable('realms',{id:text('id').primaryKey(),data:text('data').notNull(),version:integer('version').notNull().default(0)});
export const heroes=sqliteTable('heroes',{id:text('id').primaryKey(),data:text('data').notNull(),updated:integer('updated').notNull()});
