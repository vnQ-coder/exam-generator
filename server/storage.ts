import { type User, type InsertUser, type Question, type InsertQuestion, users, questions } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Question methods
  createQuestion(question: InsertQuestion): Promise<Question>;
  getQuestion(id: string): Promise<Question | undefined>;
  getAllQuestions(): Promise<Question[]>;
  getQuestionsByTags(tags: string[]): Promise<Question[]>;
  deleteQuestion(id: string): Promise<boolean>;
  updateQuestion(id: string, updates: Partial<InsertQuestion>): Promise<Question | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const [question] = await db
      .insert(questions)
      .values({
        ...insertQuestion,
        tags: insertQuestion.tags || [],
        options: insertQuestion.options || null,
        answer: insertQuestion.answer || null,
        confidence: insertQuestion.confidence || 0,
      })
      .returning();
    return question;
  }

  async getQuestion(id: string): Promise<Question | undefined> {
    const [question] = await db.select().from(questions).where(eq(questions.id, id));
    return question || undefined;
  }

  async getAllQuestions(): Promise<Question[]> {
    return await db
      .select()
      .from(questions)
      .orderBy(desc(questions.createdAt));
  }

  async getQuestionsByTags(tags: string[]): Promise<Question[]> {
    // Note: This is a simplified implementation. For production, you'd want proper JSONB querying
    const allQuestions = await db.select().from(questions);
    return allQuestions.filter((question) => {
      const questionTags = Array.isArray(question.tags) ? question.tags : [];
      return tags.some((tag) => questionTags.includes(tag));
    });
  }

  async deleteQuestion(id: string): Promise<boolean> {
    const result = await db.delete(questions).where(eq(questions.id, id));
    return (result.rowCount || 0) > 0;
  }

  async updateQuestion(id: string, updates: Partial<InsertQuestion>): Promise<Question | undefined> {
    const [updatedQuestion] = await db
      .update(questions)
      .set(updates)
      .where(eq(questions.id, id))
      .returning();
    return updatedQuestion || undefined;
  }
}

export const storage = new DatabaseStorage();
