"use client";

import { useParams } from "next/navigation";
import { RequestDetailView, useRequest } from "@/app/dashboard/request-detail";

export default function AdminRequestDetail() {
  const { id } = useParams<{ id: string }>();
  const { data, error } = useRequest(id);
  return <RequestDetailView data={data} error={error} backHref="/dashboard/admin/requests" backLabel="All requests" showReporter />;
}
