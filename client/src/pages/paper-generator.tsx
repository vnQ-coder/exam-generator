import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, Download, Eye, Trash2, Clock, Calculator, BookOpen } from "lucide-react";
import PaperConfigForm from "@/components/PaperConfigForm";
import PaperViewer from "@/components/PaperViewer";
import type { GeneratePaperInput, QuestionPaper } from "@shared/schema";

export default function PaperGenerator() {
  const [showConfigForm, setShowConfigForm] = useState(false);
  const [viewingPaper, setViewingPaper] = useState<QuestionPaper | null>(null);
  const queryClient = useQueryClient();

  const { data: papersData, isLoading: papersLoading } = useQuery<{ success: boolean; papers: QuestionPaper[] }>({
    queryKey: ["/api/papers"],
  });

  const { data: topicsData } = useQuery<{ success: boolean; topics: string[] }>({
    queryKey: ["/api/papers/topics"],
  });

  const generateMutation = useMutation({
    mutationFn: async (data: GeneratePaperInput) => {
      const response = await fetch("/api/papers/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error("Failed to generate paper");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/papers"] });
      setShowConfigForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (paperId: string) => {
      const response = await fetch(`/api/papers/${paperId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete paper");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/papers"] });
    },
  });

  const handleGeneratePaper = (data: GeneratePaperInput) => {
    generateMutation.mutate(data);
  };

  const handleDeletePaper = (paperId: string) => {
    if (window.confirm("Are you sure you want to delete this paper?")) {
      deleteMutation.mutate(paperId);
    }
  };

  const papers = papersData?.papers || [];
  const availableTopics = topicsData?.topics || [];

  if (viewingPaper) {
    return (
      <PaperViewer
        paper={viewingPaper}
        onBack={() => setViewingPaper(null)}
        onDownload={() => {
          // TODO: Implement PDF download
          console.log("Download paper:", viewingPaper._id);
        }}
      />
    );
  }

  if (showConfigForm) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Generate New Paper
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PaperConfigForm
              onSubmit={handleGeneratePaper}
              onCancel={() => setShowConfigForm(false)}
              isLoading={generateMutation.isPending}
              availableTopics={availableTopics}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Question Paper Generator</h1>
          <p className="text-muted-foreground">
            Create structured question papers with AI-powered question selection
          </p>
        </div>
        <Button onClick={() => setShowConfigForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Generate Paper
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <FileText className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{papers.length}</p>
                <p className="text-sm text-muted-foreground">Total Papers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{availableTopics.length}</p>
                <p className="text-sm text-muted-foreground">Available Topics</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Calculator className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">
                  {papers.reduce((sum, paper) => sum + paper.questions.length, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Questions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">
                  {papers.length > 0 ? Math.round(papers.reduce((sum, paper) => sum + paper.duration, 0) / papers.length) : 0}
                </p>
                <p className="text-sm text-muted-foreground">Avg Duration (min)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Papers List */}
      <Card>
        <CardHeader>
          <CardTitle>Generated Papers</CardTitle>
        </CardHeader>
        <CardContent>
          {papersLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading papers...
            </div>
          ) : papers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No papers generated yet</p>
              <p className="text-sm mb-4">Create your first question paper to get started</p>
              <Button onClick={() => setShowConfigForm(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Generate Paper
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {papers.map((paper) => (
                <div
                  key={paper._id}
                  className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-lg">{paper.title}</h3>
                        <Badge variant="outline">{paper.subject}</Badge>
                        <Badge variant="secondary">{paper.difficulty}</Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <Calculator className="h-4 w-4" />
                          <span>{paper.totalMarks} marks</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{paper.duration} min</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          <span>{paper.questions.length} questions</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <BookOpen className="h-4 w-4" />
                          <span>{paper.configuration.topics.length} topics</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-3">
                        {paper.configuration.topics.map((topic) => (
                          <Badge key={topic} variant="outline" className="text-xs">
                            {topic}
                          </Badge>
                        ))}
                      </div>

                      <div className="text-xs text-muted-foreground">
                        Created: {new Date(paper.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewingPaper(paper)}
                        title="View Paper"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // TODO: Implement download functionality
                          console.log("Download paper:", paper._id);
                        }}
                        title="Download Paper"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeletePaper(paper._id.toString())}
                        title="Delete Paper"
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
    </div>
  );
}
