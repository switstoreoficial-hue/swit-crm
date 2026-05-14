"use client";

import { useUser } from "@/hooks/useUser";
import { FollowUpList } from "@/components/FollowUpList";

export default function FollowUpPage() {
  const user = useUser();
  if (!user) return null;
  return <FollowUpList />;
}
