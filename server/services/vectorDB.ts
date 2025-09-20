import { ChromaClient } from "chromadb";
import { v4 as uuidv4 } from "uuid";

export class VectorDBService {
  private client: ChromaClient;
  private collectionName = "queryforge_questions";

  constructor() {
    this.client = new ChromaClient({
      path: "http://localhost:8000" // Default ChromaDB server port
    });
  }

  async initialize() {
    try {
      // Check if collection exists, if not create it
      const collections = await this.client.listCollections();
      const collectionExists = collections.some(col => col.name === this.collectionName);
      
      if (!collectionExists) {
        await this.client.createCollection({
          name: this.collectionName,
          metadata: { description: "QueryForge questions and answers" }
        });
        console.log(`Created collection: ${this.collectionName}`);
      } else {
        console.log(`Collection ${this.collectionName} already exists`);
      }
    } catch (error) {
      console.error("Error initializing vector database:", error);
      throw error;
    }
  }

  async addDocument(document: {
    id?: string;
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
  }) {
    try {
      const id = document.id || uuidv4();
      
      await this.client.getCollection({ name: this.collectionName }).add({
        ids: [id],
        documents: [document.content],
        metadatas: [document.metadata]
      });
      
      return id;
    } catch (error) {
      console.error("Error adding document to vector database:", error);
      throw error;
    }
  }

  async searchSimilar(query: string, limit: number = 5, threshold: number = 0.7) {
    try {
      const collection = await this.client.getCollection({ name: this.collectionName });
      
      const results = await collection.query({
        queryTexts: [query],
        nResults: limit,
        include: ["metadatas", "distances", "documents"]
      });

      // Filter results by threshold and format response
      const filteredResults = results.metadatas[0]
        .map((metadata, index) => ({
          metadata,
          distance: results.distances[0][index],
          document: results.documents[0][index],
          score: 1 - results.distances[0][index] // Convert distance to similarity score
        }))
        .filter(result => result.score >= threshold)
        .sort((a, b) => b.score - a.score);

      return filteredResults;
    } catch (error) {
      console.error("Error searching vector database:", error);
      throw error;
    }
  }

  async updateDocument(id: string, document: {
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
  }) {
    try {
      const collection = await this.client.getCollection({ name: this.collectionName });
      
      await collection.update({
        ids: [id],
        documents: [document.content],
        metadatas: [document.metadata]
      });
      
      return true;
    } catch (error) {
      console.error("Error updating document in vector database:", error);
      throw error;
    }
  }

  async deleteDocument(id: string) {
    try {
      const collection = await this.client.getCollection({ name: this.collectionName });
      
      await collection.delete({
        ids: [id]
      });
      
      return true;
    } catch (error) {
      console.error("Error deleting document from vector database:", error);
      throw error;
    }
  }

  async getCollectionStats() {
    try {
      const collection = await this.client.getCollection({ name: this.collectionName });
      const count = await collection.count();
      return { count };
    } catch (error) {
      console.error("Error getting collection stats:", error);
      throw error;
    }
  }
}

export const vectorDB = new VectorDBService();

