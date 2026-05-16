"use client";

import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import NProgress from "nprogress";
import "nprogress/nprogress.css";

NProgress.configure({ showSpinner: false, trickleSpeed: 200, minimum: 0.08 });

function Inner() {
  const path = usePathname();
  const params = useSearchParams();
  useEffect(() => {
    NProgress.done();
  }, [path, params]);
  return null;
}

export function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  );
}
