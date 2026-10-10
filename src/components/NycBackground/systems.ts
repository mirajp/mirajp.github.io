import { DEFAULT_CONFIG } from "./config";
import { getPaths } from "./paths";
import { getResetHelicopter } from "./state";
import {
  Cloud,
  Witch,
  Ship,
  Helicopter,
  Bird,
  DogWizard,
  CharonFerry,
} from "./types";
import { smoothstep, approachAngle } from "./utils";

export const updateAndDrawClouds = (
  ctx: CanvasRenderingContext2D,
  clouds: Cloud[],
  dt: number,
  width: number,
  baseScale: number,
) => {
  clouds.forEach((cloud) => {
    cloud.x += cloud.speed * dt;

    if (cloud.x > width + 100) {
      cloud.x = -100;
    }

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

export const updateAndDrawWitches = (
  ctx: CanvasRenderingContext2D,
  witches: Witch[],
  dt: number,
  width: number,
  height: number,
  baseScale: number,
  config: typeof DEFAULT_CONFIG,
) => {
  const paths = getPaths();
  witches.forEach((witch) => {
    const s = baseScale * witch.scale;
    const r = config.witchLoopRadius * s;
    const dir = witch.direction;

    if (
      !witch.isLooping &&
      witch.baseY - 2 * r > 0 &&
      Math.random() < config.witchLoopChance * dt
    ) {
      witch.isLooping = true;
      witch.loopProgress = 0;
    }

    witch.bobAngle += 0.025 * Math.random() * dt;

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
      const angularSpeed =
        (witch.speed / r) * speedFactor * (0.2 + 0.8 * loopBlend);
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

    const forwardSpeed =
      witch.speed * (1 - (1 - config.witchLoopDrift) * loopBlend);
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
    const localAngle = Math.atan2(
      Math.sin(worldAngle),
      dir * Math.cos(worldAngle),
    );

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

export const updateAndDrawShips = (
  ctx: CanvasRenderingContext2D,
  ships: Ship[],
  dt: number,
  width: number,
  baseScale: number,
) => {
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
      const dirScale =
        ship.type === "river_styx_ferry" ? -ship.direction : ship.direction;
      ctx.scale(dirScale * baseScale * 0.8, baseScale * 0.8);
      ctx.stroke(shipPath);
      ctx.restore();
    }
  });
};

export const updateAndDrawCharonFerrys = (
  ctx: CanvasRenderingContext2D,
  charonFerrys: CharonFerry[],
  dt: number,
  width: number,
  height: number,
  baseScale: number,
  sketchColor: string,
) => {
  const paths = getPaths();
  charonFerrys.forEach((ship) => {
    ship.x += ship.speed * ship.direction * dt;
    ship.bobAngle += ship.bobSpeed * dt;
    ship.paddleAngle += ship.paddleSpeed * dt;

    if (ship.direction === 1 && ship.x > width + 100) {
      ship.x = -100;
      const isDesktop =
        typeof document !== "undefined" &&
        document.documentElement.clientWidth >= 1024;
      const shipBottomOffset = isDesktop ? 30 : 15;
      const shipBottomOffsetMultiplier = isDesktop ? 20 : 10;
      ship.y =
        height - shipBottomOffset + Math.random() * shipBottomOffsetMultiplier;
    } else if (ship.direction === -1 && ship.x < -100) {
      ship.x = width + 100;
      const isDesktop =
        typeof document !== "undefined" &&
        document.documentElement.clientWidth >= 1024;
      const shipBottomOffset = isDesktop ? 30 : 15;
      const shipBottomOffsetMultiplier = isDesktop ? 20 : 10;
      ship.y =
        height - shipBottomOffset + Math.random() * shipBottomOffsetMultiplier;
    }

    const shipPath = paths.charonFerrys[ship.type] || paths.ships[ship.type];
    const skeletonPath = paths.charonSkeletons[ship.type];
    if (shipPath) {
      const bobY = Math.sin(ship.bobAngle) * 2;
      const rockAngle = Math.cos(ship.bobAngle) * 0.025;

      ctx.save();
      ctx.translate(ship.x, ship.y + bobY);
      ctx.strokeStyle = sketchColor;
      ctx.lineWidth = 1;
      // river_styx_ferry prow faces left (-x), so invert direction scale for forward-facing motion
      const dirScale =
        ship.type === "river_styx_ferry" ? -ship.direction : ship.direction;
      ctx.scale(dirScale * baseScale * 0.8, baseScale * 0.8);
      ctx.rotate(rockAngle);
      ctx.stroke(shipPath);
      if (skeletonPath) {
        ctx.stroke(skeletonPath);
        const stroke = Math.sin(ship.paddleAngle);
        const oarAngle = 0.84 + stroke * 0.2;
        const gripX = 6 + stroke * 1.2;
        const gripY = -24 + Math.cos(ship.paddleAngle) * 0.7;
        const handDistance = 12.5;
        const hand2X = gripX + Math.cos(oarAngle) * handDistance;
        const hand2Y = gripY + Math.sin(oarAngle) * handDistance;

        ctx.save();
        ctx.translate(gripX, gripY);
        ctx.rotate(oarAngle);
        ctx.beginPath();
        ctx.moveTo(-11, 0);
        ctx.lineTo(60, 0);
        ctx.moveTo(47, -2);
        ctx.lineTo(52, -8);
        ctx.lineTo(60, -8);
        ctx.lineTo(60, 8);
        ctx.lineTo(52, 8);
        ctx.lineTo(47, 2);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();

        ctx.beginPath();
        ctx.moveTo(4, -31);
        ctx.lineTo(1, -25);
        ctx.lineTo(gripX, gripY);
        ctx.moveTo(12, -31);
        ctx.lineTo(15, -23);
        ctx.lineTo(hand2X, hand2Y);
        ctx.moveTo(gripX - 1, gripY + 1);
        ctx.lineTo(gripX + 1.5, gripY + 3);
        ctx.moveTo(hand2X - 1.5, hand2Y + 1.5);
        ctx.lineTo(hand2X + 1, hand2Y + 3.5);
        ctx.stroke();
      }
      ctx.restore();
    }
  });
};

export const updateAndDrawHelicopters = (
  ctx: CanvasRenderingContext2D,
  helicopters: Helicopter[],
  dt: number,
  width: number,
  height: number,
  baseScale: number,
) => {
  helicopters.forEach((heli) => {
    heli.x += heli.speed * heli.direction * dt;
    heli.rotorAngle += 0.25 * dt;

    if (heli.x > width + 100 || heli.x < -100) {
      Object.assign(
        heli,
        getResetHelicopter(ctx.canvas.width, ctx.canvas.height),
        {
          x: heli.x < 0 ? width + 100 : -100,
        },
      );
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

export const updateAndDrawBirds = (
  ctx: CanvasRenderingContext2D,
  birds: Bird[],
  dt: number,
  width: number,
  height: number,
  baseScale: number,
) => {
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

// ============================================================
// DOG WIZARD
//
// Animated components:
//   - Entire dog drifts horizontally
//   - Body gently bobs
//   - Hat has subtle independent wobble
//   - Cape has secondary sway
//   - Broom has slight rotation
//   - Bristles have secondary wiggle
//
// Only hat + cape are filled.
// Everything else is outline-only.
// ============================================================
export const updateAndDrawDogWizards = (
  ctx: CanvasRenderingContext2D,
  dogs: DogWizard[],
  dt: number,
  width: number,
  height: number,
  baseScale: number,
  sketchColor: string,
) => {
  const paths = getPaths();

  dogs.forEach((dog) => {
    // Update movement.
    dog.x += dog.speed * dog.direction * dt;
    dog.bobAngle += dog.bobSpeed * dt;
    dog.broomAngle += dog.broomSpeed * dt;
    dog.capeAngle += dog.capeSpeed * dt;
    dog.hatAngle += dog.hatSpeed * dt;

    // Reset when the dog leaves the screen.
    if (dog.direction === 1 && dog.x > width + 100) {
      dog.x = -100;
      dog.y = height * (0.42 + Math.random() * 0.28);
    } else if (dog.direction === -1 && dog.x < -100) {
      dog.x = width + 100;
      dog.y = height * (0.42 + Math.random() * 0.28);
    }

    const bobY = Math.sin(dog.bobAngle) * 4;
    const bodyTilt = Math.cos(dog.bobAngle) * 0.015;
    const capeSwing = Math.sin(dog.capeAngle) * 0.06;
    const capeFlutter = Math.sin(dog.capeAngle * 1.7) * 0.035;
    const hatSwing = Math.sin(dog.hatAngle) * 0.012;
    const broomSwing = Math.sin(dog.broomAngle) * 0.012;
    const s = baseScale * dog.scale;

    ctx.save();
    ctx.translate(dog.x, dog.y + bobY);
    ctx.scale(dog.direction * s, s);
    ctx.rotate(bodyTilt);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = sketchColor;
    ctx.lineWidth = 4;

    // Draw broom behind the dog.
    ctx.save();
    const broomPivotX = 160;
    const broomPivotY = 105;
    ctx.translate(broomPivotX, broomPivotY);
    ctx.rotate(broomSwing);
    ctx.translate(-broomPivotX, -broomPivotY);
    ctx.stroke(paths.dogWizard.broom);
    ctx.lineWidth = 2.5;
    ctx.stroke(paths.dogWizard.broomGrain1);
    ctx.stroke(paths.dogWizard.broomGrain2);
    ctx.stroke(paths.dogWizard.broomGrain3);
    ctx.lineWidth = 4;
    ctx.stroke(paths.dogWizard.bristles);
    ctx.stroke(paths.dogWizard.bristle1);
    ctx.stroke(paths.dogWizard.bristle2);
    ctx.stroke(paths.dogWizard.bristle3);
    ctx.stroke(paths.dogWizard.bristle4);
    ctx.restore();

    // Draw dog body.
    ctx.lineWidth = 4;
    ctx.stroke(paths.dogWizard.body);
    ctx.stroke(paths.dogWizard.ear);
    ctx.stroke(paths.dogWizard.chest);
    ctx.stroke(paths.dogWizard.belly);
    ctx.stroke(paths.dogWizard.tail);

    // Draw legs.
    ctx.stroke(paths.dogWizard.frontLeg);
    ctx.stroke(paths.dogWizard.frontPaw);
    ctx.stroke(paths.dogWizard.rearLeg);
    ctx.stroke(paths.dogWizard.rearPaw);

    // Draw cape with layered movement.
    ctx.save();

    const capePivotX = 120;
    const capePivotY = 45;

    ctx.translate(capePivotX, capePivotY);
    ctx.rotate(capeSwing);
    ctx.translate(-capePivotX, -capePivotY);

    ctx.fillStyle = "rgba(20, 20, 20, 1)";
    ctx.strokeStyle = sketchColor;
    ctx.lineWidth = 4;

    ctx.fill(paths.dogWizard.cape);
    ctx.stroke(paths.dogWizard.cape);

    // Animate the upper cape fold.
    ctx.save();
    ctx.translate(70, 80);
    ctx.rotate(capeFlutter);
    ctx.translate(-70, -80);
    ctx.stroke(paths.dogWizard.capeFold1);
    ctx.restore();

    // Animate the second cape fold.
    ctx.save();
    ctx.translate(50, 100);
    ctx.rotate(capeFlutter * 1.2);
    ctx.translate(-50, -100);
    ctx.stroke(paths.dogWizard.capeFold2);
    ctx.restore();

    // Animate the third cape fold.
    ctx.save();
    ctx.translate(35, 120);
    ctx.rotate(capeFlutter * 1.4);
    ctx.translate(-35, -120);
    ctx.stroke(paths.dogWizard.capeFold3);
    ctx.restore();

    // Animate the lower cape fold.
    ctx.save();
    ctx.translate(20, 135);
    ctx.rotate(capeFlutter * 1.6);
    ctx.translate(-20, -135);
    ctx.stroke(paths.dogWizard.capeFold4);
    ctx.restore();

    ctx.restore();

    // Draw collar and tag.
    ctx.stroke(paths.dogWizard.collar);
    ctx.stroke(paths.dogWizard.clasp);
    ctx.stroke(paths.dogWizard.tag);

    // Draw hands over the broom.
    ctx.stroke(paths.dogWizard.handFront);
    ctx.stroke(paths.dogWizard.handRear);
    ctx.stroke(paths.dogWizard.fingers1);
    ctx.stroke(paths.dogWizard.fingers2);
    ctx.stroke(paths.dogWizard.fingers3);

    // Draw face.
    ctx.stroke(paths.dogWizard.nose);
    ctx.stroke(paths.dogWizard.leftEye);
    ctx.stroke(paths.dogWizard.rightEye);
    ctx.stroke(paths.dogWizard.smile);
    ctx.stroke(paths.dogWizard.mouthCorner);

    // Draw hat.
    ctx.save();

    const hatPivotX = 65;
    const hatPivotY = -60;

    ctx.translate(hatPivotX, hatPivotY);
    ctx.rotate(hatSwing);
    ctx.translate(-hatPivotX, -hatPivotY);

    ctx.fillStyle = "rgba(48, 48, 48, 1)";
    ctx.strokeStyle = sketchColor;
    ctx.lineWidth = 4;

    ctx.fill(paths.dogWizard.hat);
    ctx.stroke(paths.dogWizard.hat);
    ctx.stroke(paths.dogWizard.hatBrim);
    ctx.stroke(paths.dogWizard.hatBand);
    ctx.stroke(paths.dogWizard.hatBuckle);

    ctx.restore();
    ctx.restore();
  });
};
