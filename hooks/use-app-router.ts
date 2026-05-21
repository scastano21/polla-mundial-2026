"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import type { NavigateOptions } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { startNavigationProgress } from "@/lib/navigation-progress";

export function useAppRouter() {
  const router = useRouter();

  return useMemo(
    () => ({
      ...router,
      push(href: string, options?: NavigateOptions) {
        startNavigationProgress();
        return router.push(href, options);
      },
      replace(href: string, options?: NavigateOptions) {
        startNavigationProgress();
        return router.replace(href, options);
      },
    }),
    [router]
  );
}
