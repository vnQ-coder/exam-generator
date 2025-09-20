import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Search, Brain, Database, Lightbulb, ExternalLink } from "lucide-react";

interface RAGResponse {
  answer: string;
  sources: Array<{
    questionId: string;
    question: string;
    answer?: string;
    score: number;
    type: string;
    difficulty: string;
    tags: string[];
  }>;
  usedRAG: boolean;
  confidence: number;
}

export default function RAGSearch() {
  const [query, setQuery] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: ragData, isLoading, error } = useQuery<RAGResponse>({
    queryKey: ["/api/rag/search", searchQuery],
    enabled: !!searchQuery,
    queryFn: async () => {
      const response = await fetch("/api/rag/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: searchQuery, limit: 5, threshold: 0.7 }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to search knowledge base");
      }
      
      const result = await response.json();
      return result;
    },
  });

  const { data: statsData } = useQuery({
    queryKey: ["/api/rag/stats"],
    queryFn: async () => {
      const response = await fetch("/api/rag/stats");
      if (!response.ok) {
        throw new Error("Failed to get stats");
      }
      return response.json();
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchQuery(query.trim());
    }
  };

  const handleClear = () => {
    setQuery("");
    setSearchQuery("");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Knowledge Search
            {statsData?.stats && (
              <Badge variant="secondary" className="ml-2">
                {statsData.stats.count} items in knowledge base
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask anything about your questions and answers..."
                className="flex-1"
              />
              <Button type="submit" disabled={!query.trim() || isLoading}>
                <Search className="h-4 w-4 mr-2" />
                {isLoading ? "Searching..." : "Search"}
              </Button>
              {searchQuery && (
                <Button type="button" variant="outline" onClick={handleClear}>
                  Clear
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      {error && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              Error: {error.message}
            </div>
          </CardContent>
        </Card>
      )}

      {ragData && (
        <div className="space-y-4">
          {/* Answer */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {ragData.usedRAG ? (
                  <>
                    <Database className="h-5 w-5 text-green-600" />
                    Answer from Knowledge Base
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      {Math.round(ragData.confidence * 100)}% confidence
                    </Badge>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      RAG Powered
                    </Badge>
                  </>
                ) : (
                  <>
                    <Lightbulb className="h-5 w-5 text-yellow-600" />
                    AI Generated Answer
                    <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                      No relevant content found
                    </Badge>
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      Direct AI
                    </Badge>
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                {ragData.answer.split('\n').map((line, index) => (
                  <p key={index} className="mb-2">
                    {line}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Debug Info */}
          <Card className="bg-gray-50">
            <CardHeader>
              <CardTitle className="text-sm text-gray-600">Debug Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-2">
                <p><strong>Search Method:</strong> {ragData.usedRAG ? "RAG (Knowledge Base)" : "Direct AI"}</p>
                <p><strong>Confidence:</strong> {Math.round(ragData.confidence * 100)}%</p>
                <p><strong>Sources Found:</strong> {ragData.sources.length}</p>
                {ragData.sources.length > 0 && (
                  <div>
                    <p><strong>Source Questions:</strong></p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      {ragData.sources.map((source, index) => (
                        <li key={index} className="text-xs">
                          "{source.question}" (Score: {Math.round(source.score * 100)}%)
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Sources */}
          {ragData.sources.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Sources ({ragData.sources.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {ragData.sources.map((source, index) => (
                    <div
                      key={index}
                      className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge>{source.type}</Badge>
                          <Badge variant="secondary">{source.difficulty}</Badge>
                          <Badge variant="outline">
                            {Math.round(source.score * 100)}% match
                          </Badge>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`/question-bank`, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </div>
                      <h4 className="font-medium mb-2">{source.question}</h4>
                      {source.answer && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {source.answer}
                        </p>
                      )}
                      {source.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {source.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* No Results */}
      {searchQuery && !isLoading && !ragData && !error && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No results found</p>
              <p className="text-sm">
                Try rephrasing your question or adding more questions to the knowledge base.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
