/**
 * @format
 */

import { createPicture, PaintStyle, Skia, SkPicture } from '@shopify/react-native-skia';
import type { ScratchCardTheme } from './themes';

/** Same color with zero alpha, so gradients fade without a gray fringe. */
export const transparentOf = (color: string) => {
  const c = Skia.Color(color);
  return Float32Array.of(c[0], c[1], c[2], 0);
};

/** Deterministic PRNG so the foil texture never jumps between renders. */
const seededRandom = (seed: number) => {
  let s = Math.abs(Math.floor(seed)) % 233280;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
};

export const addSparkle = (
  path: ReturnType<typeof Skia.Path.Make>,
  cx: number,
  cy: number,
  r: number,
) => {
  const k = r * 0.14;
  path.moveTo(cx, cy - r);
  path.quadTo(cx + k, cy - k, cx + r, cy);
  path.quadTo(cx + k, cy + k, cx, cy + r);
  path.quadTo(cx - k, cy + k, cx - r, cy);
  path.quadTo(cx - k, cy - k, cx, cy - r);
  path.close();
};

/**
 * Static foil texture: themed pattern, metallic grain and a dashed "ticket" border.
 * Coordinates are in canvas space, with the card starting at (x, y).
 */
export const buildFoilPicture = (
  theme: ScratchCardTheme,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): SkPicture =>
  createPicture(canvas => {
    const rand = seededRandom(width * 31 + height * 17 + theme.name.length);
    const ink = Skia.Paint();
    ink.setAntiAlias(true);
    ink.setColor(Skia.Color(theme.patternColor));

    const pattern = Skia.Path.Make();
    switch (theme.foilPattern) {
      case 'diamonds': {
        const gap = 18;
        for (let row = 0; row * gap < height + gap; row++) {
          const offset = row % 2 === 0 ? 0 : gap / 2;
          for (let col = -1; col * gap < width + gap; col++) {
            const cx = x + col * gap + offset;
            const cy = y + row * gap;
            const s = 3.2;
            pattern.moveTo(cx, cy - s);
            pattern.lineTo(cx + s, cy);
            pattern.lineTo(cx, cy + s);
            pattern.lineTo(cx - s, cy);
            pattern.close();
          }
        }
        canvas.drawPath(pattern, ink);
        break;
      }
      case 'dots': {
        const gap = 11;
        for (let row = 0; row * gap < height + gap; row++) {
          const offset = row % 2 === 0 ? 0 : gap / 2;
          for (let col = -1; col * gap < width + gap; col++) {
            pattern.addCircle(x + col * gap + offset, y + row * gap, 1.5);
          }
        }
        canvas.drawPath(pattern, ink);
        break;
      }
      case 'stripes': {
        const gap = 12;
        for (let d = -height; d < width + height; d += gap) {
          pattern.moveTo(x + d, y);
          pattern.lineTo(x + d + height, y + height);
        }
        ink.setStyle(PaintStyle.Stroke);
        ink.setStrokeWidth(3.5);
        canvas.drawPath(pattern, ink);
        break;
      }
      case 'waves': {
        const gap = 14;
        const amp = 4;
        for (let row = -1; row * gap < height + gap; row++) {
          const baseY = y + row * gap;
          pattern.moveTo(x - 10, baseY);
          for (let px = -10; px <= width + 10; px += 6) {
            pattern.lineTo(x + px, baseY + Math.sin((px / width) * Math.PI * 6 + row) * amp);
          }
        }
        ink.setStyle(PaintStyle.Stroke);
        ink.setStrokeWidth(1.6);
        canvas.drawPath(pattern, ink);
        break;
      }
      case 'stars': {
        const count = Math.round((width * height) / 700);
        for (let i = 0; i < count; i++) {
          const cx = x + rand() * width;
          const cy = y + rand() * height;
          const r = 1 + Math.pow(rand(), 3) * 5;
          if (r > 2.2) {
            addSparkle(pattern, cx, cy, r);
          } else {
            pattern.addCircle(cx, cy, r * 0.45);
          }
        }
        canvas.drawPath(pattern, ink);
        break;
      }
    }

    // Metallic grain.
    const grainLight = Skia.Path.Make();
    const grainDark = Skia.Path.Make();
    const grains = Math.round((width * height) / 90);
    for (let i = 0; i < grains; i++) {
      const target = rand() > 0.5 ? grainLight : grainDark;
      target.addCircle(x + rand() * width, y + rand() * height, 0.5 + rand() * 0.6);
    }
    const grainPaint = Skia.Paint();
    grainPaint.setAntiAlias(true);
    grainPaint.setColor(Skia.Color('rgba(255,255,255,0.09)'));
    canvas.drawPath(grainLight, grainPaint);
    grainPaint.setColor(Skia.Color('rgba(0,0,0,0.08)'));
    canvas.drawPath(grainDark, grainPaint);

    // Dashed ticket border.
    const inset = 9;
    const border = Skia.Paint();
    border.setAntiAlias(true);
    border.setStyle(PaintStyle.Stroke);
    border.setStrokeWidth(1.4);
    border.setColor(Skia.Color(theme.foilTextColor));
    border.setAlphaf(0.28);
    border.setPathEffect(Skia.PathEffect.MakeDash([7, 5], 0));
    canvas.drawRRect(
      Skia.RRectXY(
        Skia.XYWHRect(x + inset, y + inset, width - inset * 2, height - inset * 2),
        Math.max(4, radius - inset),
        Math.max(4, radius - inset),
      ),
      border,
    );
  });
