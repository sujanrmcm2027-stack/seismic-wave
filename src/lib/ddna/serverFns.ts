import { createServerFn } from "@tanstack/react-start";
import { ddnaReportInputSchema } from "@/data/ddnaSchema";
import { addReportServer, listReportsServer } from "@/lib/ddna/store.server";

export const listDdnaReports = createServerFn({ method: "GET" }).handler(async () => {
  return listReportsServer();
});

export const submitDdnaReport = createServerFn({ method: "POST" })
  .validator(ddnaReportInputSchema)
  .handler(async ({ data }) => {
    return addReportServer(data);
  });
