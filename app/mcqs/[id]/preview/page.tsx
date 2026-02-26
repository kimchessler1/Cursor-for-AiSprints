"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { MCQWithChoices } from "@/lib/services/mcq-service";

interface PreviewMCQPageProps {
  params: Promise<{ id: string }>;
}

export default function PreviewMCQPage({ params }: PreviewMCQPageProps) {
  const router = useRouter();
  const [mcq, setMcq] = useState<MCQWithChoices | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{
    is_correct: boolean;
    selected_choice: { id: string; choice_text: string };
    correct_choice: { id: string; choice_text: string };
  } | null>(null);

  useEffect(() => {
    const fetchMCQ = async () => {
      try {
        const resolvedParams = await params;
        const response = await fetch(`/api/mcqs/${resolvedParams.id}`);

        if (!response.ok) {
          throw new Error("Failed to fetch MCQ");
        }

        const data = (await response.json()) as MCQWithChoices;
        setMcq(data);
      } catch (error) {
        console.error("Error fetching MCQ:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMCQ();
  }, [params]);

  const handleSubmit = async () => {
    if (!selectedChoice || !mcq) return;

    try {
      const response = await fetch(`/api/mcqs/${mcq.id}/attempts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          selected_choice_id: selectedChoice,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit attempt");
      }

      const data = (await response.json()) as {
        is_correct: boolean;
        selected_choice: { id: string; choice_text: string };
        correct_choice: { id: string; choice_text: string };
      };
      setResult(data);
      setSubmitted(true);
    } catch (error) {
      console.error("Error submitting attempt:", error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Skeleton className="h-8 w-32 mb-4" />
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
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

  if (!mcq) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="mb-4">
            <Button variant="outline" onClick={() => router.push("/mcqs")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to MCQs
            </Button>
          </div>
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">MCQ not found</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-4">
          <Button variant="outline" onClick={() => router.push("/mcqs")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to MCQs
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{mcq.title}</CardTitle>
            {mcq.description && (
              <CardDescription>{mcq.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">{mcq.question}</h3>

                <div className="space-y-3">
                  {mcq.choices.map((choice, index) => (
                    <div
                      key={choice.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedChoice === choice.id
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted/50"
                      } ${
                        submitted && choice.is_correct
                          ? "border-green-500 bg-green-50"
                          : submitted &&
                            selectedChoice === choice.id &&
                            !choice.is_correct
                          ? "border-red-500 bg-red-50"
                          : ""
                      }`}
                      onClick={() => !submitted && setSelectedChoice(choice.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-6 h-6 border rounded-full flex items-center justify-center text-sm font-medium">
                          {String.fromCharCode(65 + index)}
                        </div>
                        <span className="flex-1">{choice.choice_text}</span>
                        {submitted && choice.is_correct && (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                        {submitted &&
                          selectedChoice === choice.id &&
                          !choice.is_correct && (
                            <XCircle className="w-5 h-5 text-red-500" />
                          )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {!submitted ? (
                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    Select your answer above
                  </div>
                  <Button onClick={handleSubmit} disabled={!selectedChoice}>
                    Submit Answer
                  </Button>
                </div>
              ) : (
                result && (
                  <div className="space-y-4">
                    <div
                      className={`p-4 rounded-lg ${
                        result.is_correct
                          ? "bg-green-50 border border-green-200"
                          : "bg-red-50 border border-red-200"
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        {result.is_correct ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                        <span
                          className={`font-semibold ${
                            result.is_correct
                              ? "text-green-700"
                              : "text-red-700"
                          }`}
                        >
                          {result.is_correct ? "Correct!" : "Incorrect"}
                        </span>
                      </div>
                      <p className="text-sm mt-2">
                        {result.is_correct
                          ? "Well done! You selected the correct answer."
                          : `The correct answer was: ${result.correct_choice.choice_text}`}
                      </p>
                    </div>

                    <div className="flex justify-between items-center">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSubmitted(false);
                          setSelectedChoice(null);
                          setResult(null);
                        }}
                      >
                        Try Again
                      </Button>
                      <Button onClick={() => router.push("/mcqs")}>
                        Back to MCQs
                      </Button>
                    </div>
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
