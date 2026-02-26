"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Plus,
  Trash2,
  GripVertical,
  Save,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";
import { CreateMCQData } from "@/lib/services/mcq-service";

interface FormChoice {
  id: string;
  choice_text: string;
  is_correct: boolean;
  order_index: number;
}

interface MCQFormProps {
  initialData?: CreateMCQData & { id?: string; choices?: unknown[] };
  isEditing?: boolean;
}

export function MCQForm({ initialData, isEditing = false }: MCQFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    question: initialData?.question || "",
  });

  const [choices, setChoices] = useState<FormChoice[]>(
    initialData?.choices?.map((choice) => {
      const c = choice as {
        id: string;
        choice_text: string;
        is_correct: boolean | string | number;
        order_index: number;
      };
      return {
        id: c.id,
        choice_text: c.choice_text,
        is_correct:
          c.is_correct === 1 ||
          c.is_correct === "true" ||
          c.is_correct === true,
        order_index: c.order_index,
      };
    }) || [
      { id: "1", choice_text: "", is_correct: false, order_index: 0 },
      { id: "2", choice_text: "", is_correct: false, order_index: 1 },
    ]
  );

  // Update form when initialData changes (for TEKS generation)
  useEffect(() => {
    if (initialData) {
      console.log("Updating form with initial data:", initialData);

      // Update form data
      setFormData({
        title: initialData.title || "",
        description: initialData.description || "",
        question: initialData.question || "",
      });

      // Update choices if provided
      if (initialData.choices && initialData.choices.length > 0) {
        const updatedChoices = initialData.choices.map((choice) => {
          const c = choice as {
            id: string;
            choice_text: string;
            is_correct: boolean | string | number;
            order_index: number;
          };
          return {
            id: c.id,
            choice_text: c.choice_text,
            is_correct:
              c.is_correct === 1 ||
              c.is_correct === "true" ||
              c.is_correct === true,
            order_index: c.order_index,
          };
        });
        setChoices(updatedChoices);
        console.log("Updated choices:", updatedChoices);
      }
    }
  }, [initialData]);

  // Debug logging for initial data
  useEffect(() => {
    if (initialData?.choices) {
      console.log("Form initial data choices:", initialData.choices);
      console.log("Form choices state:", choices);
      console.log(
        "is_correct values in form:",
        choices.map((c) => ({
          text: c.choice_text,
          is_correct: c.is_correct,
          type: typeof c.is_correct,
        }))
      );
    }
  }, [initialData, choices]);

  // Add new choice
  const addChoice = () => {
    if (choices.length >= 6) return;

    const newChoice: FormChoice = {
      id: Date.now().toString(),
      choice_text: "",
      is_correct: false,
      order_index: choices.length,
    };
    setChoices([...choices, newChoice]);
  };

  // Remove choice
  const removeChoice = (index: number) => {
    if (choices.length <= 2) return;

    const newChoices = choices.filter((_, i) => i !== index);
    // Update order indices
    const updatedChoices = newChoices.map((choice, i) => ({
      ...choice,
      order_index: i,
    }));
    setChoices(updatedChoices);
  };

  // Update choice text
  const updateChoiceText = (index: number, text: string) => {
    const newChoices = [...choices];
    newChoices[index].choice_text = text;
    setChoices(newChoices);
  };

  // Update correct choice
  const updateCorrectChoice = (index: number) => {
    const newChoices = choices.map((choice, i) => ({
      ...choice,
      is_correct: i === index,
    }));
    setChoices(newChoices);
  };

  // Move choice up/down
  const moveChoice = (index: number, direction: "up" | "down") => {
    const newChoices = [...choices];
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newChoices.length) return;

    // Swap choices
    [newChoices[index], newChoices[targetIndex]] = [
      newChoices[targetIndex],
      newChoices[index],
    ];

    // Update order indices
    newChoices.forEach((choice, i) => {
      choice.order_index = i;
    });

    setChoices(newChoices);
  };

  // Validate form
  const validateForm = () => {
    if (!formData.title.trim()) {
      setError("Title is required");
      return false;
    }
    if (!formData.question.trim()) {
      setError("Question is required");
      return false;
    }
    if (choices.length < 2) {
      setError("At least 2 choices are required");
      return false;
    }
    if (choices.some((choice) => !choice.choice_text.trim())) {
      setError("All choices must have text");
      return false;
    }
    if (!choices.some((choice) => choice.is_correct)) {
      setError("Exactly one choice must be marked as correct");
      return false;
    }
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) return;

    setLoading(true);

    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        question: formData.question.trim(),
        choices: choices.map((choice) => ({
          choice_text: choice.choice_text.trim(),
          is_correct: choice.is_correct,
          order_index: choice.order_index,
        })),
      };

      const url = isEditing ? `/api/mcqs/${initialData?.id}` : "/api/mcqs";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error || "Failed to save MCQ");
      }

      // Redirect to MCQs list
      router.push("/mcqs");
    } catch (error) {
      console.error("Error saving MCQ:", error);
      setError(error instanceof Error ? error.message : "Failed to save MCQ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>MCQ Details</CardTitle>
          <CardDescription>
            Provide the basic information for your multiple choice question
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Enter MCQ title"
              maxLength={200}
              required
            />
            <p className="text-sm text-muted-foreground mt-1">
              {formData.title.length}/200 characters
            </p>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Enter optional description"
              maxLength={500}
              rows={3}
            />
            <p className="text-sm text-muted-foreground mt-1">
              {formData.description.length}/500 characters
            </p>
          </div>

          <div>
            <Label htmlFor="question">Question *</Label>
            <Textarea
              id="question"
              value={formData.question}
              onChange={(e) =>
                setFormData({ ...formData, question: e.target.value })
              }
              placeholder="Enter your question"
              maxLength={1000}
              rows={4}
              required
            />
            <p className="text-sm text-muted-foreground mt-1">
              {formData.question.length}/1000 characters
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Answer Choices</CardTitle>
              <CardDescription>
                Add 2-6 answer choices and mark one as correct
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addChoice}
              disabled={choices.length >= 6}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Choice
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {choices.map((choice, index) => (
              <div
                key={choice.id}
                className="flex items-center space-x-4 p-4 border rounded-lg"
              >
                <div className="flex items-center space-x-2">
                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium w-8">
                    {String.fromCharCode(65 + index)}
                  </span>
                </div>

                <div className="flex-1">
                  <Input
                    value={choice.choice_text}
                    onChange={(e) => updateChoiceText(index, e.target.value)}
                    placeholder={`Choice ${index + 1}`}
                    className="mb-2"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant={choice.is_correct ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateCorrectChoice(index)}
                  >
                    {choice.is_correct ? "Correct" : "Mark Correct"}
                  </Button>

                  <div className="flex flex-col space-y-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => moveChoice(index, "up")}
                      disabled={index === 0}
                    >
                      ↑
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => moveChoice(index, "down")}
                      disabled={index === choices.length - 1}
                    >
                      ↓
                    </Button>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeChoice(index)}
                    disabled={choices.length <= 2}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center space-x-2 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>
                {choices.filter((c) => c.is_correct).length === 0
                  ? "Please mark one choice as correct"
                  : choices.filter((c) => c.is_correct).length === 1
                  ? "✓ One correct choice selected"
                  : "Please select exactly one correct choice"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-destructive">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Cancel
        </Button>

        <Button type="submit" disabled={loading}>
          <Save className="w-4 h-4 mr-2" />
          {loading ? "Saving..." : isEditing ? "Update MCQ" : "Create MCQ"}
        </Button>
      </div>
    </form>
  );
}
