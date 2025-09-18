import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateQuestionsSchema, insertQuestionSchema } from "@shared/schema";
import { generateQuestions } from "./services/gemini";

export async function registerRoutes(app: Express): Promise<Server> {
  // Generate questions endpoint
  app.post("/api/questions/generate", async (req, res) => {
    try {
      const validatedData = generateQuestionsSchema.parse(req.body);
      
      const generatedQuestions = await generateQuestions(validatedData);
      
      // Store questions in database
      const storedQuestions = await Promise.all(
        generatedQuestions.map(async (q) => {
          const questionData = {
            question: q.question,
            type: q.type,
            difficulty: q.difficulty,
            sourceText: validatedData.sourceText,
            answer: q.answer || null,
            options: q.options || null,
            tags: q.tags,
            confidence: q.confidence,
          };
          
          return await storage.createQuestion(questionData);
        })
      );

      res.json({ 
        success: true, 
        questions: storedQuestions,
        count: storedQuestions.length 
      });
    } catch (error) {
      console.error("Error generating questions:", error);
      res.status(400).json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to generate questions" 
      });
    }
  });

  // Get all questions
  app.get("/api/questions", async (req, res) => {
    try {
      const questions = await storage.getAllQuestions();
      res.json({ success: true, questions });
    } catch (error) {
      console.error("Error fetching questions:", error);
      res.status(500).json({ 
        success: false, 
        error: "Failed to fetch questions" 
      });
    }
  });

  // Get question by ID
  app.get("/api/questions/:id", async (req, res) => {
    try {
      const question = await storage.getQuestion(req.params.id);
      if (!question) {
        return res.status(404).json({ 
          success: false, 
          error: "Question not found" 
        });
      }
      res.json({ success: true, question });
    } catch (error) {
      console.error("Error fetching question:", error);
      res.status(500).json({ 
        success: false, 
        error: "Failed to fetch question" 
      });
    }
  });

  // Update question
  app.patch("/api/questions/:id", async (req, res) => {
    try {
      const updates = insertQuestionSchema.partial().parse(req.body);
      const updatedQuestion = await storage.updateQuestion(req.params.id, updates);
      
      if (!updatedQuestion) {
        return res.status(404).json({ 
          success: false, 
          error: "Question not found" 
        });
      }

      res.json({ success: true, question: updatedQuestion });
    } catch (error) {
      console.error("Error updating question:", error);
      res.status(400).json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to update question" 
      });
    }
  });

  // Delete question
  app.delete("/api/questions/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteQuestion(req.params.id);
      
      if (!deleted) {
        return res.status(404).json({ 
          success: false, 
          error: "Question not found" 
        });
      }

      res.json({ success: true, message: "Question deleted successfully" });
    } catch (error) {
      console.error("Error deleting question:", error);
      res.status(500).json({ 
        success: false, 
        error: "Failed to delete question" 
      });
    }
  });

  // Get questions by tags
  app.get("/api/questions/tags/:tags", async (req, res) => {
    try {
      const tags = req.params.tags.split(",");
      const questions = await storage.getQuestionsByTags(tags);
      res.json({ success: true, questions });
    } catch (error) {
      console.error("Error fetching questions by tags:", error);
      res.status(500).json({ 
        success: false, 
        error: "Failed to fetch questions by tags" 
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
