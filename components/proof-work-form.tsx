"use client";

import { useState, useRef } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, CloudUpload, ImageIcon, Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { UploadDropzone } from "@/utils/uploadthing";

type TargetOption = { id: string; label: string; hint?: string };

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
    <Button type="submit" disabled={disabled || pending} className="gap-2">
      {pending && <Loader2 style={{ width: 14, height: 14, animation: "g-spin 0.7s linear infinite" }} />}
      {pending ? "Submitting..." : label}
    </Button>
  );
}

type UploadSlotProps = {
  label: string;
  sublabel: string;
  fieldPrefix: string;
  file: { url: string; name: string } | null;
  onUpload: (file: { url: string; name: string }) => void;
  onRemove: () => void;
};

function UploadSlot({ label, sublabel, fieldPrefix, file, onUpload, onRemove }: UploadSlotProps) {
  const [uploading, setUploading] = useState(false);

  const uploaded = !!file;

  return (
    <div style={{
      borderRadius: 14,
      border: uploaded
        ? "1px solid rgba(154,170,120,0.35)"
        : "1px solid rgba(196,172,120,0.14)",
      background: uploaded
        ? "rgba(154,170,120,0.06)"
        : "rgba(196,172,120,0.03)",
      overflow: "hidden",
      transition: "border-color 0.2s ease, background 0.2s ease",
    }}>
      {/* Slot header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 14px",
        borderBottom: `1px solid ${uploaded ? "rgba(154,170,120,0.20)" : "rgba(196,172,120,0.09)"}`,
        background: uploaded ? "rgba(154,170,120,0.05)" : "rgba(196,172,120,0.02)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: uploaded ? "rgba(154,170,120,0.15)" : "rgba(196,172,120,0.08)",
            border: `1px solid ${uploaded ? "rgba(154,170,120,0.30)" : "rgba(196,172,120,0.14)"}`,
          }}>
            {uploaded
              ? <CheckCircle2 style={{ width: 14, height: 14, color: "#AABB88" }} />
              : <ImageIcon style={{ width: 14, height: 14, color: "#6A7888" }} />
            }
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: uploaded ? "#AABB88" : "#EDE6D6" }}>{label}</div>
            <div style={{ fontSize: 10, color: "#6A7888", marginTop: 1 }}>{sublabel}</div>
          </div>
        </div>
        {uploaded && (
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
            background: "rgba(154,170,120,0.13)", color: "#AABB88",
            border: "1px solid rgba(154,170,120,0.28)", borderRadius: 9999,
            padding: "2px 8px",
          }}>Uploaded</span>
        )}
        {!uploaded && (
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
            background: "rgba(196,172,120,0.06)", color: "#6A7888",
            border: "1px solid rgba(196,172,120,0.12)", borderRadius: 9999,
            padding: "2px 8px",
          }}>Required</span>
        )}
      </div>

      {/* Hidden input so the server action can read the URL */}
      {file && (
        <input type="hidden" name={`${fieldPrefix}_0`} value={file.url} />
      )}

      {/* Preview or upload zone */}
      <div style={{ padding: 12 }}>
        {uploaded && file ? (
          <div style={{ position: "relative", borderRadius: 10, overflow: "hidden" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={file.url}
              alt={file.name}
              style={{ width: "100%", height: 180, objectFit: "cover", display: "block", borderRadius: 10 }}
            />
            {/* Overlay on hover */}
            <div style={{
              position: "absolute", inset: 0, borderRadius: 10,
              background: "rgba(13,17,24,0.55)",
              display: "flex", alignItems: "center", justifyContent: "center",
              opacity: 0,
              transition: "opacity 0.2s ease",
            }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
            >
              <button
                type="button"
                onClick={onRemove}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  background: "rgba(160,104,104,0.20)", border: "1px solid rgba(160,104,104,0.40)",
                  borderRadius: 10, padding: "8px 14px", cursor: "pointer",
                  color: "#C08888", fontSize: 12, fontWeight: 600,
                }}
              >
                <X style={{ width: 13, height: 13 }} />
                Remove & re-upload
              </button>
            </div>
            {/* Always-visible remove button */}
            <button
              type="button"
              onClick={onRemove}
              style={{
                position: "absolute", top: 8, right: 8,
                background: "rgba(13,17,24,0.80)", border: "1px solid rgba(196,172,120,0.20)",
                borderRadius: 8, padding: "4px 6px", cursor: "pointer", color: "#EDE6D6",
                display: "flex", alignItems: "center", gap: 4, fontSize: 11,
              }}
            >
              <X style={{ width: 12, height: 12 }} />
              Remove
            </button>
          </div>
        ) : (
          <div style={{ position: "relative" }}>
            {uploading && (
              <div style={{
                position: "absolute", inset: 0, zIndex: 10, borderRadius: 10,
                background: "rgba(13,17,24,0.75)", backdropFilter: "blur(4px)",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8,
              }}>
                <Loader2 style={{ width: 24, height: 24, color: "#C4AC78", animation: "g-spin 0.7s linear infinite" }} />
                <span style={{ fontSize: 12, color: "#A09880" }}>Uploading…</span>
              </div>
            )}
            <UploadDropzone
              endpoint="proofUpload"
              onUploadBegin={() => setUploading(true)}
              onClientUploadComplete={(res) => {
                setUploading(false);
                if (res?.length) onUpload({ url: res[0].url, name: res[0].name });
              }}
              onUploadError={(err: Error) => {
                setUploading(false);
                alert(`Upload failed: ${err.message}`);
              }}
              appearance={{
                container: {
                  border: "1.5px dashed rgba(196,172,120,0.22)",
                  borderRadius: 10,
                  background: "rgba(196,172,120,0.03)",
                  padding: "24px 16px",
                  cursor: "pointer",
                  transition: "border-color 0.2s ease, background 0.2s ease",
                },
                uploadIcon: { color: "#6A7888", width: 32, height: 32 },
                label: { color: "#A09880", fontSize: 13, fontWeight: 500 },
                allowedContent: { color: "#6A7888", fontSize: 11 },
                button: {
                  background: "linear-gradient(135deg, #A08840, #C4AC78)",
                  color: "#0D1118", fontWeight: 600, fontSize: 12,
                  borderRadius: 8, border: "none",
                  boxShadow: "0 0 12px rgba(196,172,120,0.18)",
                },
              }}
            />
          </div>
        )}
      </div>
    </div>
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
  const [startFile, setStartFile] = useState<{ url: string; name: string } | null>(null);
  const [endFile, setEndFile] = useState<{ url: string; name: string } | null>(null);

  const canSubmit = !!startFile && !!endFile && targets.length > 0;
  const selectedTarget = defaultTargetId ?? targets[0]?.id ?? "";
  const selectedHint = targets.find((t) => t.id === selectedTarget)?.hint;

  return (
    <form action={action} style={{
      background: "rgba(196,172,120,0.04)", backdropFilter: "blur(16px)",
      borderTop: "1px solid rgba(196,172,120,0.18)", borderLeft: "1px solid rgba(196,172,120,0.12)",
      borderRight: "1px solid rgba(196,172,120,0.06)", borderBottom: "1px solid rgba(196,172,120,0.04)",
      borderRadius: 18, padding: 24, display: "flex", flexDirection: "column", gap: 20,
    }}>
      <input type="hidden" name="groupId" value={groupId} />

      {/* Title */}
      <div>
        <div style={{ fontSize: 15, fontWeight: 600, color: "#EDE6D6", marginBottom: 3 }}>{title}</div>
        <div style={{ fontSize: 13, color: "#A09880" }}>{description}</div>
      </div>

      {/* Target selector */}
      {targets.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <Label>Target</Label>
          <Select name={targetField} defaultValue={selectedTarget}>
            {targets.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </Select>
          {selectedHint && <p style={{ fontSize: 11, color: "#6A7888", margin: 0 }}>{selectedHint}</p>}
        </div>
      ) : (
        <div style={{
          background: "rgba(196,172,120,0.04)", border: "1px solid rgba(196,172,120,0.09)",
          borderRadius: 12, padding: "14px 16px", fontSize: 13, color: "#6A7888",
        }}>
          No active targets yet.
        </div>
      )}

      {/* Summary */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <Label>Summary / Reflection</Label>
        <Textarea name="reflection" required placeholder="What did you accomplish? What did you learn?" className="min-h-[100px]" />
      </div>

      {/* Upload slots */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <Label>Proof Photos</Label>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#6A7888" }}>
            <div style={{
              width: 16, height: 16, borderRadius: "50%",
              background: startFile ? "rgba(154,170,120,0.20)" : "rgba(196,172,120,0.08)",
              border: `1px solid ${startFile ? "rgba(154,170,120,0.40)" : "rgba(196,172,120,0.16)"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {startFile
                ? <CheckCircle2 style={{ width: 10, height: 10, color: "#AABB88" }} />
                : <span style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(196,172,120,0.30)", display: "block" }} />
              }
            </div>
            Before
            <div style={{ width: 16, height: 1, background: "rgba(196,172,120,0.15)" }} />
            <div style={{
              width: 16, height: 16, borderRadius: "50%",
              background: endFile ? "rgba(154,170,120,0.20)" : "rgba(196,172,120,0.08)",
              border: `1px solid ${endFile ? "rgba(154,170,120,0.40)" : "rgba(196,172,120,0.16)"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {endFile
                ? <CheckCircle2 style={{ width: 10, height: 10, color: "#AABB88" }} />
                : <span style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(196,172,120,0.30)", display: "block" }} />
              }
            </div>
            After
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <UploadSlot
            label="Before / Start"
            sublabel="Photo before you began"
            fieldPrefix="startFileUrl"
            file={startFile}
            onUpload={setStartFile}
            onRemove={() => setStartFile(null)}
          />
          <UploadSlot
            label="After / End"
            sublabel="Photo after completion"
            fieldPrefix="endFileUrl"
            file={endFile}
            onUpload={setEndFile}
            onRemove={() => setEndFile(null)}
          />
        </div>
      </div>

      {/* Footer */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
        paddingTop: 16, borderTop: "1px solid rgba(196,172,120,0.09)",
      }}>
        {/* Checklist */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {[
            { done: targets.length > 0, text: "Target selected" },
            { done: !!startFile,        text: "Before photo uploaded" },
            { done: !!endFile,          text: "After photo uploaded" },
          ].map(({ done, text }) => (
            <div key={text} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
              <div style={{
                width: 14, height: 14, borderRadius: "50%", flexShrink: 0,
                background: done ? "rgba(154,170,120,0.15)" : "rgba(196,172,120,0.06)",
                border: `1px solid ${done ? "rgba(154,170,120,0.35)" : "rgba(196,172,120,0.12)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {done && <CheckCircle2 style={{ width: 9, height: 9, color: "#AABB88" }} />}
              </div>
              <span style={{ color: done ? "#AABB88" : "#6A7888" }}>{text}</span>
            </div>
          ))}
        </div>

        <SubmitButton disabled={!canSubmit} label={submitLabel} />
      </div>
    </form>
  );
}
