"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useOrganizationList } from "@clerk/nextjs";

/**
 * Interstitial used when opening a startup in a new tab from `/startups`.
 * The active organization lives on the Clerk session, so the new tab has to set
 * it before the app renders anything org-scoped. Deliberately outside the
 * `(auth)` route group so the sidebar/header don't flash during the switch.
 */
function SwitchStartup() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setActive, isLoaded } = useOrganizationList();

  const orgId = searchParams.get("org");

  useEffect(() => {
    if (!isLoaded || !setActive) return;

    if (!orgId) {
      router.replace("/");
      return;
    }

    setActive({ organization: orgId, redirectUrl: "/" });
  }, [isLoaded, setActive, orgId, router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#EFF0F4]">
      <span className="text-sm font-medium text-[#111827] opacity-60">
        Opening startup...
      </span>
    </div>
  );
}

export default function SwitchStartupPage() {
  return (
    <Suspense fallback={null}>
      <SwitchStartup />
    </Suspense>
  );
}
