import { GoogleGenerativeAI } from "@google/generative-ai";
import { storage } from "../storage";
import { config } from "dotenv";

// Load environment variables
config();
export interface RAGResponse {
  answer: string;
  sources: Array<{
    questionId: string;
    question: string;
    answer?: string;
    score: number;
    type: string;
    difficulty: string;
    tags: string[];
  }>;
  usedRAG: boolean;
  confidence: number;
}

export class SimpleRAGService {
  private ai: GoogleGenerativeAI;

  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is required for RAG service");
    }

    this.ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }

  async searchKnowledge(query: string, limit: number = 5, threshold: number = 0.7): Promise<RAGResponse> {
    try {
      // Get all questions from the database
      const allQuestions = await storage.getAllQuestions();
      
      if (allQuestions.length === 0) {
        // No questions in database, use LLM directly
        return await this.generateWithLLM(query, []);
      }

      // Simple text-based similarity search
      const relevantQuestions = this.findSimilarQuestions(query, allQuestions, limit, threshold);
      
      if (relevantQuestions.length === 0) {
        // No relevant questions found, use LLM directly
        return await this.generateWithLLM(query, []);
      }

      // Use the most relevant results as context
      const context = relevantQuestions.map(result => ({
        question: result.question.question,
        answer: result.question.answer || "No answer provided",
        type: result.question.type,
        difficulty: result.question.difficulty,
        tags: result.question.tags,
        score: result.score
      }));

      // Generate answer using RAG
      const ragAnswer = await this.generateWithRAG(query, context);
      
      return {
        answer: ragAnswer,
        sources: context,
        usedRAG: true,
        confidence: Math.max(...relevantQuestions.map(r => r.score))
      };
    } catch (error) {
      console.error("Error in RAG search:", error);
      // Fallback to LLM if RAG fails
      return await this.generateWithLLM(query, []);
    }
  }

  private findSimilarQuestions(query: string, questions: any[], limit: number, threshold: number) {
    const queryWords = query.toLowerCase().split(/\s+/).filter(word => word.length > 2);
    
    const scoredQuestions = questions.map(question => {
      const questionText = `${question.question} ${question.answer || ''} ${question.sourceText || ''}`.toLowerCase();
      const questionWords = questionText.split(/\s+/).filter(word => word.length > 2);
      
      // Calculate multiple similarity scores
      const commonWords = queryWords.filter(word => questionWords.includes(word));
      const wordOverlapScore = commonWords.length / Math.max(queryWords.length, questionWords.length);
      
      // Check for partial word matches (e.g., "newton" matches "newton's")
      const partialMatches = queryWords.filter(queryWord => 
        questionWords.some(questionWord => 
          questionWord.includes(queryWord) || queryWord.includes(questionWord)
        )
      );
      const partialScore = partialMatches.length / Math.max(queryWords.length, questionWords.length);
      
      // Check for exact phrase matches
      const phraseMatch = questionText.includes(query.toLowerCase()) ? 1 : 0;
      
      // Combined score (weighted)
      const score = Math.max(
        wordOverlapScore * 0.4,
        partialScore * 0.3,
        phraseMatch * 0.3
      );
      
      return { question, score };
    });

    // Lower the threshold and show more results for debugging
    const results = scoredQuestions
      .filter(item => item.score >= 0.1) // Much lower threshold
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    console.log(`RAG Search: Found ${results.length} similar questions for query: "${query}"`);
    results.forEach((result, index) => {
      console.log(`  ${index + 1}. Score: ${result.score.toFixed(3)} - "${result.question.question}"`);
    });

    return results;
  }

  private async generateWithRAG(query: string, context: Array<{
    question: string;
    answer: string;
    type: string;
    difficulty: string;
    tags: string[];
    score: number;
  }>): Promise<string> {
    try {
      const contextText = context.map((item, index) => 
        `${index + 1}. Question: ${item.question}\n   Answer: ${item.answer}\n   Type: ${item.type}, Difficulty: ${item.difficulty}\n   Tags: ${item.tags.join(", ")}\n`
      ).join("\n");

      const prompt = `Based on the following knowledge base, answer the user's question. If the information is not available in the knowledge base, say so and provide a general answer.

Knowledge Base:
${contextText}

User Question: ${query}

Please provide a comprehensive answer based on the knowledge base above. If you need to reference specific questions from the knowledge base, mention them by their number.`;

      const model = this.ai.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent(prompt);
      
      return result.response.text();
    } catch (error) {
      console.error("Error generating RAG response:", error);
      throw error;
    }
  }

  private async generateWithLLM(query: string, context: any[]): Promise<RAGResponse> {
    try {
      const model = this.ai.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent(query);
      
      return {
        answer: result.response.text(),
        sources: context,
        usedRAG: false,
        confidence: 0.5 // Lower confidence when not using RAG
      };
    } catch (error) {
      console.error("Error generating LLM response:", error);
      throw error;
    }
  }

  async getKnowledgeStats(): Promise<{ count: number }> {
    try {
      const questions = await storage.getAllQuestions();
      return { count: questions.length };
    } catch (error) {
      console.error("Error getting knowledge stats:", error);
      throw error;
    }
  }
}

export const simpleRAGService = new SimpleRAGService();
