import { Cloud, Bird, Witch, Ship, Helicopter } from "./types";

export class SceneState {
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

export const initClouds = (count: number, width: number, height: number): Cloud[] =>
  Array.from({ length: count }).map(() => ({
    x: Math.random() * width,
    y: (0.05 + Math.random() * 0.35) * height,
    speed: 0.05 + Math.random() * 0.2,
    scale: 0.2 + Math.random() * 2,
  }));

export const initBirds = (count: number, width: number, height: number): Bird[] =>
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

export const initWitches = (count: number, width: number, height: number): Witch[] =>
  Array.from({ length: count }).map(() => getResetWitch(width, height));

export const initShips = (count: number, width: number, height: number): Ship[] => {
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

export function getResetHelicopter(width: number, height: number): Helicopter {
  return {
    x: Math.random() * width,
    y: height * 0.05 + Math.random() * (height * 0.35),
    speed: 1.7 + Math.random() * 0.9,
    direction: Math.random() > 0.5 ? 1 : -1,
    rotorAngle: 0,
  };
}
export const initHelicopters = (count: number, width: number, height: number): Helicopter[] =>
  Array.from({ length: count }).map(() => getResetHelicopter(width, height));
