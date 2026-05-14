"use client";

import { useUser } from "@/hooks/useUser";
import { Pipeline } from "@/components/Pipeline";

export default function PipelinePage() {
  const user = useUser();
  if (!user) return null;
  return <Pipeline />;
}
