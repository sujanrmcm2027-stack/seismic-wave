import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ClipboardList, Loader2, Send } from "lucide-react";
import { useEffect } from "react";
import { useForm, type FieldPath } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  ddnaReportInputSchema,
  IMMEDIATE_NEEDS,
  LOCAL_LEVEL_TYPES,
  NEPAL_PROVINCES,
  type DdnaReportInput,
} from "@/data/ddnaSchema";
import { submitDdnaReport } from "@/lib/ddna/serverFns";

type DdnaFormValues = z.input<typeof ddnaReportInputSchema>;

const DDNA_DRAFT_STORAGE_KEY = "ddna-report-draft";

function isAllZero(values: DdnaReportInput) {
  const numericFields = [
    ...Object.values(values.structuralDamage),
    ...Object.values(values.humanImpact),
    ...Object.values(values.criticalInfrastructure),
  ];
  return numericFields.every((n) => Number(n) === 0);
}

const DEFAULT_VALUES: DdnaFormValues = {
  province: "Bagmati",
  district: "",
  localLevel: "",
  localLevelType: "Municipality",
  ward: 1,
  eventReference: "",
  eventTimestamp: "",
  submittedBy: { name: "", designation: "", phone: "", email: "" },
  gps: undefined,
  structuralDamage: {
    totalStructuresSurveyed: 0,
    grade1Negligible: 0,
    grade2Slight: 0,
    grade3Moderate: 0,
    grade4Substantial: 0,
    grade5Collapse: 0,
  },
  humanImpact: {
    deaths: 0,
    injuries: 0,
    missing: 0,
    displacedFamilies: 0,
    displacedIndividuals: 0,
  },
  criticalInfrastructure: {
    schoolsDamaged: 0,
    healthFacilitiesDamaged: 0,
    roadsBlockedKm: 0,
    bridgesDamaged: 0,
    waterSystemsDamaged: 0,
  },
  immediateNeeds: [],
  narrative: "",
};

const NUMBER_FIELD_GROUPS: {
  legend: string;
  fields: { name: FieldPath<DdnaFormValues>; label: string; step?: string }[];
}[] = [
  {
    legend: "Structural Damage Survey (EMS-98 grading)",
    fields: [
      { name: "structuralDamage.totalStructuresSurveyed", label: "Total structures surveyed" },
      { name: "structuralDamage.grade1Negligible", label: "Grade 1 — Negligible" },
      { name: "structuralDamage.grade2Slight", label: "Grade 2 — Slight" },
      { name: "structuralDamage.grade3Moderate", label: "Grade 3 — Moderate" },
      { name: "structuralDamage.grade4Substantial", label: "Grade 4 — Substantial" },
      { name: "structuralDamage.grade5Collapse", label: "Grade 5 — Collapse" },
    ],
  },
  {
    legend: "Human Impact",
    fields: [
      { name: "humanImpact.deaths", label: "Deaths" },
      { name: "humanImpact.injuries", label: "Injuries" },
      { name: "humanImpact.missing", label: "Missing" },
      { name: "humanImpact.displacedFamilies", label: "Displaced families" },
      { name: "humanImpact.displacedIndividuals", label: "Displaced individuals" },
    ],
  },
  {
    legend: "Critical Infrastructure",
    fields: [
      { name: "criticalInfrastructure.schoolsDamaged", label: "Schools damaged" },
      {
        name: "criticalInfrastructure.healthFacilitiesDamaged",
        label: "Health facilities damaged",
      },
      { name: "criticalInfrastructure.roadsBlockedKm", label: "Roads blocked (km)", step: "0.1" },
      { name: "criticalInfrastructure.bridgesDamaged", label: "Bridges damaged" },
      { name: "criticalInfrastructure.waterSystemsDamaged", label: "Water systems damaged" },
    ],
  },
];

export function DdnaReportForm() {
  const queryClient = useQueryClient();
  const form = useForm<DdnaFormValues, unknown, DdnaReportInput>({
    resolver: zodResolver(ddnaReportInputSchema),
    defaultValues: DEFAULT_VALUES,
  });

  // Restore an in-progress draft once on mount, so field values survive an
  // unexpected connection drop or accidental tab close.
  useEffect(() => {
    try {
      const cached = window.localStorage.getItem(DDNA_DRAFT_STORAGE_KEY);
      if (cached) form.reset(JSON.parse(cached));
    } catch {
      // malformed or inaccessible cache — proceed with the blank form
    }
  }, [form]);

  // Cache field values in real time as the officer types.
  useEffect(() => {
    const subscription = form.watch((values) => {
      try {
        window.localStorage.setItem(DDNA_DRAFT_STORAGE_KEY, JSON.stringify(values));
      } catch {
        // storage unavailable (private mode / quota) — safe to skip caching
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const mutation = useMutation({
    mutationFn: (data: DdnaReportInput) => submitDdnaReport({ data }),
    onSuccess: (report) => {
      queryClient.invalidateQueries({ queryKey: ["ddna-reports"] });
      toast.success(
        report.within72Hours
          ? "Damage report submitted within the 72-hour compliance window."
          : "Damage report submitted, but outside the 72-hour compliance window — flagged for review.",
      );
      form.reset(DEFAULT_VALUES);
      window.localStorage.removeItem(DDNA_DRAFT_STORAGE_KEY);
    },
    onError: () => {
      toast.error("Could not submit the report. Check the form and try again.");
    },
  });

  const onSubmit = (data: DdnaReportInput) => {
    if (isAllZero(data)) {
      toast.error(
        "Enter at least one non-zero value across structural damage, human impact, or infrastructure fields before submitting.",
      );
      return;
    }
    mutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 rounded-xl border border-border bg-card p-5 shadow-sm"
      >
        <div className="flex items-center gap-2 border-b border-border pb-4">
          <ClipboardList className="h-4 w-4 text-primary" />
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              DDNA / BIPAD Standardized Submission
            </div>
            <div className="text-sm font-semibold text-foreground">
              Municipal Damage Assessment Report
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FormField
            control={form.control}
            name="province"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Province</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {NEPAL_PROVINCES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="district"
            render={({ field }) => (
              <FormItem>
                <FormLabel>District</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Lamjung" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="localLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Local level name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Besisahar" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="localLevelType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Local level type</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {LOCAL_LEVEL_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="ward"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ward no.</FormLabel>
                <FormControl>
                  <Input type="number" min={1} max={35} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="eventReference"
            render={({ field }) => (
              <FormItem className="lg:col-span-2">
                <FormLabel>Triggering event reference</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. M5.4 Lamjung Main Shock 2026-06-02" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="eventTimestamp"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Event timestamp</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FormField
            control={form.control}
            name="submittedBy.name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reporting officer</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="submittedBy.designation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Designation</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Ward Disaster Focal Person" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="submittedBy.phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input placeholder="+977-98XXXXXXXX" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="submittedBy.email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email (optional)</FormLabel>
                <FormControl>
                  <Input type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {NUMBER_FIELD_GROUPS.map((group) => (
          <fieldset key={group.legend} className="space-y-3">
            <legend className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {group.legend}
            </legend>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {group.fields.map((f) => (
                <label key={f.name} className="block text-xs font-medium text-muted-foreground">
                  {f.label}
                  <Input
                    type="number"
                    min={0}
                    step={f.step ?? "1"}
                    className="mt-1"
                    {...form.register(f.name)}
                  />
                </label>
              ))}
            </div>
          </fieldset>
        ))}

        <FormField
          control={form.control}
          name="immediateNeeds"
          render={() => (
            <FormItem>
              <FormLabel>Immediate needs</FormLabel>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {IMMEDIATE_NEEDS.map((need) => (
                  <label key={need} className="flex items-center gap-2 text-sm text-foreground">
                    <Checkbox
                      checked={(form.watch("immediateNeeds") ?? []).includes(need)}
                      onCheckedChange={(checked) => {
                        const current = form.getValues("immediateNeeds") ?? [];
                        form.setValue(
                          "immediateNeeds",
                          checked ? [...current, need] : current.filter((n) => n !== need),
                        );
                      }}
                    />
                    {need}
                  </label>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="narrative"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Narrative summary</FormLabel>
              <FormControl>
                <Textarea
                  rows={4}
                  placeholder="Short field summary of damage extent, response status, and outstanding risks."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
          <p className="text-xs text-muted-foreground">
            Submissions are timestamped automatically and flagged if received more than 72 hours
            after the reference event, per DRRM Act 2074 reporting requirements.
          </p>
          <Button type="submit" disabled={mutation.isPending} className="shrink-0 gap-2">
            {mutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Submit Report
          </Button>
        </div>
      </form>
    </Form>
  );
}
