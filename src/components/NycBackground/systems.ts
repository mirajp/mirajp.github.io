import { DEFAULT_CONFIG } from "./config";
import { getPaths } from "./paths";
import { getResetHelicopter } from "./state";
import { Cloud, Witch, Ship, Helicopter, Bird } from "./types";
import { smoothstep, approachAngle } from "./utils";

export const updateAndDrawClouds = (ctx: CanvasRenderingContext2D, clouds: Cloud[], dt: number, width: number, baseScale: number) => {
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

export const updateAndDrawWitches = (ctx: CanvasRenderingContext2D, witches: Witch[], dt: number, width: number, height: number, baseScale: number, config: typeof DEFAULT_CONFIG) => {
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

    witch.bobAngle += (0.025 * Math.random()) * dt;
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
    witch.baseY += (Math.random() - 0.5) * 0.3 * dt;

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

export const updateAndDrawShips = (ctx: CanvasRenderingContext2D, ships: Ship[], dt: number, width: number, baseScale: number) => {
  const paths = getPaths();
  ships.forEach((ship) => {
    ship.x += ship.speed * ship.direction * dt;

    if (ship.x > width + 100) {
      ship.x = -100;
    }
    if (ship.x < -100) {
      ship.x = width + 100;
    }

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

export const updateAndDrawHelicopters = (ctx: CanvasRenderingContext2D, helicopters: Helicopter[], dt: number, width: number, height: number, baseScale: number) => {
  helicopters.forEach((heli) => {
    heli.x += heli.speed * heli.direction * dt;
    heli.rotorAngle += 0.25 * dt;

    if (heli.x > width + 100 || heli.x < -100) {
      Object.assign(heli, getResetHelicopter(ctx.canvas.width,  ctx.canvas.height), {
        x: heli.x < 0 ? width + 100 : -100
      })
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

export const updateAndDrawBirds = (ctx: CanvasRenderingContext2D, birds: Bird[], dt: number, width: number, height: number, baseScale: number) => {
  birds.forEach((bird) => {
    bird.x += bird.speed * dt;
    bird.y += (Math.random() - 0.5) * 0.15 * dt;
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
