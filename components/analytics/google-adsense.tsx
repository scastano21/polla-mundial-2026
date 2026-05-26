const ADSENSE_CLIENT =
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim() || "ca-pub-1924830807495595";

/** Script global de AdSense en &lt;head&gt; (verificación y anuncios automáticos). */
export function GoogleAdSense() {
  return (
    <script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
      crossOrigin="anonymous"
      suppressHydrationWarning
    />
  );
}
