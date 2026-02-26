"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MCQForm } from "@/components/mcq-form";
import { TeksGenerationDialog } from "@/components/teks-generation-dialog";
import { MCQGeneration } from "@/lib/mcq-generation-schema";
import { CreateMCQData } from "@/lib/services/mcq-service";

export default function CreateMCQPage() {
  const [showTeksDialog, setShowTeksDialog] = useState(false);
  const [generatedMCQ, setGeneratedMCQ] = useState<
    (CreateMCQData & { id?: string; choices?: unknown[] }) | undefined
  >(undefined);

  const handleTeksGenerate = (mcqData: MCQGeneration) => {
    // Convert AI-generated data to MCQForm format
    const formData: CreateMCQData & { id?: string; choices?: unknown[] } = {
      title: mcqData.title,
      description: mcqData.description || "",
      question: mcqData.question,
      choices: mcqData.choices.map((choice, index) => ({
        id: `generated-${index}`,
        choice_text: choice.choice_text,
        is_correct: choice.is_correct,
        order_index: choice.order_index,
      })),
    };

    setGeneratedMCQ(formData);
    setShowTeksDialog(false);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Create MCQ</h1>
            <p className="text-muted-foreground">
              Create a new multiple choice question
            </p>
          </div>
          <Button
            onClick={() => setShowTeksDialog(true)}
            variant="outline"
            className="ml-4"
          >
            Generate with TEKS
          </Button>
        </div>

        <MCQForm initialData={generatedMCQ} isEditing={false} />

        <TeksGenerationDialog
          open={showTeksDialog}
          onOpenChange={setShowTeksDialog}
          onGenerate={handleTeksGenerate}
        />
      </div>
    </div>
  );
}
