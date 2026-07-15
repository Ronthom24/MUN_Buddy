"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ConferenceIndexPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  useEffect(() => {
    router.replace(`/conferences/${params.id}/registrations`);
  }, [router, params.id]);

  return null;
}
