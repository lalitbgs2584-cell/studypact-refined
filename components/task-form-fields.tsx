import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type GroupOption = {
  id: string;
  name: string;
};

type MembershipOption = {
  groupId: string;
  group: GroupOption;
};

type TaskFormFieldsProps = {
  memberships: MembershipOption[];
  targetGroups: GroupOption[];
  activeGroupId: string | null;
  defaultDueDate: string;
};

export function TaskFormFields({
  memberships,
  targetGroups,
  activeGroupId,
  defaultDueDate,
}: TaskFormFieldsProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="task-group">Group</Label>
        <Select id="task-group" name="groupId" defaultValue={activeGroupId ?? memberships[0]?.groupId ?? ""}>
          {memberships.map((membership) => (
            <option key={membership.groupId} value={membership.groupId}>
              {membership.group.name}
            </option>
          ))}
        </Select>
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="task-scope">Scope</Label>
          <Select id="task-scope" name="scope" defaultValue="PERSONAL">
            <option value="PERSONAL">Personal task</option>
            <option value="GROUP">Group broadcast</option>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Broadcast groups</Label>
          <div className="grid gap-2 rounded-2xl border border-primary/10 bg-primary/5 p-3 sm:grid-cols-2">
            {targetGroups.map((group) => (
              <label
                key={group.id}
                className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-white/75"
              >
                <input
                  type="checkbox"
                  name="groupIds"
                  value={group.id}
                  defaultChecked={group.id === activeGroupId}
                  className="h-4 w-4 rounded border-primary/20 bg-transparent accent-[rgba(196,172,120,0.95)]"
                />
                <span>{group.name}</span>
              </label>
            ))}
          </div>
          <p className="text-xs text-white/45">Choose one or more groups when you switch the task scope to group broadcast.</p>
        </div>
      </div>

      <p className="text-xs text-white/45">
        Repeating the same task name builds a longer tracker stream, so habits like DSA reps or project shipping compound over time.
      </p>
    </>
  );
}
