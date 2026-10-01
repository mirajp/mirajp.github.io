import { useEffect, useRef } from "react";

export default function NycBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    let baseScale = Math.max(0.3, Math.min(0.7, width / 1920));

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      baseScale = Math.max(0.3, Math.min(0.7, width / 1920));
    };
    window.addEventListener("resize", handleResize);

    const sketchColor = "rgba(100, 116, 139, 1)";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const skylineImg = new Image();
    skylineImg.src = "/skyline.png";

    const clouds = Array.from({ length: 8 }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * (height * 0.35),
      speed: 0.01 + Math.random() * 0.04,
      scale: 0.2 + Math.random() * 1.4,
    }));

    // Enhanced Birds: Increased count, varied scales for depth, and varied speeds
    const birds = Array.from({ length: 12 }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * (height * 0.4),
      speed: 0.2 + Math.random() * 0.4,
      flapSpeed: 0.05 + Math.random() * 0.05,
      flap: Math.random() * Math.PI * 2,
      scale: 0.3 + Math.random() * 0.8, // Some birds are small (far), some large (near)
    }));

    const shipPaths = {
      ferry: new Path2D(
        "M -35 0 L 35 0 L 30 10 L -30 10 Z M -30 0 L -25 -12 L 25 -12 L 30 0 M -20 -12 L -15 -20 L 15 -20 L 20 -12 M -15 -6 L -10 -6 M -5 -6 L 0 -6 M 5 -6 L 10 -6 M 15 -6 L 20 -6",
      ),
      catamaran: new Path2D(
        "M -35 0 L 25 0 L 35 -10 L 25 -10 Z M -30 0 L -25 -15 L 15 -15 L 25 -10 M -15 -15 L -10 -22 L 5 -22 L 10 -15 M -10 -7 L 10 -7",
      ),
      tugboat: new Path2D(
        "M -20 0 L 15 0 L 20 -5 L 20 5 L -15 5 Z M -5 0 L -5 -12 L 8 -12 L 8 0 M -2 -12 L -2 -18 L 2 -18 L 2 -12 M 2 -6 L 5 -6",
      ),
      cargo: new Path2D(
        "M -40 0 L 40 0 L 35 6 L -35 6 Z M -30 0 L -30 -10 L -10 -10 L -10 0 M -5 0 L -5 -15 L 15 -15 L 15 0 M 25 0 L 25 -12 L 35 -12 L 35 0 M -35 0 L -35 -18 L -30 -18 L -30 0",
      ),
      sailboat: new Path2D(
        "M -15 0 L 15 0 Q 0 8 -15 0 M 0 0 L 0 -35 L 15 -5 L 0 -5",
      ),
    };

    const shipTypes = Object.keys(shipPaths) as (keyof typeof shipPaths)[];

    const ships = Array.from({ length: 4 }).map(() => {
      const type = shipTypes[Math.floor(Math.random() * shipTypes.length)];

      let speed = 0.04 + Math.random() * 0.05;
      if (type === "catamaran") speed = 0.15 + Math.random() * 0.05;
      if (type === "ferry") speed = 0.1 + Math.random() * 0.05;
      if (type === "cargo") speed = 0.02 + Math.random() * 0.02;

      const isDesktop = window.document.documentElement.clientWidth >= 1024;
      const shipBottomOffset = isDesktop ? 30 : 15;
      const shipBottomOffsetMultiplier = isDesktop ? 20 : 10;
      return {
        x: Math.random() * width,
        y:
          height -
          shipBottomOffset +
          Math.random() * shipBottomOffsetMultiplier,
        speed: speed,
        direction: Math.random() > 0.5 ? 1 : -1,
        type: type,
      };
    });

    const helicopters = Array.from({ length: 1 }).map(() => ({
      x: Math.random() * width,
      y: height * 0.15 + Math.random() * (height * 0.15),
      speed: 0.2 + Math.random() * 0.3,
      direction: Math.random() > 0.5 ? 1 : -1,
      rotorAngle: 0,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      if (skylineImg.complete) {
        const scale = width / skylineImg.width;
        const imgHeight = skylineImg.height * scale;
        const imgY = height - imgHeight;

        ctx.globalAlpha = 0.2;
        ctx.drawImage(skylineImg, 0, imgY, width, imgHeight);
        ctx.globalAlpha = 1.0;
      }

      ctx.strokeStyle = sketchColor;
      ctx.lineWidth = 1.0;

      // Draw Clouds
      clouds.forEach((cloud) => {
        cloud.x += cloud.speed;
        if (cloud.x > width + 100) cloud.x = -100;

        ctx.save();
        ctx.translate(cloud.x, cloud.y);
        ctx.scale(baseScale * cloud.scale, baseScale * cloud.scale);
        ctx.beginPath();
        ctx.moveTo(0, 20);
        ctx.arc(0, 0, 20, Math.PI * 0.5, Math.PI * 1.5);
        ctx.arc(15, -10, 25, Math.PI * 1, Math.PI * 2);
        ctx.arc(40, 0, 20, Math.PI * 1.5, Math.PI * 0.5);
        ctx.lineTo(40, 20);
        ctx.stroke();
        ctx.restore();
      });

      // Draw Ships
      ships.forEach((ship) => {
        ship.x += ship.speed * ship.direction;
        if (ship.x > width + 100) ship.x = -100;
        if (ship.x < -100) ship.x = width + 100;

        ctx.save();
        ctx.translate(ship.x, ship.y);
        ctx.scale(ship.direction * baseScale * 0.8, baseScale * 0.8);
        ctx.stroke(shipPaths[ship.type]);
        ctx.restore();
      });

      // Draw Helicopters
      helicopters.forEach((heli) => {
        heli.x += heli.speed * heli.direction;
        heli.rotorAngle += 0.25;
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

        // Body
        ctx.moveTo(15, 0);
        ctx.ellipse(0, 0, 15, 8, 0, 0, Math.PI * 2);

        // Tail
        ctx.moveTo(-15, 0);
        ctx.lineTo(-30, -5);
        ctx.lineTo(-30, -10);

        // Rotor
        const rotorWidth = Math.cos(heli.rotorAngle) * 20;
        ctx.moveTo(0, -8);
        ctx.lineTo(0, -12);
        ctx.moveTo(-rotorWidth, -12);
        ctx.lineTo(rotorWidth, -12);
        ctx.stroke();
        ctx.restore();
      });

      // Draw Birds
      birds.forEach((bird) => {
        bird.x += bird.speed;
        bird.flap += bird.flapSpeed;
        if (bird.x > width + 50) {
          bird.x = -50;
          bird.y = Math.random() * (height * 0.4);
        }

        ctx.save();
        ctx.translate(bird.x, bird.y);
        ctx.scale(baseScale * bird.scale, baseScale * bird.scale);
        ctx.beginPath();

        // A wider, more dynamic "V" shape for the sketch birds
        const flapOffset = Math.sin(bird.flap) * 8;
        ctx.moveTo(-10, -5 + flapOffset); // Left wing tip
        ctx.quadraticCurveTo(-5, 0, 0, 5); // Left wing to body
        ctx.quadraticCurveTo(5, 0, 10, -5 + flapOffset); // Body to right wing tip

        ctx.stroke();
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    skylineImg.onload = () => {
      render();
    };
    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
}
