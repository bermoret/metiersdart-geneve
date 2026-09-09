"use client";

import { useState } from "react";

type Props = {
  platform: "vimeo" | "youtube";
  videoId: string;
  title: string;
  category: string;
};

export function VideoCapsule({ platform, videoId, title, category }: Props) {
  const [playing, setPlaying] = useState(false);

  const embedUrl =
    platform === "vimeo"
      ? `https://player.vimeo.com/video/${videoId}?autoplay=1&byline=0&portrait=0&title=0`
      : `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;

  return (
    <div className="group rounded-xl border border-mag-cream overflow-hidden hover:shadow-md transition-shadow bg-white">
      <div className="relative aspect-video bg-mag-dark">
        {playing ? (
          <iframe
            src={embedUrl}
            className="absolute inset-0 w-full h-full"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            title={title}
          />
        ) : (
          <button
            onClick={() => setPlaying(true)}
            className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-mag-red/20 to-mag-dark/50 hover:from-mag-red/30 hover:to-mag-dark/60 transition-colors"
            aria-label={`Lire la capsule : ${title}`}
          >
            <span className="relative z-10 flex items-center justify-center w-14 h-14 rounded-full bg-white/90 group-hover:bg-white shadow-lg transition-transform group-hover:scale-110">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="text-mag-red ml-1">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </button>
        )}
      </div>
      <div className="p-3">
        <p className="font-medium text-sm text-mag-dark leading-snug">{title}</p>
        <p className="mt-1 text-xs text-mag-gray">{category}</p>
      </div>
    </div>
  );
}
