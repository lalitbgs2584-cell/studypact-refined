export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  ArrowLeft,
  Ban,
  CheckCircle2,
  Flag,
  XCircle,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireAdminAccess } from "@/lib/access";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { actionReport } from "@/lib/actions/admin";

async function fetchReports() {
  return db.report.findMany({
    orderBy: [
      { status: "asc" },
      { createdAt: "desc" },
    ],
    include: {
      reporter: { select: { id: true, name: true, email: true } },
      resolvedBy: { select: { name: true } },
    },
    take: 100,
  });
}

export default async function AdminReportsPage() {
  await requireAdminAccess();
  const reports = await fetchReports();

  const pendingReports = reports.filter((r) => r.status === "PENDING");
  const resolvedReports = reports.filter((r) => r.status !== "PENDING");

  const reasonLabels: Record<string, string> = {
    SPAM: "Spam",
    INAPPROPRIATE: "Inappropriate",
    FAKE_PROOF: "Fake Proof",
    HARRASSMENT: "Harassment",
    OTHER: "Other",
  };

  const targetTypeLabels: Record<string, string> = {
    USER: "User",
    CHECKIN: "Proof Submission",
    GROUP: "Group",
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        </Link>
      </div>

      <Card className="overflow-hidden border-l-4 border-l-rose-500">
        <CardContent className="space-y-3 p-6">
          <div className="inline-flex items-center gap-2 rounded-[4px] bg-rose-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.25em] text-rose-400">
            <Flag className="h-3.5 w-3.5" />
            Reports & Abuse
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            User Reports ({reports.length})
          </h1>
          <p className="text-sm text-white/50">
            Review user-submitted reports for fake proofs, spam, and harassment.
          </p>
        </CardContent>
      </Card>

      {/* Pending Reports */}
      {pendingReports.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white/40">
            Pending ({pendingReports.length})
          </h2>
          {pendingReports.map((report) => (
            <Card key={report.id} className="border-l-4 border-l-rose-500">
              <CardContent className="space-y-3 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-400">
                        {reasonLabels[report.reason] ?? report.reason}
                      </span>
                      <span className="rounded-full bg-secondary/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/40">
                        {targetTypeLabels[report.targetType] ?? report.targetType}
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-white/60">
                      Reported by <span className="font-medium text-white/80">{report.reporter.name}</span>
                      <span className="ml-2 text-white/30">{report.createdAt.toLocaleDateString()}</span>
                    </div>
                    {report.details && (
                      <div className="mt-2 max-w-xl rounded-[4px] bg-secondary/30 p-3 text-sm text-white/70">
                        {report.details}
                      </div>
                    )}
                    <div className="mt-1 text-xs text-white/30">
                      Target ID: {report.targetId}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <form action={actionReport}>
                      <input type="hidden" name="reportId" value={report.id} />
                      <input type="hidden" name="action" value="resolve" />
                      <input type="hidden" name="returnTo" value="/admin/reports" />
                      <Button type="submit" variant="outline" size="sm" className="gap-1.5 text-xs text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" />
                        Resolve
                      </Button>
                    </form>
                    <form action={actionReport}>
                      <input type="hidden" name="reportId" value={report.id} />
                      <input type="hidden" name="action" value="dismiss" />
                      <input type="hidden" name="returnTo" value="/admin/reports" />
                      <Button type="submit" variant="outline" size="sm" className="gap-1.5 text-xs">
                        <XCircle className="h-3 w-3" />
                        Dismiss
                      </Button>
                    </form>
                    <form action={actionReport}>
                      <input type="hidden" name="reportId" value={report.id} />
                      <input type="hidden" name="action" value="ban" />
                      <input type="hidden" name="returnTo" value="/admin/reports" />
                      <Button type="submit" variant="outline" size="sm" className="gap-1.5 text-xs text-red-400">
                        <Ban className="h-3 w-3" />
                        Ban Target
                      </Button>
                    </form>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Resolved Reports */}
      {resolvedReports.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white/40">
            Resolved ({resolvedReports.length})
          </h2>
          {resolvedReports.map((report) => (
            <Card key={report.id} className="opacity-60">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                      report.status === "RESOLVED" ? "bg-emerald-500/15 text-emerald-400" : "bg-white/10 text-white/40"
                    )}>
                      {report.status}
                    </span>
                    <span className="text-sm text-white/50">
                      {reasonLabels[report.reason]} — by {report.reporter.name}
                    </span>
                  </div>
                  {report.resolvedBy && (
                    <span className="text-xs text-white/30">
                      Resolved by {report.resolvedBy.name}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {reports.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Flag className="mx-auto mb-3 h-10 w-10 text-primary/30" />
            <div className="text-lg font-bold text-white/60">No reports</div>
            <div className="text-sm text-white/40">The community is behaving well.</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
