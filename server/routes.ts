import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateQuestionsSchema, insertQuestionSchema, generatePaperSchema, paperConfigurationSchema } from "@shared/schema";
import { generateQuestions, assessQuestionQuality } from "./services/gemini";
import { simpleRAGService } from "./services/simpleRAG";
import { paperGeneratorService } from "./services/paperGenerator";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create question endpoint
  app.post("/api/questions", async (req, res) => {
    try {
      const validatedData = insertQuestionSchema.parse(req.body);
      const question = await storage.createQuestion(validatedData);
      res.json({ success: true, question });
    } catch (error) {
      console.error("Error creating question:", error);
      res.status(400).json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to create question" 
      });
    }
  });

  // Generate questions endpoint
  app.post("/api/questions/generate", async (req, res) => {
    try {
      const validatedData = generateQuestionsSchema.parse(req.body);
      
      const generatedQuestions = await generateQuestions(validatedData);
      
      // Store questions in database with optional quality assessment
      const storedQuestions = await Promise.all(
        generatedQuestions.map(async (q) => {
          let qualityData = {};
          
          // Perform quality assessment if enabled
          if (validatedData.enableQualityCheck) {
            try {
              const qualityScore = await assessQuestionQuality(
                q.question,
                validatedData.sourceText,
                q.type,
                q.difficulty
              );
              
              qualityData = {
                qualityScore: Math.round(qualityScore.overallScore),
                clarityScore: Math.round(qualityScore.clarity),
                relevanceScore: Math.round(qualityScore.relevance),
                difficultyScore: Math.round(qualityScore.difficulty),
                engagementScore: Math.round(qualityScore.engagement),
                qualityFeedback: qualityScore.feedback,
                qualitySuggestions: qualityScore.suggestions,
              };
            } catch (error) {
              console.error("Quality assessment failed for question:", error);
              // Continue without quality data if assessment fails
            }
          }
          
          const questionData = {
            question: q.question,
            type: q.type,
            difficulty: q.difficulty,
            sourceText: validatedData.sourceText,
            answer: q.answer || null,
            options: q.options || null,
            tags: q.tags,
            confidence: q.confidence,
            ...qualityData,
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

  // Export questions as JSON
  app.get("/api/questions/export/json", async (req, res) => {
    try {
      const questions = await storage.getAllQuestions();
      const exportData = {
        exportDate: new Date().toISOString(),
        totalQuestions: questions.length,
        questions: questions.map(q => ({
          id: q.id,
          question: q.question,
          type: q.type,
          difficulty: q.difficulty,
          answer: q.answer,
          options: q.options,
          tags: q.tags,
          confidence: q.confidence,
          sourceText: q.sourceText,
          createdAt: q.createdAt
        }))
      };
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="questions-export-${new Date().toISOString().split('T')[0]}.json"`);
      res.json(exportData);
    } catch (error) {
      console.error("Error exporting questions as JSON:", error);
      res.status(500).json({ 
        success: false, 
        error: "Failed to export questions" 
      });
    }
  });

  // Export questions as CSV
  app.get("/api/questions/export/csv", async (req, res) => {
    try {
      const questions = await storage.getAllQuestions();
      
      // CSV headers
      const headers = [
        'ID', 'Question', 'Type', 'Difficulty', 'Answer', 'Options', 'Tags', 'Confidence', 'Created At', 'Source Text'
      ];
      
      // Convert questions to CSV rows
      const csvRows = questions.map(q => [
        q.id,
        `"${(q.question || '').replace(/"/g, '""')}"`, // Escape quotes
        q.type,
        q.difficulty,
        `"${(q.answer || '').replace(/"/g, '""')}"`,
        `"${Array.isArray(q.options) ? q.options.join('; ') : ''}"`,
        `"${Array.isArray(q.tags) ? q.tags.join(', ') : ''}"`,
        q.confidence || 0,
        q.createdAt ? new Date(q.createdAt).toISOString() : '',
        `"${(q.sourceText || '').replace(/"/g, '""')}"`
      ]);
      
      const csvContent = [headers.join(','), ...csvRows.map(row => row.join(','))].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="questions-export-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvContent);
    } catch (error) {
      console.error("Error exporting questions as CSV:", error);
      res.status(500).json({ 
        success: false, 
        error: "Failed to export questions" 
      });
    }
  });

  // RAG Search endpoint
  app.post("/api/rag/search", async (req, res) => {
    try {
      const { query, limit = 5, threshold = 0.7 } = req.body;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ 
          success: false, 
          error: "Query is required and must be a string" 
        });
      }

      const result = await simpleRAGService.searchKnowledge(query, limit, threshold);
      res.json({ success: true, ...result });
    } catch (error) {
      console.error("Error in RAG search:", error);
      res.status(500).json({ 
        success: false, 
        error: "Failed to perform RAG search" 
      });
    }
  });

  // RAG Knowledge base stats
  app.get("/api/rag/stats", async (req, res) => {
    try {
      const stats = await simpleRAGService.getKnowledgeStats();
      res.json({ success: true, stats });
    } catch (error) {
      console.error("Error getting RAG stats:", error);
      res.status(500).json({ 
        success: false, 
        error: "Failed to get RAG stats" 
      });
    }
  });

  // Initialize RAG system
  app.post("/api/rag/init", async (req, res) => {
    try {
      // Simple RAG doesn't need initialization, just return success
      res.json({ success: true, message: "RAG system ready" });
    } catch (error) {
      console.error("Error initializing RAG system:", error);
      res.status(500).json({ 
        success: false, 
        error: "Failed to initialize RAG system" 
      });
    }
  });

  // Paper Generation Endpoints
  app.post("/api/papers/generate", async (req, res) => {
    try {
      const validatedData = generatePaperSchema.parse(req.body);
      const result = await paperGeneratorService.generatePaper(validatedData);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error("Error generating paper:", error);
      res.status(400).json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to generate paper" 
      });
    }
  });

  // Get available topics (MUST come before /api/papers/:id)
  app.get("/api/papers/topics", async (req, res) => {
    try {
      const topics = await paperGeneratorService.getAvailableTopics();
      res.json({ success: true, topics });
    } catch (error) {
      console.error("Error fetching topics:", error);
      res.status(500).json({ 
        success: false, 
        error: "Failed to fetch topics" 
      });
    }
  });

  // Paper Templates (MUST come before /api/papers/:id)
  app.get("/api/papers/templates", async (req, res) => {
    try {
      const templates = await paperGeneratorService.getPaperTemplates();
      res.json({ success: true, templates });
    } catch (error) {
      console.error("Error fetching templates:", error);
      res.status(500).json({ 
        success: false, 
        error: "Failed to fetch templates" 
      });
    }
  });

  app.post("/api/papers/templates", async (req, res) => {
    try {
      const validatedData = paperConfigurationSchema.parse(req.body);
      const template = await paperGeneratorService.savePaperTemplate(validatedData);
      res.json({ success: true, template });
    } catch (error) {
      console.error("Error saving template:", error);
      res.status(400).json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to save template" 
      });
    }
  });

  // Get all papers
  app.get("/api/papers", async (req, res) => {
    try {
      const { QuestionPaper } = await import("@shared/schema");
      const papers = await QuestionPaper.find().sort({ createdAt: -1 });
      res.json({ success: true, papers });
    } catch (error) {
      console.error("Error fetching papers:", error);
      res.status(500).json({ 
        success: false, 
        error: "Failed to fetch papers" 
      });
    }
  });

  // Get paper by ID
  app.get("/api/papers/:id", async (req, res) => {
    try {
      const { QuestionPaper } = await import("@shared/schema");
      const paper = await QuestionPaper.findById(req.params.id);
      
      if (!paper) {
        return res.status(404).json({ 
          success: false, 
          error: "Paper not found" 
        });
      }
      
      res.json({ success: true, paper });
    } catch (error) {
      console.error("Error fetching paper:", error);
      res.status(500).json({ 
        success: false, 
        error: "Failed to fetch paper" 
      });
    }
  });

  // Delete paper
  app.delete("/api/papers/:id", async (req, res) => {
    try {
      const { QuestionPaper } = await import("@shared/schema");
      const result = await QuestionPaper.findByIdAndDelete(req.params.id);
      
      if (!result) {
        return res.status(404).json({ 
          success: false, 
          error: "Paper not found" 
        });
      }
      
      res.json({ success: true, message: "Paper deleted successfully" });
    } catch (error) {
      console.error("Error deleting paper:", error);
      res.status(500).json({ 
        success: false, 
        error: "Failed to delete paper" 
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
