export interface NycBackgroundProps {
  sketchColor?: string;
  cloudCount?: number;
  birdCount?: number;
  witchCount?: number;
  shipCount?: number;
  helicopterCount?: number;
  dogWizardCount?: number;
  charonFerryCount?: number;
}

export interface Cloud {
  x: number;
  y: number;
  speed: number;
  scale: number;
}

export interface Bird {
  x: number;
  y: number;
  speed: number;
  flapSpeed: number;
  flap: number;
  scale: number;
}

export interface Witch {
  baseX: number;
  baseY: number;
  speed: number;
  direction: number;
  scale: number;
  bobAngle: number;
  isLooping: boolean;
  loopProgress: number;
  rotation: number;
  rotationInitialized: boolean;
}

export interface Ship {
  x: number;
  y: number;
  speed: number;
  direction: number;
  type: string;
}

export interface Helicopter {
  x: number;
  y: number;
  speed: number;
  direction: number;
  rotorAngle: number;
}

export interface DogWizard {
  x: number;
  y: number;
  speed: number;
  direction: 1 | -1;
  scale: number;
  bobAngle: number;
  bobSpeed: number;
  broomAngle: number;
  broomSpeed: number;
  capeAngle: number;
  capeSpeed: number;
  hatAngle: number;
  hatSpeed: number;
}

export interface CharonFerry {
  x: number;
  y: number;
  speed: number;
  direction: number;
  type: string;
  bobAngle: number;
  bobSpeed: number;
  paddleAngle: number;
  paddleSpeed: number;
}
