import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Database, Plus, Edit, Trash2, Eye } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import QuestionDialog from "@/components/QuestionDialog";
import type { Question } from "@shared/schema";

export default function QuestionBank() {
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null);

  const { data: questionsData, isLoading, refetch } = useQuery<{ success: boolean; questions: Question[] }>({
    queryKey: ["/api/questions"],
  });

  const questions = questionsData?.questions || [];

  const handleCreateQuestion = () => {
    setSelectedQuestion(undefined);
    setDialogMode("create");
    setIsDialogOpen(true);
  };

  const handleEditQuestion = (question: Question) => {
    setSelectedQuestion(question);
    setDialogMode("edit");
    setIsDialogOpen(true);
  };

  const handleDeleteQuestion = async (question: Question) => {
    try {
      const response = await fetch(`/api/questions/${question._id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete question");
      }
      
      // Refresh the questions list
      refetch();
      setQuestionToDelete(null);
    } catch (error) {
      console.error("Failed to delete question:", error);
      alert("Failed to delete question. Please try again.");
    }
  };

  const handleViewQuestion = (question: Question) => {
    setSelectedQuestion(question);
    setDialogMode("edit");
    setIsDialogOpen(true);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center" data-testid="text-question-bank-title">
              <Database className="mr-2 h-5 w-5 text-primary" />
              Question Bank
              <Badge variant="secondary" className="ml-2" data-testid="badge-total-questions">
                {questions.length} Total
              </Badge>
            </CardTitle>
            <Button onClick={handleCreateQuestion} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Question
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading questions...
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="text-no-questions">
              <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No questions in the bank yet</p>
              <p className="text-sm mb-4">Create your first question to get started</p>
              <Button onClick={handleCreateQuestion} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create Question
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((question) => (
                <div
                  key={question._id}
                  className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                  data-testid={`question-${question._id}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge>{question.type}</Badge>
                        <Badge variant="secondary">{question.difficulty}</Badge>
                        {Array.isArray(question.tags) && question.tags.map((tag) => (
                          <Badge key={tag} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                        {question.confidence > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {question.confidence}% confidence
                          </Badge>
                        )}
                      </div>
                      <p className="font-medium mb-2">{question.question}</p>
                      {question.answer && (
                        <p className="text-sm text-muted-foreground mb-2">
                          <strong>Answer:</strong> {question.answer}
                        </p>
                      )}
                      {Array.isArray(question.options) && question.options.length > 0 && (
                        <div className="text-sm text-muted-foreground mb-2">
                          <strong>Options:</strong>
                          <ul className="list-disc list-inside ml-2">
                            {question.options.map((option, index) => (
                              <li key={index}>{option}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Created: {new Date(question.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewQuestion(question)}
                        title="View/Edit Question"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditQuestion(question)}
                        title="Edit Question"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setQuestionToDelete(question)}
                        title="Delete Question"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Question Dialog */}
      <QuestionDialog
        question={selectedQuestion}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        mode={dialogMode}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!questionToDelete} onOpenChange={() => setQuestionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Question</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this question? This action cannot be undone.
              <br />
              <br />
              <strong>Question:</strong> {questionToDelete?.question}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => questionToDelete && handleDeleteQuestion(questionToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}