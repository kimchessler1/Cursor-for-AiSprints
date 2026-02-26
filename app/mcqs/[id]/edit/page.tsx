"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MCQForm } from "@/components/mcq-form";
import { MCQWithChoices } from "@/lib/services/mcq-service";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

interface EditMCQPageProps {
  params: Promise<{ id: string }>;
}

export default function EditMCQPage({ params }: EditMCQPageProps) {
  const router = useRouter();
  const [mcq, setMcq] = useState<MCQWithChoices | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMCQ = async () => {
      try {
        const resolvedParams = await params;
        const response = await fetch(`/api/mcqs/${resolvedParams.id}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError("MCQ not found");
            return;
          }
          throw new Error("Failed to fetch MCQ");
        }

        const data = (await response.json()) as MCQWithChoices;
        console.log("MCQ data from API:", data);
        console.log("Choices data:", data.choices);
        console.log(
          "is_correct values:",
          data.choices.map((c) => ({
            text: c.choice_text,
            is_correct: c.is_correct,
            type: typeof c.is_correct,
          }))
        );
        setMcq(data);
      } catch (error) {
        console.error("Error fetching MCQ:", error);
        setError("Failed to load MCQ");
      } finally {
        setLoading(false);
      }
    };

    fetchMCQ();
  }, [params]);

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !mcq) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Edit MCQ</h1>
            <p className="text-muted-foreground">{error || "MCQ not found"}</p>
          </div>
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground mb-4">
                {error || "The MCQ you're looking for doesn't exist."}
              </p>
              <button
                onClick={() => router.push("/mcqs")}
                className="text-primary hover:underline"
              >
                ← Back to MCQs
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Edit MCQ</h1>
          <p className="text-muted-foreground">
            Update your multiple choice question
          </p>
        </div>
        <MCQForm
          initialData={{
            id: mcq.id,
            title: mcq.title,
            description: mcq.description || "",
            question: mcq.question,
            choices: mcq.choices.map((choice) => ({
              id: choice.id,
              choice_text: choice.choice_text,
              is_correct:
                choice.is_correct === 1 ||
                choice.is_correct === "true" ||
                choice.is_correct === true,
              order_index: choice.order_index,
            })),
          }}
          isEditing={true}
        />
      </div>
    </div>
  );
}
