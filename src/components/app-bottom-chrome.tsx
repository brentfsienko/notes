"use client";

import { useEffect, useRef, useState } from "react";
import { Nav } from "./nav";

const SCROLL_DOWN_HIDE = 10;
const SCROLL_UP_SHOW = 10;
const TOP_ALWAYS_VISIBLE = 48;

function readScrollY() {
  return (
    window.scrollY ||
    document.documentElement.scrollTop ||
    document.body.scrollTop ||
    0
  );
}

/** Fixed tab bar; slides down while scrolling down, back up on scroll up. */
export function AppBottomChrome() {
  const [retracted, setRetracted] = useState(false);
  const lastY = useRef(0);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    lastY.current = readScrollY();

    const flush = () => {
      rafId.current = null;
      const y = readScrollY();
      const dy = y - lastY.current;
      lastY.current = y;

      if (y < TOP_ALWAYS_VISIBLE) {
        setRetracted(false);
        return;
      }
      if (dy > SCROLL_DOWN_HIDE) setRetracted(true);
      else if (dy < -SCROLL_UP_SHOW) setRetracted(false);
    };

    const onScroll = () => {
      if (rafId.current != null) return;
      rafId.current = requestAnimationFrame(flush);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafId.current != null) cancelAnimationFrame(rafId.current);
    };
  }, []);

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-lg safe-bottom bg-bg transition-transform duration-300 ease-out will-change-transform ${
        retracted
          ? "pointer-events-none translate-y-full"
          : "translate-y-0"
      }`}
    >
      <Nav />
    </div>
  );
}
