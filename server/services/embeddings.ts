import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "dotenv";

// Load environment variables
config();
export class EmbeddingService {
  private ai: GoogleGenerativeAI;

  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is required for embeddings");
    }

    this.ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }

  async embedText(text: string): Promise<number[]> {
    try {
      const model = this.ai.getGenerativeModel({ model: "embedding-001" });
      const result = await model.embedContent(text);
      return result.embedding.values;
    } catch (error) {
      console.error("Error generating embeddings:", error);
      throw error;
    }
  }

  async embedDocuments(documents: string[]): Promise<number[][]> {
    try {
      const model = this.ai.getGenerativeModel({ model: "embedding-001" });
      const results = await Promise.all(
        documents.map(doc => this.embedText(doc))
      );
      return results;
    } catch (error) {
      console.error("Error generating document embeddings:", error);
      throw error;
    }
  }

  async embedQuestion(question: string, answer?: string, sourceText?: string): Promise<string> {
    // Create a comprehensive text for embedding that includes question, answer, and context
    let content = `Question: ${question}`;
    
    if (answer) {
      content += `\nAnswer: ${answer}`;
    }
    
    if (sourceText) {
      content += `\nContext: ${sourceText}`;
    }
    
    return content;
  }

  async createDocumentFromQuestion(questionData: {
    id: string;
    question: string;
    answer?: string;
    type: string;
    difficulty: string;
    tags: string[];
    sourceText: string;
  }): Promise<{
    content: string;
    metadata: {
      questionId: string;
      question: string;
      answer?: string;
      type: string;
      difficulty: string;
      tags: string[];
      sourceText: string;
    };
  }> {
    const content = await this.embedQuestion(
      questionData.question,
      questionData.answer,
      questionData.sourceText
    );

    return {
      content,
      metadata: {
        questionId: questionData.id,
        question: questionData.question,
        answer: questionData.answer,
        type: questionData.type,
        difficulty: questionData.difficulty,
        tags: questionData.tags,
        sourceText: questionData.sourceText,
      }
    };
  }
}

export const embeddingService = new EmbeddingService();