"use client";

import { useState } from "react";
import { Layers3, UserRound, Users } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type GroupMemberOption = {
  userId: string;
  name: string;
  role: "member" | "admin";
};

type GroupOption = {
  id: string;
  name: string;
  taskPostingMode: "ADMINS_ONLY" | "ALL_MEMBERS";
  users: GroupMemberOption[];
};

type MembershipOption = {
  groupId: string;
  role: "member" | "admin";
  group: GroupOption;
};

type TaskComposerMode = "PERSONAL" | "GROUP_ALL" | "GROUP_SELECTED";

type TaskFormFieldsProps = {
  memberships: MembershipOption[];
  activeGroupId: string | null;
  defaultDueDate: string;
};

function ModeButton({
  active,
  disabled,
  icon: Icon,
  label,
  description,
  onClick,
}: {
  active: boolean;
  disabled?: boolean;
  icon: typeof UserRound;
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex min-h-20 flex-col items-start gap-2 rounded-2xl border px-4 py-3 text-left transition",
        active
          ? "border-primary/30 bg-primary/10 text-primary shadow-[0_10px_30px_rgba(196,172,120,0.08)]"
          : "border-white/8 bg-white/[0.03] text-white/75 hover:border-primary/15 hover:bg-primary/5 hover:text-white",
        disabled && "cursor-not-allowed opacity-45 hover:border-white/8 hover:bg-white/[0.03] hover:text-white/75",
      )}
    >
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        <span className="text-sm font-semibold">{label}</span>
      </div>
      <span className="text-xs leading-5 text-white/50">{description}</span>
    </button>
  );
}

export function TaskFormFields({
  memberships,
  activeGroupId,
  defaultDueDate,
}: TaskFormFieldsProps) {
  const [selectedGroupId, setSelectedGroupId] = useState(activeGroupId ?? memberships[0]?.groupId ?? "");
  const [taskMode, setTaskMode] = useState<TaskComposerMode>("PERSONAL");
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([]);

  const selectedMembership =
    memberships.find((membership) => membership.groupId === selectedGroupId) ??
    memberships[0] ??
    null;
  const selectedGroup = selectedMembership?.group ?? null;
  const groupMembers = selectedGroup?.users ?? [];
  const canBroadcastToGroup = Boolean(
    selectedMembership &&
      (selectedMembership.role === "admin" || selectedMembership.group.taskPostingMode === "ALL_MEMBERS"),
  );
  const canAssignSelectedMembers = selectedMembership?.role === "admin";
  const visibleAssigneeIds = selectedAssigneeIds.filter((userId) =>
    groupMembers.some((member) => member.userId === userId),
  );
  const effectiveTaskMode =
    taskMode === "GROUP_SELECTED" && !canAssignSelectedMembers
      ? canBroadcastToGroup
        ? "GROUP_ALL"
        : "PERSONAL"
      : taskMode === "GROUP_ALL" && !canBroadcastToGroup
        ? "PERSONAL"
        : taskMode;
  const assignmentMode =
    effectiveTaskMode === "PERSONAL"
      ? "SELF"
      : effectiveTaskMode === "GROUP_SELECTED"
        ? "SELECTED_MEMBERS"
        : "ALL_MEMBERS";

  const toggleAssignee = (userId: string) => {
    setSelectedAssigneeIds((current) =>
      current.includes(userId)
        ? current.filter((value) => value !== userId)
        : [...current, userId],
    );
  };

  return (
    <>
      <input type="hidden" name="scope" value={effectiveTaskMode === "PERSONAL" ? "PERSONAL" : "GROUP"} />
      <input type="hidden" name="assignmentMode" value={assignmentMode} />

      <div className="space-y-2">
        <Label htmlFor="task-group">Group</Label>
        <Select
          id="task-group"
          name="groupId"
          value={selectedGroupId}
          onChange={(event) => setSelectedGroupId(event.target.value)}
        >
          {memberships.map((membership) => (
            <option key={membership.groupId} value={membership.groupId}>
              {membership.group.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-3">
        <div>
          <Label>Assignment</Label>
          <p className="mt-1 text-xs text-white/45">
            Choose whether this should stay personal, reach the whole group, or go to selected members.
          </p>
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          <ModeButton
            active={effectiveTaskMode === "PERSONAL"}
            icon={UserRound}
            label="Personal"
            description="Only visible in your own task list."
            onClick={() => setTaskMode("PERSONAL")}
          />
          <ModeButton
            active={effectiveTaskMode === "GROUP_ALL"}
            disabled={!canBroadcastToGroup}
            icon={Users}
            label="Whole Group"
            description="Assign the same task to every member in this group."
            onClick={() => setTaskMode("GROUP_ALL")}
          />
          <ModeButton
            active={effectiveTaskMode === "GROUP_SELECTED"}
            disabled={!canAssignSelectedMembers}
            icon={Layers3}
            label="Selected Members"
            description="Leaders can target one or more specific members."
            onClick={() => setTaskMode("GROUP_SELECTED")}
          />
        </div>

        {!canBroadcastToGroup ? (
          <p className="text-xs text-amber-200/70">
            This group only allows leaders to post group tasks. Personal tasks are still available.
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="task-title">Title</Label>
        <Input
          id="task-title"
          name="title"
          placeholder="Solve 2 medium Leetcode questions"
          required
          autoComplete="off"
          inputMode="text"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="task-details">Details</Label>
        <Textarea
          id="task-details"
          name="details"
          placeholder="What should be done?"
          autoComplete="off"
          inputMode="text"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="task-due">Due date</Label>
          <Input
            id="task-due"
            name="dueAt"
            type="datetime-local"
            defaultValue={defaultDueDate}
            autoComplete="off"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="task-category">Category</Label>
          <Select id="task-category" name="category" defaultValue="CUSTOM">
            <option value="DSA">DSA</option>
            <option value="DEVELOPMENT">Development</option>
            <option value="REVISION">Revision</option>
            <option value="INTERVIEW_PREP">Interview Prep</option>
            <option value="READING">Reading</option>
            <option value="CUSTOM">Custom</option>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="task-priority">Priority</Label>
          <Select id="task-priority" name="priority" defaultValue="MEDIUM">
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="task-difficulty">Difficulty</Label>
          <Select id="task-difficulty" name="difficulty" defaultValue="MEDIUM">
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="task-block">Study block</Label>
          <Select id="task-block" name="blockType" defaultValue="DEEP_WORK">
            <option value="DEEP_WORK">Block 1 - Deep Work (DSA)</option>
            <option value="LEARNING">Block 2 - Learning</option>
            <option value="PROJECTS">Block 3 - Projects</option>
          </Select>
        </div>
      </div>

      {effectiveTaskMode === "GROUP_SELECTED" ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <Label>Assign to members</Label>
              <p className="mt-1 text-xs text-white/45">
                Pick one or more members inside {selectedGroup?.name ?? "this group"}.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedAssigneeIds(groupMembers.map((member) => member.userId))}
                className="rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary transition hover:bg-primary/10"
              >
                Select all
              </button>
              <button
                type="button"
                onClick={() => setSelectedAssigneeIds([])}
                className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-semibold text-white/65 transition hover:border-white/20 hover:text-white"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="grid gap-2 rounded-2xl border border-primary/10 bg-primary/5 p-3">
            {groupMembers.map((member) => {
              const checked = visibleAssigneeIds.includes(member.userId);

              return (
                <label
                  key={member.userId}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border px-3 py-3 text-sm transition",
                    checked
                      ? "border-primary/25 bg-primary/10 text-white"
                      : "border-white/8 bg-white/[0.03] text-white/70 hover:border-primary/15 hover:bg-primary/5",
                  )}
                >
                  <input
                    type="checkbox"
                    name="assigneeIds"
                    value={member.userId}
                    checked={checked}
                    onChange={() => toggleAssignee(member.userId)}
                    className="h-4 w-4 rounded border-primary/20 bg-transparent accent-[rgba(196,172,120,0.95)]"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{member.name}</div>
                    <div className="text-xs uppercase tracking-[0.18em] text-white/40">
                      {member.role === "admin" ? "Leader" : "Member"}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      ) : null}

      <p className="text-xs text-white/45">
        Repeating the same task name builds a longer tracker stream, so habits like DSA reps or project shipping compound over time.
      </p>
    </>
  );
}
