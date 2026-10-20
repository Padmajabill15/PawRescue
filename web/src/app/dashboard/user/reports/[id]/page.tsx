"use client";

import { useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { RequestDetailView, useRequest } from "@/app/dashboard/request-detail";
import { Alert } from "@/components/ui/alert";

function Inner() {
  const { id } = useParams<{ id: string }>();
  const fresh = useSearchParams().get("new");
  const { data, error } = useRequest(id);
  const n = Number(fresh);

  return (
    <RequestDetailView
      data={data}
      error={error}
      backHref="/dashboard/user/reports"
      backLabel="My reports"
      banner={
        fresh !== null && (
          <Alert kind="success">
            Report sent!{" "}
            {n > 0
              ? `${n} verified NGO${n > 1 ? "s" : ""} near the animal ${n > 1 ? "have" : "has"} been alerted.`
              : "No NGO covers this exact spot yet, so our admin team will step in."}{" "}
            You&apos;ll see every update here.
          </Alert>
        )
      }
    />
  );
}

export default function UserReportDetail() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  );
}
