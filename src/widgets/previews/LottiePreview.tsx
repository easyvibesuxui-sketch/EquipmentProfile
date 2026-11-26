import { useEffect, useRef } from 'react';

/**
 * Plays a Lottie (JSON) animation in a widget's Manage Widgets preview: the same for every user, no live data.
 * The player (lottie-web, light SVG build) loads only when a preview opens. The intro plays once, then the
 * "loop" marker repeats; with reduced motion the still frame at the end of the intro shows.
 */
export function LottiePreview({ data, label }: { data: object; label: string }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let anim: { destroy: () => void } | null = null;
    let cancelled = false;
    import('lottie-web/build/player/lottie_light').then(({ default: lottie }) => {
      if (cancelled || !box.current) return;
      const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const a = lottie.loadAnimation({
        container: box.current, renderer: 'svg', loop: false, autoplay: !still, animationData: data,
        rendererSettings: { preserveAspectRatio: 'xMidYMid slice' },
      });
      const markers = (data as { markers?: Array<{ tm: number; cm: string; dr: number }> }).markers ?? [];
      const loop = markers.find((m) => m.cm === 'loop');
      if (still) a.goToAndStop(loop ? loop.tm + 4 : 0, true);
      else if (loop) a.addEventListener('complete', () => { a.loop = true; a.playSegments([loop.tm, loop.tm + loop.dr], true); });
      anim = a;
    });
    return () => { cancelled = true; anim?.destroy(); };
  }, [data]);
  return <div ref={box} className="ep-lottie" role="img" aria-label={label} />;
}
