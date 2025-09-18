import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database } from "lucide-react";
import type { Question } from "@shared/schema";

export default function QuestionBank() {
  const { data: questionsData, isLoading } = useQuery<{ success: boolean; questions: Question[] }>({
    queryKey: ["/api/questions"],
  });

  const questions = questionsData?.questions || [];

  return (
    <div className="max-w-6xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center" data-testid="text-question-bank-title">
            <Database className="mr-2 h-5 w-5 text-primary" />
            Question Bank
            <Badge variant="secondary" className="ml-2" data-testid="badge-total-questions">
              {questions.length} Total
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading questions...
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="text-no-questions">
              No questions in the bank yet. Generate some questions to see them here.
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((question) => (
                <div
                  key={question.id}
                  className="p-4 border rounded-lg"
                  data-testid={`question-${question.id}`}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge>{question.type}</Badge>
                    <Badge variant="secondary">{question.difficulty}</Badge>
                    {Array.isArray(question.tags) && question.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <p className="font-medium">{question.question}</p>
                  {question.answer && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Answer: {question.answer}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
