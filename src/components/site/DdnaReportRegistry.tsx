import { useQuery } from "@tanstack/react-query";
import { Download, FileJson, FileSpreadsheet, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  exportDdnaReportsToCsv,
  exportDdnaReportsToJson,
  type DdnaDamageReport,
} from "@/data/ddnaSchema";
import { listDdnaReports } from "@/lib/ddna/serverFns";

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function ComplianceBadge({ report }: { report: DdnaDamageReport }) {
  if (report.within72Hours) {
    return (
      <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
        Within 72h
      </Badge>
    );
  }
  return (
    <Badge className="border-red-500/25 bg-red-500/10 text-red-700 dark:text-red-300">
      Late ({report.hoursSinceEvent.toFixed(0)}h)
    </Badge>
  );
}

export function DdnaReportRegistry() {
  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["ddna-reports"],
    queryFn: () => listDdnaReports(),
  });

  const compliantCount = reports.filter((r) => r.within72Hours).length;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface/70 px-4 py-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            National Schema Registry
          </div>
          <div className="text-sm font-semibold text-foreground">
            Submitted Damage Reports · {compliantCount}/{reports.length} within 72-hour window
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={!reports.length}
            onClick={() =>
              downloadFile(
                exportDdnaReportsToJson(reports),
                `ddna-reports-${new Date().toISOString().slice(0, 10)}.json`,
                "application/json",
              )
            }
          >
            <FileJson className="h-3.5 w-3.5" /> JSON
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={!reports.length}
            onClick={() =>
              downloadFile(
                exportDdnaReportsToCsv(reports),
                `ddna-reports-${new Date().toISOString().slice(0, 10)}.csv`,
                "text/csv",
              )
            }
          >
            <FileSpreadsheet className="h-3.5 w-3.5" /> CSV
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading submitted reports…
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>District / Local Level</TableHead>
              <TableHead>Event Reference</TableHead>
              <TableHead>Deaths</TableHead>
              <TableHead>Displaced</TableHead>
              <TableHead>Structures (G4–G5)</TableHead>
              <TableHead>Compliance</TableHead>
              <TableHead>Sync Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map((report) => (
              <TableRow key={report.id}>
                <TableCell className="font-medium text-foreground">
                  {report.district} · {report.localLevel}-{report.ward}
                </TableCell>
                <TableCell className="max-w-[220px] truncate text-muted-foreground">
                  {report.eventReference}
                </TableCell>
                <TableCell>{report.humanImpact.deaths}</TableCell>
                <TableCell>{report.humanImpact.displacedIndividuals}</TableCell>
                <TableCell>
                  {report.structuralDamage.grade4Substantial +
                    report.structuralDamage.grade5Collapse}
                </TableCell>
                <TableCell>
                  <ComplianceBadge report={report} />
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {report.syncStatus.replace(/_/g, " ")}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {!reports.length && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No reports submitted yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}

      <div className="flex items-center gap-2 border-t border-border bg-surface/40 px-4 py-2 text-xs text-muted-foreground">
        <Download className="h-3.5 w-3.5" /> Exports match the{" "}
        {reports[0]?.schemaVersion ?? "DDNA-BIPAD-1.0"} field layout for direct upload to the BIPAD
        Portal.
      </div>
    </div>
  );
}
