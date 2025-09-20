import { GoogleGenerativeAI } from "@google/generative-ai";
import { vectorDB } from "./vectorDB";
import { embeddingService } from "./embeddings";

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

export class RAGService {
  private ai: GoogleGenerativeAI;

  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is required for RAG service");
    }

    this.ai = new GoogleGenerativeAI({ 
      apiKey: process.env.GEMINI_API_KEY 
    });
  }

  async searchKnowledge(query: string, limit: number = 5, threshold: number = 0.7): Promise<RAGResponse> {
    try {
      // First, search the vector database for similar content
      const searchResults = await vectorDB.searchSimilar(query, limit, threshold);
      
      if (searchResults.length === 0) {
        // No relevant content found in database, use LLM directly
        return await this.generateWithLLM(query, []);
      }

      // Use the most relevant results as context
      const context = searchResults.map(result => ({
        question: result.metadata.question,
        answer: result.metadata.answer || "No answer provided",
        type: result.metadata.type,
        difficulty: result.metadata.difficulty,
        tags: result.metadata.tags,
        score: result.score
      }));

      // Generate answer using RAG
      const ragAnswer = await this.generateWithRAG(query, context);
      
      return {
        answer: ragAnswer,
        sources: context,
        usedRAG: true,
        confidence: Math.max(...searchResults.map(r => r.score))
      };
    } catch (error) {
      console.error("Error in RAG search:", error);
      // Fallback to LLM if RAG fails
      return await this.generateWithLLM(query, []);
    }
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

  async addQuestionToKnowledge(questionData: {
    id: string;
    question: string;
    answer?: string;
    type: string;
    difficulty: string;
    tags: string[];
    sourceText: string;
  }): Promise<void> {
    try {
      const document = await embeddingService.createDocumentFromQuestion(questionData);
      await vectorDB.addDocument(document);
      console.log(`Added question ${questionData.id} to knowledge base`);
    } catch (error) {
      console.error("Error adding question to knowledge base:", error);
      throw error;
    }
  }

  async updateQuestionInKnowledge(questionData: {
    id: string;
    question: string;
    answer?: string;
    type: string;
    difficulty: string;
    tags: string[];
    sourceText: string;
  }): Promise<void> {
    try {
      const document = await embeddingService.createDocumentFromQuestion(questionData);
      await vectorDB.updateDocument(questionData.id, document);
      console.log(`Updated question ${questionData.id} in knowledge base`);
    } catch (error) {
      console.error("Error updating question in knowledge base:", error);
      throw error;
    }
  }

  async removeQuestionFromKnowledge(questionId: string): Promise<void> {
    try {
      await vectorDB.deleteDocument(questionId);
      console.log(`Removed question ${questionId} from knowledge base`);
    } catch (error) {
      console.error("Error removing question from knowledge base:", error);
      throw error;
    }
  }

  async getKnowledgeStats(): Promise<{ count: number }> {
    try {
      return await vectorDB.getCollectionStats();
    } catch (error) {
      console.error("Error getting knowledge stats:", error);
      throw error;
    }
  }
}

export const ragService = new RAGService();
