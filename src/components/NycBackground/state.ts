import {
  Cloud,
  Bird,
  Witch,
  Ship,
  Helicopter,
  DogWizard,
  CharonFerry,
} from "./types";

export class SceneState {
  clouds: Cloud[] = [];
  birds: Bird[] = [];
  witches: Witch[] = [];
  ships: Ship[] = [];
  helicopters: Helicopter[] = [];
  dogWizards: DogWizard[] = [];
  charonFerrys: CharonFerry[] = [];
  skylineImg: HTMLImageElement;

  constructor() {
    this.skylineImg = new Image();
    this.skylineImg.src = "/skyline.png";
  }
}

export const initClouds = (
  count: number,
  width: number,
  height: number,
): Cloud[] =>
  Array.from({ length: count }).map(() => ({
    x: Math.random() * width,
    y: (0.05 + Math.random() * 0.35) * height,
    speed: 0.05 + Math.random() * 0.2,
    scale: 0.2 + Math.random() * 2,
  }));

export const initBirds = (
  count: number,
  width: number,
  height: number,
): Bird[] =>
  Array.from({ length: count }).map(() => ({
    x: Math.random() * width,
    y: Math.random() * (height * 0.4),
    speed: 0.2 + Math.random() * 0.4,
    flapSpeed: 0.05 + Math.random() * 0.05,
    flap: Math.random() * Math.PI * 2,
    scale: 0.3 + Math.random() * 0.8,
  }));

export function getResetWitch(width: number, height: number): Witch {
  return {
    baseX: Math.random() * width,
    baseY: height * (0.5 + Math.random() * 0.4),
    speed: 0.6 + Math.random() * 0.8,
    direction: Math.random() < 0.5 ? -1 : 1,
    scale: 1 + Math.random() * 0.6,
    bobAngle: Math.random() * Math.PI * 2,
    isLooping: false,
    loopProgress: 0,
    rotation: 0,
    rotationInitialized: false,
  };
}

export const initWitches = (
  count: number,
  width: number,
  height: number,
): Witch[] =>
  Array.from({ length: count }).map(() => getResetWitch(width, height));

export const initShips = (
  count: number,
  width: number,
  height: number,
): Ship[] => {
  const shipTypes = ["ferry", "catamaran", "tugboat", "cargo", "sailboat"];
  return Array.from({ length: count }).map(() => {
    const type = shipTypes[Math.floor(Math.random() * shipTypes.length)];
    let speed = 0.1 + Math.random() * 0.05;

    if (type === "catamaran") {
      speed = 0.5 + Math.random() * 0.1;
    } else if (type === "ferry") {
      speed = 0.15 + Math.random() * 0.1;
    } else if (type === "cargo") {
      speed = 0.02 + Math.random() * 0.05;
    }

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

export function getResetHelicopter(width: number, height: number): Helicopter {
  return {
    x: Math.random() * width,
    y: height * 0.05 + Math.random() * (height * 0.35),
    speed: 1.7 + Math.random() * 0.9,
    direction: Math.random() > 0.5 ? 1 : -1,
    rotorAngle: 0,
  };
}

export const initHelicopters = (
  count: number,
  width: number,
  height: number,
): Helicopter[] =>
  Array.from({ length: count }).map(() => getResetHelicopter(width, height));

export function getResetDogWizard(width: number, height: number): DogWizard {
  return {
    // Keep the initial position inside the screen.
    x: Math.random() * width,

    // Dog Wizard flies in the lower-middle portion
    // of the scene rather than with the birds.
    y: height * (0.42 + Math.random() * 0.28),
    speed: 0.55 + Math.random() * 0.4,
    direction: Math.random() > 0.5 ? 1 : -1,
    bobAngle: Math.random() * Math.PI * 2,
    bobSpeed: 0.03 + Math.random() * 0.015,
    broomAngle: (Math.random() - 0.5) * 0.04,
    broomSpeed: 0.0015 + Math.random() * 0.001,
    capeAngle: (Math.random() - 0.5) * 0.04,
    capeSpeed: 0.025 + Math.random() * 0.015,
    hatAngle: (Math.random() - 0.5) * 0.025,
    hatSpeed: 0.018 + Math.random() * 0.012,

    // Smaller because the Dog Wizard path geometry
    // is much larger than the witch geometry.
    scale: 0.15 + Math.random() * 0.15,
  };
}

export const initDogWizards = (
  count: number,
  width: number,
  height: number,
): DogWizard[] =>
  Array.from({ length: count }).map(() => getResetDogWizard(width, height));

export function getResetCharonFerry(
  width: number,
  height: number,
): CharonFerry {
  const isDesktop =
    typeof document !== "undefined" &&
    document.documentElement.clientWidth >= 1024;
  const shipBottomOffset = isDesktop ? 30 : 15;
  const shipBottomOffsetMultiplier = isDesktop ? 20 : 10;

  return {
    x: Math.random() * width,
    y: height - shipBottomOffset + Math.random() * shipBottomOffsetMultiplier,
    speed: 0.12 + Math.random() * 0.08,
    direction: Math.random() > 0.5 ? 1 : -1,
    type: "river_styx_ferry",
    bobAngle: Math.random() * Math.PI * 2,
    bobSpeed: 0.03 + Math.random() * 0.015,
    paddleAngle: Math.random() * Math.PI * 2,
    paddleSpeed: 0.045 + Math.random() * 0.015,
  };
}

export const initCharonFerrys = (
  count: number,
  width: number,
  height: number,
): CharonFerry[] =>
  Array.from({ length: count }).map(() => getResetCharonFerry(width, height));
