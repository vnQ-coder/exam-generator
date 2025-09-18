import { GoogleGenAI } from "@google/genai";
import { type GenerateQuestionsRequest } from "@shared/schema";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || "" 
});

interface GeneratedQuestion {
  question: string;
  type: string;
  difficulty: string;
  answer?: string;
  options?: string[];
  tags: string[];
  confidence: number;
}

export async function generateQuestions(
  request: GenerateQuestionsRequest
): Promise<GeneratedQuestion[]> {
  try {
    const { sourceText, questionType, difficulty, questionCount, includeAnswers, autoTag } = request;

    const systemPrompt = `You are an expert question generator. Generate educational questions based on the provided text content.

Instructions:
- Generate exactly ${questionCount} questions
- Question type: ${questionType === 'mixed' ? 'Mix different types (multiple-choice, true-false, short-answer, essay)' : questionType}
- Difficulty level: ${difficulty}
- ${includeAnswers ? 'Include correct answers' : 'Do not include answers'}
- ${autoTag ? 'Generate relevant tags for categorization' : 'Use generic tags'}

For multiple-choice questions: Provide 4 options (A, B, C, D) with one correct answer.
For true-false questions: Provide the correct true/false answer.
For short-answer questions: Provide a brief sample answer.
For essay questions: Provide key points that should be addressed.

Return ONLY valid JSON in this exact format:
{
  "questions": [
    {
      "question": "Question text here",
      "type": "multiple-choice|true-false|short-answer|essay",
      "difficulty": "easy|medium|hard",
      "answer": "Correct answer or explanation",
      "options": ["Option A", "Option B", "Option C", "Option D"] // Only for multiple-choice
      "tags": ["tag1", "tag2"],
      "confidence": 85 // 0-100 confidence score
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  question: { type: "string" },
                  type: { type: "string" },
                  difficulty: { type: "string" },
                  answer: { type: "string" },
                  options: {
                    type: "array",
                    items: { type: "string" }
                  },
                  tags: {
                    type: "array",
                    items: { type: "string" }
                  },
                  confidence: { type: "number" }
                },
                required: ["question", "type", "difficulty", "tags", "confidence"]
              }
            }
          },
          required: ["questions"]
        },
      },
      contents: `Generate questions from this content:\n\n${sourceText}`,
    });

    const rawJson = response.text;
    if (!rawJson) {
      throw new Error("Empty response from Gemini API");
    }

    const data = JSON.parse(rawJson);
    return data.questions || [];
  } catch (error) {
    console.error("Failed to generate questions:", error);
    throw new Error(`Failed to generate questions: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function generateTags(text: string): Promise<string[]> {
  try {
    const systemPrompt = `Analyze the provided text and generate 3-5 relevant tags that categorize the content. 
    Tags should be:
    - Concise (1-3 words)
    - Relevant to the main topics
    - Useful for categorization
    
    Return only a JSON array of strings: ["tag1", "tag2", "tag3"]`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "array",
          items: { type: "string" }
        },
      },
      contents: text,
    });

    const rawJson = response.text;
    if (!rawJson) {
      throw new Error("Empty response from Gemini API");
    }

    return JSON.parse(rawJson);
  } catch (error) {
    console.error("Failed to generate tags:", error);
    return ["General"];
  }
}
