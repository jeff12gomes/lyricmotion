import type { Theme, ThemeBackground } from "../types";
import { invertHex } from "./colors";

export const ANIMATED_BACKGROUND_TYPES: readonly ThemeBackground[] = [
  "aurora",
  "raios",
  "bokeh",
  "estrelas",
  "ondas",
  "suave",
  "seda",
  "diagonal",
  "bordas",
  "liquido",
  "feixes",
  "carmim",
  "nuvens-azuis",
  "fumaca-carmim",
  "feixes-brasa",
  "respingos-tinta",
  "seda-fogo",
  "fumaca-prata",
];

interface Particle {
  x: number;
  y: number;
  r: number;
  s: number;
  ph: number;
}

interface Star {
  x: number;
  y: number;
  r: number;
  ph: number;
}

interface InkSplash {
  x: number;
  y: number;
  radius: number;
  phase: number;
  satellites: Array<{ angle: number; distance: number; radius: number }>;
}

let seed = 7;

function random(): number {
  seed = (seed * 16807) % 2147483647;
  return seed / 2147483647;
}

const particles: Particle[] = Array.from({ length: 70 }, () => ({
  x: random(),
  y: random(),
  r: random(),
  s: random(),
  ph: random() * 6.28,
}));

const stars: Star[] = Array.from({ length: 240 }, () => ({
  x: random(),
  y: random(),
  r: random(),
  ph: random() * 6.28,
}));

const inkSplashes: InkSplash[] = Array.from({ length: 9 }, () => ({
  x: 0.08 + random() * 0.84,
  y: 0.08 + random() * 0.84,
  radius: 0.035 + random() * 0.055,
  phase: random() * Math.PI * 2,
  satellites: Array.from({ length: 7 }, () => ({
    angle: random() * Math.PI * 2,
    distance: 0.9 + random() * 1.8,
    radius: 0.035 + random() * 0.12,
  })),
}));

function hexAlpha(hex: string, alpha: number): string {
  const value = Number.parseInt(hex.slice(1), 16);
  return `rgba(${value >> 16},${(value >> 8) & 255},${value & 255},${alpha})`;
}

export function drawBackground(
  ctx: CanvasRenderingContext2D,
  time: number,
  theme: Theme,
  invertColors = false,
): void {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;
  const invertPalette = invertColors && theme.id !== "chroma";
  const [colorA, colorB, colorC] = invertPalette
    ? theme.c.map(invertHex)
    : theme.c;
  const maxDimension = Math.max(width, height);

  if (theme.bg === "chapado") {
    ctx.fillStyle = colorA;
    ctx.fillRect(0, 0, width, height);
    return;
  }

  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, colorA);
  gradient.addColorStop(1, colorB);
  ctx.fillStyle =
    theme.bg === "aurora" ||
    theme.bg === "raios" ||
    theme.bg === "fumaca-carmim" ||
    theme.bg === "feixes-brasa" ||
    theme.bg === "seda-fogo" ||
    theme.bg === "fumaca-prata"
      ? colorA
      : gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.globalCompositeOperation =
    theme.bg === "suave" ||
    theme.bg === "seda" ||
    theme.bg === "diagonal" ||
    theme.bg === "bordas" ||
    theme.bg === "liquido" ||
    theme.bg === "carmim" ||
    theme.bg === "respingos-tinta"
      ? "source-over"
      : "lighter";

  if (theme.bg === "fumaca-prata") {
    const fogLayers = [
      { x: 0.19, y: 0.62, radius: 0.39, phase: 0.4, speed: 0.017, alpha: 0.18 },
      { x: 0.38, y: 0.42, radius: 0.46, phase: 1.8, speed: 0.013, alpha: 0.2 },
      { x: 0.62, y: 0.54, radius: 0.43, phase: 3.1, speed: 0.015, alpha: 0.19 },
      { x: 0.82, y: 0.34, radius: 0.35, phase: 4.5, speed: 0.019, alpha: 0.16 },
      { x: 0.49, y: 0.27, radius: 0.34, phase: 5.3, speed: 0.012, alpha: 0.14 },
      { x: 0.28, y: 0.82, radius: 0.3, phase: 2.4, speed: 0.021, alpha: 0.13 },
    ];
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (const [index, layer] of fogLayers.entries()) {
      const phase = time * layer.speed + layer.phase;
      const x =
        width *
        (layer.x + 0.085 * Math.sin(phase) + 0.022 * Math.sin(phase * 0.43));
      const y =
        height *
        (layer.y + 0.065 * Math.cos(phase * 0.72) + 0.018 * Math.sin(phase));
      const radius = maxDimension * layer.radius;
      const cloud = ctx.createRadialGradient(
        x,
        y,
        radius * 0.025,
        x,
        y,
        radius,
      );
      cloud.addColorStop(0, hexAlpha(colorC, layer.alpha));
      cloud.addColorStop(0.35, hexAlpha(colorC, layer.alpha * 0.7));
      cloud.addColorStop(0.72, hexAlpha(colorB, layer.alpha * 0.72));
      cloud.addColorStop(1, hexAlpha(colorA, 0));
      ctx.fillStyle = cloud;
      ctx.fillRect(0, 0, width, height);

      const wispX = x + Math.sin(phase * 0.58 + index) * radius * 0.32;
      const wispY = y + Math.cos(phase * 0.49 + index) * radius * 0.2;
      const wispRadius = radius * 0.66;
      const wisp = ctx.createRadialGradient(
        wispX,
        wispY,
        0,
        wispX,
        wispY,
        wispRadius,
      );
      wisp.addColorStop(0, hexAlpha(colorC, layer.alpha * 0.34));
      wisp.addColorStop(0.5, hexAlpha(colorB, layer.alpha * 0.24));
      wisp.addColorStop(1, hexAlpha(colorB, 0));
      ctx.fillStyle = wisp;
      ctx.fillRect(0, 0, width, height);
    }

    const centerGlow = ctx.createRadialGradient(
      width * 0.5,
      height * 0.49,
      maxDimension * 0.04,
      width * 0.5,
      height * 0.49,
      maxDimension * 0.61,
    );
    centerGlow.addColorStop(0, hexAlpha(colorC, 0.12));
    centerGlow.addColorStop(0.48, hexAlpha(colorB, 0.08));
    centerGlow.addColorStop(1, hexAlpha(colorA, 0));
    ctx.fillStyle = centerGlow;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  } else if (theme.bg === "seda-fogo") {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.translate(width / 2, height / 2);
    ctx.rotate(-0.2 + Math.sin(time * 0.035) * 0.025);

    for (let index = 0; index < 7; index += 1) {
      const phase = time * (0.12 + index * 0.009) + index * 1.7;
      const centerY = (index - 3) * height * 0.2;
      const drift = Math.sin(phase) * width * 0.12;
      const amplitude = height * (0.09 + (index % 3) * 0.025);
      const bandWidth = maxDimension * (0.09 + (index % 2) * 0.045);
      const band = ctx.createLinearGradient(
        0,
        centerY - bandWidth,
        0,
        centerY + bandWidth,
      );
      band.addColorStop(0, hexAlpha(colorB, 0));
      band.addColorStop(0.28, hexAlpha(colorB, 0.08));
      band.addColorStop(0.5, hexAlpha(colorC, 0.19));
      band.addColorStop(0.72, hexAlpha(colorB, 0.09));
      band.addColorStop(1, hexAlpha(colorB, 0));
      ctx.strokeStyle = band;
      ctx.lineWidth = bandWidth * 2;
      ctx.lineCap = "round";
      ctx.shadowColor = hexAlpha(colorC, 0.22);
      ctx.shadowBlur = maxDimension * 0.055;
      ctx.beginPath();
      ctx.moveTo(-width * 0.78, centerY + drift * 0.2);
      ctx.bezierCurveTo(
        -width * 0.38 + drift,
        centerY - amplitude,
        width * 0.18 - drift * 0.55,
        centerY + amplitude,
        width * 0.78 + drift * 0.35,
        centerY - drift * 0.15,
      );
      ctx.stroke();
    }

    ctx.shadowBlur = 0;
    for (let index = 0; index < 4; index += 1) {
      const phase = time * 0.09 + index * 1.9;
      const x = Math.sin(phase) * width * 0.32;
      const y = Math.cos(phase * 0.8) * height * 0.22;
      const radius = maxDimension * (0.28 + (index % 2) * 0.08);
      const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
      glow.addColorStop(0, hexAlpha(index % 2 ? colorC : colorB, 0.16));
      glow.addColorStop(0.52, hexAlpha(colorB, 0.07));
      glow.addColorStop(1, hexAlpha(colorA, 0));
      ctx.fillStyle = glow;
      ctx.fillRect(-width / 2, -height / 2, width, height);
    }
    ctx.restore();
  } else if (theme.bg === "respingos-tinta") {
    for (const splash of inkSplashes) {
      const drift = time * 0.11 + splash.phase;
      const centerX =
        width * splash.x + width * 0.018 * Math.sin(drift * 0.72);
      const centerY =
        height * splash.y + height * 0.016 * Math.cos(drift);
      const radius = maxDimension * splash.radius;
      const halo = ctx.createRadialGradient(
        centerX,
        centerY,
        radius * 0.08,
        centerX,
        centerY,
        radius * 2.4,
      );
      halo.addColorStop(0, hexAlpha(colorC, 0.16));
      halo.addColorStop(1, hexAlpha(colorC, 0));
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(0.08 * Math.sin(drift * 0.65));
      ctx.beginPath();
      const points = 20;
      for (let point = 0; point < points; point += 1) {
        const angle = (point / points) * Math.PI * 2;
        const irregularity =
          0.76 +
          0.16 * Math.sin(angle * 3 + splash.phase) +
          0.09 * Math.cos(angle * 5 - splash.phase * 0.7);
        const wobble = 1 + 0.06 * Math.sin(drift + point * 0.8);
        const x = Math.cos(angle) * radius * irregularity * wobble;
        const y = Math.sin(angle) * radius * irregularity * wobble;
        if (point === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fillStyle = hexAlpha(colorC, 0.78);
      ctx.fill();

      for (const drop of splash.satellites) {
        const dropX = Math.cos(drop.angle) * radius * drop.distance;
        const dropY =
          Math.sin(drop.angle) * radius * drop.distance +
          Math.sin(drift + drop.angle) * radius * 0.07;
        const dropRadius = radius * drop.radius;
        ctx.beginPath();
        ctx.ellipse(
          dropX,
          dropY,
          dropRadius * 0.72,
          dropRadius * 1.35,
          drop.angle + Math.PI / 2,
          0,
          Math.PI * 2,
        );
        ctx.fillStyle = hexAlpha(colorC, 0.72);
        ctx.fill();
      }
      ctx.restore();
    }
  } else if (theme.bg === "feixes-brasa") {
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.rotate((-28 * Math.PI) / 180);
    const travel = maxDimension * 0.62;
    const offset = ((time * 17) % travel) - travel / 2;
    for (let index = -7; index <= 7; index += 1) {
      const center = index * maxDimension * 0.24 + offset;
      const phase = time * 0.16 + index * 1.4;
      const beamWidth =
        maxDimension * (0.105 + 0.025 * (0.5 + 0.5 * Math.sin(phase)));
      const left = center - beamWidth / 2;
      const right = center + beamWidth / 2;
      const beam = ctx.createLinearGradient(left, 0, right, 0);
      beam.addColorStop(0, hexAlpha(colorB, 0));
      beam.addColorStop(0.22, hexAlpha(colorB, 0.035));
      beam.addColorStop(0.5, hexAlpha(colorC, 0.19));
      beam.addColorStop(0.78, hexAlpha(colorB, 0.06));
      beam.addColorStop(1, hexAlpha(colorB, 0));
      ctx.fillStyle = beam;
      ctx.fillRect(left, -maxDimension * 1.8, beamWidth, maxDimension * 3.6);

      const coreWidth = beamWidth * 0.28;
      const core = ctx.createLinearGradient(
        center - coreWidth,
        0,
        center + coreWidth,
        0,
      );
      core.addColorStop(0, hexAlpha(colorC, 0));
      core.addColorStop(0.5, hexAlpha(colorC, 0.2));
      core.addColorStop(1, hexAlpha(colorC, 0));
      ctx.fillStyle = core;
      ctx.fillRect(
        center - coreWidth,
        -maxDimension * 1.8,
        coreWidth * 2,
        maxDimension * 3.6,
      );
    }
    ctx.restore();
  } else if (theme.bg === "fumaca-carmim") {
    const smokeClouds = [
      { x: 0.26, y: 0.72, radius: 0.34, speed: 0.019, phase: 0.3 },
      { x: 0.4, y: 0.56, radius: 0.4, speed: 0.015, phase: 1.7 },
      { x: 0.58, y: 0.44, radius: 0.39, speed: 0.017, phase: 2.8 },
      { x: 0.73, y: 0.28, radius: 0.31, speed: 0.021, phase: 4.1 },
      { x: 0.5, y: 0.52, radius: 0.46, speed: 0.013, phase: 5.2 },
      { x: 0.34, y: 0.4, radius: 0.28, speed: 0.023, phase: 3.6 },
    ];
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.translate(width / 2, height / 2);
    ctx.rotate(Math.sin(time * 0.035) * 0.018);
    for (const [index, cloudLayer] of smokeClouds.entries()) {
      const phase = time * cloudLayer.speed + cloudLayer.phase;
      const x =
        (cloudLayer.x - 0.5 + 0.045 * Math.sin(phase)) * width;
      const y =
        (cloudLayer.y - 0.5 + 0.055 * Math.cos(phase * 0.8)) * height;
      const radius = maxDimension * cloudLayer.radius;
      const cloud = ctx.createRadialGradient(
        x,
        y,
        radius * 0.025,
        x,
        y,
        radius,
      );
      cloud.addColorStop(0, hexAlpha(colorC, index % 2 === 0 ? 0.2 : 0.15));
      cloud.addColorStop(0.28, hexAlpha(colorC, 0.12));
      cloud.addColorStop(0.66, hexAlpha(colorB, 0.18));
      cloud.addColorStop(1, hexAlpha(colorB, 0));
      ctx.fillStyle = cloud;
      ctx.fillRect(-width / 2, -height / 2, width, height);
    }

    const heartGlow = ctx.createRadialGradient(
      0,
      0,
      maxDimension * 0.04,
      0,
      0,
      maxDimension * 0.47,
    );
    heartGlow.addColorStop(0, hexAlpha(colorC, 0.15));
    heartGlow.addColorStop(0.45, hexAlpha(colorB, 0.12));
    heartGlow.addColorStop(1, hexAlpha(colorA, 0));
    ctx.fillStyle = heartGlow;
    ctx.fillRect(-width / 2, -height / 2, width, height);
    ctx.restore();
  } else if (theme.bg === "nuvens-azuis") {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const cloudLayers = [
      { x: 0.18, y: 0.24, radius: 0.4, speed: 0.027, phase: 0.2, alpha: 0.16 },
      { x: 0.76, y: 0.19, radius: 0.34, speed: 0.021, phase: 1.8, alpha: 0.14 },
      { x: 0.46, y: 0.56, radius: 0.48, speed: 0.018, phase: 3.2, alpha: 0.13 },
      { x: 0.12, y: 0.78, radius: 0.36, speed: 0.024, phase: 4.4, alpha: 0.12 },
      { x: 0.86, y: 0.76, radius: 0.43, speed: 0.02, phase: 5.3, alpha: 0.14 },
      { x: 0.59, y: 0.32, radius: 0.29, speed: 0.031, phase: 2.5, alpha: 0.11 },
    ];
    for (const [index, layer] of cloudLayers.entries()) {
      const drift = time * layer.speed + layer.phase;
      const x =
        width *
        (layer.x + 0.11 * Math.sin(drift) + 0.035 * Math.sin(drift * 0.43));
      const y =
        height *
        (layer.y + 0.085 * Math.cos(drift * 0.72) + 0.025 * Math.sin(drift));
      const radius = maxDimension * layer.radius;
      const cloud = ctx.createRadialGradient(x, y, radius * 0.04, x, y, radius);
      cloud.addColorStop(0, hexAlpha(colorC, layer.alpha));
      cloud.addColorStop(0.42, hexAlpha(colorB, layer.alpha * 0.62));
      cloud.addColorStop(1, hexAlpha(colorA, 0));
      ctx.fillStyle = cloud;
      ctx.fillRect(0, 0, width, height);

      const wispX = width * (layer.x + 0.12 * Math.sin(drift * 0.66 + index));
      const wispY = height * (layer.y + 0.1 * Math.cos(drift * 0.55 + index));
      const wispRadius = radius * 0.58;
      const wisp = ctx.createRadialGradient(
        wispX,
        wispY,
        0,
        wispX,
        wispY,
        wispRadius,
      );
      wisp.addColorStop(0, hexAlpha(colorB, layer.alpha * 0.35));
      wisp.addColorStop(1, hexAlpha(colorB, 0));
      ctx.fillStyle = wisp;
      ctx.fillRect(0, 0, width, height);
    }
    ctx.restore();
  } else if (theme.bg === "seda") {
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineWidth = maxDimension * 0.12;
    ctx.shadowBlur = maxDimension * 0.08;
    ctx.shadowColor = hexAlpha("#6b665f", 0.22);
    for (let index = 0; index < 3; index += 1) {
      const phase = time * 0.12 + index * 2.1;
      ctx.strokeStyle = hexAlpha("#77716a", 0.11);
      ctx.beginPath();
      ctx.moveTo(-width * 0.2, height * (0.25 + index * 0.24));
      ctx.bezierCurveTo(
        width * (0.25 + 0.08 * Math.sin(phase)),
        height * (0.08 + index * 0.2),
        width * (0.65 + 0.1 * Math.cos(phase)),
        height * (0.78 - index * 0.16),
        width * 1.2,
        height * (0.32 + index * 0.2),
      );
      ctx.stroke();
    }
    ctx.restore();
    for (let index = 0; index < 3; index += 1) {
      const x = width * (0.5 + 0.45 * Math.sin(time * 0.09 + index * 2.4));
      const y = height * (0.5 + 0.4 * Math.cos(time * 0.08 + index * 1.8));
      const shade = ctx.createRadialGradient(x, y, 0, x, y, maxDimension * 0.48);
      shade.addColorStop(0, hexAlpha("#89837b", 0.13));
      shade.addColorStop(1, hexAlpha("#89837b", 0));
      ctx.fillStyle = shade;
      ctx.fillRect(0, 0, width, height);
    }
  } else if (theme.bg === "diagonal") {
    ctx.save();
    ctx.translate(((time * 18) % maxDimension) - maxDimension, 0);
    ctx.rotate(-0.45);
    if (theme.id === "coral-urbano") {
      for (let index = -4; index < 12; index += 1) {
        const x = index * maxDimension * 0.2;
        const band = ctx.createLinearGradient(x, 0, x + maxDimension * 0.09, 0);
        band.addColorStop(0, hexAlpha(colorC, 0));
        band.addColorStop(0.5, hexAlpha(colorC, 0.16));
        band.addColorStop(1, hexAlpha(colorC, 0));
        ctx.fillStyle = band;
        ctx.fillRect(x, -height, maxDimension * 0.1, height * 3);
      }
    } else {
      for (let index = -5; index < 13; index += 1) {
        const x = index * maxDimension * 0.18;
        const beam = ctx.createLinearGradient(x, 0, x + maxDimension * 0.1, 0);
        beam.addColorStop(0, hexAlpha(colorC, 0));
        beam.addColorStop(0.5, hexAlpha(colorC, 0.15));
        beam.addColorStop(1, hexAlpha(colorC, 0));
        ctx.fillStyle = beam;
        ctx.fillRect(x, -height, maxDimension * 0.12, height * 3);
      }
    }
    ctx.restore();

    if (theme.id === "coral-urbano") {
      for (const particle of particles) {
        const x = ((particle.x * width + time * (8 + particle.s * 9)) % width);
        const y = particle.y * height;
        ctx.fillStyle = hexAlpha("#ffe7d9", 0.12 + particle.r * 0.12);
        ctx.beginPath();
        ctx.arc(x, y, 0.5 + particle.r * 1.1, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (theme.bg === "bordas") {
    for (let index = 0; index < 6; index += 1) {
      const side = index % 2;
      const phase = time * 0.45 + index * 1.7;
      const x = side ? width * (0.94 + 0.06 * Math.sin(phase)) : width * (0.06 + 0.06 * Math.sin(phase));
      const y = height * ((index / 3) % 1 + 0.08 * Math.cos(phase));
      const radius = maxDimension * (0.16 + 0.035 * Math.sin(phase));
      const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
      glow.addColorStop(0, hexAlpha(colorC, 0.34));
      glow.addColorStop(0.58, hexAlpha(colorC, 0.12));
      glow.addColorStop(1, hexAlpha(colorC, 0));
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);
    }
  } else if (theme.bg === "liquido") {
    for (let index = 0; index < 5; index += 1) {
      const base = height * (0.22 + index * 0.15);
      const amplitude = height * (0.08 + (index % 2) * 0.025);
      ctx.fillStyle = hexAlpha(colorC, 0.08 + (index % 3) * 0.025);
      ctx.beginPath();
      ctx.moveTo(0, height);
      for (let x = 0; x <= width; x += Math.max(1, width / 100)) {
        const wave =
          Math.sin((x / width) * Math.PI * 2 * (1.2 + index * 0.18) + time * (0.28 + index * 0.035)) *
            amplitude +
          Math.sin((x / width) * Math.PI * 4 + time * 0.18 + index) * amplitude * 0.28;
        ctx.lineTo(x, base + wave);
      }
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fill();
    }
    const glowX = width * (0.5 + 0.32 * Math.sin(time * 0.12));
    const glowY = height * (0.45 + 0.22 * Math.cos(time * 0.1));
    const glow = ctx.createRadialGradient(glowX, glowY, 0, glowX, glowY, maxDimension * 0.55);
    glow.addColorStop(0, hexAlpha(colorC, 0.14));
    glow.addColorStop(1, hexAlpha(colorC, 0));
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
  } else if (theme.bg === "feixes") {
    const glowX = width * (theme.id === "brasa-intensa" ? 0.5 : 0.15);
    const glowY = height * (theme.id === "brasa-intensa" ? 1.05 : -0.1);
    const glow = ctx.createRadialGradient(glowX, glowY, 0, glowX, glowY, maxDimension * 1.1);
    glow.addColorStop(0, hexAlpha(colorC, 0.3));
    glow.addColorStop(1, hexAlpha(colorC, 0));
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    if (theme.id === "brasa-intensa") {
      ctx.translate(width * 0.5, height * 0.95);
      ctx.rotate(Math.sin(time * 0.08) * 0.08);
      for (let index = 0; index < 11; index += 1) {
        const angle = -Math.PI * 0.9 + (index / 10) * Math.PI * 0.8;
        const spread = 0.025 + 0.012 * Math.sin(time * 0.18 + index);
        ctx.fillStyle = hexAlpha(colorC, 0.035 + 0.025 * Math.sin(time * 0.15 + index));
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(angle - spread) * maxDimension * 1.4, Math.sin(angle - spread) * maxDimension * 1.4);
        ctx.lineTo(Math.cos(angle + spread) * maxDimension * 1.4, Math.sin(angle + spread) * maxDimension * 1.4);
        ctx.closePath();
        ctx.fill();
      }
    } else {
      ctx.translate(width / 2, height / 2);
      ctx.rotate(-0.55 + Math.sin(time * 0.045) * 0.04);
      const offset = (time * 14) % (maxDimension * 0.24);
      for (let index = -6; index < 7; index += 1) {
        const x = index * maxDimension * 0.24 + offset;
        const beam = ctx.createLinearGradient(x, 0, x + maxDimension * 0.1, 0);
        beam.addColorStop(0, hexAlpha(colorC, 0));
        beam.addColorStop(0.5, hexAlpha(colorC, 0.24));
        beam.addColorStop(1, hexAlpha(colorC, 0));
        ctx.fillStyle = beam;
        ctx.fillRect(x, -maxDimension * 2, maxDimension * 0.1, maxDimension * 4);
      }
    }
    ctx.restore();
  } else if (theme.bg === "carmim") {
    const offset = (time * 3) % Math.max(8, width * 0.018);
    ctx.lineWidth = Math.max(1, width * 0.001);
    for (let x = -width * 0.02 + offset; x < width; x += Math.max(8, width * 0.018)) {
      ctx.strokeStyle = hexAlpha("#26040a", 0.13);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (const star of stars) {
      const x = star.x * width;
      const y = star.y * height;
      const alpha = 0.12 + 0.35 * Math.abs(Math.sin(time * 0.55 + star.ph));
      ctx.fillStyle = hexAlpha("#fff0df", alpha);
      ctx.beginPath();
      ctx.arc(x, y, 0.4 + star.r * maxDimension * 0.0012, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (theme.bg === "aurora") {
    for (let index = 0; index < 4; index += 1) {
      const x = width * (0.5 + 0.38 * Math.sin(time * 0.13 + index * 1.7));
      const y = height * (0.5 + 0.32 * Math.cos(time * 0.11 + index * 2.3));
      const glow = ctx.createRadialGradient(
        x,
        y,
        0,
        x,
        y,
        maxDimension * 0.55,
      );
      const color = index % 2 ? colorC : colorB;
      glow.addColorStop(0, hexAlpha(color, 0.5));
      glow.addColorStop(1, hexAlpha(color, 0));
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);
    }
  } else if (theme.bg === "raios") {
    const glow = ctx.createRadialGradient(
      width / 2,
      -height * 0.1,
      0,
      width / 2,
      -height * 0.1,
      maxDimension * 0.9,
    );
    glow.addColorStop(0, hexAlpha(colorB, 0.95));
    glow.addColorStop(1, hexAlpha(colorB, 0));
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(width / 2, -height * 0.12);
    ctx.rotate(Math.sin(time * 0.05) * 0.25);
    for (let index = 0; index < 14; index += 1) {
      const angle = (index / 14) * Math.PI * 2;
      const spread = 0.07 + 0.03 * Math.sin(time * 0.4 + index);
      ctx.fillStyle = hexAlpha(
        colorC,
        0.05 + 0.04 * Math.sin(time * 0.3 + index * 2),
      );
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(
        Math.cos(angle - spread) * maxDimension * 1.6,
        Math.sin(angle - spread) * maxDimension * 1.6,
      );
      ctx.lineTo(
        Math.cos(angle + spread) * maxDimension * 1.6,
        Math.sin(angle + spread) * maxDimension * 1.6,
      );
      ctx.fill();
    }
    ctx.restore();
  } else if (theme.bg === "bokeh" || theme.bg === "suave") {
    for (const particle of particles) {
      const y =
        (((particle.y - time * (0.01 + particle.s * 0.03)) % 1 + 1) % 1) *
          1.2 -
        0.1;
      const x = particle.x + 0.03 * Math.sin(time * 0.3 + particle.ph);
      const radius = maxDimension * (0.02 + particle.r * 0.07);
      const alpha =
        (theme.bg === "suave" ? 0.18 : 0.28) *
        (0.55 + 0.45 * Math.sin(time * 0.8 + particle.ph));
      const glow = ctx.createRadialGradient(
        x * width,
        y * height,
        0,
        x * width,
        y * height,
        radius,
      );
      glow.addColorStop(0, hexAlpha(colorC, alpha));
      glow.addColorStop(1, hexAlpha(colorC, 0));
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x * width, y * height, radius, 0, 7);
      ctx.fill();
    }
  } else if (theme.bg === "estrelas") {
    const glow = ctx.createRadialGradient(
      width / 2,
      height * 1.1,
      0,
      width / 2,
      height * 1.1,
      maxDimension * 0.7,
    );
    glow.addColorStop(0, hexAlpha(colorC, 0.35));
    glow.addColorStop(1, hexAlpha(colorC, 0));
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    for (const star of stars) {
      const x = ((star.x + time * 0.003) % 1) * width;
      ctx.fillStyle = hexAlpha(
        "#ffffff",
        0.25 + 0.6 * Math.abs(Math.sin(time * 0.9 + star.ph)),
      );
      ctx.beginPath();
      ctx.arc(x, star.y * height, 0.6 + star.r * maxDimension * 0.0016, 0, 7);
      ctx.fill();
    }
  } else if (theme.bg === "ondas") {
    for (let index = 0; index < 4; index += 1) {
      ctx.fillStyle = hexAlpha(colorC, 0.07 + index * 0.04);
      ctx.beginPath();
      ctx.moveTo(0, height);
      for (let x = 0; x <= width; x += width / 60) {
        ctx.lineTo(
          x,
          height * (0.55 + index * 0.1) +
            Math.sin(
              (x / width) * 6.28 * (1 + index * 0.4) +
                time * (0.5 + index * 0.15),
            ) *
              height *
              0.04,
        );
      }
      ctx.lineTo(width, height);
      ctx.fill();
    }
  }

  ctx.globalCompositeOperation = "source-over";
  if (
    theme.bg !== "suave" &&
    theme.bg !== "respingos-tinta"
  ) {
    const paletteLuminance =
      [colorA, colorB, colorC].reduce((total, color) => {
        const red = Number.parseInt(color.slice(1, 3), 16) / 255;
        const green = Number.parseInt(color.slice(3, 5), 16) / 255;
        const blue = Number.parseInt(color.slice(5, 7), 16) / 255;
        return total + 0.2126 * red + 0.7152 * green + 0.0722 * blue;
      }, 0) / 3;
    const vignetteAlpha =
      invertPalette && paletteLuminance > 0.55 ? 0.12 : 0.55;
    const vignette = ctx.createRadialGradient(
      width / 2,
      height / 2,
      maxDimension * 0.25,
      width / 2,
      height / 2,
      maxDimension * 0.75,
    );
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, `rgba(0,0,0,${vignetteAlpha})`);
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);
  }
}
