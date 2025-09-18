import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Brain, FileText, Settings, Trash2, Copy, Edit, Download, Save } from "lucide-react";
import type { Question, GenerateQuestionsRequest } from "@shared/schema";

export default function Home() {
  const [sourceText, setSourceText] = useState("");
  const [questionType, setQuestionType] = useState<"mixed" | "multiple-choice" | "true-false" | "short-answer" | "essay">("mixed");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [questionCount, setQuestionCount] = useState(5);
  const [includeAnswers, setIncludeAnswers] = useState(true);
  const [autoTag, setAutoTag] = useState(true);
  const [contextAware, setContextAware] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: questionsData, isLoading: questionsLoading } = useQuery<{ success: boolean; questions: Question[] }>({
    queryKey: ["/api/questions"],
  });

  const generateMutation = useMutation({
    mutationFn: async (data: GenerateQuestionsRequest) => {
      const response = await apiRequest("POST", "/api/questions/generate", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      toast({
        title: "Questions Generated",
        description: "AI has successfully generated your questions!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate questions. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/questions/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      toast({
        title: "Question Deleted",
        description: "Question has been removed successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete question.",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    if (!sourceText.trim()) {
      toast({
        title: "Source Text Required",
        description: "Please enter some text to generate questions from.",
        variant: "destructive",
      });
      return;
    }

    generateMutation.mutate({
      sourceText,
      questionType,
      difficulty,
      questionCount,
      includeAnswers,
      autoTag,
      contextAware,
    });
  };

  const handleClearText = () => {
    setSourceText("");
  };

  const handleCopyQuestion = (question: Question) => {
    navigator.clipboard.writeText(question.question);
    toast({
      title: "Copied",
      description: "Question copied to clipboard.",
    });
  };

  const questions = questionsData?.questions || [];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Input Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Text Input */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center" data-testid="text-source-title">
                <FileText className="mr-2 h-5 w-5 text-primary" />
                Source Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                className="min-h-64 resize-none"
                placeholder="Paste your text content here to generate questions from. This could be educational material, articles, documentation, or any content you want to create questions about..."
                data-testid="input-source-text"
              />
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-muted-foreground" data-testid="text-character-count">
                  {sourceText.length} characters
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearText}
                  data-testid="button-clear-text"
                >
                  <Trash2 className="mr-1 h-4 w-4" />
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Generation Controls */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center" data-testid="text-generation-settings">
                <Settings className="mr-2 h-5 w-5 text-primary" />
                Generation Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Question Type */}
              <div>
                <Label htmlFor="question-type">Question Type</Label>
                <Select value={questionType} onValueChange={(value: any) => setQuestionType(value)}>
                  <SelectTrigger data-testid="select-question-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mixed">Mixed Types</SelectItem>
                    <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                    <SelectItem value="true-false">True/False</SelectItem>
                    <SelectItem value="short-answer">Short Answer</SelectItem>
                    <SelectItem value="essay">Essay</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Difficulty Level */}
              <div>
                <Label>Difficulty Level</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {(["easy", "medium", "hard"] as const).map((level) => (
                    <Button
                      key={level}
                      variant={difficulty === level ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDifficulty(level)}
                      data-testid={`button-difficulty-${level}`}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Number of Questions */}
              <div>
                <Label htmlFor="question-count">Number of Questions</Label>
                <Input
                  id="question-count"
                  type="number"
                  value={questionCount}
                  onChange={(e) => setQuestionCount(parseInt(e.target.value) || 1)}
                  min={1}
                  max={20}
                  data-testid="input-question-count"
                />
              </div>

              {/* Advanced Options */}
              <div className="space-y-3">
                <Label>Advanced Options</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-answers"
                      checked={includeAnswers}
                      onCheckedChange={(checked) => setIncludeAnswers(!!checked)}
                      data-testid="checkbox-include-answers"
                    />
                    <Label htmlFor="include-answers" className="text-sm">Include answers</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="auto-tag"
                      checked={autoTag}
                      onCheckedChange={(checked) => setAutoTag(!!checked)}
                      data-testid="checkbox-auto-tag"
                    />
                    <Label htmlFor="auto-tag" className="text-sm">Auto-tag questions</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="context-aware"
                      checked={contextAware}
                      onCheckedChange={(checked) => setContextAware(!!checked)}
                      data-testid="checkbox-context-aware"
                    />
                    <Label htmlFor="context-aware" className="text-sm">Context-aware generation</Label>
                  </div>
                </div>
              </div>

              {/* Generate Button */}
              <Button
                className="w-full"
                onClick={handleGenerate}
                disabled={generateMutation.isPending || !sourceText.trim()}
                data-testid="button-generate-questions"
              >
                <Brain className="mr-2 h-4 w-4" />
                {generateMutation.isPending ? "Generating..." : "Generate Questions"}
              </Button>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base" data-testid="text-quick-stats-title">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Generated:</span>
                  <span className="font-medium" data-testid="text-total-generated">
                    {questions.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Session:</span>
                  <span className="font-medium" data-testid="text-session-count">
                    {questions.filter(q => {
                      const today = new Date();
                      const questionDate = new Date(q.createdAt!);
                      return questionDate.toDateString() === today.toDateString();
                    }).length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Generated Questions Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center" data-testid="text-generated-questions-title">
              <Brain className="mr-2 h-5 w-5 text-primary" />
              Generated Questions
              <Badge variant="secondary" className="ml-2" data-testid="badge-question-count">
                {questions.length}
              </Badge>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" data-testid="button-export">
                <Download className="mr-1 h-4 w-4" />
                Export
              </Button>
              <Button variant="outline" size="sm" data-testid="button-save-all">
                <Save className="mr-1 h-4 w-4" />
                Save All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {questionsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-4 border rounded-lg">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-16 w-full mb-2" />
                  <div className="flex space-x-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="text-no-questions">
              No questions generated yet. Enter some source content and click "Generate Questions" to get started.
            </div>
          ) : (
            <div className="space-y-6">
              {questions.map((question) => (
                <div
                  key={question.id}
                  className="p-4 border rounded-lg bg-muted/30"
                  data-testid={`card-question-${question.id}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Badge data-testid={`badge-type-${question.id}`}>
                        {question.type}
                      </Badge>
                      <Badge variant="secondary" data-testid={`badge-difficulty-${question.id}`}>
                        {question.difficulty}
                      </Badge>
                      {Array.isArray(question.tags) && question.tags.map((tag) => (
                        <Badge key={tag} variant="outline" data-testid={`badge-tag-${tag}`}>
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" data-testid={`button-edit-${question.id}`}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyQuestion(question)}
                        data-testid={`button-copy-${question.id}`}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate(question.id)}
                        disabled={deleteMutation.isPending}
                        data-testid={`button-delete-${question.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  <h4 className="font-semibold mb-3" data-testid={`text-question-${question.id}`}>
                    {question.question}
                  </h4>

                  {question.type === "multiple-choice" && Array.isArray(question.options) && (
                    <div className="space-y-2 mb-3">
                      {question.options.map((option, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <span className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-sm">
                            {String.fromCharCode(65 + index)}
                          </span>
                          <span>{option}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {question.type === "true-false" && (
                    <div className="flex items-center space-x-4 mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-sm font-medium">
                          T
                        </span>
                        <span>True</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-sm">
                          F
                        </span>
                        <span>False</span>
                      </div>
                    </div>
                  )}

                  {question.answer && (
                    <div className="p-3 bg-muted rounded-md mb-3">
                      <p className="text-sm">
                        <strong>Answer:</strong> {question.answer}
                      </p>
                    </div>
                  )}

                  <div className="text-sm text-muted-foreground flex items-center justify-between">
                    <span data-testid={`text-timestamp-${question.id}`}>
                      Generated: {question.createdAt ? new Date(question.createdAt).toLocaleString() : 'Unknown'}
                    </span>
                    <span data-testid={`text-confidence-${question.id}`}>
                      Confidence: {question.confidence}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
