import { storage } from "../storage";
import { Question, QuestionPaper, PaperConfiguration, GeneratePaperInput } from "@shared/schema";

export interface PaperGenerationResult {
  success: boolean;
  paper?: QuestionPaper;
  message: string;
  stats?: {
    totalQuestions: number;
    questionsByType: Record<string, number>;
    questionsByDifficulty: Record<string, number>;
    topicCoverage: string[];
    totalMarks: number;
  };
}

export class PaperGeneratorService {
  async generatePaper(config: GeneratePaperInput): Promise<PaperGenerationResult> {
    try {
      // Validate configuration
      const validationResult = this.validateConfiguration(config);
      if (!validationResult.valid) {
        return {
          success: false,
          message: validationResult.error || "Invalid configuration"
        };
      }

      // Get all available questions
      const allQuestions = await storage.getAllQuestions();
      
      if (allQuestions.length === 0) {
        return {
          success: false,
          message: "No questions available in the database. Please add some questions first."
        };
      }

      // Filter questions by topics if specified
      const filteredQuestions = this.filterQuestionsByTopics(allQuestions, config.topics);
      
      if (filteredQuestions.length === 0) {
        return {
          success: false,
          message: `No questions found for the specified topics: ${config.topics.join(", ")}`
        };
      }

      // Generate paper using smart selection algorithm
      const selectedQuestions = this.selectQuestions(filteredQuestions, config);
      
      if (selectedQuestions.length === 0) {
        return {
          success: false,
          message: "Could not select enough questions matching the criteria"
        };
      }

      // Create paper structure
      const paper = await this.createPaper(config, selectedQuestions);
      
      // Generate statistics
      const stats = this.generateStats(selectedQuestions, config);

      return {
        success: true,
        paper,
        message: "Paper generated successfully",
        stats
      };

    } catch (error) {
      console.error("Error generating paper:", error);
      return {
        success: false,
        message: "Failed to generate paper. Please try again."
      };
    }
  }

  private validateConfiguration(config: GeneratePaperInput): { valid: boolean; error?: string } {
    // Check if total marks match
    const calculatedTotal = config.questionTypes.mcq.totalMarks + 
                           config.questionTypes.short.totalMarks + 
                           config.questionTypes.long.totalMarks;
    
    if (calculatedTotal !== config.totalMarks) {
      return {
        valid: false,
        error: `Total marks mismatch. Calculated: ${calculatedTotal}, Expected: ${config.totalMarks}`
      };
    }

    // Check if difficulty distribution totals 100%
    const difficultyTotal = config.difficultyDistribution.easy + 
                           config.difficultyDistribution.medium + 
                           config.difficultyDistribution.hard;
    
    if (difficultyTotal !== 100) {
      return {
        valid: false,
        error: `Difficulty distribution must total 100%. Current total: ${difficultyTotal}%`
      };
    }

    return { valid: true };
  }

  private filterQuestionsByTopics(questions: Question[], topics: string[]): Question[] {
    if (topics.length === 0) return questions;
    
    return questions.filter(question => {
      const questionTags = question.tags || [];
      return topics.some(topic => 
        questionTags.some(tag => 
          tag.toLowerCase().includes(topic.toLowerCase()) ||
          topic.toLowerCase().includes(tag.toLowerCase())
        )
      );
    });
  }

  private selectQuestions(questions: Question[], config: GeneratePaperInput): Question[] {
    const selectedQuestions: Question[] = [];
    const usedQuestionIds = new Set<string>();

    // Group questions by type and difficulty
    const questionsByTypeAndDifficulty = this.groupQuestionsByTypeAndDifficulty(questions);

    // Select questions for each type
    const questionTypes = [
      { type: 'multiple-choice', config: config.questionTypes.mcq, section: 'MCQ' },
      { type: 'short-answer', config: config.questionTypes.short, section: 'Short Answer' },
      { type: 'essay', config: config.questionTypes.long, section: 'Long Answer' }
    ];

    for (const { type, config: typeConfig, section } of questionTypes) {
      if (typeConfig.count === 0) continue;

      const typeQuestions = questionsByTypeAndDifficulty[type] || {};
      const selectedForType = this.selectQuestionsForType(
        typeQuestions,
        typeConfig,
        config.difficultyDistribution,
        usedQuestionIds
      );

      // Add section information and marks
      selectedForType.forEach(question => {
        const questionWithSection = {
          ...question.toObject ? question.toObject() : question,
          section,
          marks: typeConfig.marks
        };
        selectedQuestions.push(questionWithSection);
        usedQuestionIds.add(question._id.toString());
      });
    }

    return selectedQuestions;
  }

  private groupQuestionsByTypeAndDifficulty(questions: Question[]): Record<string, Record<string, Question[]>> {
    const grouped: Record<string, Record<string, Question[]>> = {};

    questions.forEach(question => {
      const type = question.type;
      const difficulty = question.difficulty;

      if (!grouped[type]) {
        grouped[type] = { easy: [], medium: [], hard: [] };
      }

      if (!grouped[type][difficulty]) {
        grouped[type][difficulty] = [];
      }

      grouped[type][difficulty].push(question);
    });

    return grouped;
  }

  private selectQuestionsForType(
    typeQuestions: Record<string, Question[]>,
    typeConfig: { count: number; marks: number },
    difficultyDistribution: { easy: number; medium: number; hard: number },
    usedQuestionIds: Set<string>
  ): Question[] {
    const selected: Question[] = [];
    const totalNeeded = typeConfig.count;

    // Calculate how many questions needed for each difficulty
    const easyCount = Math.round((totalNeeded * difficultyDistribution.easy) / 100);
    const mediumCount = Math.round((totalNeeded * difficultyDistribution.medium) / 100);
    const hardCount = totalNeeded - easyCount - mediumCount;

    // Select questions for each difficulty
    const difficulties = [
      { level: 'easy', count: easyCount },
      { level: 'medium', count: mediumCount },
      { level: 'hard', count: hardCount }
    ];

    for (const { level, count } of difficulties) {
      if (count === 0) continue;

      const availableQuestions = (typeQuestions[level] || [])
        .filter(q => !usedQuestionIds.has(q._id.toString()))
        .sort((a, b) => (b.confidence || 0) - (a.confidence || 0)); // Sort by confidence

      const selectedForDifficulty = availableQuestions.slice(0, count);
      selected.push(...selectedForDifficulty);
    }

    return selected;
  }

  private async createPaper(config: GeneratePaperInput, selectedQuestions: Question[]): Promise<QuestionPaper> {
    const paperData = {
      title: config.title,
      subject: config.subject,
      totalMarks: config.totalMarks,
      duration: config.duration,
      difficulty: config.difficulty,
      configuration: {
        questionTypes: config.questionTypes,
        topics: config.topics,
        difficultyDistribution: config.difficultyDistribution
      },
      questions: selectedQuestions.map(q => ({
        questionId: q._id ? q._id.toString() : 'unknown',
        question: q.question,
        type: q.type,
        difficulty: q.difficulty,
        marks: (q as any).marks || 1,
        section: (q as any).section || 'General'
      }))
    };

    const { QuestionPaper } = await import("@shared/schema");
    const paper = new QuestionPaper(paperData);
    await paper.save();
    
    return paper;
  }

  private generateStats(questions: Question[], config: GeneratePaperInput) {
    const questionsByType: Record<string, number> = {};
    const questionsByDifficulty: Record<string, number> = {};
    const topicCoverage = new Set<string>();

    questions.forEach(question => {
      // Count by type
      questionsByType[question.type] = (questionsByType[question.type] || 0) + 1;
      
      // Count by difficulty
      questionsByDifficulty[question.difficulty] = (questionsByDifficulty[question.difficulty] || 0) + 1;
      
      // Collect topics
      (question.tags || []).forEach(tag => topicCoverage.add(tag));
    });

    return {
      totalQuestions: questions.length,
      questionsByType,
      questionsByDifficulty,
      topicCoverage: Array.from(topicCoverage),
      totalMarks: config.totalMarks
    };
  }

  async getAvailableTopics(): Promise<string[]> {
    try {
      const questions = await storage.getAllQuestions();
      const topics = new Set<string>();
      
      questions.forEach(question => {
        (question.tags || []).forEach(tag => topics.add(tag));
      });
      
      return Array.from(topics).sort();
    } catch (error) {
      console.error("Error getting available topics:", error);
      return [];
    }
  }

  async getPaperTemplates(): Promise<PaperConfiguration[]> {
    try {
      const { PaperConfiguration } = await import("@shared/schema");
      const templates = await PaperConfiguration.find({ isTemplate: true });
      return templates;
    } catch (error) {
      console.error("Error getting paper templates:", error);
      return [];
    }
  }

  async savePaperTemplate(config: any): Promise<PaperConfiguration> {
    try {
      const { PaperConfiguration } = await import("@shared/schema");
      const template = new PaperConfiguration({
        ...config,
        isTemplate: true
      });
      await template.save();
      return template;
    } catch (error) {
      console.error("Error saving paper template:", error);
      throw error;
    }
  }
}

export const paperGeneratorService = new PaperGeneratorService();
