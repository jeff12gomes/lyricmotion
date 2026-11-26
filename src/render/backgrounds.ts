import type { Theme } from "../types";

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

function hexAlpha(hex: string, alpha: number): string {
  const value = Number.parseInt(hex.slice(1), 16);
  return `rgba(${value >> 16},${(value >> 8) & 255},${value & 255},${alpha})`;
}

export function drawBackground(
  ctx: CanvasRenderingContext2D,
  time: number,
  theme: Theme,
): void {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;
  const [colorA, colorB, colorC] = theme.c;
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
    theme.bg === "aurora" || theme.bg === "raios" ? colorA : gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.globalCompositeOperation = theme.bg === "suave" ? "source-over" : "lighter";

  if (theme.bg === "aurora") {
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
  if (theme.bg !== "suave") {
    const vignette = ctx.createRadialGradient(
      width / 2,
      height / 2,
      maxDimension * 0.25,
      width / 2,
      height / 2,
      maxDimension * 0.75,
    );
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,0,0,.55)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);
  }
}
