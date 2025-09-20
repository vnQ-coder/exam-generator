import { type User, type InsertUser, type Question, type InsertQuestion, User as UserModel, Question as QuestionModel } from "@shared/schema";

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
    try {
      const user = await UserModel.findById(id);
      return user || undefined;
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const user = await UserModel.findOne({ username });
      return user || undefined;
    } catch (error) {
      console.error('Error getting user by username:', error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const user = new UserModel(insertUser);
      await user.save();
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    try {
      const question = new QuestionModel({
        ...insertQuestion,
        tags: insertQuestion.tags || [],
        options: insertQuestion.options || undefined,
        answer: insertQuestion.answer || undefined,
        confidence: insertQuestion.confidence || 0,
      });
      await question.save();
      return question;
    } catch (error) {
      console.error('Error creating question:', error);
      throw error;
    }
  }

  async getQuestion(id: string): Promise<Question | undefined> {
    try {
      const question = await QuestionModel.findById(id);
      return question || undefined;
    } catch (error) {
      console.error('Error getting question:', error);
      return undefined;
    }
  }

  async getAllQuestions(): Promise<Question[]> {
    try {
      return await QuestionModel.find().sort({ createdAt: -1 });
    } catch (error) {
      console.error('Error getting all questions:', error);
      return [];
    }
  }

  async getQuestionsByTags(tags: string[]): Promise<Question[]> {
    try {
      return await QuestionModel.find({ 
        tags: { $in: tags } 
      }).sort({ createdAt: -1 });
    } catch (error) {
      console.error('Error getting questions by tags:', error);
      return [];
    }
  }

  async deleteQuestion(id: string): Promise<boolean> {
    try {
      const result = await QuestionModel.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      console.error('Error deleting question:', error);
      return false;
    }
  }

  async updateQuestion(id: string, updates: Partial<InsertQuestion>): Promise<Question | undefined> {
    try {
      const question = await QuestionModel.findByIdAndUpdate(
        id, 
        updates, 
        { new: true, runValidators: true }
      );
      return question || undefined;
    } catch (error) {
      console.error('Error updating question:', error);
      return undefined;
    }
  }
}

export const storage = new DatabaseStorage();