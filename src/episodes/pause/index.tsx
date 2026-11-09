import React from 'react';
import { defineEpisode, Timeline, LookDef, HudChip, FONT, UI } from '../../engine';
import timeline from './timeline.json';
import {
  S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14, S15, S16, S17, S18, S19, S20,
  S21, S22, S23, S24, S25, S26, S27, S28, S29, S30, S31, S32, S33, S34, S35, S36, S37, S38, S39,
  S40, S41, S42, S43,
} from './shots';

// The pause's look: the picture drains to a cold, slightly higher-contrast grade and holds perfectly still
// (no jitter — the world is stopped), a cool wash sits over it and a PAUSED chip blinks. Nothing moves but the chip.
interface PauseLookOverlayProps {
  f: number;
  lv: number;
  p: number;
  n: number;
}
const pauseLook: LookDef = {
  grade: (lv) => `saturate(${1 - 0.48 * lv}) brightness(${1 - 0.07 * lv}) contrast(${1 + 0.13 * lv}) hue-rotate(${-18 * lv}deg)`,
  jitter: 0,
  Overlay: ({ f, lv }: PauseLookOverlayProps) => (
    <g>
      <rect x={-400} y={-400} width={2720} height={1880} fill="#8FC2E8" opacity={0.07 * lv} style={{ mixBlendMode: 'screen' }} />
      <rect x={-400} y={-400} width={2720} height={1880} fill="#0A1024" opacity={0.05 * lv} />
      <HudChip f={f} label="PAUSED" icon="pause" />
      <text x={1820} y={1012} textAnchor="end" fontFamily={FONT.ui} fontSize={26} fill={UI.text} opacity={0.45} letterSpacing={4}>
        {'WORLD 0 px'}
      </text>
    </g>
  ),
};

export const pause = defineEpisode('Pause', {
  timeline: timeline as Timeline,
  shots: {
    S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14, S15, S16, S17, S18, S19, S20,
    S21, S22, S23, S24, S25, S26, S27, S28, S29, S30, S31, S32, S33, S34, S35, S36, S37, S38, S39,
    S40, S41, S42, S43,
  },
  looks: { pause: pauseLook },
});
