import { sql } from "drizzle-orm";
import { 
  pgTable, 
  text, 
  varchar, 
  integer, 
  boolean, 
  timestamp,
  numeric,
  index
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  full_name: text("full_name").notNull(),
  email: varchar("email").notNull().unique(),
  password: text("password").notNull(),
  academic_degree: text("academic_degree"),
  category: text("category").notNull(), // "docente" | "estudante" | "outro" | "preletor"
  affiliation: text("affiliation").notNull(), // "urnm" | "externo"
  institution: text("institution"),
  role: text("role").notNull().default("participant"), // "participant" | "avaliador" | "admin"
  qr_code: varchar("qr_code").unique(),
  payment_status: text("payment_status").notNull().default("pending"), // "pending" | "approved" | "paid" | "exempt"
  payment_amount: numeric("payment_amount"),
  is_checked_in: boolean("is_checked_in").default(false),
  created_at: timestamp("created_at").defaultNow(),
});

export const submissions = pgTable("submissions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  user_id: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  abstract: text("abstract"),
  keywords: text("keywords"),
  file_uri: text("file_uri"),
  file_name: text("file_name"),
  thematic_axis: integer("thematic_axis").notNull(),
  status: text("status").notNull().default("pending"), // "pending" | "approved" | "rejected"
  reviewer_id: integer("reviewer_id").references(() => users.id),
  review_note: text("review_note"),
  submitted_at: timestamp("submitted_at").defaultNow(),
  reviewed_at: timestamp("reviewed_at"),
}, (table) => ({
  userIdIdx: index("submissions_user_id_idx").on(table.user_id),
  reviewerIdIdx: index("submissions_reviewer_id_idx").on(table.reviewer_id),
}));

export const messages = pgTable("messages", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  sender_id: integer("sender_id").notNull().references(() => users.id),
  recipient_id: integer("recipient_id").notNull().references(() => users.id),
  submission_id: integer("submission_id").references(() => submissions.id),
  content: text("content").notNull(),
  is_read: boolean("is_read").default(false),
  created_at: timestamp("created_at").defaultNow(),
}, (table) => ({
  senderIdIdx: index("messages_sender_id_idx").on(table.sender_id),
  recipientIdIdx: index("messages_recipient_id_idx").on(table.recipient_id),
}));

export const congress_program = pgTable("congress_program", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  title: text("title").notNull(),
  description: text("description"),
  date: timestamp("date").notNull(),
  location: text("location"),
  is_completed: boolean("is_completed").default(false),
  created_at: timestamp("created_at").defaultNow(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Submission = typeof submissions.$inferSelect;
export type InsertSubmission = typeof submissions.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;
export type ProgramItem = typeof congress_program.$inferSelect;
export type InsertProgramItem = typeof congress_program.$inferInsert;
