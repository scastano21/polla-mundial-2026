import NProgress from "nprogress";

let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

NProgress.configure({
  showSpinner: true,
  trickleSpeed: 120,
  minimum: 0.12,
  easing: "ease",
  speed: 280,
});

export function startNavigationProgress(): void {
  NProgress.start();
  if (fallbackTimer) clearTimeout(fallbackTimer);
  fallbackTimer = setTimeout(() => {
    NProgress.done();
    fallbackTimer = null;
  }, 8000);
}

export function doneNavigationProgress(): void {
  if (fallbackTimer) {
    clearTimeout(fallbackTimer);
    fallbackTimer = null;
  }
  NProgress.done();
}

export function isInternalNavigationHref(href: string, origin: string): boolean {
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
    return false;
  }
  try {
    const url = new URL(href, origin);
    if (url.origin !== origin) return false;
    const current = new URL(window.location.href);
    return url.pathname + url.search !== current.pathname + current.search;
  } catch {
    return false;
  }
}
