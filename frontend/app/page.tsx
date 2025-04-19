"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/nav/auth-context";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/overview");
    } else {
      router.replace("/auth");
    }
  }, [isAuthenticated, router]);

  return null;
}
