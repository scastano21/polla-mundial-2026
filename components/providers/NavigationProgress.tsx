"use client";

import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import "nprogress/nprogress.css";
import {
  doneNavigationProgress,
  isInternalNavigationHref,
  startNavigationProgress,
} from "@/lib/navigation-progress";

function shouldSkipProgress(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return true;
  return !!target.closest("[data-skip-nav-progress]");
}

function Inner() {
  const path = usePathname();
  const params = useSearchParams();

  useEffect(() => {
    doneNavigationProgress();
  }, [path, params]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || shouldSkipProgress(event.target)) return;

      const origin = window.location.origin;
      const anchor = (event.target as Element).closest("a[href]");
      if (anchor instanceof HTMLAnchorElement) {
        if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;
        const href = anchor.getAttribute("href");
        if (href && isInternalNavigationHref(href, origin)) {
          startNavigationProgress();
        }
        return;
      }

      const interactive = (event.target as Element).closest(
        "button, [data-slot='button'], [role='button']"
      );
      if (interactive instanceof HTMLElement) {
        if (
          interactive.hasAttribute("disabled") ||
          interactive.getAttribute("aria-disabled") === "true"
        ) {
          return;
        }
        startNavigationProgress();
      }
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}

export function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  );
}
