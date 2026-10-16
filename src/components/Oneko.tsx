"use client";
import React, { useEffect, useRef, useSyncExternalStore } from "react";
import { useCat } from "@/context/CatContext";

interface SpriteSet {
  [key: string]: number[][];
}

interface NekoProps {
  catImage?: string;
  speed?: number;
}

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const mq = window.matchMedia(REDUCED_MOTION);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}
const getReducedMotion = () => window.matchMedia(REDUCED_MOTION).matches;
const getServerReducedMotion = () => false;

const Oneko: React.FC<NekoProps> = ({
  catImage = "/oneko.gif",
  speed = 10,
}) => {
  const { showCat } = useCat();
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    getServerReducedMotion,
  );
  const nekoRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const prevDragX = useRef(0);
  const prevDragY = useRef(0);

  useEffect(() => {
    if (reducedMotion) return;

    let nekoPosX = 32;
    let nekoPosY = 32;
    let mousePosX = 0;
    let mousePosY = 0;
    let frameCount = 0;
    let idleTime = 0;
    let idleAnimation: string | null = null;
    let idleAnimationFrame = 0;
    let lastFrameTimestamp = 0;

    const spriteSets: SpriteSet = {
      idle: [[-3, -3]],
      alert: [[-7, -3]],
      scratchSelf: [
        [-5, 0],
        [-6, 0],
        [-7, 0],
      ],
      scratchWallN: [
        [0, 0],
        [0, -1],
      ],
      scratchWallS: [
        [-7, -1],
        [-6, -2],
      ],
      scratchWallE: [
        [-2, -2],
        [-2, -3],
      ],
      scratchWallW: [
        [-4, 0],
        [-4, -1],
      ],
      tired: [[-3, -2]],
      sleeping: [
        [-2, 0],
        [-2, -1],
      ],
      N: [
        [-1, -2],
        [-1, -3],
      ],
      NE: [
        [0, -2],
        [0, -3],
      ],
      E: [
        [-3, 0],
        [-3, -1],
      ],
      SE: [
        [-5, -1],
        [-5, -2],
      ],
      S: [
        [-6, -3],
        [-7, -2],
      ],
      SW: [
        [-5, -3],
        [-6, -1],
      ],
      W: [
        [-4, -2],
        [-4, -3],
      ],
      NW: [
        [-1, 0],
        [-1, -1],
      ],
    };

    const setSprite = (name: string, frame: number) => {
      if (!nekoRef.current) return;
      const sprite = spriteSets[name][frame % spriteSets[name].length];
      nekoRef.current.style.backgroundPosition = `${sprite[0] * 32}px ${sprite[1] * 32}px`;
    };

    const resetIdleAnimation = () => {
      idleAnimation = null;
      idleAnimationFrame = 0;
    };

    const idle = () => {
      idleTime += 1;

      if (
        idleTime > 10 &&
        Math.floor(Math.random() * 200) === 0 &&
        idleAnimation === null
      ) {
        const availableIdleAnimations = ["sleeping", "scratchSelf"];
        if (nekoPosX < 32) availableIdleAnimations.push("scratchWallW");
        if (nekoPosY < 32) availableIdleAnimations.push("scratchWallN");
        if (nekoPosX > window.innerWidth - 32)
          availableIdleAnimations.push("scratchWallE");
        if (nekoPosY > window.innerHeight - 32)
          availableIdleAnimations.push("scratchWallS");
        idleAnimation =
          availableIdleAnimations[
            Math.floor(Math.random() * availableIdleAnimations.length)
          ];
      }

      switch (idleAnimation) {
        case "sleeping":
          if (idleAnimationFrame < 8) {
            setSprite("tired", 0);
            break;
          }
          setSprite("sleeping", Math.floor(idleAnimationFrame / 4));
          if (idleAnimationFrame > 192) resetIdleAnimation();
          break;
        case "scratchWallN":
        case "scratchWallS":
        case "scratchWallE":
        case "scratchWallW":
        case "scratchSelf":
          setSprite(idleAnimation, idleAnimationFrame);
          if (idleAnimationFrame > 9) resetIdleAnimation();
          break;
        default:
          setSprite("idle", 0);
          return;
      }
      idleAnimationFrame += 1;
    };

    const frame = () => {
      if (!nekoRef.current) return;

      if (isDragging.current) {
        nekoPosX = mousePosX + dragOffset.current.x;
        nekoPosY = mousePosY + dragOffset.current.y;
        nekoPosX = Math.min(Math.max(16, nekoPosX), window.innerWidth - 16);
        nekoPosY = Math.min(Math.max(16, nekoPosY), window.innerHeight - 16);
        nekoRef.current.style.left = `${nekoPosX - 16}px`;
        nekoRef.current.style.top = `${nekoPosY - 16}px`;

        const dragDiffX = nekoPosX - prevDragX.current;
        const dragDiffY = nekoPosY - prevDragY.current;
        const dragDist = Math.sqrt(dragDiffX ** 2 + dragDiffY ** 2);

        if (dragDist > 1) {
          const reverseDirectionMap: Record<string, string> = {
            N: "S",
            S: "N",
            E: "W",
            W: "E",
            NE: "SW",
            NW: "SE",
            SE: "NW",
            SW: "NE",
          };
          let dir = "";
          dir = dragDiffY < -0.5 ? "N" : "";
          dir += dragDiffY > 0.5 ? "S" : "";
          dir += dragDiffX > 0.5 ? "E" : "";
          dir += dragDiffX < -0.5 ? "W" : "";
          setSprite(reverseDirectionMap[dir] ?? "alert", frameCount);
        } else {
          setSprite("alert", 0);
        }

        prevDragX.current = nekoPosX;
        prevDragY.current = nekoPosY;
        return;
      }

      frameCount += 1;
      const diffX = nekoPosX - mousePosX;
      const diffY = nekoPosY - mousePosY;
      const distance = Math.sqrt(diffX ** 2 + diffY ** 2);

      if (distance < speed || distance < 48) {
        idle();
        return;
      }

      idleAnimation = null;
      idleAnimationFrame = 0;

      if (idleTime > 1) {
        setSprite("alert", 0);
        idleTime = Math.min(idleTime, 7);
        idleTime -= 1;
        return;
      }

      let direction = "";
      direction = diffY / distance > 0.5 ? "N" : "";
      direction += diffY / distance < -0.5 ? "S" : "";
      direction += diffX / distance > 0.5 ? "W" : "";
      direction += diffX / distance < -0.5 ? "E" : "";
      setSprite(direction, frameCount);

      nekoPosX -= (diffX / distance) * speed;
      nekoPosY -= (diffY / distance) * speed;

      nekoPosX = Math.min(Math.max(16, nekoPosX), window.innerWidth - 16);
      nekoPosY = Math.min(Math.max(16, nekoPosY), window.innerHeight - 16);

      nekoRef.current.style.left = `${nekoPosX - 16}px`;
      nekoRef.current.style.top = `${nekoPosY - 16}px`;
    };

    const onAnimationFrame = (timestamp: number) => {
      if (!nekoRef.current) return;
      if (!lastFrameTimestamp) lastFrameTimestamp = timestamp;
      if (timestamp - lastFrameTimestamp > 100) {
        lastFrameTimestamp = timestamp;
        frame();
      }
      animationId = requestAnimationFrame(onAnimationFrame);
    };

    const handleMouseMove = (event: MouseEvent) => {
      mousePosX = event.clientX;
      mousePosY = event.clientY;
    };

    const handleMouseDown = (event: MouseEvent) => {
      if (!nekoRef.current) return;
      const rect = nekoRef.current.getBoundingClientRect();
      const catCenterX = rect.left + 16;
      const catCenterY = rect.top + 16;
      const clickDist = Math.sqrt(
        (event.clientX - catCenterX) ** 2 + (event.clientY - catCenterY) ** 2,
      );
      if (clickDist > 24) return;

      isDragging.current = true;
      dragOffset.current = {
        x: nekoPosX - event.clientX,
        y: nekoPosY - event.clientY,
      };
      nekoRef.current.style.cursor = "grabbing";
    };

    const handleMouseUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      idleTime = 0;
      if (nekoRef.current) nekoRef.current.style.cursor = "grab";
    };

    if (nekoRef.current) {
      nekoRef.current.style.left = `${nekoPosX - 16}px`;
      nekoRef.current.style.top = `${nekoPosY - 16}px`;
    }

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mouseup", handleMouseUp);
    let animationId = requestAnimationFrame(onAnimationFrame);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mouseup", handleMouseUp);
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [speed, reducedMotion]);

  const hidden = reducedMotion || !showCat;

  return (
    <div
      ref={nekoRef}
      id="oneko"
      aria-hidden="true"
      style={{
        width: "32px",
        height: "32px",
        position: "fixed",
        pointerEvents: "auto",
        cursor: "grab",
        backgroundImage: `url(${catImage})`,
        imageRendering: "pixelated",
        zIndex: 2147483647,
        visibility: hidden ? "hidden" : "visible",
        opacity: hidden ? 0 : 1,
        transition: "opacity 0.2s ease-in-out",
      }}
    />
  );
};

export default Oneko;
