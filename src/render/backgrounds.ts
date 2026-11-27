import type { Theme } from "../types";
import { invertHex } from "./colors";

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
    theme.bg === "aurora" || theme.bg === "raios" ? colorA : gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.globalCompositeOperation =
    theme.bg === "suave" ||
    theme.bg === "seda" ||
    theme.bg === "diagonal" ||
    theme.bg === "bordas" ||
    theme.bg === "liquido" ||
    theme.bg === "carmim"
      ? "source-over"
      : "lighter";

  if (theme.bg === "seda") {
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
  if (theme.bg !== "suave") {
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
