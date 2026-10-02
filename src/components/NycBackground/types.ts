export interface NycBackgroundProps {
  sketchColor?: string;
  cloudCount?: number;
  birdCount?: number;
  witchCount?: number;
  shipCount?: number;
  helicopterCount?: number;
}

export interface Cloud { x: number; y: number; speed: number; scale: number; }
export interface Bird { x: number; y: number; speed: number; flapSpeed: number; flap: number; scale: number; }
export interface Witch {
  baseX: number; baseY: number; speed: number; direction: number; scale: number; bobAngle: number;
  isLooping: boolean; loopProgress: number; rotation: number; rotationInitialized: boolean;
}
export interface Ship { x: number; y: number; speed: number; direction: number; type: string; }
export interface Helicopter { x: number; y: number; speed: number; direction: number; rotorAngle: number; }
