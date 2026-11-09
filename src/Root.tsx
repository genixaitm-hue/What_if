import React from 'react';
import { Composition } from 'remotion';
import './engine/fonts';
import { STUDIO } from './studio.config';
import { EPISODES } from './episodes';
import { CastSheet } from './CastSheet';

// Every episode gets two compositions: <Id> (the film) and <Id>Board (one frame per shot, at its key frame, for the
// storyboard). Cast renders the cast sheet.
//   npx remotion studio src/index.ts --port 3430

export const Root: React.FC = () => {
  const common = (e: any) => e.id === 'Shelter'
    ? { width: 1080, height: 1920, fps: STUDIO.fps }
    : { width: STUDIO.width, height: STUDIO.height, fps: STUDIO.fps };
  return (
    <>
      {EPISODES.map((e) => {
        const c = common(e);
        return (
          <React.Fragment key={e.id}>
            <Composition id={e.id} component={e.Main} durationInFrames={Math.max(1, e.total)} {...c} />
            <Composition id={`${e.id}Board`} component={e.Board} durationInFrames={Math.max(1, e.shotCount)} {...c} />
          </React.Fragment>
        );
      })}
      <Composition id="Cast" component={CastSheet} durationInFrames={1} {...{ width: STUDIO.width, height: STUDIO.height, fps: STUDIO.fps }} />
    </>
  );
};
