import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import type { Question, InsertQuestion } from "@shared/schema";

const questionFormSchema = z.object({
  question: z.string().min(1, "Question is required"),
  type: z.enum(['multiple-choice', 'true-false', 'short-answer', 'essay']),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  sourceText: z.string().min(1, "Source text is required"),
  answer: z.string().optional(),
  options: z.array(z.string()).optional(),
  tags: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(100).default(0),
});

type QuestionFormData = z.infer<typeof questionFormSchema>;

interface QuestionFormProps {
  question?: Question;
  onSubmit: (data: InsertQuestion) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function QuestionForm({ question, onSubmit, onCancel, isLoading = false }: QuestionFormProps) {
  const [newTag, setNewTag] = useState("");
  const [newOption, setNewOption] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<QuestionFormData>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: question ? {
      question: question.question,
      type: question.type,
      difficulty: question.difficulty,
      sourceText: question.sourceText,
      answer: question.answer || "",
      options: question.options || [],
      tags: question.tags || [],
      confidence: question.confidence || 0,
    } : {
      question: "",
      type: "multiple-choice",
      difficulty: "medium",
      sourceText: "",
      answer: "",
      options: [],
      tags: [],
      confidence: 0,
    },
  });

  const watchedType = watch("type");
  const watchedTags = watch("tags") || [];
  const watchedOptions = watch("options") || [];

  const addTag = () => {
    if (newTag.trim() && !watchedTags.includes(newTag.trim())) {
      setValue("tags", [...watchedTags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setValue("tags", watchedTags.filter(tag => tag !== tagToRemove));
  };

  const addOption = () => {
    if (newOption.trim() && !watchedOptions.includes(newOption.trim())) {
      setValue("options", [...watchedOptions, newOption.trim()]);
      setNewOption("");
    }
  };

  const removeOption = (optionToRemove: string) => {
    setValue("options", watchedOptions.filter(option => option !== optionToRemove));
  };

  const handleFormSubmit = (data: QuestionFormData) => {
    const submitData: InsertQuestion = {
      ...data,
      answer: data.answer || undefined,
      options: data.options?.length ? data.options : undefined,
    };
    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div>
        <Label htmlFor="question">Question *</Label>
        <Textarea
          id="question"
          {...register("question")}
          placeholder="Enter your question here..."
          className="mt-1"
        />
        {errors.question && (
          <p className="text-sm text-red-500 mt-1">{errors.question.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="type">Question Type *</Label>
          <Select
            value={watch("type")}
            onValueChange={(value) => setValue("type", value as any)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
              <SelectItem value="true-false">True/False</SelectItem>
              <SelectItem value="short-answer">Short Answer</SelectItem>
              <SelectItem value="essay">Essay</SelectItem>
            </SelectContent>
          </Select>
          {errors.type && (
            <p className="text-sm text-red-500 mt-1">{errors.type.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="difficulty">Difficulty *</Label>
          <Select
            value={watch("difficulty")}
            onValueChange={(value) => setValue("difficulty", value as any)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
          {errors.difficulty && (
            <p className="text-sm text-red-500 mt-1">{errors.difficulty.message}</p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="sourceText">Source Text *</Label>
        <Textarea
          id="sourceText"
          {...register("sourceText")}
          placeholder="Enter the source material this question is based on..."
          className="mt-1"
        />
        {errors.sourceText && (
          <p className="text-sm text-red-500 mt-1">{errors.sourceText.message}</p>
        )}
      </div>

      {watchedType === "multiple-choice" && (
        <div>
          <Label>Options</Label>
          <div className="mt-1 space-y-2">
            {watchedOptions.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Input value={option} readOnly />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeOption(option)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <div className="flex items-center space-x-2">
              <Input
                value={newOption}
                onChange={(e) => setNewOption(e.target.value)}
                placeholder="Add option..."
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addOption())}
              />
              <Button type="button" variant="outline" size="sm" onClick={addOption}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <div>
        <Label htmlFor="answer">Answer</Label>
        <Textarea
          id="answer"
          {...register("answer")}
          placeholder="Enter the correct answer or explanation..."
          className="mt-1"
        />
      </div>

      <div>
        <Label>Tags</Label>
        <div className="mt-1 space-y-2">
          <div className="flex flex-wrap gap-2">
            {watchedTags.map((tag) => (
              <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                {tag}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => removeTag(tag)}
                />
              </Badge>
            ))}
          </div>
          <div className="flex items-center space-x-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Add tag..."
              onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
            />
            <Button type="button" variant="outline" size="sm" onClick={addTag}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="confidence">Confidence Score (0-100)</Label>
        <Input
          id="confidence"
          type="number"
          min="0"
          max="100"
          {...register("confidence", { valueAsNumber: true })}
          className="mt-1"
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : question ? "Update Question" : "Create Question"}
        </Button>
      </div>
    </form>
  );
}
