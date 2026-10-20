import { PageHeader } from "@/components/dashboard/stat-card";
import { ReportForm } from "@/components/rescue/report-form";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Report a rescue – PawRescue" };

export default function ReportPage() {
  return (
    <>
      <PageHeader title="Report an animal" subtitle="Nearby verified NGOs are alerted the moment you submit." />
      <Card className="max-w-3xl">
        <CardContent className="pt-6">
          <ReportForm />
        </CardContent>
      </Card>
    </>
  );
}
