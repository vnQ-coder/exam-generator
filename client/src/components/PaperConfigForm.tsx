import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { X, Plus, Calculator, Clock, BookOpen } from "lucide-react";
import type { GeneratePaperInput } from "@shared/schema";

const paperConfigSchema = z.object({
  title: z.string().min(1, "Paper title is required"),
  subject: z.string().min(1, "Subject is required"),
  totalMarks: z.number().min(1, "Total marks must be at least 1"),
  duration: z.number().min(30, "Duration must be at least 30 minutes"),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  questionTypes: z.object({
    mcq: z.object({
      count: z.number().min(0),
      marks: z.number().min(1),
      totalMarks: z.number().min(0)
    }),
    short: z.object({
      count: z.number().min(0),
      marks: z.number().min(1),
      totalMarks: z.number().min(0)
    }),
    long: z.object({
      count: z.number().min(0),
      marks: z.number().min(1),
      totalMarks: z.number().min(0)
    })
  }),
  topics: z.array(z.string()).min(1, "At least one topic is required"),
  difficultyDistribution: z.object({
    easy: z.number().min(0).max(100),
    medium: z.number().min(0).max(100),
    hard: z.number().min(0).max(100)
  }).refine(data => data.easy + data.medium + data.hard === 100, {
    message: "Difficulty distribution must total 100%"
  })
});

type PaperConfigFormData = z.infer<typeof paperConfigSchema>;

interface PaperConfigFormProps {
  onSubmit: (data: GeneratePaperInput) => void;
  onCancel: () => void;
  isLoading?: boolean;
  availableTopics?: string[];
}

export default function PaperConfigForm({ 
  onSubmit, 
  onCancel, 
  isLoading = false, 
  availableTopics = [] 
}: PaperConfigFormProps) {
  const [newTopic, setNewTopic] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PaperConfigFormData>({
    resolver: zodResolver(paperConfigSchema),
    defaultValues: {
      title: "",
      subject: "",
      totalMarks: 100,
      duration: 180,
      difficulty: "medium",
      questionTypes: {
        mcq: { count: 20, marks: 1, totalMarks: 20 },
        short: { count: 20, marks: 2, totalMarks: 40 },
        long: { count: 5, marks: 8, totalMarks: 40 }
      },
      topics: [],
      difficultyDistribution: {
        easy: 30,
        medium: 50,
        hard: 20
      }
    },
  });

  const watchedQuestionTypes = watch("questionTypes");
  const watchedDifficultyDistribution = watch("difficultyDistribution");

  // Auto-calculate total marks
  useEffect(() => {
    const total = watchedQuestionTypes.mcq.totalMarks + 
                  watchedQuestionTypes.short.totalMarks + 
                  watchedQuestionTypes.long.totalMarks;
    setValue("totalMarks", total);
  }, [watchedQuestionTypes, setValue]);

  // Auto-calculate total marks for each question type
  const updateQuestionTypeTotal = (type: keyof typeof watchedQuestionTypes) => {
    const config = watchedQuestionTypes[type];
    const totalMarks = config.count * config.marks;
    setValue(`questionTypes.${type}.totalMarks`, totalMarks);
  };

  const addTopic = () => {
    if (newTopic.trim() && !selectedTopics.includes(newTopic.trim())) {
      const updatedTopics = [...selectedTopics, newTopic.trim()];
      setSelectedTopics(updatedTopics);
      setValue("topics", updatedTopics);
      setNewTopic("");
    }
  };

  const removeTopic = (topicToRemove: string) => {
    const updatedTopics = selectedTopics.filter(topic => topic !== topicToRemove);
    setSelectedTopics(updatedTopics);
    setValue("topics", updatedTopics);
  };

  const handleFormSubmit = (data: PaperConfigFormData) => {
    onSubmit(data);
  };

  const totalMarks = watchedQuestionTypes.mcq.totalMarks + 
                    watchedQuestionTypes.short.totalMarks + 
                    watchedQuestionTypes.long.totalMarks;

  const difficultyTotal = watchedDifficultyDistribution.easy + 
                         watchedDifficultyDistribution.medium + 
                         watchedDifficultyDistribution.hard;

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Paper Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Paper Title *</Label>
              <Input
                id="title"
                {...register("title")}
                placeholder="e.g., Computer Science Midterm Exam"
                className="mt-1"
              />
              {errors.title && (
                <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                {...register("subject")}
                placeholder="e.g., Computer Science"
                className="mt-1"
              />
              {errors.subject && (
                <p className="text-sm text-red-500 mt-1">{errors.subject.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="totalMarks">Total Marks</Label>
              <Input
                id="totalMarks"
                type="number"
                {...register("totalMarks", { valueAsNumber: true })}
                className="mt-1"
                readOnly
              />
              <p className="text-xs text-muted-foreground mt-1">Auto-calculated from question types</p>
            </div>
            <div>
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                {...register("duration", { valueAsNumber: true })}
                className="mt-1"
              />
              {errors.duration && (
                <p className="text-sm text-red-500 mt-1">{errors.duration.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="difficulty">Overall Difficulty</Label>
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
          </div>
        </CardContent>
      </Card>

      {/* Question Type Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Question Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(watchedQuestionTypes).map(([type, config]) => (
            <div key={type} className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium capitalize">{type} Questions</h4>
                <Badge variant="outline">
                  {config.totalMarks} marks total
                </Badge>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor={`${type}-count`}>Count</Label>
                  <Input
                    id={`${type}-count`}
                    type="number"
                    value={config.count}
                    onChange={(e) => {
                      const count = parseInt(e.target.value) || 0;
                      setValue(`questionTypes.${type}.count`, count);
                      updateQuestionTypeTotal(type as keyof typeof watchedQuestionTypes);
                    }}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor={`${type}-marks`}>Marks per Question</Label>
                  <Input
                    id={`${type}-marks`}
                    type="number"
                    value={config.marks}
                    onChange={(e) => {
                      const marks = parseInt(e.target.value) || 1;
                      setValue(`questionTypes.${type}.marks`, marks);
                      updateQuestionTypeTotal(type as keyof typeof watchedQuestionTypes);
                    }}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Total Marks</Label>
                  <Input
                    value={config.totalMarks}
                    className="mt-1"
                    readOnly
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Difficulty Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Difficulty Distribution (%)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            {Object.entries(watchedDifficultyDistribution).map(([level, value]) => (
              <div key={level} className="space-y-2">
                <div className="flex justify-between">
                  <Label className="capitalize">{level}</Label>
                  <span className="text-sm font-medium">{value}%</span>
                </div>
                <Slider
                  value={[value]}
                  onValueChange={([newValue]) => {
                    const remaining = 100 - (Object.values(watchedDifficultyDistribution)
                      .reduce((sum, v) => sum + v, 0) - value);
                    const adjustedValue = Math.min(newValue, remaining);
                    setValue(`difficultyDistribution.${level}`, adjustedValue);
                  }}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>
            ))}
          </div>
          
          {difficultyTotal !== 100 && (
            <p className="text-sm text-red-500">
              Difficulty distribution must total 100%. Current total: {difficultyTotal}%
            </p>
          )}
        </CardContent>
      </Card>

      {/* Topics */}
      <Card>
        <CardHeader>
          <CardTitle>Topics to Cover</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {selectedTopics.map((topic) => (
              <Badge key={topic} variant="secondary" className="flex items-center gap-1">
                {topic}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => removeTopic(topic)}
                />
              </Badge>
            ))}
          </div>
          
          <div className="flex items-center space-x-2">
            <Input
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              placeholder="Add topic..."
              onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTopic())}
            />
            <Button type="button" variant="outline" size="sm" onClick={addTopic}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {availableTopics.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Available topics from your questions:</p>
              <div className="flex flex-wrap gap-2">
                {availableTopics.map((topic) => (
                  <Button
                    key={topic}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (!selectedTopics.includes(topic)) {
                        const updatedTopics = [...selectedTopics, topic];
                        setSelectedTopics(updatedTopics);
                        setValue("topics", updatedTopics);
                      }
                    }}
                    disabled={selectedTopics.includes(topic)}
                  >
                    {topic}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {errors.topics && (
            <p className="text-sm text-red-500">{errors.topics.message}</p>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Paper Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>Total Marks:</strong> {totalMarks}</p>
              <p><strong>Duration:</strong> {watch("duration")} minutes</p>
              <p><strong>Difficulty:</strong> {watch("difficulty")}</p>
            </div>
            <div>
              <p><strong>Total Questions:</strong> {
                watchedQuestionTypes.mcq.count + 
                watchedQuestionTypes.short.count + 
                watchedQuestionTypes.long.count
              }</p>
              <p><strong>Topics:</strong> {selectedTopics.length}</p>
              <p><strong>Distribution:</strong> {watchedDifficultyDistribution.easy}% / {watchedDifficultyDistribution.medium}% / {watchedDifficultyDistribution.hard}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading || difficultyTotal !== 100}>
          {isLoading ? "Generating Paper..." : "Generate Paper"}
        </Button>
      </div>
    </form>
  );
}
