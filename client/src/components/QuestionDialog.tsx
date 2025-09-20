import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, Edit } from "lucide-react";
import QuestionForm from "./QuestionForm";
import type { Question, InsertQuestion } from "@shared/schema";

interface QuestionDialogProps {
  question?: Question;
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
}

export default function QuestionDialog({ question, isOpen, onClose, mode }: QuestionDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: InsertQuestion) => {
      const response = await fetch("/api/questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Failed to create question");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertQuestion> }) => {
      const response = await fetch(`/api/questions/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Failed to update question");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      onClose();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/questions/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete question");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      onClose();
    },
  });

  const handleSubmit = (data: InsertQuestion) => {
    if (mode === "create") {
      createMutation.mutate(data);
    } else if (mode === "edit" && question) {
      updateMutation.mutate({ id: question._id.toString(), data });
    }
  };

  const handleDelete = async () => {
    if (!question) return;
    
    if (window.confirm("Are you sure you want to delete this question? This action cannot be undone.")) {
      setIsDeleting(true);
      try {
        await deleteMutation.mutateAsync(question._id.toString());
      } catch (error) {
        console.error("Failed to delete question:", error);
        alert("Failed to delete question. Please try again.");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending || isDeleting;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>
              {mode === "create" ? "Create New Question" : "Edit Question"}
            </DialogTitle>
            {mode === "edit" && question && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isLoading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
        </DialogHeader>
        
        <QuestionForm
          question={question}
          onSubmit={handleSubmit}
          onCancel={onClose}
          isLoading={isLoading}
        />
      </DialogContent>
    </Dialog>
  );
}
