import React from 'react';
import {
  Hero, Pose, basePose, poseAt, faceAt, walkPose, LOOKS, HEAD, LEG_LEN, C,
  kf, clamp, lerp, easeOut, easeIn, backOut, rnd, settle, camT,
  Foreground, Sparkle, TitleCard, UI, FONT, Glow, LightVeil,
  ShotProps,
} from '../../engine';

// "What if your shower had a weather forecast?" — the 33-second Arabic cut, 14 shots, one flat dusk bathroom built
// locally (no new engine set). The character is fingerless: mitten hands only, the same look as every episode.
// The forecast is the power: a wall dial the viewer reads as weather, and a chip that stays calm until it flips red.

const PIP = LOOKS.pipHood;
const MO = LOOKS.mo;
const SIS = LOOKS.sis;
const SUIT = LOOKS.suit;

// ---------------------------------------------------------------- the bathroom (flat, dusk)

const TILES_X = Array.from({ length: 13 }, (_, i) => -200 + i * 190);
const TILES_Y = Array.from({ length: 7 }, (_, i) => 40 + i * 150);

/** The bathroom, front-on: teal tile wall, glass stall in the middle, sink + fogged mirror left, frosted door right. */
const Bathroom: React.FC<{ t?: number; doorPct?: number; glassOn?: boolean }> = ({ t = 0, doorPct = 0, glassOn = true }) => (
  <g>
    <rect x={-400} y={-400} width={2720} height={1880} fill="#0E1018" />
    {/* back wall */}
    <rect x={-400} y={-400} width={2720} height={1260} fill="#22333F" />
    {TILES_X.map((x, i) => (
      <line key={`vx${i}`} x1={x} y1={-400} x2={x} y2={860} stroke="#31465A" strokeWidth={5} opacity={0.6} />
    ))}
    {TILES_Y.map((y, i) => (
      <line key={`hy${i}`} x1={-400} y1={y} x2={2320} y2={y} stroke="#31465A" strokeWidth={5} opacity={0.6} />
    ))}
    <rect x={-400} y={-400} width={2720} height={1260} fill="#9FCBE8" opacity={0.05} style={{ mixBlendMode: 'screen' }} />
    {/* floor */}
    <rect x={-400} y={860} width={2720} height={620} fill="#1A1E28" />
    {TILES_X.map((x, i) => (
      <line key={`fx${i}`} x1={x} y1={860} x2={x - 140} y2={1480} stroke="#262C3A" strokeWidth={5} opacity={0.8} />
    ))}
    <line x1={-400} y1={860} x2={2320} y2={860} stroke="#3A4A5C" strokeWidth={7} />
    {/* sink + fogged mirror, left */}
    <g>
      <rect x={150} y={330} width={330} height={420} rx={26} fill="#3A4A5C" opacity={glassOn ? 0.9 : 1} />
      <rect x={176} y={356} width={278} height={368} rx={18} fill="#BFE0F2" opacity={0.28} />
      <path d="M 210 420 Q 260 400 320 420 Q 380 440 420 415" stroke="#FFFFFF" strokeWidth={5} fill="none" opacity={0.35} />
      <path d="M 230 500 Q 290 486 350 502" stroke="#FFFFFF" strokeWidth={4} fill="none" opacity={0.25} />
      <ellipse cx={315} cy={700} rx={120} ry={30} fill="#2E3846" />
      <rect x={295} y={700} width={40} height={150} fill="#2E3846" />
      <circle cx={70} cy={702} r={13} fill="#E9C46A" />
      <path d="M 70 702 V 740" stroke="#E9C46A" strokeWidth={9} strokeLinecap="round" />
    </g>
    {/* glass stall, centre */}
    <g opacity={glassOn ? 1 : 0.35}>
      <rect x={560} y={170} width={800} height={742} rx={18} fill="#BFE0F2" opacity={0.10} />
      <rect x={560} y={170} width={800} height={742} rx={18} fill="none" stroke="#4E6577" strokeWidth={10} />
      <line x1={960} y1={170} x2={960} y2={912} stroke="#4E6577" strokeWidth={7} opacity={0.7} />
      <path d="M 600 380 L 760 210" stroke="#FFFFFF" strokeWidth={16} opacity={0.16} strokeLinecap="round" />
      <path d="M 1180 640 L 1310 480" stroke="#FFFFFF" strokeWidth={13} opacity={0.12} strokeLinecap="round" />
      {/* showerhead + pipe */}
      <path d="M 960 170 V 96" stroke="#8FA6B9" strokeWidth={16} strokeLinecap="round" />
      <path d="M 960 250 Q 960 208 918 196" stroke="#8FA6B9" strokeWidth={15} fill="none" strokeLinecap="round" />
      <path d="M 852 258 Q 848 236 918 230 Q 988 236 984 258 Q 990 292 918 296 Q 846 292 852 258 Z" fill="#C9D6E0" stroke="#1A2230" strokeWidth={5} />
      {[880, 903, 926, 949].map((x, i) => (
        <circle key={i} cx={x} cy={292} r={5} fill="#5A7186" />
      ))}
      {/* knobs */}
      <circle cx={620} cy={620} r={30} fill="#243140" stroke="#E9C46A" strokeWidth={6} />
      <circle cx={1300} cy={620} r={30} fill="#243140" stroke="#E9C46A" strokeWidth={6} />
      <path d={`M 620 620 ${doorPct ? 'h 0' : 'v -22'}`} stroke="#E9C46A" strokeWidth={8} strokeLinecap="round" transform={`rotate(${doorPct * 120} 620 620)`} />
    </g>
    {/* puddle + drain */}
    <ellipse cx={960} cy={940} rx={330} ry={42} fill="#101418" opacity={0.6} />
    <ellipse cx={960} cy={934} rx={300} ry={34} fill="#2C3E4E" opacity={0.5} />
    <circle cx={960} cy={934} r={17} fill="#101418" />
    {/* frosted door, right */}
    <g>
      <rect x={1520} y={120} width={330} height={800} rx={16} fill="#2A3644" stroke="#4E6577" strokeWidth={9} />
      <rect x={1552} y={170} width={266} height={640} rx={10} fill="#BFE0F2" opacity={0.14} />
      <path d="M 1584 300 Q 1650 282 1720 300" stroke="#FFFFFF" strokeWidth={5} fill="none" opacity={0.2} />
      <circle cx={1566} cy={560} r={11} fill="#8FA6B9" />
    </g>
    {/* window-blind light slats from the left */}
    {[0, 1, 2].map((i) => (
      <rect key={i} x={-400} y={90 + i * 170} width={1500} height={46} fill="#FFD9A0" opacity={0.05} style={{ mixBlendMode: 'screen' }} />
    ))}
    <Glow x={960} y={430} r={620} o={0.16} />
    <LightVeil id="bath" lights={[[960, 470, 680]]} o={0.35} />
    <Foreground blur={3}><rect x={-400} y={990} width={2720} height={490} fill="#0A0C12" opacity={0.55} /></Foreground>
  </g>
);

/** Falling water droplets between the head and the floor. */
const Drops: React.FC<{ x0: number; x1: number; y0: number; y1: number; n?: number; kind?: 'ice' | 'cold' | 'hot' | 'steam' }> = ({ x0, x1, y0, y1, n = 16, kind = 'cold' }) => (
  <g>
    {Array.from({ length: n }, (_, i) => {
      const px = x0 + ((x1 - x0) * i) / (n - 1) + Math.sin(i * 17.3) * 18;
      const py = y0 + ((y1 - y0) * ((i * 37) % 11)) / 11;
      if (kind === 'ice') {
        return <rect key={i} x={px - 13} y={py} width={26} height={26} rx={6} fill="#BFE6FF" stroke="#7FB6D9" strokeWidth={3} transform={`rotate(${(i * 23) % 60 - 30} ${px} ${py + 13})`} />;
      }
      if (kind === 'steam') {
        return <ellipse key={i} cx={px} cy={py} rx={30} ry={17} fill="#EAF2F8" opacity={0.3} />;
      }
      return <path key={i} d="M 0 -26 Q 9 -12 7 4 Q 4 16 0 20 Q -4 16 -7 4 Q -9 -12 0 -26 Z" transform={`translate(${px} ${py})`} fill={kind === 'hot' ? '#FF9A5A' : '#9FCBE8'} stroke={kind === 'hot' ? '#C2571B' : '#5E88A8'} strokeWidth={3} opacity={0.9} />;
    })}
  </g>
);

// ================================================================= THE SHOWER
// ---------- S1: macro: ice cubes out of the head ----------
export const S1: React.FC<ShotProps> = ({ t }) => {
  const shiver = settle(t, 14, 6, 3);
  const pip = poseAt(t, [
    { f: 0, p: { x: 960, y: 880 - LEG_LEN * 0.9, scale: 0.9, yaw: 0, look: -0.4, expr: 'worried', armL: { a: 60, b: 40 }, armR: { a: 60, b: 40 } } },
    { f: 20, p: { x: 960 + shiver * 0.4, armL: { a: 54, b: 44 }, armR: { a: 54, b: 44 } } },
  ]);
  return (
    <g transform={camT(960, 500, kf(t, [[0, 1.35], [26, 1.5]]))}>
      <Bathroom t={t} />
      <Drops x0={860} x1={1060} y0={296} y1={920} n={15} kind="ice" />
      <Hero look={PIP} pose={{ ...basePose, ...pip }} rimId="rimL" shadow={0} />
      <Sparkle x={960} y={350} t={t - 8} s={1.1} />
    </g>
  );
};

// ---------- S2: medium: the steam blast, Pip dancing ----------
export const S2: React.FC<ShotProps> = ({ t }) => {
  const dance = Math.sin(t / 3.4) * 18;
  const pip = poseAt(t, [
    { f: 0, p: { x: 960, y: 880 - LEG_LEN * 0.95, scale: 0.95, yaw: 0, expr: 'shock', tilt: -4 } },
    { f: 12, p: { x: 960 + dance, tilt: 5, armL: { a: 150, b: 30 }, armR: { a: 150, b: 30 } } },
    { f: 24, p: { x: 960 - dance, tilt: -5, armL: { a: 160, b: 24 }, armR: { a: 160, b: 24 } } },
  ]);
  return (
    <g transform={camT(960, 500, kf(t, [[0, 1.5], [40, 1.58]]))}>
      <Bathroom t={t} />
      <Drops x0={820} x1={1100} y0={296} y1={900} n={22} kind="steam" />
      <Drops x0={880} x1={1040} y0={296} y1={900} n={12} kind="hot" />
      <Hero look={PIP} pose={{ ...basePose, ...pip }} rimId="rimR" shadow={0} />
    </g>
  );
};

// ---------- S3: medium: the flip-flop dance (cold, hot, cold) ----------
export const S3: React.FC<ShotProps> = ({ t }) => {
  const hot = t >= 14 && t < 26;
  const pip = poseAt(t, [
    { f: 0, p: { x: 960, y: 880 - LEG_LEN * 0.95, scale: 0.95, yaw: 0, expr: 'worried' } },
    { f: 14, p: { expr: 'shock', armL: { a: 158, b: 40 }, armR: { a: 158, b: 40 }, tilt: -6 } },
    { f: 26, p: { expr: 'worried', armL: { a: 46, b: 30 }, armR: { a: 46, b: 30 }, tilt: 4 } },
  ]);
  return (
    <g transform={camT(960, 500, kf(t, [[0, 1.55], [40, 1.45]]))}>
      <Bathroom t={t} />
      <Drops x0={860} x1={1060} y0={296} y1={900} n={18} kind={hot ? 'hot' : 'cold'} />
      {hot ? <Drops x0={900} x1={1020} y0={340} y1={820} n={10} kind="steam" /> : null}
      <Hero look={PIP} pose={{ ...basePose, ...pip }} rimId="rimR" shadow={0} />
    </g>
  );
};

// ---------- S4: wide: Pip nervous before the glass ----------
export const S4: React.FC<ShotProps> = ({ t }) => {
  const pip = poseAt(t, [
    { f: 0, p: { x: 960, y: 890 - LEG_LEN * 1.0, scale: 1.0, yaw: 0, look: 0.5, expr: 'worried', armL: { a: 16, b: 10 }, armR: { a: 16, b: 10 } } },
    { f: 40, p: { x: 960, armL: { a: 28, b: 12 }, armR: { a: 28, b: 12 }, look: -0.4 } },
  ]);
  return (
    <g transform={camT(960, 540, kf(t, [[0, 1.0], [57, 1.08]]))}>
      <Bathroom t={t} />
      <Hero look={PIP} pose={{ ...basePose, ...pip }} rimId="rimL" shadow={0} />
      <Sparkle x={960} y={300} t={t - 6} s={0.9} />
    </g>
  );
};

// ---------- S5: the Arabic title card over the bathroom ----------
export const S5: React.FC<ShotProps> = ({ t }) => (
  <g transform={camT(960, 540, 1.02)}>
    <Bathroom t={t} />
    <TitleCard t={t} lines={['ماذا لو كان لدشك', 'نشرة طقس؟']} y={330} size={150} />
    <Drops x0={860} x1={1060} y0={296} y1={900} n={10} kind="cold" />
  </g>
);

// ---------- S6: medium: checking the forecast dial ----------
export const S6: React.FC<ShotProps> = ({ t }) => {
  const pip = poseAt(t, [
    { f: 0, p: { x: 1240, y: 880 - LEG_LEN * 1.0, scale: 1.0, yaw: -0.5, look: -0.9, expr: 'neutral', armL: { a: 90, b: 60 }, armR: { a: 90, b: 60 } } },
    { f: 24, p: { armL: { a: 120, b: 52 }, armR: { a: 120, b: 52 } } },
  ]);
  const needle = -90 + clamp(t / 30) * 150;
  return (
    <g transform={camT(1010, 520, kf(t, [[0, 1.42], [51, 1.5]]))}>
      <Bathroom t={t} />
      {/* the forecast dial on the wall beside the glass */}
      <g transform="translate(620 470)">
        <circle r={150} fill={UI.pill} opacity={0.7} />
        <circle r={150} fill="none" stroke={UI.text} strokeWidth={6} opacity={0.85} />
        <circle r={132} fill="none" stroke={UI.live} strokeWidth={9} strokeDasharray={2 * Math.PI * 132} strokeDashoffset={2 * Math.PI * 132 * (1 - clamp(t / 28))} transform="rotate(-90)" />
        <path d="M 0 0 L 0 -96" stroke={UI.live} strokeWidth={10} strokeLinecap="round" transform={`rotate(${needle})`} />
        <text y={62} textAnchor="middle" fontFamily={FONT.ar} fontWeight={800} fontSize={44} fill={UI.live}>
          {t < 18 ? '25°' : '40°'}
        </text>
        <text y={112} textAnchor="middle" fontFamily={FONT.ar} fontWeight={700} fontSize={34} fill={UI.text}>
          نشرة الطقس
        </text>
      </g>
      <Hero look={PIP} pose={{ ...basePose, ...pip }} rimId="rimR" shadow={0} />
    </g>
  );
};

// ---------- S7: wide: calm warm shower, neighbor shivering outside ----------
export const S7: React.FC<ShotProps> = ({ t }) => {
  const pip = poseAt(t, [
    { f: 0, p: { x: 960, y: 882 - LEG_LEN * 0.98, scale: 0.98, yaw: 0, look: 0.2, expr: 'happy', armL: { a: 20, b: 8 }, armR: { a: 20, b: 8 }, headTilt: -4 } },
    { f: 90, p: { headTilt: 3, armL: { a: 26, b: 14 }, armR: { a: 26, b: 14 } } },
  ]);
  const moShiver = settle(t, 9, 7, 4);
  return (
    <g transform={camT(960, 540, kf(t, [[0, 1.05], [186, 1.12]]))}>
      <Bathroom t={t} />
      <Drops x0={880} x1={1040} y0={296} y1={900} n={14} kind="hot" />
      <Hero look={PIP} pose={{ ...basePose, ...pip }} rimId="rimR" shadow={0} />
      {/* the neighbor, wrapped in a blanket, shivering at the door */}
      <g transform={`translate(${1690 + moShiver * 0.5} 830)`}>
        <path d="M -120 100 Q -110 -10 0 -26 Q 110 -10 120 100 Z" fill="#5E6E46" stroke="#14121C" strokeWidth={6} />
        <circle cx={0} cy={-56} r={52} fill={MO.hand} stroke="#14121C" strokeWidth={6} />
        <path d="M -40 -96 Q 0 -130 40 -96 L 40 -78 Q 0 -100 -40 -78 Z" fill="#2A1C18" />
        <path d="M -16 -52 Q -8 -58 0 -52 M 12 -52 Q 20 -58 28 -52" stroke="#14121C" strokeWidth={5} fill="none" strokeLinecap="round" />
        <path d="M -8 -32 Q 0 -26 8 -32" stroke="#14121C" strokeWidth={5} fill="none" strokeLinecap="round" />
      </g>
      <Sparkle x={920} y={360} t={t - 30} s={1.0} />
    </g>
  );
};

// ---------- S8: macro: thermometer at 60, three-second countdown ----------
export const S8: React.FC<ShotProps> = ({ t }) => {
  const secs = clamp((t - 10) / 56);
  const fill = 0.25 + secs * 0.75;
  return (
    <g transform={camT(960, 540, 1.0)}>
      <Bathroom t={t} glassOn={false} />
      {/* thermometer */}
      <g transform="translate(500 540)">
        <rect x={-60} y={-300} width={120} height={480} rx={60} fill="#101418" stroke="#3A4A5C" strokeWidth={6} />
        <rect x={-42} y={148 - 430 * fill} width={84} height={430 * fill} rx={42} fill="#FF5A4A" />
        <circle cy={210} r={86} fill="#FF5A4A" stroke="#3A4A5C" strokeWidth={6} />
        <text x={96} y={-240} textAnchor="start" fontFamily={FONT.ar} fontWeight={900} fontSize={86} fill="#FF5A4A">
          60°
        </text>
        <text x={96} y={-180} textAnchor="start" fontFamily={FONT.ar} fontWeight={700} fontSize={44} fill={UI.text}>
          درجة
        </text>
      </g>
      {/* the three-second countdown */}
      <g transform="translate(1300 540)">
        <circle r={180} fill={UI.pill} opacity={0.72} />
        <circle r={180} fill="none" stroke={UI.text} strokeWidth={6} opacity={0.85} />
        <circle r={162} fill="none" stroke="#FF5A4A" strokeWidth={10} strokeDasharray={2 * Math.PI * 162} strokeDashoffset={2 * Math.PI * 162 * (1 - secs)} transform="rotate(-90)" />
        <text y={40} textAnchor="middle" fontFamily={FONT.ar} fontWeight={900} fontSize={130} fill="#FF5A4A">
          {t < 10 ? '3' : Math.max(0, 3 - Math.floor(secs * 3))}
        </text>
        <text y={118} textAnchor="middle" fontFamily={FONT.ar} fontWeight={700} fontSize={42} fill={UI.text}>
          ثوانٍ
        </text>
      </g>
      <Drops x0={860} x1={1060} y0={600} y1={920} n={12} kind="hot" />
    </g>
  );
};

// ---------- S9: medium: the neighbor tap opens, pressure drops ----------
export const S9: React.FC<ShotProps> = ({ t }) => {
  const open = easeOut(clamp(t / 14));
  return (
    <g transform={camT(960, 520, 1.35)}>
      <rect x={-400} y={-400} width={2720} height={1880} fill="#0E1018" />
      {/* building pipes cross-section */}
      <path d="M -400 640 H 2320" stroke="#4E6577" strokeWidth={46} />
      <path d="M -400 640 H 2320" stroke="#8FA6B9" strokeWidth={10} opacity={0.6} />
      <path d="M 960 300 V 620" stroke="#4E6577" strokeWidth={46} />
      <path d="M 960 300 V 620" stroke="#8FA6B9" strokeWidth={10} opacity={0.6} />
      {/* water flowing */}
      <path d="M -400 640 H 700" stroke="#9FCBE8" strokeWidth={20} opacity={0.9} />
      <path d="M 960 300 V 620" stroke="#9FCBE8" strokeWidth={20} opacity={0.9} />
      {/* the valve opening */}
      <g transform="translate(960 640)">
        <circle r={70} fill="#243140" stroke="#E9C46A" strokeWidth={8} />
        <path d="M -52 0 H 52 M 0 -52 V 52" stroke="#E9C46A" strokeWidth={10} strokeLinecap="round" transform={`rotate(${open * 240})`} />
      </g>
      {/* pressure gauge dropping */}
      <g transform="translate(1420 380)">
        <circle r={130} fill={UI.pill} opacity={0.75} />
        <circle r={130} fill="none" stroke={UI.text} strokeWidth={6} opacity={0.85} />
        <path d="M 0 0 L 0 -100" stroke="#FF5A4A" strokeWidth={10} strokeLinecap="round" transform={`rotate(${-80 + open * 120})`} />
        <text y={64} textAnchor="middle" fontFamily={FONT.ar} fontWeight={800} fontSize={36} fill="#FF5A4A">
          {open < 0.5 ? 'عالٍ' : 'منخفض'}
        </text>
      </g>
      <Sparkle x={960} y={520} t={t - 10} s={1.2} />
    </g>
  );
};

// ---------- S10: medium: the suit at the pipes ----------
export const S10: React.FC<ShotProps> = ({ t }) => {
  const suit = poseAt(t, [
    { f: 0, p: { x: 1060, y: 880 - LEG_LEN * 1.05, scale: 1.05, yaw: -0.9, look: 0, expr: 'neutral', armL: { a: 66, b: 60 }, armR: { a: 40, b: 30 } } },
    { f: 40, p: { armL: { a: 96, b: 30 }, look: 0.3 } },
  ]);
  return (
    <g transform={camT(1080, 520, kf(t, [[0, 1.5], [82, 1.42]]))}>
      <rect x={-400} y={-400} width={2720} height={1880} fill="#0E1018" />
      <path d="M -400 640 H 2320" stroke="#4E6577" strokeWidth={46} />
      <path d="M -400 640 H 2320" stroke="#8FA6B9" strokeWidth={10} opacity={0.6} />
      <path d="M -400 640 H 800" stroke="#9FCBE8" strokeWidth={20} opacity={0.55} />
      <g transform="translate(780 640)">
        <circle r={62} fill="#243140" stroke="#E9C46A" strokeWidth={8} />
        <path d="M -46 0 H 46 M 0 -46 V 46" stroke="#E9C46A" strokeWidth={9} strokeLinecap="round" transform={`rotate(${easeOut(clamp(t / 30)) * 240})`} />
      </g>
      <Hero look={SUIT} pose={{ ...basePose, ...suit }} rimId="rimL" shadow={0} />
      <Glow x={1060} y={420} r={300} o={0.14} />
    </g>
  );
};

// ---------- S11: close-up: the forecast flips red under scalding water ----------
export const S11: React.FC<ShotProps> = ({ t }) => {
  const sc = 4.4;
  const pip = basePose;
  const head = { x: 940, y: 660 };
  return (
    <g transform={camT(960, 520, 1.0)}>
      <Bathroom t={t} />
      <Drops x0={820} x1={1100} y0={296} y1={900} n={20} kind="hot" />
      <g transform={`translate(${head.x} ${head.y}) scale(${sc}) translate(${-pip.x} ${-pip.y - HEAD.y - 20})`}>
        <Hero look={PIP} pose={{ ...pip, ...faceAt(t, [[0, 'shock']]) }} rimId="rimR" shadow={0} />
      </g>
      {/* the forecast chip flipping red */}
      <g transform={`translate(1450 220) scale(${backOut(clamp(t / 7))})`}>
        <rect x={-230} y={-62} width={460} height={124} rx={62} fill="#1A0A0A" stroke="#FF5A4A" strokeWidth={6} />
        <circle cx={-160} cy={0} r={20} fill="#FF5A4A" />
        <text y={16} textAnchor="middle" fontFamily={FONT.ar} fontWeight={900} fontSize={52} fill="#FFD9D0">
          خطر
        </text>
      </g>
    </g>
  );
};

// ---------- S12: wide: sister waiting outside the door ----------
export const S12: React.FC<ShotProps> = ({ t }) => {
  const sis: Partial<Pose> = { x: 1685, y: 890 - LEG_LEN * 0.72, scale: 0.72, yaw: -0.8, look: -0.3, expr: 'neutral' as const, headTilt: -4, armL: { a: 30, b: 26 }, armR: { a: 30, b: 26 } };
  const pip = poseAt(t, [
    { f: 0, p: { x: 960, y: 884 - LEG_LEN * 1.0, scale: 1.0, yaw: 0, expr: 'worried', armL: { a: 24, b: 14 }, armR: { a: 24, b: 14 } } },
    { f: 30, p: { look: -0.6, armL: { a: 44, b: 20 }, armR: { a: 44, b: 20 } } },
  ]);
  return (
    <g transform={camT(960, 540, kf(t, [[0, 1.0], [58, 1.06]]))}>
      <Bathroom t={t} />
      <Drops x0={880} x1={1040} y0={296} y1={900} n={10} kind="hot" />
      <Hero look={PIP} pose={{ ...basePose, ...pip }} rimId="rimR" shadow={0} />
      <Hero look={SIS} pose={{ ...basePose, ...sis }} rimId="rimL" shadow={0} />
      {/* sis's towel over her mitten */}
      <path d="M 1685 760 Q 1720 800 1690 850 Q 1660 870 1640 840 Q 1626 800 1652 768 Z" fill="#EFE2CC" stroke="#14121C" strokeWidth={4} opacity={0.92} />
    </g>
  );
};

// ---------- S13: medium: the forecast flips, Pip pointing (mitten) ----------
export const S13: React.FC<ShotProps> = ({ t }) => {
  const pip = poseAt(t, [
    { f: 0, p: { x: 960, y: 886 - LEG_LEN * 1.02, scale: 1.02, yaw: 0, expr: 'shock', armL: { a: 20, b: 8 }, armR: { a: 118, b: 64 }, handR: 'point' } },
    { f: 20, p: { look: -0.7, armR: { a: 122, b: 58 } } },
  ]);
  return (
    <g transform={camT(960, 520, kf(t, [[0, 1.5], [39, 1.58]]))}>
      <Bathroom t={t} />
      <Drops x0={860} x1={1060} y0={296} y1={900} n={16} kind="hot" />
      <g transform={`translate(1460 240) scale(${backOut(clamp(t / 6))})`}>
        <rect x={-210} y={-56} width={420} height={112} rx={56} fill="#1A0A0A" stroke="#FF5A4A" strokeWidth={5} />
        <circle cx={-146} cy={0} r={17} fill="#FF5A4A" />
        <text y={14} textAnchor="middle" fontFamily={FONT.ar} fontWeight={900} fontSize={46} fill="#FFD9D0">
          خطر
        </text>
      </g>
      <Hero look={PIP} pose={{ ...basePose, ...pip }} rimId="rimR" shadow={0} />
    </g>
  );
};

// ---------- S14: the end card ----------
export const S14: React.FC<ShotProps> = ({ t }) => (
  <g>
    <rect x={-400} y={-400} width={2720} height={1880} fill="#060410" />
    <Drops x0={300} x1={1620} y0={-100} y1={900} n={16} kind="cold" />
    <g transform={`translate(960 470) scale(${backOut(clamp((t - 4) / 8))})`}>
      <rect x={-330} y={-92} width={660} height={184} rx={92} fill={UI.pill} stroke={UI.text} strokeWidth={3} opacity={0.94} />
      <g transform="translate(-236 0)">
        <rect x={-16} y={-34} width={18} height={68} rx={7} fill={UI.live} />
        <rect x={16} y={-34} width={18} height={68} rx={7} fill={UI.live} opacity={t % 30 < 18 ? 1 : 0.35} />
      </g>
      <text x={-20} textAnchor="start" y={26} fontFamily={FONT.ar} fontWeight={900} fontSize={64} fill={UI.text}>
        الجزء الأول
      </text>
    </g>
    {t > 18 ? (
      <text textAnchor="middle" x={960} y={660} fontFamily={FONT.ar} fontWeight={700} fontSize={40} fill={UI.text} opacity={0.55}>
        فمن سيفتح صنبورك؟
      </text>
    ) : null}
  </g>
);
