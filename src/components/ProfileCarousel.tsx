"use client";

import Image from "next/image";
import { useCallback, useState } from "react";

const photos = [
  { src: "/ProfilePic.jpeg", alt: "Portrait of Bhav" },
  { src: "/me_with_cat.jpg", alt: "Bhav with a cat" },
];

function layerStyle(position: number): React.CSSProperties {
  if (position === 0) {
    return {
      transform: "translate(0, 0) rotate(0deg) scale(1)",
      zIndex: 20,
      opacity: 1,
    };
  }
  return {
    transform: "translate(14px, -6px) rotate(7deg) scale(0.93)",
    zIndex: 10,
    opacity: 0.85,
  };
}

export default function ProfileCarousel() {
  const [active, setActive] = useState(0);

  const next = useCallback(() => setActive((i) => (i + 1) % photos.length), []);

  return (
    <div className="relative h-20 w-20 shrink-0">
      {photos.map((photo, i) => {
        const position = (i - active + photos.length) % photos.length;
        return (
          <button
            key={photo.src}
            type="button"
            onClick={next}
            aria-label={
              position === 0
                ? `${photo.alt}. Click to show next photo`
                : `Show ${photo.alt}`
            }
            className="absolute inset-0 cursor-pointer overflow-hidden rounded-xl transition-all duration-500 ease-out motion-reduce:transition-none"
            style={layerStyle(position)}
          >
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              sizes="128px"
              className="object-cover"
              priority={i === 0}
            />
          </button>
        );
      })}
    </div>
  );
}
