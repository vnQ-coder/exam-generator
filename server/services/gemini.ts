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

interface QualityScore {
  overallScore: number;
  clarity: number;
  relevance: number;
  difficulty: number;
  engagement: number;
  feedback: string;
  suggestions: string[];
}

export async function assessQuestionQuality(
  question: string,
  sourceText: string,
  questionType: string,
  difficulty: string
): Promise<QualityScore> {
  try {
    const systemPrompt = `You are an expert educational content reviewer. Assess the quality of this question based on the source material.

Evaluate the question on these criteria (score 0-100 each):
1. Clarity: Is the question clear, unambiguous, and well-written?
2. Relevance: How well does it relate to the source material?
3. Difficulty: Is the difficulty appropriate for the stated level?
4. Engagement: Is it interesting and thought-provoking?

Also provide:
- Overall score (weighted average)
- Brief feedback explaining the scores
- 2-3 specific improvement suggestions

Return ONLY valid JSON in this format:
{
  "overallScore": 85,
  "clarity": 90,
  "relevance": 85,
  "difficulty": 80,
  "engagement": 85,
  "feedback": "This question effectively tests comprehension...",
  "suggestions": ["Consider adding more specific context", "The wording could be simplified"]
}`;

    const content = `Question: ${question}
Type: ${questionType}
Stated Difficulty: ${difficulty}
Source Text: ${sourceText}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            overallScore: { type: "number" },
            clarity: { type: "number" },
            relevance: { type: "number" },
            difficulty: { type: "number" },
            engagement: { type: "number" },
            feedback: { type: "string" },
            suggestions: {
              type: "array",
              items: { type: "string" }
            }
          },
          required: ["overallScore", "clarity", "relevance", "difficulty", "engagement", "feedback", "suggestions"]
        },
      },
      contents: content,
    });

    const rawJson = response.text;
    if (!rawJson) {
      throw new Error("Empty response from Gemini API");
    }

    return JSON.parse(rawJson);
  } catch (error) {
    console.error("Failed to assess question quality:", error);
    return {
      overallScore: 70,
      clarity: 70,
      relevance: 70,
      difficulty: 70,
      engagement: 70,
      feedback: "Quality assessment unavailable",
      suggestions: ["Review question clarity", "Check relevance to source material"]
    };
  }
}
