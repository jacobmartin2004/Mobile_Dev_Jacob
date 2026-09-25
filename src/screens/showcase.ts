/**
 * @format
 */

import type React from 'react';
import StartScreen from './StartScreen';
import ScratchCardScreen from './ScratchCardScreen';
import { HoldToStartPreview, ScratchCardPreview } from './home/previews';

export interface ShowcaseItem {
  id: string;
  title: string;
  description: string;
  tag: string;
  accent: string;
  /** Small looping animation shown inside the home screen box. */
  Preview: React.FC;
  /** Full demo screen opened when the box is tapped. */
  Screen: React.FC;
  /** Style of the floating back button on top of this screen. */
  backButtonTone: 'light' | 'dark';
}

/** Add a new component here and it shows up on the home screen. */
export const SHOWCASE: ShowcaseItem[] = [
  {
    id: 'hold-to-start',
    title: 'Hold to Start',
    description: 'Press and hold to fill, then expand into a welcome screen.',
    tag: 'Gesture',
    accent: '#A855F7',
    Preview: HoldToStartPreview,
    Screen: StartScreen,
    backButtonTone: 'light',
  },
  {
    id: 'scratch-card',
    title: 'Scratch Card',
    description: 'Real scratch-off foil with glowing stars and random points.',
    tag: '7 styles',
    accent: '#FFC53D',
    Preview: ScratchCardPreview,
    Screen: ScratchCardScreen,
    backButtonTone: 'dark',
  },
];
