import { useEffect, useRef } from "react";

// ============================================================================
// Types & Configuration
// ============================================================================

export interface NycBackgroundProps {
  sketchColor?: string;
  cloudCount?: number;
  birdCount?: number;
  witchCount?: number;
  shipCount?: number;
  helicopterCount?: number;
}

const DEFAULT_CONFIG = {
  sketchColor: "rgba(100, 116, 139, 1)",
  cloudCount: 8,
  birdCount: 12,
  witchCount: 5,
  shipCount: 4,
  helicopterCount: 1,
  witchLoopRadius: 24,
  witchLoopChance: 0.0005,
  witchLoopDrift: 0.15,
  witchLoopWidth: 1,
  witchLoopHeight: 0.87,
  witchLoopRamp: Math.PI * 0.15,
};

// ============================================================================
// Helper Math Functions
// ============================================================================

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const smoothstep = (t: number) => {
  t = clamp(t, 0, 1);
  return t * t * (3 - 2 * t);
};

const approachAngle = (current: number, target: number, amount: number) => {
  const delta = Math.atan2(Math.sin(target - current), Math.cos(target - current));
  return current + delta * amount;
};

// ============================================================================
// Entities & State
// ============================================================================

interface Cloud { x: number; y: number; speed: number; scale: number; }
interface Bird { x: number; y: number; speed: number; flapSpeed: number; flap: number; scale: number; }
interface Witch {
  baseX: number; baseY: number; speed: number; direction: number; scale: number; bobAngle: number;
  isLooping: boolean; loopProgress: number; rotation: number; rotationInitialized: boolean;
}
interface Ship { x: number; y: number; speed: number; direction: number; type: string; }
interface Helicopter { x: number; y: number; speed: number; direction: number; rotorAngle: number; }

class SceneState {
  clouds: Cloud[] = [];
  birds: Bird[] = [];
  witches: Witch[] = [];
  ships: Ship[] = [];
  helicopters: Helicopter[] = [];
  skylineImg: HTMLImageElement;

  constructor() {
    this.skylineImg = new Image();
    this.skylineImg.src = "/skyline.png";
  }
}

// ============================================================================
// Paths (Lazy Loaded to prevent SSR/Path2D issues)
// ============================================================================
let pathsCache: { witch: Path2D; ships: Record<string, Path2D> } | null = null;

const getPaths = () => {
  if (pathsCache) return pathsCache;

  const witch = new Path2D(
    "M -2 -12 L 8 -12 M 1 -12 L 6 -22 L 7 -12 " +
    "M 3 -12 L 7 -2 L -1 1 Z " +
    "M -1 -2 Q -10 2 -15 -3 Q -10 0 -2 3 " +
    "M -20 4 L 15 0 " +
    "M -20 4 L -28 1 M -20 4 L -30 5 M -20 4 L -26 9"
  );

  const ships: Record<string, Path2D> = {
    ferry: new Path2D("M -35 0 L 35 0 L 30 10 L -30 10 Z M -30 0 L -25 -12 L 25 -12 L 30 0 M -20 -12 L -15 -20 L 15 -20 L 20 -12 M -15 -6 L -10 -6 M -5 -6 L 0 -6 M 5 -6 L 10 -6 M 15 -6 L 20 -6"),
    catamaran: new Path2D("M -35 0 L 25 0 L 35 -10 L 25 -10 Z M -30 0 L -25 -15 L 15 -15 L 25 -10 M -15 -15 L -10 -22 L 5 -22 L 10 -15 M -10 -7 L 10 -7"),
    tugboat: new Path2D("M -20 0 L 15 0 L 20 -5 L 20 5 L -15 5 Z M -5 0 L -5 -12 L 8 -12 L 8 0 M -2 -12 L -2 -18 L 2 -18 L 2 -12 M 2 -6 L 5 -6"),
    cargo: new Path2D("M -40 0 L 40 0 L 35 6 L -35 6 Z M -30 0 L -30 -10 L -10 -10 L -10 0 M -5 0 L -5 -15 L 15 -15 L 15 0 M 25 0 L 25 -12 L 35 -12 L 35 0 M -35 0 L -35 -18 L -30 -18 L -30 0"),
    sailboat: new Path2D("M -15 0 L 15 0 Q 0 8 -15 0 M 0 0 L 0 -35 L 15 -5 L 0 -5"),
  };

  pathsCache = { witch, ships };
  return pathsCache;
};

// ============================================================================
// Initialization Functions
// ============================================================================

const initClouds = (count: number, width: number, height: number): Cloud[] =>
  Array.from({ length: count }).map(() => ({
    x: Math.random() * width,
    y: (0.05 + Math.random() * 0.35) * height,
    speed: 0.05 + Math.random() * 0.2,
    scale: 0.2 + Math.random() * 2,
  }));

const initBirds = (count: number, width: number, height: number): Bird[] =>
  Array.from({ length: count }).map(() => ({
    x: Math.random() * width,
    y: Math.random() * (height * 0.4),
    speed: 0.2 + Math.random() * 0.4,
    flapSpeed: 0.05 + Math.random() * 0.05,
    flap: Math.random() * Math.PI * 2,
    scale: 0.3 + Math.random() * 0.8,
  }));

const initWitches = (count: number, width: number, height: number): Witch[] =>
  Array.from({ length: count }).map(() => ({
    baseX: Math.random() * width,
    baseY: height * (0.5 + Math.random() * 0.4),
    speed: 0.6 + Math.random() * 0.8,
    direction: Math.random() < 0.5 ? -1 : 1,
    scale: 0.8 + Math.random() * 0.6,
    bobAngle: Math.random() * Math.PI * 2,
    isLooping: false,
    loopProgress: 0,
    rotation: 0,
    rotationInitialized: false,
  }));

const initShips = (count: number, width: number, height: number): Ship[] => {
  const shipTypes = ["ferry", "catamaran", "tugboat", "cargo", "sailboat"];
  return Array.from({ length: count }).map(() => {
    const type = shipTypes[Math.floor(Math.random() * shipTypes.length)];
    let speed = 0.1 + Math.random() * 0.05;
    if (type === "catamaran") speed = 0.5 + Math.random() * 0.1;
    else if (type === "ferry") speed = 0.15 + Math.random() * 0.1;
    else if (type === "cargo") speed = 0.02 + Math.random() * 0.05;

    const isDesktop = document.documentElement.clientWidth >= 1024;
    const shipBottomOffset = isDesktop ? 30 : 15;
    const shipBottomOffsetMultiplier = isDesktop ? 20 : 10;

    return {
      x: Math.random() * width,
      y: height - shipBottomOffset + Math.random() * shipBottomOffsetMultiplier,
      speed,
      direction: Math.random() > 0.5 ? 1 : -1,
      type,
    };
  });
};

const initHelicopters = (count: number, width: number, height: number): Helicopter[] =>
  Array.from({ length: count }).map(() => ({
    x: Math.random() * width,
    y: height * 0.15 + Math.random() * (height * 0.15),
    speed: 1.7 + Math.random() * 0.9,
    direction: Math.random() > 0.5 ? 1 : -1,
    rotorAngle: 0,
  }));

// ============================================================================
// Render & Physics Systems
// ============================================================================

const updateAndDrawClouds = (ctx: CanvasRenderingContext2D, clouds: Cloud[], dt: number, width: number, baseScale: number) => {
  clouds.forEach((cloud) => {
    // Physics
    cloud.x += cloud.speed * dt;
    if (cloud.x > width + 100) cloud.x = -100;

    // Render
    ctx.save();
    ctx.translate(cloud.x, cloud.y);
    ctx.scale(baseScale * cloud.scale, baseScale * cloud.scale);
    ctx.beginPath();
    ctx.moveTo(0, 20);
    ctx.arc(0, 0, 20, Math.PI * 0.5, Math.PI * 1.5);
    ctx.arc(15, -10, 25, Math.PI, Math.PI * 2);
    ctx.arc(40, 0, 20, Math.PI * 1.5, Math.PI * 0.5);
    ctx.lineTo(40, 20);
    ctx.stroke();
    ctx.restore();
  });
};

const updateAndDrawWitches = (ctx: CanvasRenderingContext2D, witches: Witch[], dt: number, width: number, height: number, baseScale: number, config: typeof DEFAULT_CONFIG) => {
  const paths = getPaths();
  witches.forEach((witch) => {
    const s = baseScale * witch.scale;
    const r = config.witchLoopRadius * s;
    const dir = witch.direction;

    // Start loop
    if (!witch.isLooping && witch.baseY - 2 * r > 0 && Math.random() < config.witchLoopChance * dt) {
      witch.isLooping = true;
      witch.loopProgress = 0;
    }

    witch.bobAngle += 0.01 * dt;
    let loopBlend = 0;
    let loopVX = 0;
    let loopVY = 0;
    let offsetX = 0;
    let offsetY = 0;

    if (witch.isLooping) {
      const p = witch.loopProgress;
      const enter = smoothstep(p / config.witchLoopRamp);
      const exit = smoothstep((Math.PI * 2 - p) / config.witchLoopRamp);
      loopBlend = enter * exit;

      const speedFactor = 1 - 0.35 * Math.sin(p / 2) ** 2;
      const angularSpeed = (witch.speed / r) * speedFactor * (0.2 + 0.8 * loopBlend);

      witch.loopProgress += angularSpeed * dt;
      offsetX = Math.sin(p) * r * config.witchLoopWidth * dir;
      offsetY = -(1 - Math.cos(p)) * r * config.witchLoopHeight;

      loopVX = Math.cos(p) * r * config.witchLoopWidth * angularSpeed * dir;
      loopVY = -Math.sin(p) * r * config.witchLoopHeight * angularSpeed;

      if (witch.loopProgress >= Math.PI * 2) {
        witch.isLooping = false;
        witch.loopProgress = 0;
      }
    }

    const forwardSpeed = witch.speed * (1 - (1 - config.witchLoopDrift) * loopBlend);
    const flightVX = forwardSpeed * dir;
    witch.baseX += flightVX * dt;

    const bobY = Math.sin(witch.bobAngle) * 5 * (1 - loopBlend);
    const bobVY = Math.cos(witch.bobAngle) * 5 * 0.03 * (1 - loopBlend);

    const currentX = witch.baseX + offsetX;
    const currentY = witch.baseY + offsetY + bobY;

    if (!witch.isLooping) {
      if (dir === 1 && witch.baseX > width + 100) {
        witch.baseX = -100;
        witch.baseY = height * (0.5 + Math.random() * 0.4);
      }
      if (dir === -1 && witch.baseX < -100) {
        witch.baseX = width + 100;
        witch.baseY = height * (0.5 + Math.random() * 0.4);
      }
    }

    const velocityX = flightVX + loopVX;
    const velocityY = loopVY + bobVY;
    const worldAngle = Math.atan2(velocityY, velocityX);
    const localAngle = Math.atan2(Math.sin(worldAngle), dir * Math.cos(worldAngle));

    if (!witch.rotationInitialized) {
      witch.rotation = localAngle;
      witch.rotationInitialized = true;
    } else {
      witch.rotation = approachAngle(witch.rotation, localAngle, 0.14 * dt);
    }

    ctx.save();
    ctx.translate(currentX, currentY);
    ctx.scale(dir * s, s);
    ctx.rotate(witch.rotation);
    ctx.stroke(paths.witch);
    ctx.restore();
  });
};

const updateAndDrawShips = (ctx: CanvasRenderingContext2D, ships: Ship[], dt: number, width: number, baseScale: number) => {
  const paths = getPaths();
  ships.forEach((ship) => {
    ship.x += ship.speed * ship.direction * dt;

    if (ship.x > width + 100) ship.x = -100;
    if (ship.x < -100) ship.x = width + 100;

    const shipPath = paths.ships[ship.type];
    if (shipPath) {
      ctx.save();
      ctx.translate(ship.x, ship.y);
      ctx.scale(ship.direction * baseScale * 0.8, baseScale * 0.8);
      ctx.stroke(shipPath);
      ctx.restore();
    }
  });
};

const updateAndDrawHelicopters = (ctx: CanvasRenderingContext2D, helicopters: Helicopter[], dt: number, width: number, height: number, baseScale: number) => {
  helicopters.forEach((heli) => {
    heli.x += heli.speed * heli.direction * dt;
    heli.rotorAngle += 0.25 * dt;

    if (heli.x > width + 100) {
      heli.x = -100;
      heli.y = height * 0.15 + Math.random() * (height * 0.15);
    }
    if (heli.x < -100) {
      heli.x = width + 100;
      heli.y = height * 0.15 + Math.random() * (height * 0.15);
    }

    ctx.save();
    ctx.translate(heli.x, heli.y);
    ctx.scale(heli.direction * baseScale * 1.4, baseScale * 1.4);
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.ellipse(0, 0, 15, 8, 0, 0, Math.PI * 2);
    ctx.moveTo(-15, 0);
    ctx.lineTo(-30, -5);
    ctx.lineTo(-30, -10);
    const rotorWidth = Math.cos(heli.rotorAngle) * 20;
    ctx.moveTo(0, -8);
    ctx.lineTo(0, -12);
    ctx.moveTo(-rotorWidth, -12);
    ctx.lineTo(rotorWidth, -12);
    ctx.stroke();
    ctx.restore();
  });
};

const updateAndDrawBirds = (ctx: CanvasRenderingContext2D, birds: Bird[], dt: number, width: number, height: number, baseScale: number) => {
  birds.forEach((bird) => {
    bird.x += bird.speed * dt;
    bird.flap += bird.flapSpeed * dt;

    if (bird.x > width + 50) {
      bird.x = -50;
      bird.y = Math.random() * (height * 0.4);
    }

    ctx.save();
    ctx.translate(bird.x, bird.y);
    ctx.scale(baseScale * bird.scale, baseScale * bird.scale);
    ctx.beginPath();
    const flapOffset = Math.sin(bird.flap) * 8;
    ctx.moveTo(-10, -5 + flapOffset);
    ctx.quadraticCurveTo(-5, 0, 0, 5);
    ctx.quadraticCurveTo(5, 0, 10, -5 + flapOffset);
    ctx.stroke();
    ctx.restore();
  });
};

// ============================================================================
// Main React Component
// ============================================================================

export default function NycBackground(props: NycBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Merge provided props with default config
  const config = { ...DEFAULT_CONFIG, ...props };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Animation & State vars
    let animationFrameId = 0;
    let lastTime = 0;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let baseScale = Math.max(0.3, Math.min(0.7, width / 1920));

    // Initialize State Once
    const scene = new SceneState();
    scene.clouds = initClouds(config.cloudCount, width, height);
    scene.birds = initBirds(config.birdCount, width, height);
    scene.witches = initWitches(config.witchCount, width, height);
    scene.ships = initShips(config.shipCount, width, height);
    scene.helicopters = initHelicopters(config.helicopterCount, width, height);

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Handle Window Resizes purely
    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      baseScale = Math.max(0.3, Math.min(0.7, width / 1920));
    };
    window.addEventListener("resize", handleResize);

    // Main Render Loop
    const render = (now: number) => {
      ctx.clearRect(0, 0, width, height);

      const dt = lastTime === 0 ? 1 : Math.min((now - lastTime) / 16.667, 3);
      lastTime = now;

      // Draw Skyline
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

      // Execute Updates and Draws for independent sub-systems
      updateAndDrawClouds(ctx, scene.clouds, dt, width, baseScale);
      updateAndDrawWitches(ctx, scene.witches, dt, width, height, baseScale, config);
      updateAndDrawShips(ctx, scene.ships, dt, width, baseScale);
      updateAndDrawHelicopters(ctx, scene.helicopters, dt, width, height, baseScale);
      updateAndDrawBirds(ctx, scene.birds, dt, width, height, baseScale);

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
    config.sketchColor,
  ]); // Re-initialize only if main config counts or color change

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full pointer-events-none"
      aria-hidden="true"
    />
  );
}
