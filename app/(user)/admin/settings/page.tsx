export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowLeft, Settings, Save } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireAdminAccess } from "@/lib/access";
import { db } from "@/lib/db";
import { updateSystemSettings } from "@/lib/actions/admin";

const DEFAULT_SETTINGS: Record<string, { value: string; description: string; group: string }> = {
  max_group_size: { value: "8", description: "Maximum members allowed per group", group: "Groups" },
  validation_threshold: { value: "50", description: "Percentage of approvals needed to finalize a proof (e.g., 50 = majority)", group: "Validation" },
  max_proof_uploads: { value: "5", description: "Maximum number of proof files per submission", group: "Proofs" },
  proof_types_allowed: { value: "image,text", description: "Comma-separated list of allowed proof types (image, video, text)", group: "Proofs" },
  penalty_missed_task: { value: "10", description: "Points deducted for a missed task", group: "Penalties" },
  reward_completed_task: { value: "5", description: "Points awarded for completing a task", group: "Rewards" },
  reward_accurate_review: { value: "2", description: "Points awarded for a correct peer review", group: "Rewards" },
  inactivity_days_threshold: { value: "3", description: "Days of no submissions before a member is flagged as inactive", group: "Activity" },
  dispute_auto_escalate: { value: "true", description: "Auto-escalate to admin when leader hasn't resolved within 48h", group: "Disputes" },
};

async function getSettings() {
  const dbSettings = await db.systemSetting.findMany();
  const settingsMap: Record<string, string> = {};

  for (const s of dbSettings) {
    settingsMap[s.key] = s.value;
  }

  return Object.entries(DEFAULT_SETTINGS).map(([key, def]) => ({
    key,
    value: settingsMap[key] ?? def.value,
    description: def.description,
    group: def.group,
  }));
}

export default async function AdminSettingsPage() {
  await requireAdminAccess();
  const settings = await getSettings();

  // Group settings by category
  const grouped: Record<string, typeof settings> = {};
  for (const s of settings) {
    if (!grouped[s.group]) grouped[s.group] = [];
    grouped[s.group].push(s);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        </Link>
      </div>

      <Card className="overflow-hidden border-l-4 border-l-primary">
        <CardContent className="space-y-3 p-6">
          <div className="inline-flex items-center gap-2 rounded-[4px] bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.25em] text-primary">
            <Settings className="h-3.5 w-3.5" />
            System Settings
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Platform Configuration
          </h1>
          <p className="text-sm text-white/50">
            Toggle features, configure penalty rules, validation thresholds, and upload limits.
          </p>
        </CardContent>
      </Card>

      {Object.entries(grouped).map(([groupName, groupSettings]) => (
        <Card key={groupName}>
          <CardHeader>
            <CardTitle className="text-white">{groupName}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {groupSettings.map((setting) => (
              <form key={setting.key} action={updateSystemSettings} className="flex flex-col gap-2 rounded-lg border border-border bg-card/70 p-4 sm:flex-row sm:items-end sm:gap-4">
                <input type="hidden" name="key" value={setting.key} />
                <input type="hidden" name="returnTo" value="/admin/settings" />
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor={setting.key} className="text-sm font-medium text-white">
                    {setting.key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </Label>
                  <p className="text-xs text-white/40">{setting.description}</p>
                  <Input
                    id={setting.key}
                    name="value"
                    defaultValue={setting.value}
                    className="max-w-xs"
                  />
                </div>
                <Button type="submit" variant="outline" size="sm" className="gap-1.5 self-start text-xs sm:self-auto">
                  <Save className="h-3 w-3" />
                  Save
                </Button>
              </form>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
