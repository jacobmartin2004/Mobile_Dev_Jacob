/**
 * @format
 */

export type FoilPattern = 'diamonds' | 'dots' | 'stripes' | 'stars' | 'waves';

export type ScratchCardVariant =
  | 'gold'
  | 'silver'
  | 'holographic'
  | 'neon'
  | 'emerald'
  | 'rose'
  | 'midnight';

export interface ScratchCardTheme {
  name: string;
  /** Gradient of the scratchable foil, top-left to bottom-right. */
  foilColors: string[];
  foilPattern: FoilPattern;
  /** Pattern ink drawn over the foil (use low alpha). */
  patternColor: string;
  /** Moving shine band across the foil. */
  shimmerColor: string;
  /** Text printed on the foil. */
  foilTextColor: string;
  /** Aura around the card and the glowing rim of scratched edges. */
  glowColor: string;
  /** Colors the star particles pick from. */
  starColors: string[];
  /** Gradient behind the prize. */
  revealColors: string[];
  /** Sunburst rays behind the prize. */
  rayColor: string;
  labelColor: string;
  pointsColor: string;
  pointsGlow: string;
  captionColor: string;
}

export const SCRATCH_CARD_THEMES: Record<ScratchCardVariant, ScratchCardTheme> = {
  gold: {
    name: 'Royal Gold',
    foilColors: ['#8A5A12', '#E9B949', '#FFF1B8', '#D19A2A', '#7A4A0C'],
    foilPattern: 'diamonds',
    patternColor: 'rgba(255, 244, 200, 0.16)',
    shimmerColor: 'rgba(255, 252, 235, 0.65)',
    foilTextColor: '#4A2C05',
    glowColor: '#FFC53D',
    starColors: ['#FFF4C2', '#FFD76A', '#FFB020', '#FFFFFF'],
    revealColors: ['#2A1703', '#4A2A06', '#1A0E02'],
    rayColor: 'rgba(255, 197, 61, 0.14)',
    labelColor: '#FFD76A',
    pointsColor: '#FFF4C2',
    pointsGlow: '#FFB020',
    captionColor: 'rgba(255, 230, 160, 0.8)',
  },
  silver: {
    name: 'Platinum',
    foilColors: ['#6B7280', '#D1D5DB', '#F9FAFB', '#9CA3AF', '#4B5563'],
    foilPattern: 'stripes',
    patternColor: 'rgba(255, 255, 255, 0.14)',
    shimmerColor: 'rgba(255, 255, 255, 0.75)',
    foilTextColor: '#1F2937',
    glowColor: '#C7D2FE',
    starColors: ['#FFFFFF', '#E0E7FF', '#A5B4FC', '#C7D2FE'],
    revealColors: ['#111827', '#1F2937', '#0B1020'],
    rayColor: 'rgba(199, 210, 254, 0.12)',
    labelColor: '#C7D2FE',
    pointsColor: '#FFFFFF',
    pointsGlow: '#818CF8',
    captionColor: 'rgba(224, 231, 255, 0.75)',
  },
  holographic: {
    name: 'Holographic',
    foilColors: ['#FF7AD9', '#9D7CFF', '#6EE7F9', '#86EFAC', '#FDE68A', '#FF7AD9'],
    foilPattern: 'waves',
    patternColor: 'rgba(255, 255, 255, 0.2)',
    shimmerColor: 'rgba(255, 255, 255, 0.8)',
    foilTextColor: '#2E1065',
    glowColor: '#C084FC',
    starColors: ['#FFFFFF', '#F0ABFC', '#67E8F9', '#FDE68A', '#86EFAC'],
    revealColors: ['#1E0B3A', '#2D1060', '#0B1B3A'],
    rayColor: 'rgba(240, 171, 252, 0.13)',
    labelColor: '#F0ABFC',
    pointsColor: '#FFFFFF',
    pointsGlow: '#C084FC',
    captionColor: 'rgba(233, 213, 255, 0.8)',
  },
  neon: {
    name: 'Neon Pulse',
    foilColors: ['#0F0A2E', '#2B0F5C', '#5B21B6', '#1E1B4B', '#0A0620'],
    foilPattern: 'dots',
    patternColor: 'rgba(34, 211, 238, 0.28)',
    shimmerColor: 'rgba(34, 211, 238, 0.5)',
    foilTextColor: '#67E8F9',
    glowColor: '#22D3EE',
    starColors: ['#FFFFFF', '#22D3EE', '#F472B6', '#A78BFA'],
    revealColors: ['#020617', '#0C1640', '#020617'],
    rayColor: 'rgba(34, 211, 238, 0.12)',
    labelColor: '#F472B6',
    pointsColor: '#ECFEFF',
    pointsGlow: '#22D3EE',
    captionColor: 'rgba(165, 243, 252, 0.8)',
  },
  emerald: {
    name: 'Lucky Emerald',
    foilColors: ['#064E3B', '#10B981', '#A7F3D0', '#059669', '#022C22'],
    foilPattern: 'diamonds',
    patternColor: 'rgba(209, 250, 229, 0.16)',
    shimmerColor: 'rgba(236, 253, 245, 0.6)',
    foilTextColor: '#022C22',
    glowColor: '#34D399',
    starColors: ['#FFFFFF', '#A7F3D0', '#34D399', '#FDE68A'],
    revealColors: ['#022C22', '#064E3B', '#01150F'],
    rayColor: 'rgba(52, 211, 153, 0.14)',
    labelColor: '#6EE7B7',
    pointsColor: '#ECFDF5',
    pointsGlow: '#10B981',
    captionColor: 'rgba(167, 243, 208, 0.8)',
  },
  rose: {
    name: 'Rose Quartz',
    foilColors: ['#9D174D', '#F472B6', '#FFE4F1', '#EC4899', '#831843'],
    foilPattern: 'stars',
    patternColor: 'rgba(255, 240, 248, 0.3)',
    shimmerColor: 'rgba(255, 245, 250, 0.7)',
    foilTextColor: '#500724',
    glowColor: '#F472B6',
    starColors: ['#FFFFFF', '#FBCFE8', '#F472B6', '#FDE68A'],
    revealColors: ['#2A0616', '#4C0A2A', '#1A030E'],
    rayColor: 'rgba(244, 114, 182, 0.14)',
    labelColor: '#F9A8D4',
    pointsColor: '#FFF1F7',
    pointsGlow: '#EC4899',
    captionColor: 'rgba(251, 207, 232, 0.8)',
  },
  midnight: {
    name: 'Midnight Galaxy',
    foilColors: ['#020617', '#1E1B4B', '#312E81', '#0F172A', '#020617'],
    foilPattern: 'stars',
    patternColor: 'rgba(255, 255, 255, 0.55)',
    shimmerColor: 'rgba(165, 180, 252, 0.45)',
    foilTextColor: '#E0E7FF',
    glowColor: '#818CF8',
    starColors: ['#FFFFFF', '#C7D2FE', '#FDE68A', '#A5B4FC'],
    revealColors: ['#0B0624', '#1E1150', '#050314'],
    rayColor: 'rgba(253, 230, 138, 0.1)',
    labelColor: '#FDE68A',
    pointsColor: '#FFFFFF',
    pointsGlow: '#818CF8',
    captionColor: 'rgba(199, 210, 254, 0.8)',
  },
};

export const SCRATCH_CARD_VARIANTS = Object.keys(SCRATCH_CARD_THEMES) as ScratchCardVariant[];
