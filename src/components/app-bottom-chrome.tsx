"use client";

import { Nav } from "./nav";
import { MiniPlayer } from "./mini-player";

/** Fixed stack: mini-player above tab bar (Spotify-style). */
export function AppBottomChrome() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-lg safe-bottom bg-bg">
      <MiniPlayer />
      <Nav />
    </div>
  );
}
