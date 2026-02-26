"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { TEKS_DATA } from "@/lib/teks";
import {
  TeksGenerationRequest,
  MCQGeneration,
} from "@/lib/mcq-generation-schema";

interface TeksGenerationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (mcq: MCQGeneration) => void;
}

interface FormData {
  subject: string;
  grade_level: string;
  strand_name: string;
  standard_code: string;
  topic_specifics: string;
}

interface FilteredData {
  grades: Array<{ grade_level: string }>;
  strands: Array<{ strand_name: string; code_prefix: string }>;
  standards: Array<{ code: string; description: string }>;
}

export function TeksGenerationDialog({
  open,
  onOpenChange,
  onGenerate,
}: TeksGenerationDialogProps) {
  const [formData, setFormData] = useState<FormData>({
    subject: "",
    grade_level: "",
    strand_name: "",
    standard_code: "",
    topic_specifics: "",
  });

  const [filteredData, setFilteredData] = useState<FilteredData>({
    grades: [],
    strands: [],
    standards: [],
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setFormData({
        subject: "",
        grade_level: "",
        strand_name: "",
        standard_code: "",
        topic_specifics: "",
      });
      setFilteredData({
        grades: [],
        strands: [],
        standards: [],
      });
      setError(null);
    }
  }, [open]);

  // Update filtered data when form data changes
  useEffect(() => {
    if (formData.subject) {
      const subject = TEKS_DATA.subjects.find(
        (s) => s.subject === formData.subject
      );
      setFilteredData((prev) => ({
        ...prev,
        grades: subject?.grades || [],
        strands: [],
        standards: [],
      }));
    } else {
      setFilteredData({
        grades: [],
        strands: [],
        standards: [],
      });
    }
  }, [formData.subject]);

  useEffect(() => {
    if (formData.subject && formData.grade_level) {
      const subject = TEKS_DATA.subjects.find(
        (s) => s.subject === formData.subject
      );
      const grade = subject?.grades.find(
        (g) => g.grade_level === formData.grade_level
      );
      setFilteredData((prev) => ({
        ...prev,
        strands: grade?.strands || [],
        standards: [],
      }));
    }
  }, [formData.subject, formData.grade_level]);

  useEffect(() => {
    if (formData.subject && formData.grade_level && formData.strand_name) {
      const subject = TEKS_DATA.subjects.find(
        (s) => s.subject === formData.subject
      );
      const grade = subject?.grades.find(
        (g) => g.grade_level === formData.grade_level
      );
      const strand = grade?.strands.find(
        (s) => s.strand_name === formData.strand_name
      );
      setFilteredData((prev) => ({
        ...prev,
        standards: strand?.standards || [],
      }));
    }
  }, [formData.subject, formData.grade_level, formData.strand_name]);

  const handleSubjectChange = (value: string) => {
    setFormData({
      subject: value,
      grade_level: "",
      strand_name: "",
      standard_code: "",
      topic_specifics: formData.topic_specifics,
    });
  };

  const handleGradeChange = (value: string) => {
    setFormData({
      ...formData,
      grade_level: value,
      strand_name: "",
      standard_code: "",
    });
  };

  const handleStrandChange = (value: string) => {
    setFormData({
      ...formData,
      strand_name: value,
      standard_code: "",
    });
  };

  const handleStandardChange = (value: string) => {
    setFormData({
      ...formData,
      standard_code: value,
    });
  };

  const handleTopicChange = (value: string) => {
    setFormData({
      ...formData,
      topic_specifics: value,
    });
  };

  const getSelectedStandardDescription = (): string => {
    if (!formData.standard_code) return "";
    return (
      filteredData.standards.find((s) => s.code === formData.standard_code)
        ?.description || ""
    );
  };

  const isFormValid = (): boolean => {
    return !!(
      formData.subject &&
      formData.grade_level &&
      formData.strand_name &&
      formData.standard_code &&
      formData.topic_specifics.trim()
    );
  };

  const handleGenerate = async () => {
    if (!isFormValid()) {
      setError("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const requestData: TeksGenerationRequest = {
        subject: formData.subject,
        grade_level: formData.grade_level,
        strand_name: formData.strand_name,
        standard_code: formData.standard_code,
        standard_description: getSelectedStandardDescription(),
        topic_specifics: formData.topic_specifics,
      };

      const response = await fetch("/api/mcqs/generate-teks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error || "Failed to generate MCQ");
      }

      const generatedMCQ: MCQGeneration = await response.json();
      onGenerate(generatedMCQ);
      onOpenChange(false);
    } catch (err) {
      console.error("MCQ generation error:", err);
      setError(err instanceof Error ? err.message : "Failed to generate MCQ");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Generate MCQ with TEKS Standards</DialogTitle>
          <DialogDescription>
            Select a TEKS standard and provide topic specifics to generate an
            aligned multiple choice question.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <FieldGroup>
            {/* Subject Selection */}
            <Field>
              <FieldLabel htmlFor="subject">Subject *</FieldLabel>
              <Select
                value={formData.subject}
                onValueChange={handleSubjectChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  {TEKS_DATA.subjects.map((subject) => (
                    <SelectItem key={subject.subject} value={subject.subject}>
                      {subject.subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {/* Grade Level Selection */}
            <Field>
              <FieldLabel htmlFor="grade">Grade Level *</FieldLabel>
              <Select
                value={formData.grade_level}
                onValueChange={handleGradeChange}
                disabled={!formData.subject}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a grade level" />
                </SelectTrigger>
                <SelectContent>
                  {filteredData.grades.map((grade) => (
                    <SelectItem
                      key={grade.grade_level}
                      value={grade.grade_level}
                    >
                      {grade.grade_level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {/* Strand Selection */}
            <Field>
              <FieldLabel htmlFor="strand">Strand *</FieldLabel>
              <Select
                value={formData.strand_name}
                onValueChange={handleStrandChange}
                disabled={!formData.grade_level}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a strand" />
                </SelectTrigger>
                <SelectContent>
                  {filteredData.strands.map((strand) => (
                    <SelectItem
                      key={strand.strand_name}
                      value={strand.strand_name}
                    >
                      {strand.strand_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {/* Standard Selection */}
            <Field>
              <FieldLabel htmlFor="standard">Standard *</FieldLabel>
              <Select
                value={formData.standard_code}
                onValueChange={handleStandardChange}
                disabled={!formData.strand_name}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a standard" />
                </SelectTrigger>
                <SelectContent>
                  {filteredData.standards.map((standard) => (
                    <SelectItem key={standard.code} value={standard.code}>
                      <div className="flex flex-col">
                        <span className="font-medium">{standard.code}</span>
                        <span className="text-sm text-muted-foreground">
                          {standard.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {/* Topic/Specifics Input */}
            <Field>
              <FieldLabel htmlFor="topic">Topic/Specifics *</FieldLabel>
              <Textarea
                id="topic"
                placeholder="Describe the specific topic or context for the question (e.g., 'fractions with denominators 2, 4, 8' or 'photosynthesis in plants')"
                value={formData.topic_specifics}
                onChange={(e) => handleTopicChange(e.target.value)}
                rows={3}
              />
              <FieldDescription>
                Provide specific details about the topic to help generate a
                focused question.
              </FieldDescription>
            </Field>
          </FieldGroup>

          {/* Error Display */}
          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={!isFormValid() || isLoading}
          >
            {isLoading ? "Generating..." : "Generate MCQ"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
