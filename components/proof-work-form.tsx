"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { UploadDropzone } from "@/utils/uploadthing";

type TargetOption = {
  id: string;
  label: string;
  hint?: string;
};

type ProofWorkFormProps = {
  action: (formData: FormData) => Promise<void>;
  groupId: string;
  targetField: "taskId" | "assignmentQuestionId";
  targets: TargetOption[];
  defaultTargetId?: string | null;
  title: string;
  description: string;
  submitLabel: string;
};

function SubmitButton({ disabled, label }: { disabled: boolean; label: string }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={disabled || pending} className="w-full md:w-auto">
      {pending ? "Submitting..." : label}
    </Button>
  );
}

export function ProofWorkForm({
  action,
  groupId,
  targetField,
  targets,
  defaultTargetId,
  title,
  description,
  submitLabel,
}: ProofWorkFormProps) {
  const [startFiles, setStartFiles] = useState<{ url: string; name: string }[]>([]);
  const [endFiles, setEndFiles] = useState<{ url: string; name: string }[]>([]);

  const canSubmit = startFiles.length > 0 && endFiles.length > 0;
  const selectedTarget = defaultTargetId ?? targets[0]?.id ?? "";
  const selectedHint = targets.find((target) => target.id === selectedTarget)?.hint;

  return (
    <form action={action} className="space-y-6 rounded-3xl border border-border bg-card/90 p-5 backdrop-blur-xl md:p-6">
      <input type="hidden" name="groupId" value={groupId} />

      <div className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      {targets.length > 0 ? (
        <div className="space-y-2">
          <Label className="text-muted-foreground">Target</Label>
          <select
            name={targetField}
            defaultValue={selectedTarget}
            className="w-full rounded-2xl border border-border bg-background/70 p-3 text-sm text-foreground focus:border-ring focus:outline-none"
          >
            {targets.map((target) => (
              <option key={target.id} value={target.id}>
                {target.label}
              </option>
            ))}
          </select>
          {selectedHint ? <p className="text-xs text-muted-foreground">{selectedHint}</p> : null}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-background/50 p-4 text-sm text-muted-foreground">
          No active targets yet.
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-muted-foreground">Summary</Label>
        <textarea
          name="reflection"
          required
          placeholder="What did you learn or accomplish?"
          className="min-h-[120px] w-full rounded-2xl border border-border bg-background/70 p-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3 rounded-2xl border border-border bg-background/50 p-4">
          <div className="flex items-center justify-between">
            <Label className="text-muted-foreground">Before / Start</Label>
            {startFiles.length > 0 ? <span className="text-xs text-primary">Uploaded</span> : null}
          </div>
          {startFiles.length > 0 ? (
            <div className="space-y-2">
              {startFiles.map((file, index) => (
                <div key={file.url} className="relative overflow-hidden rounded-2xl border border-border bg-background/70">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={file.url} alt={file.name} className="h-44 w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setStartFiles((current) => current.filter((_, currentIndex) => currentIndex !== index))}
                    className="absolute right-2 top-2 rounded-full border border-border bg-background/80 p-1 text-foreground shadow-sm"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <UploadDropzone
              endpoint="proofUpload"
              onClientUploadComplete={(res) => {
                if (res?.length) {
                  setStartFiles([{ url: res[0].url, name: res[0].name }]);
                }
              }}
              onUploadError={(error: Error) => alert(error.message)}
              className="border-border bg-background/70 ut-button:bg-primary ut-button:hover:bg-primary/90 ut-label:text-primary"
            />
          )}
        </div>

        <div className="space-y-3 rounded-2xl border border-border bg-background/50 p-4">
          <div className="flex items-center justify-between">
            <Label className="text-muted-foreground">After / End</Label>
            {endFiles.length > 0 ? <span className="text-xs text-primary">Uploaded</span> : null}
          </div>
          {endFiles.length > 0 ? (
            <div className="space-y-2">
              {endFiles.map((file, index) => (
                <div key={file.url} className="relative overflow-hidden rounded-2xl border border-border bg-background/70">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={file.url} alt={file.name} className="h-44 w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setEndFiles((current) => current.filter((_, currentIndex) => currentIndex !== index))}
                    className="absolute right-2 top-2 rounded-full border border-border bg-background/80 p-1 text-foreground shadow-sm"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <UploadDropzone
              endpoint="proofUpload"
              onClientUploadComplete={(res) => {
                if (res?.length) {
                  setEndFiles([{ url: res[0].url, name: res[0].name }]);
                }
              }}
              onUploadError={(error: Error) => alert(error.message)}
              className="border-border bg-background/70 ut-button:bg-primary ut-button:hover:bg-primary/90 ut-label:text-primary"
            />
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CheckCircle className="h-4 w-4 text-primary" />
          JPG/PNG images only, with before and after proof required.
        </div>
        <SubmitButton disabled={!canSubmit || targets.length === 0} label={submitLabel} />
      </div>
    </form>
  );
}
