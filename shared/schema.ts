import mongoose, { Schema, Document } from 'mongoose';
import { z } from "zod";

// Question Schema
export interface IQuestion extends Document {
  question: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer' | 'essay';
  difficulty: 'easy' | 'medium' | 'hard';
  sourceText: string;
  answer?: string;
  options?: string[];
  tags: string[];
  confidence: number;
  // Quality assessment fields
  qualityScore?: number;
  clarityScore?: number;
  relevanceScore?: number;
  difficultyScore?: number;
  engagementScore?: number;
  qualityFeedback?: string;
  qualitySuggestions?: string[];
  createdAt: Date;
}

const QuestionSchema = new Schema<IQuestion>({
  question: { type: String, required: true },
  type: { 
    type: String, 
    required: true,
    enum: ['multiple-choice', 'true-false', 'short-answer', 'essay']
  },
  difficulty: { 
    type: String, 
    required: true,
    enum: ['easy', 'medium', 'hard']
  },
  sourceText: { type: String, required: true },
  answer: { type: String },
  options: [{ type: String }],
  tags: { type: [String], default: [] },
  confidence: { type: Number, default: 0, min: 0, max: 100 },
  // Quality assessment fields
  qualityScore: { type: Number, default: 0, min: 0, max: 100 },
  clarityScore: { type: Number, default: 0, min: 0, max: 100 },
  relevanceScore: { type: Number, default: 0, min: 0, max: 100 },
  difficultyScore: { type: Number, default: 0, min: 0, max: 100 },
  engagementScore: { type: Number, default: 0, min: 0, max: 100 },
  qualityFeedback: { type: String },
  qualitySuggestions: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now }
});

// User Schema
export interface IUser extends Document {
  username: string;
  password: string;
}

const UserSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

// Question Paper Schema
export interface IQuestionPaper extends Document {
  title: string;
  subject: string;
  totalMarks: number;
  duration: number; // in minutes
  difficulty: 'easy' | 'medium' | 'hard';
  configuration: {
    questionTypes: {
      mcq: { count: number; marks: number; totalMarks: number };
      short: { count: number; marks: number; totalMarks: number };
      long: { count: number; marks: number; totalMarks: number };
    };
    topics: string[];
    difficultyDistribution: {
      easy: number;
      medium: number;
      hard: number;
    };
  };
  questions: Array<{
    questionId: string;
    question: string;
    type: string;
    difficulty: string;
    marks: number;
    section: string;
  }>;
  createdAt: Date;
}

const QuestionPaperSchema = new Schema<IQuestionPaper>({
  title: { type: String, required: true },
  subject: { type: String, required: true },
  totalMarks: { type: Number, required: true },
  duration: { type: Number, required: true },
  difficulty: { 
    type: String, 
    required: true,
    enum: ['easy', 'medium', 'hard']
  },
  configuration: {
    questionTypes: {
      mcq: {
        count: { type: Number, required: true },
        marks: { type: Number, required: true },
        totalMarks: { type: Number, required: true }
      },
      short: {
        count: { type: Number, required: true },
        marks: { type: Number, required: true },
        totalMarks: { type: Number, required: true }
      },
      long: {
        count: { type: Number, required: true },
        marks: { type: Number, required: true },
        totalMarks: { type: Number, required: true }
      }
    },
    topics: [{ type: String }],
    difficultyDistribution: {
      easy: { type: Number, required: true },
      medium: { type: Number, required: true },
      hard: { type: Number, required: true }
    }
  },
  questions: [{
    questionId: { type: String, required: true },
    question: { type: String, required: true },
    type: { type: String, required: true },
    difficulty: { type: String, required: true },
    marks: { type: Number, required: true },
    section: { type: String, required: true }
  }],
  createdAt: { type: Date, default: Date.now }
});

// Paper Configuration Schema
export interface IPaperConfiguration extends Document {
  name: string;
  subject: string;
  totalMarks: number;
  duration: number;
  difficulty: 'easy' | 'medium' | 'hard';
  questionTypes: {
    mcq: { count: number; marks: number; totalMarks: number };
    short: { count: number; marks: number; totalMarks: number };
    long: { count: number; marks: number; totalMarks: number };
  };
  topics: string[];
  difficultyDistribution: {
    easy: number;
    medium: number;
    hard: number;
  };
  isTemplate: boolean;
  createdAt: Date;
}

const PaperConfigurationSchema = new Schema<IPaperConfiguration>({
  name: { type: String, required: true },
  subject: { type: String, required: true },
  totalMarks: { type: Number, required: true },
  duration: { type: Number, required: true },
  difficulty: { 
    type: String, 
    required: true,
    enum: ['easy', 'medium', 'hard']
  },
  questionTypes: {
    mcq: {
      count: { type: Number, required: true },
      marks: { type: Number, required: true },
      totalMarks: { type: Number, required: true }
    },
    short: {
      count: { type: Number, required: true },
      marks: { type: Number, required: true },
      totalMarks: { type: Number, required: true }
    },
    long: {
      count: { type: Number, required: true },
      marks: { type: Number, required: true },
      totalMarks: { type: Number, required: true }
    }
  },
  topics: [{ type: String }],
  difficultyDistribution: {
    easy: { type: Number, required: true },
    medium: { type: Number, required: true },
    hard: { type: Number, required: true }
  },
  isTemplate: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Create models
export const Question = mongoose.model<IQuestion>('Question', QuestionSchema);
export const User = mongoose.model<IUser>('User', UserSchema);
export const QuestionPaper = mongoose.model<IQuestionPaper>('QuestionPaper', QuestionPaperSchema);
export const PaperConfiguration = mongoose.model<IPaperConfiguration>('PaperConfiguration', PaperConfigurationSchema);

// Zod schemas for validation
export const insertQuestionSchema = z.object({
  question: z.string().min(1, "Question is required"),
  type: z.enum(['multiple-choice', 'true-false', 'short-answer', 'essay']),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  sourceText: z.string().min(1, "Source text is required"),
  answer: z.string().optional(),
  options: z.array(z.string()).optional(),
  tags: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(100).default(0),
  qualityScore: z.number().min(0).max(100).optional(),
  clarityScore: z.number().min(0).max(100).optional(),
  relevanceScore: z.number().min(0).max(100).optional(),
  difficultyScore: z.number().min(0).max(100).optional(),
  engagementScore: z.number().min(0).max(100).optional(),
  qualityFeedback: z.string().optional(),
  qualitySuggestions: z.array(z.string()).default([])
});

export const generateQuestionsSchema = z.object({
  sourceText: z.string().min(1, "Source text is required"),
  questionType: z.enum(["mixed", "multiple-choice", "true-false", "short-answer", "essay"]),
  difficulty: z.enum(["easy", "medium", "hard"]),
  questionCount: z.number().min(1).max(20),
  includeAnswers: z.boolean().default(true),
  autoTag: z.boolean().default(true),
  contextAware: z.boolean().default(false),
  enableQualityCheck: z.boolean().default(true),
});

export const insertUserSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required")
});

// Type exports
// Paper generation schemas
export const paperConfigurationSchema = z.object({
  name: z.string().min(1, "Configuration name is required"),
  subject: z.string().min(1, "Subject is required"),
  totalMarks: z.number().min(1, "Total marks must be at least 1"),
  duration: z.number().min(30, "Duration must be at least 30 minutes"),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  questionTypes: z.object({
    mcq: z.object({
      count: z.number().min(0),
      marks: z.number().min(1),
      totalMarks: z.number().min(0)
    }),
    short: z.object({
      count: z.number().min(0),
      marks: z.number().min(1),
      totalMarks: z.number().min(0)
    }),
    long: z.object({
      count: z.number().min(0),
      marks: z.number().min(1),
      totalMarks: z.number().min(0)
    })
  }),
  topics: z.array(z.string()).min(1, "At least one topic is required"),
  difficultyDistribution: z.object({
    easy: z.number().min(0).max(100),
    medium: z.number().min(0).max(100),
    hard: z.number().min(0).max(100)
  }).refine(data => data.easy + data.medium + data.hard === 100, {
    message: "Difficulty distribution must total 100%"
  })
});

export const generatePaperSchema = z.object({
  title: z.string().min(1, "Paper title is required"),
  subject: z.string().min(1, "Subject is required"),
  totalMarks: z.number().min(1, "Total marks must be at least 1"),
  duration: z.number().min(30, "Duration must be at least 30 minutes"),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  questionTypes: z.object({
    mcq: z.object({
      count: z.number().min(0),
      marks: z.number().min(1),
      totalMarks: z.number().min(0)
    }),
    short: z.object({
      count: z.number().min(0),
      marks: z.number().min(1),
      totalMarks: z.number().min(0)
    }),
    long: z.object({
      count: z.number().min(0),
      marks: z.number().min(1),
      totalMarks: z.number().min(0)
    })
  }),
  topics: z.array(z.string()).min(1, "At least one topic is required"),
  difficultyDistribution: z.object({
    easy: z.number().min(0).max(100),
    medium: z.number().min(0).max(100),
    hard: z.number().min(0).max(100)
  }).refine(data => data.easy + data.medium + data.hard === 100, {
    message: "Difficulty distribution must total 100%"
  })
});

// Type exports
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Question = IQuestion;
export type GenerateQuestionsRequest = z.infer<typeof generateQuestionsSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = IUser;
export type QuestionPaper = IQuestionPaper;
export type PaperConfiguration = IPaperConfiguration;
export type PaperConfigurationInput = z.infer<typeof paperConfigurationSchema>;
export type GeneratePaperInput = z.infer<typeof generatePaperSchema>;