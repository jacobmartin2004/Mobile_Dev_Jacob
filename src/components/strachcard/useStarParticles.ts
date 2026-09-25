/**
 * @format
 */

import { useMemo } from 'react';
import { BlurStyle, createPicture, Skia } from '@shopify/react-native-skia';
import { useDerivedValue, useFrameCallback, useSharedValue } from 'react-native-reanimated';

const MAX_PARTICLES = 140;
const GRAVITY = 0.00018; // px / ms²
const DRAG_PER_FRAME = 0.975;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  rot: number;
  vr: number;
  color: number;
  /** 0 = four-point sparkle, 1 = soft orb */
  kind: number;
  phase: number;
}

const makeDeadPool = (): Particle[] =>
  Array.from({ length: MAX_PARTICLES }, () => ({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    life: 0,
    maxLife: 1,
    size: 1,
    rot: 0,
    vr: 0,
    color: 0,
    kind: 0,
    phase: 0,
  }));

/** Unit (radius 1) four-point sparkle with pinched, curved arms. */
const makeSparklePath = () => {
  const p = Skia.Path.Make();
  p.moveTo(0, -1);
  p.quadTo(0.12, -0.12, 1, 0);
  p.quadTo(0.12, 0.12, 0, 1);
  p.quadTo(-0.12, 0.12, -1, 0);
  p.quadTo(-0.12, -0.12, 0, -1);
  p.close();
  return p;
};

export const useStarParticles = (starColors: string[], width: number, height: number) => {
  const particles = useSharedValue<Particle[]>(makeDeadPool());
  const cursor = useSharedValue(0);
  const alive = useSharedValue(0);

  const sparkle = useMemo(makeSparklePath, []);
  const colors = useMemo(() => starColors.map(c => Skia.Color(c)), [starColors]);

  const spawn = (
    x: number,
    y: number,
    count: number,
    minSpeed: number,
    maxSpeed: number,
    minSize: number,
    maxSize: number,
    minLife: number,
    maxLife: number,
    upwardBias: number,
  ) => {
    'worklet';
    const colorCount = colors.length;
    particles.modify(arr => {
      for (let n = 0; n < count; n++) {
        const p = arr[cursor.value];
        cursor.value = (cursor.value + 1) % MAX_PARTICLES;
        const angle = Math.random() * Math.PI * 2;
        const speed = minSpeed + Math.random() * (maxSpeed - minSpeed);
        p.x = x;
        p.y = y;
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed - upwardBias;
        p.maxLife = minLife + Math.random() * (maxLife - minLife);
        p.life = p.maxLife;
        p.size = minSize + Math.random() * (maxSize - minSize);
        p.rot = Math.random() * 90;
        p.vr = (Math.random() - 0.5) * 0.4;
        p.color = Math.floor(Math.random() * colorCount);
        p.kind = Math.random() < 0.72 ? 0 : 1;
        p.phase = Math.random() * Math.PI * 2;
      }
      return arr;
    });
    alive.value = Math.min(MAX_PARTICLES, alive.value + count);
  };

  /** Small trail of sparkles at the fingertip. */
  const emit = (x: number, y: number, count: number) => {
    'worklet';
    spawn(x, y, count, 0.02, 0.14, 3.5, 9, 450, 950, 0.05);
  };

  /** Celebration burst, used when the card is fully revealed. */
  const burst = (x: number, y: number, count: number) => {
    'worklet';
    spawn(x, y, count, 0.12, 0.5, 5, 14, 900, 1700, 0.08);
  };

  useFrameCallback(frame => {
    'worklet';
    if (alive.value === 0) {
      return;
    }
    const dt = Math.min(frame.timeSincePreviousFrame ?? 16, 40);
    const drag = Math.pow(DRAG_PER_FRAME, dt / 16);
    let living = 0;
    particles.modify(arr => {
      for (let i = 0; i < arr.length; i++) {
        const p = arr[i];
        if (p.life <= 0) {
          continue;
        }
        p.life -= dt;
        if (p.life <= 0) {
          continue;
        }
        living++;
        p.vx *= drag;
        p.vy = p.vy * drag + GRAVITY * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
      }
      return arr;
    });
    alive.value = living;
  });

  const picture = useDerivedValue(() => {
    const arr = particles.value;
    return createPicture(
      canvas => {
        const glow = Skia.Paint();
        glow.setAntiAlias(true);
        glow.setMaskFilter(Skia.MaskFilter.MakeBlur(BlurStyle.Normal, 4, false));
        const core = Skia.Paint();
        core.setAntiAlias(true);
        const white = Skia.Paint();
        white.setAntiAlias(true);
        white.setColor(Skia.Color('#FFFFFF'));

        for (let i = 0; i < arr.length; i++) {
          const p = arr[i];
          if (p.life <= 0) {
            continue;
          }
          const t = p.life / p.maxLife; // 1 -> 0
          // Quick fade-in, long fade-out, plus a twinkle.
          const envelope = t > 0.85 ? (1 - t) / 0.15 : Math.min(1, t / 0.6);
          const twinkle = 0.7 + 0.3 * Math.sin(p.phase + p.life * 0.025);
          const alpha = envelope * twinkle;
          const scale = p.size * (0.6 + 0.4 * envelope);

          glow.setColor(colors[p.color]);
          glow.setAlphaf(alpha * 0.9);
          core.setColor(colors[p.color]);
          core.setAlphaf(alpha);
          white.setAlphaf(alpha);

          canvas.save();
          canvas.translate(p.x, p.y);
          if (p.kind === 0) {
            canvas.rotate(p.rot, 0, 0);
            canvas.drawCircle(0, 0, scale * 0.9, glow);
            canvas.scale(scale, scale);
            canvas.drawPath(sparkle, core);
            canvas.drawCircle(0, 0, 0.2, white);
          } else {
            canvas.drawCircle(0, 0, scale * 0.7, glow);
            canvas.drawCircle(0, 0, scale * 0.22, white);
          }
          canvas.restore();
        }
      },
      { width, height },
    );
  });

  return { picture, emit, burst };
};
