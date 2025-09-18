import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const questions = pgTable("questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  question: text("question").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // multiple-choice, true-false, short-answer, essay
  difficulty: varchar("difficulty", { length: 20 }).notNull(), // easy, medium, hard
  sourceText: text("source_text").notNull(),
  answer: text("answer"),
  options: jsonb("options"), // For multiple choice questions
  tags: jsonb("tags").default([]), // Array of tags
  confidence: integer("confidence").default(0), // AI confidence score 0-100
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
  createdAt: true,
});

export const generateQuestionsSchema = z.object({
  sourceText: z.string().min(1, "Source text is required"),
  questionType: z.enum(["mixed", "multiple-choice", "true-false", "short-answer", "essay"]),
  difficulty: z.enum(["easy", "medium", "hard"]),
  questionCount: z.number().min(1).max(20),
  includeAnswers: z.boolean().default(true),
  autoTag: z.boolean().default(true),
  contextAware: z.boolean().default(false),
});

export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Question = typeof questions.$inferSelect;
export type GenerateQuestionsRequest = z.infer<typeof generateQuestionsSchema>;

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
