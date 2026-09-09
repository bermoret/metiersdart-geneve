"use client";

import dynamic from "next/dynamic";

const ArtisanMap = dynamic(() => import("./ArtisanMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[300px] sm:h-[350px] rounded-xl border border-mag-cream bg-mag-cream/30 animate-pulse" />
  ),
});

export default ArtisanMap;
