import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FileText, Clock, Calculator, BookOpen, Download, ArrowLeft } from "lucide-react";
import type { QuestionPaper } from "@shared/schema";

interface PaperViewerProps {
  paper: QuestionPaper;
  onBack: () => void;
  onDownload?: () => void;
}

export default function PaperViewer({ paper, onBack, onDownload }: PaperViewerProps) {
  const formatQuestionNumber = (index: number, section: string) => {
    const sectionPrefix = section === 'MCQ' ? 'Q' : section === 'Short Answer' ? 'Q' : 'Q';
    return `${sectionPrefix}${index + 1}`;
  };

  const groupQuestionsBySection = () => {
    const sections: Record<string, Array<{ question: any; index: number }>> = {};
    
    paper.questions.forEach((q, index) => {
      const section = q.section || 'General';
      if (!sections[section]) {
        sections[section] = [];
      }
      sections[section].push({ question: q, index });
    });
    
    return sections;
  };

  const sections = groupQuestionsBySection();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Papers
        </Button>
        {onDownload && (
          <Button onClick={onDownload} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
        )}
      </div>

      {/* Paper Header */}
      <Card>
        <CardHeader className="text-center">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">{paper.title}</h1>
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                <span>{paper.subject}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calculator className="h-4 w-4" />
                <span>{paper.totalMarks} marks</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{paper.duration} minutes</span>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Badge variant="outline">{paper.difficulty}</Badge>
              <Badge variant="secondary">{paper.questions.length} questions</Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1 text-sm">
            <li>• Read all questions carefully before answering</li>
            <li>• Answer all questions in the spaces provided</li>
            <li>• Show all your work for long answer questions</li>
            <li>• Time limit: {paper.duration} minutes</li>
            <li>• Total marks: {paper.totalMarks}</li>
          </ul>
        </CardContent>
      </Card>

      {/* Questions by Section */}
      {Object.entries(sections).map(([sectionName, questions]) => (
        <Card key={sectionName}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {sectionName} ({questions.length} questions, {questions.reduce((sum, q) => sum + q.question.marks, 0)} marks)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {questions.map(({ question, index }, questionIndex) => (
              <div key={index} className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                    {formatQuestionNumber(questionIndex, sectionName)}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {question.type}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {question.difficulty}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {question.marks} marks
                      </Badge>
                    </div>
                    <p className="text-sm leading-relaxed">{question.question}</p>
                    
                    {/* Answer space for non-MCQ questions */}
                    {question.type !== 'multiple-choice' && (
                      <div className="mt-4">
                        <div className="border border-dashed border-gray-300 rounded p-4 min-h-[100px] bg-gray-50">
                          <p className="text-xs text-gray-500">Answer space</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {questionIndex < questions.length - 1 && <Separator />}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {/* Paper Footer */}
      <Card className="bg-gray-50">
        <CardContent className="p-4">
          <div className="text-center text-sm text-muted-foreground">
            <p>End of Paper</p>
            <p className="mt-1">Total Questions: {paper.questions.length} | Total Marks: {paper.totalMarks}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
