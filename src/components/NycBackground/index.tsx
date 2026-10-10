import { useEffect, useRef } from "react";
import { NycBackgroundProps } from "./types";
import { DEFAULT_CONFIG } from "./config";

import {
  SceneState,
  initClouds,
  initBirds,
  initWitches,
  initShips,
  initHelicopters,
  initDogWizards,
  initCharonFerrys,
} from "./state";

import {
  updateAndDrawClouds,
  updateAndDrawWitches,
  updateAndDrawShips,
  updateAndDrawHelicopters,
  updateAndDrawBirds,
  updateAndDrawDogWizards,
  updateAndDrawCharonFerrys,
} from "./systems";

export default function NycBackground(props: NycBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Merge provided props with default config
  const config = {
    ...DEFAULT_CONFIG,
    ...props,
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Animation and canvas state
    let animationFrameId = 0;
    let lastTime = 0;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let baseScale = Math.max(0.3, Math.min(0.7, width / 1920));

    // Initialize scene
    const scene = new SceneState();
    scene.clouds = initClouds(config.cloudCount, width, height);
    scene.birds = initBirds(config.birdCount, width, height);
    scene.witches = initWitches(config.witchCount, width, height);
    scene.ships = initShips(config.shipCount, width, height);
    scene.helicopters = initHelicopters(config.helicopterCount, width, height);
    scene.dogWizards = initDogWizards(config.dogWizardCount, width, height);
    scene.charonFerrys = initCharonFerrys(
      config.charonFerryCount,
      width,
      height,
    );

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      baseScale = Math.max(0.3, Math.min(0.7, width / 1920));
    };

    window.addEventListener("resize", handleResize);

    // Main render loop
    const render = (now: number) => {
      ctx.clearRect(0, 0, width, height);

      const dt = lastTime === 0 ? 1 : Math.min((now - lastTime) / 16.667, 3);
      lastTime = now;

      if (scene.skylineImg.complete && scene.skylineImg.naturalWidth > 0) {
        const scale = width / scene.skylineImg.width;
        const imgHeight = scene.skylineImg.height * scale;
        const imgY = height - imgHeight;
        ctx.globalAlpha = 0.2;
        ctx.drawImage(scene.skylineImg, 0, imgY, width, imgHeight);
        ctx.globalAlpha = 1;
      }

      ctx.strokeStyle = config.sketchColor;
      ctx.lineWidth = 1;

      updateAndDrawClouds(ctx, scene.clouds, dt, width, baseScale);
      updateAndDrawBirds(ctx, scene.birds, dt, width, height, baseScale);
      updateAndDrawWitches(
        ctx,
        scene.witches,
        dt,
        width,
        height,
        baseScale,
        config,
      );
      updateAndDrawDogWizards(
        ctx,
        scene.dogWizards,
        dt,
        width,
        height,
        baseScale,
        config.sketchColor,
      );
      updateAndDrawHelicopters(
        ctx,
        scene.helicopters,
        dt,
        width,
        height,
        baseScale,
      );
      updateAndDrawShips(ctx, scene.ships, dt, width, baseScale);
      updateAndDrawCharonFerrys(
        ctx,
        scene.charonFerrys,
        dt,
        width,
        height,
        baseScale,
        config.sketchColor,
      );

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [
    config.cloudCount,
    config.birdCount,
    config.witchCount,
    config.shipCount,
    config.helicopterCount,
    config.dogWizardCount,
    config.charonFerryCount,
    config.sketchColor,
  ]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full pointer-events-none"
      aria-hidden="true"
    />
  );
}
