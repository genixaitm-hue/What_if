import React from 'react';
import {
  Hero, Pose, basePose, poseAt, faceAt, walkPose, joints, toWorld, LOOKS, HEAD, LEG_LEN, C,
  kf, clamp, lerp, easeOut, easeIn, easeInOut, backOut, rnd, settle, camT,
  Foreground, Sparkle, TitleCard, Tag, UI, FONT, Glow, LightVeil,
  Rooftop, Stairwell, Banister, hipGround,
  Classroom, SchoolDesk, Kid, KIDS,
  Kitchen, KitchenIsland, stand, KITCHEN, islandTop, Tabletop,
  Schematic, SCH, SchLabel, DrawOn, Arrow, CountUp,
  Paper, Cookie, Cat,
  ShotProps,
} from '../../engine';

// "What if you could pause everyone but you?" — the 90-second cut. 43 shots on four sets plus the schematic and the
// black end card. The rule: everything but Pip stops, so any shot inside the pause draws its set with a fixed
// set-clock (FROZEN) while Pip — and, in the last act, the man in the charcoal suit — still runs on the shot's own
// clock t. The rain hangs.

const PIP = LOOKS.pipHood;
const MO = LOOKS.mo;
const SIS = LOOKS.sis;
const MOM = LOOKS.mom;
const SUIT = LOOKS.suit;

/** In shots inside the pause the world's set doesn't tick: draw it with a fixed clock. */
const FROZEN = 90;

// ---------------------------------------------------------------- rain (episode-local)
const DROPS = Array.from({ length: 150 }).map((_, i) => ({
  x: -100 + rnd(101, i) * 2100,
  y0: -250 + rnd(102, i) * 1250,
  d: 0.35 + rnd(103, i) * 0.75,
  s: 0.5 + rnd(104, i) * 1.15,
  rot: (rnd(105, i) - 0.5) * 26,
}));
const RainDrop: React.FC<{ x: number; y: number; s: number; rot?: number; streak?: number }> = ({ x, y, s, rot = 0, streak = 0 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} opacity={streak ? 0.55 : 0.92}>
    <path d="M 0 -30 Q 7 -14 5.5 -4 Q 3 8 0 13 Q -3 8 -5.5 -4 Q -7 -14 0 -30 Z" fill={streak ? '#A8D4F2' : '#CFE8FA'} />
    <path d="M 0 -22 Q 4.5 -12 2 -2 Q 0 5 -2.2 -1 Q -1 -10 0 -22 Z" fill="#FFFFFF" opacity={streak ? 0.3 : 0.85} />
  </g>
);
const Rain: React.FC<{ t: number; frozen?: boolean; n?: number; wet?: boolean }> = ({ t, frozen = false, n = 150, wet = true }) => {
  const out: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const p = DROPS[i];
    if (frozen) out.push(<RainDrop key={i} x={p.x} y={p.y0} s={p.s} rot={p.rot} />);
    else {
      const y = -320 + ((p.y0 + 320 + t * (500 + p.d * 430)) % 1500);
      out.push(<RainDrop key={i} x={p.x} y={y} s={p.s} streak={1} />);
    }
  }
  return (
    <g>
      {out}
      {wet
        ? ([
            [400, 905],
            [1180, 940],
            [1650, 915],
          ] as [number, number][]).map(([x, y], i) => (
            <g key={`pud${i}`}>
              <ellipse cx={x} cy={y} rx={150} ry={16} fill="#7FB4DC" opacity={0.14} />
              {frozen
                ? [0, 1, 2].map((k) => (
                    <ellipse key={k} cx={x} cy={y} rx={26 + k * 34} ry={4 + k * 7} fill="none" stroke="#BFE4F8" strokeWidth={3} opacity={0.4 - k * 0.1} />
                  ))
                : null}
            </g>
          ))
        : null}
    </g>
  );
};

// ---------------------------------------------------------------- episode-local props
const Ball: React.FC<{ x: number; y: number; s?: number; rot?: number }> = ({ x, y, s = 1, rot = 0 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <circle r={62} fill="#F2EFE6" stroke="#181420" strokeWidth={4} />
    <path d="M -34 -42 L 8 -52 L 28 -18 L 6 24 L -24 -10 Z" fill="#20242C" />
    <path d="M 40 8 L 60 -8 L 56 32 L 34 38 Z" fill="#20242C" />
    <path d="M -54 22 L -28 34 L -46 56 Z" fill="#20242C" />
    <circle cx={-24} cy={-32} r={15} fill="#FFFFFF" opacity={0.75} />
  </g>
);
const ToastSlice: React.FC<{ x: number; y: number; s?: number; rot?: number; bite?: number }> = ({ x, y, s = 1, rot = 0, bite = 0 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <path d="M -46 -4 Q -52 -30 -28 -32 Q -14 -44 4 -38 Q 34 -42 42 -18 Q 52 -2 44 22 L -44 22 Q -48 10 -46 -4 Z" fill="#E9C46A" stroke="#181420" strokeWidth={3.5} />
    <path d={bite > 0 ? 'M -30 -4 Q -38 -24 -18 -24 Q -6 -30 2 -20 L 2 14 L -42 8 Z' : 'M -34 -6 Q -38 -24 -20 -26 Q -8 -34 6 -28 Q 26 -32 32 -14 L 32 12 L -32 12 Z'} fill="#F6E7B8" />
    {[
      [-18, -10],
      [2, -14],
      [18, -6],
      [-8, 2],
      [12, 4],
    ].map(([dx, dy], i) => (
      <circle key={i} cx={dx} cy={dy} r={2.6} fill="#C9974A" opacity={0.7} />
    ))}
  </g>
);
const ScoopCone: React.FC<{ x: number; y: number; s?: number; rot?: number; scoop?: number }> = ({ x, y, s = 1, rot = 0, scoop = 1 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <path d="M -26 -6 L 26 -6 L 0 58 Z" fill="#D9A05A" stroke="#181420" strokeWidth={3} />
    <path d="M -16 8 L 16 8 M -10 24 L 10 24" stroke="#B07E3E" strokeWidth={3} />
    {scoop > 0 ? (
      <g transform={`translate(0 ${-12 - 26 * clamp(scoop)})`}>
        <circle r={30} fill="#F7A8C4" stroke="#181420" strokeWidth={3} />
        <circle cx={-10} cy={-10} r={9} fill="#FFFFFF" opacity={0.6} />
        <circle cx={12} cy={6} r={4} fill="#D4689A" opacity={0.7} />
      </g>
    ) : null}
  </g>
);
const StopWatch: React.FC<{ x: number; y: number; s?: number; ticks: number }> = ({ x, y, s = 1, ticks }) => {
  const ang = -124 + ticks * 34;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-15} y={-190} width={30} height={34} rx={9} fill="#3A3C46" stroke="#14151A" strokeWidth={4} />
      <circle cx={0} cy={-190} r={13} fill="#55565E" stroke="#14151A" strokeWidth={4} />
      <circle r={156} fill="#2E3038" stroke="#14151A" strokeWidth={8} />
      <circle r={136} fill="#EFE8D8" stroke="#14151A" strokeWidth={5} />
      {Array.from({ length: 12 }).map((_, i) => (
        <path key={i} d="M 0 -124 L 0 -108" transform={`rotate(${i * 30})`} stroke="#2A2C34" strokeWidth={i % 3 === 0 ? 7 : 4} strokeLinecap="round" />
      ))}
      <text y={56} textAnchor="middle" fontFamily={FONT.ui} fontSize={26} fill="#2A2C34" letterSpacing={6}>{'TAP'}</text>
      <path d="M 0 0 L 6 -104" transform={`rotate(${ang})`} stroke={C.orange} strokeWidth={9} strokeLinecap="round" transform-origin="0 0" />
      <circle r={9} fill={C.orange} stroke="#14151A" strokeWidth={4} />
      <path d="M -110 -76 Q -20 -140 90 -60" stroke="#FFFFFF" strokeWidth={16} fill="none" strokeLinecap="round" opacity={0.3} />
    </g>
  );
};

/** A mitten, posed to scale, for the big hand inserts (steals the cookie, catches the toast, the scoop). */
const BigHand: React.FC<{ x: number; y: number; rot?: number; s?: number; look: typeof PIP }> = ({ x, y, rot = 0, s = 4.4, look }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <rect x={-4} y={10} width={8} height={26} rx={4} fill={look.hand} stroke={look.line} strokeWidth={2.4} />
    <path d="M -14 -4 Q -18 14 -7 19 L 8 19 Q 15 14 12 -3 Q 4 -18 -3 -10 Z" fill={look.hand} stroke={look.line} strokeWidth={2.6} strokeLinejoin="round" />
    <ellipse cx={-14} cy={4} rx={4.8} ry={7.6} fill={look.hand} stroke={look.line} strokeWidth={2.4} />
  </g>
);

/** An arm towards a mitten, drawn from off-screen: (x1,y1) the mitten, (x0,y0) the far end, [w] widths. */
const ArmIn: React.FC<{ x0: number; y0: number; x1: number; y1: number; look: typeof PIP; w?: number }> = ({ x0, y0, x1, y1, look, w = 96 }) => (
  <g>
    <path d={`M ${x0} ${y0} L ${x1} ${y1}`} stroke={look.line} strokeWidth={w + 16} fill="none" strokeLinecap="round" />
    <path d={`M ${x0} ${y0} L ${x1} ${y1}`} stroke={look.limb} strokeWidth={w} fill="none" strokeLinecap="round" />
  </g>
);

// ================================================================= DEMO 1: the rain
// ---------- S1: wide, dusk rain over the city, Pip hurries with his hood up ----------
export const S1: React.FC<ShotProps> = ({ t }) => {
  const pose = walkPose(lerp(430, 1010, clamp(t / 24)), t * 0.62, 856, 1, { headTilt: -6, armL: { a: 40, b: 60 }, armR: { a: 34, b: 54 } });
  return (
    <g transform={camT(960, 540, kf(t, [[0, 0.9], [28, 0.96]]))}>
      <Rooftop t={t} sunX={700} sunY={560} />
      <Rain t={t} />
      <Hero look={PIP} pose={{ ...pose, ...faceAt(t, [[0, 'worried']]) }} shadow={0.6} rimId="rimR" />
      <Foreground blur={6}>
        <path d="M 1600 1080 Q 1520 690 1670 540 Q 1740 740 1780 1080 Z" fill="#0E0A14" />
      </Foreground>
    </g>
  );
};

// ---------- S2: macro insert: one drop hangs huge in the last of the light ----------
export const S2: React.FC<ShotProps> = ({ t }) => (
  <g transform={camT(960, 520, kf(t, [[0, 1.04], [84, 1.14]]))}>
    <g filter="url(#blur16)">
      <g transform="translate(-560 -320) scale(1.7)">
        <Rooftop t={FROZEN} sunX={760} sunY={520} />
      </g>
    </g>
    <rect x={-400} y={-400} width={2720} height={1880} fill="#0A1220" opacity={0.22} />
    <path d="M 220 1080 L 700 1080 L 1160 -400 L 660 -400 Z" fill="#FFB46A" opacity={0.12} style={{ mixBlendMode: 'screen' }} />
    <g filter="url(#rimR)">
      <g transform="translate(935 490) rotate(5) scale(1.65)">
        <path d="M 0 -170 Q 46 -76 36 -20 Q 14 88 0 118 Q -14 88 -36 -20 Q -46 -76 0 -170 Z" fill="#9FCBE8" stroke="#5E88A8" strokeWidth={7} />
        <path d="M -12 -80 Q 12 -62 8 4 Q 4 62 0 84 Q -7 56 -11 -4 Q -15 -48 -12 -80 Z" fill="#FFFFFF" opacity={0.85} />
        <ellipse cx={-17} cy={-36} rx={9} ry={34} fill="#FFFFFF" opacity={0.55} transform="rotate(9 -17 -36)" />
      </g>
    </g>
    {[0, 1, 2].map((k) => (
      <g key={k} transform={`translate(${916 + k * 30} ${836 + k * 78}) scale(${1.15 - k * 0.3})`}>
        <path d="M 0 -170 Q 46 -76 36 -20 Q 14 88 0 118 Q -14 88 -36 -20 Q -46 -76 0 -170 Z" fill="#BFE0F2" stroke="#7FA8C8" strokeWidth={6} />
      </g>
    ))}
    {DROPS.slice(0, 9).map((p, i) => (
      <RainDrop key={i} x={lerp(120, 1800, p.x / 2100)} y={lerp(200, 900, i / 9)} s={p.s * 0.9} rot={p.rot} />
    ))}
    <Sparkle x={1150} y={320} t={t - 30} s={2} />
  </g>
);

// ---------- S3: medium, he weaves between the hanging drops, dry ----------
export const S3: React.FC<ShotProps> = ({ t }) => {
  const x = lerp(700, 1120, clamp(t / 30));
  const pose = walkPose(x, t * 0.55, 852, 1.05, { armL: { a: 34, b: 66 }, armR: { a: 26, b: 40 }, sway: 12 });
  const face = faceAt(t, [[0, 'neutral'], [16, 'smug']]);
  return (
    <g transform={camT(clamp(x + 100, 820, 1220), 560, kf(t, [[0, 1.6], [32, 1.68]]))}>
      <Rooftop t={FROZEN} sunX={700} sunY={560} />
      <Rain t={FROZEN} frozen n={110} />
      <Hero look={PIP} pose={{ ...pose, ...face }} shadow={0.3} rimId="rimR" />
      <Foreground blur={6}>
        <RainDrop x={520} y={430 + settle(t, 4, 2)} s={5.5} rot={-8} />
        <RainDrop x={1460} y={660} s={4} rot={12} />
      </Foreground>
      <Sparkle x={720} y={320} t={t - 18} s={1.2} />
    </g>
  );
};

// ================================================================= DEMO 2: the football
// ---------- S4: wide, low: the ball flies at him down the stairs ----------
export const S4: React.FC<ShotProps> = ({ t }) => {
  const p = clamp(t / 15);
  const bx = lerp(420, 1170, easeIn(p));
  const by = lerp(260, 560, easeIn(p)) + Math.sin(p * Math.PI) * 46;
  const px = lerp(1300, 1150, p);
  const pose = walkPose(px, t * 0.5, hipGround, 0.9, { armL: { a: 20, b: -6 }, armR: { a: 16, b: -8 } });
  const face = faceAt(t, [[0, 'neutral'], [9, 'shock']]);
  return (
    <g transform={camT(clamp(bx + 90, 760, 1180), clamp(by - 10, 400, 560), kf(t, [[0, 1.04], [15, 1.18]]))}>
      <Stairwell t={t} id="s4" />
      <Hero look={PIP} pose={{ ...pose, ...face }} shadow={0.3} rimId="rimR" />
      <Banister />
      <Ball x={bx} y={by} s={1.1} rot={240 + t * 24} />
      <Foreground blur={7}>
        <rect x={-200} y={-200} width={130} height={1480} fill="#131019" />
      </Foreground>
    </g>
  );
};

// ---------- S5: macro: the ball frozen a finger from his nose ----------
export const S5: React.FC<ShotProps> = ({ t }) => {
  const sc = 3.3;
  const head = { x: 1140, y: 640 };
  const rise = easeOut(clamp((t - 8) / 10));
  const pose: Pose = {
    ...basePose,
    x: head.x,
    y: head.y - HEAD.y * sc,
    scale: sc,
    yaw: 0,
    look: -1,
    headTilt: -4,
    armL: { a: lerp(30, 104, rise), b: lerp(-10, -26, rise) },
    armR: { a: 16, b: -6 },
    sway: 0,
    ...faceAt(t, [[0, 'shock'], [14, 'worried']]),
  };
  return (
    <g transform={camT(970, 550, kf(t, [[0, 1.0], [27, 1.06]]))}>
      <g filter="url(#blur16)">
        <g transform="translate(-600 -380) scale(2.0)">
          <Stairwell t={FROZEN} id="s5" />
        </g>
      </g>
      <rect x={-400} y={-400} width={2720} height={1880} fill="#07040C" opacity={0.32} />
      <Hero look={PIP} pose={pose} shadow={0} rimId="rimR" />
      <Ball x={580} y={520} s={2.5} rot={-24} />
      <Sparkle x={580} y={280} t={t - 12} s={1} />
      <Foreground blur={16}>
        <path d="M 1760 -100 Q 1600 320 1670 800 L 1920 920 L 1920 -100 Z" fill="#140F1A" />
      </Foreground>
    </g>
  );
};

// ---------- S6: medium: he takes the ball off the air, slowly, smug ----------
export const S6: React.FC<ShotProps> = ({ t }) => {
  const px = 920;
  const base: Partial<Pose> = { x: px, y: hipGround(px) - LEG_LEN * 0.92, scale: 0.92, yaw: 0.15 };
  const pose = poseAt(t, [
    { f: 0, p: { ...base, look: -0.9, armL: { a: 92, b: -6 }, armR: { a: 14, b: -6 } } },
    { f: 5, p: { armL: { a: 102, b: -14 } }, ease: easeOut },
    { f: 14, p: { armL: { a: 78, b: 92 }, look: -0.3 } },
    { f: 24, p: { armL: { a: 64, b: 86 }, look: 0.7, headTilt: 5, tilt: -3 } },
  ]);
  const face = faceAt(t, [[0, 'worried'], [10, 'neutral'], [18, 'smug']]);
  const armL = { ...basePose.armL, ...pose.armL };
  const pp: Pose = { ...basePose, ...base, ...pose, armL };
  const hand = toWorld(pp, joints(pp).armL.end);
  const ball = t < 14 ? { x: lerp(700, 760, p2(t)), y: lerp(400, 430, p2(t)) } : { x: hand.x + 2, y: hand.y - 58 };
  return (
    <g transform={camT(kf(t, [[0, 900], [31, 950]]), 520, kf(t, [[0, 1.5], [31, 1.62]]))}>
      <Stairwell t={FROZEN} id="s6" />
      <Hero look={PIP} pose={{ ...pp, ...face, blink: t > 20 && t < 23 ? 1 : 0 }} shadow={0.35} rimId="rimR" />
      <Banister />
      <Ball x={ball.x} y={ball.y} s={1.05} rot={-20} />
      <Sparkle x={1240} y={300} t={t - 26} s={1.4} />
      <Foreground blur={7}>
        <path d="M 1620 1080 Q 1540 760 1680 620 Q 1720 820 1750 1080 Z" fill="#0E0A14" />
      </Foreground>
    </g>
  );
};
const p2 = (t: number) => clamp(t / 14);

// ================================================================= DEMO 3: Mo's snack
const MO_HIP = 420;
const MO_BASE: Partial<Pose> = { x: 330, y: MO_HIP - LEG_LEN * 0.9, scale: 0.9, yaw: -0.2, look: 0.7, headTilt: 7, armL: { a: 22, b: 56 } };

// ---------- S7: wide, the upper landing: Mo giggling at his glowing phone, snack in hand ----------
export const S7: React.FC<ShotProps> = ({ t }) => {
  const pose = poseAt(t, [
    { f: 0, p: { ...MO_BASE, armR: { a: 118, b: 62 } } },
    { f: 9, p: { headTilt: 9, armR: { a: 122, b: 58 } }, ease: easeOut },
    { f: 18, p: { headTilt: 6, armR: { a: 118, b: 62 } }, ease: easeOut },
  ]);
  const pp: Pose = { ...basePose, ...pose };
  const j = joints(pp);
  const phone = toWorld(pp, j.armR.end);
  const snack = toWorld(pp, j.armL.end);
  const face = faceAt(t, [[0, 'happy']]);
  const blink = Math.abs(Math.sin(t / 5)) > 0.96 ? 1 : 0;
  return (
    <g transform={camT(kf(t, [[0, 430], [36, 410]]), 310, kf(t, [[0, 1.42], [36, 1.5]]))}>
      <Stairwell t={t} id="s7" />
      <Hero look={MO} pose={{ ...pp, ...face, blink }} rimId="rimL" shadow={0.4} />
      <g>
        <rect x={phone.x + 4} y={phone.y + 26} width={46} height={78} rx={9} fill="#181420" stroke="#0E0B12" strokeWidth={3} />
        <rect x={phone.x + 9} y={phone.y + 31} width={36} height={50} rx={5} fill="#9FC0FF" opacity={0.8} />
        <Glow x={phone.x + 26} y={phone.y + 56} r={130} kind="cool" o={0.4} />
      </g>
      <Cookie x={snack.x + 46} y={snack.y + 26} s={1.15} />
      <Foreground blur={7}>
        <path d="M -100 1080 Q 40 700 300 650 Q 420 690 470 860 Q 500 1000 460 1080 Z" fill="#14121C" />
      </Foreground>
    </g>
  );
};

// ---------- S8: macro: the cookie slides out of Mo's frozen fingers ----------
export const S8: React.FC<ShotProps> = ({ t }) => {
  const out = easeOut(clamp(t / 16));
  const cx = lerp(680, 980, out);
  return (
    <g transform={camT(960, 520, kf(t, [[0, 1.02], [27, 1.12]]))}>
      <g filter="url(#blur16)">
        <g transform="translate(-300 -200) scale(1.7)">
          <Stairwell t={FROZEN} id="s8" />
        </g>
      </g>
      <rect x={-400} y={-400} width={2720} height={1880} fill="#0A0610" opacity={0.26} />
      <Cookie x={cx} y={540} s={3.3} rot={-12} />
      {/* Mo's frozen fist stays where the cookie was, upper left */}
      <g filter="url(#rimL)">
        <ArmIn x0={230} y0={1010} x1={520} y1={720} look={MO} w={104} />
        <ellipse cx={566} cy={692} rx={88} ry={64} fill={MO.hand} stroke={MO.line} strokeWidth={7} transform="rotate(-16 566 692)" />
        {[0, 1, 2].map((i) => (
          <ellipse key={i} cx={628 + i * 64} cy={660 - i * 10} rx={42} ry={27} fill={MO.hand} stroke={MO.line} strokeWidth={6} transform={`rotate(${-14 - i * 7} ${628 + i * 64} ${660 - i * 10})`} />
        ))}
      </g>
      {/* Pip's mitten pinches it out from underneath, in from the bottom right */}
      <g filter="url(#rimR)">
        <ArmIn x0={cx + 540} y0={1160} x1={cx + 190} y1={780} look={PIP} w={104} />
        <BigHand x={cx + 120} y={730} rot={214} s={3.6} look={PIP} />
      </g>
      <Sparkle x={cx} y={420} t={t - 18} s={1.2} />
      <Foreground blur={7}>
        <path d="M -160 1080 Q -30 760 190 720 Q 280 860 260 1080 Z" fill="#14121C" />
      </Foreground>
    </g>
  );
};

// ---------- S9: medium: pockets it, walks past frozen Mo, glances at us ----------
export const S9: React.FC<ShotProps> = ({ t }) => {
  const x = lerp(560, 1020, easeOut(clamp(t / 50)));
  const bites = t > 22 && t < 34;
  const up = clamp((t - 8) / 8) * (1 - clamp((t - 30) / 10));
  const pose = walkPose(x, t * 0.5, MO_HIP, 0.9, {
    armL: { a: 30 + 84 * up, b: 12 + 82 * up },
    headTilt: t > 44 ? -7 * clamp((t - 44) / 16) : 3,
    sway: 9,
  });
  const face = faceAt(t, [[0, 'smug'], [48, 'cool']]);
  const hm = toWorld(pose, joints(pose).armL.end);
  const moPose: Pose = { ...basePose, ...MO_BASE, armR: { a: 118, b: 62 }, expr: 'happy' };
  return (
    <g transform={camT(clamp(x + 30, 560, 940), 320, kf(t, [[0, 1.42], [67, 1.5]]))}>
      <Stairwell t={FROZEN} id="s9" />
      <Hero look={MO} pose={moPose} rimId="rimL" shadow={0.4} />
      <Hero look={PIP} pose={{ ...pose, ...face, blink: t > 50 && t < 53 ? 1 : 0 }} shadow={0.35} rimId="rimL" />
      {up > 0.05 ? <Cookie x={hm.x + 20} y={hm.y + 56 - 44 * clamp((t - 22) / 6)} s={1.05} bite={bites ? 1 : 0} /> : null}
      <Sparkle x={200} y={580} t={t - 56} s={1.4} />
      <Foreground blur={7}>
        <path d="M 1780 -40 Q 1650 400 1720 1080 L 1920 1080 L 1920 -40 Z" fill="#0E0A14" />
      </Foreground>
    </g>
  );
};

// ================================================================= THE PREMISE
// ---------- S10: the title card over the city at dusk, four drops still hung ----------
export const S10: React.FC<ShotProps> = ({ t }) => {
  const pose = poseAt(t, [
    { f: 0, p: { x: 960, y: 850 - LEG_LEN * 0.62, scale: 0.62, armL: { a: 20, b: 8 }, armR: { a: 20, b: 8 } } },
    { f: 18, p: {} },
    { f: 30, p: { armL: { a: 148, b: 12 }, armR: { a: 148, b: 12 } }, ease: easeOut },
  ]);
  const face = faceAt(t, [[0, 'happy'], [26, 'cool']]);
  return (
    <g transform={camT(960, kf(t, [[0, 520], [55, 545]]), kf(t, [[0, 0.98], [55, 1.05]]))}>
      <Rooftop t={t + 60} sunX={860} sunY={610} />
      {[350, 470, 1520, 1620].map((x, i) => (
        <RainDrop key={i} x={x} y={600 + (i % 2) * 90} s={1.25} rot={i % 2 ? 10 : -8} />
      ))}
      <Hero look={PIP} pose={{ ...pose, ...face }} shadow={0.6} rimId="rimR" />
      <TitleCard t={t} lines={['WHAT IF YOU COULD', 'PAUSE EVERYONE BUT YOU?']} accent="YOU" accentT={26} size={84} y={168} />
      <Foreground blur={16}>
        <ellipse cx={140} cy={1150} rx={430} ry={250} fill="#0B0814" />
      </Foreground>
    </g>
  );
};

// ================================================================= THE RULE
// ---------- S11: medium, the tap: two fingers, one press, the class milling behind ----------
export const S11: React.FC<ShotProps> = ({ t }) => {
  const pose = poseAt(t, [
    { f: 0, p: { x: 1060, y: 742, yaw: 0.1, look: -0.7, armL: { a: 14, b: -8 }, armR: { a: 128, b: 58 }, handR: 'point', tilt: -2 } },
    { f: 12, p: { armR: { a: 136, b: 52 } }, ease: easeOut },
    { f: 16, p: { armR: { a: 120, b: 66 }, look: -1, headTilt: 5 }, ease: easeOut },
    { f: 24, p: { armR: { a: 126, b: 58 }, headTilt: 2 } },
  ]);
  const face = faceAt(t, [[0, 'cool'], [16, 'smug']]);
  return (
    <g transform={camT(kf(t, [[0, 1040], [28, 1065]]), 560, kf(t, [[0, 1.66], [28, 1.74]]))}>
      <Classroom t={t} id="cls11" laugh={1} />
      <Hero look={PIP} pose={{ ...pose, ...face }} shadow={0} rimId="rimR" />
      <SchoolDesk x={1130} />
      <Sparkle x={1240} y={420} t={t - 15} s={1.6} />
      <Foreground blur={10}>
        <Kid x={1720} y={1270} s={2.6} look={KIDS[1]} t={t} laugh={1} />
      </Foreground>
    </g>
  );
};

// ---------- S12: wide: the class locks mid-motion, papers pinned in the air ----------
const S12_PAPERS = Array.from({ length: 9 }).map((_, i) => ({
  x: 380 + rnd(201, i) * 1180,
  y: 210 + rnd(202, i) * 400,
  rot: rnd(203, i) * 70 - 35,
  s: 0.55 + rnd(205, i) * 0.75,
}));
export const S12: React.FC<ShotProps> = ({ t }) => {
  const pose = walkPose(clamp(1560 - t * 12, 1240, 1560), t * 0.4, 792, 1, { armL: { a: 26, b: 36 }, headTilt: -4, sway: 5 });
  const face = faceAt(t, [[0, 'neutral']]);
  return (
    <g transform={camT(960, 470, kf(t, [[0, 0.92], [30, 1.0]]))}>
      <Classroom t={FROZEN} id="cls12" laugh={1} />
      {S12_PAPERS.map((pp, i) => (
        <g key={i} transform={`translate(${pp.x} ${pp.y}) rotate(${pp.rot}) scale(${pp.s})`}>
          <rect x={-46} y={-60} width={92} height={120} rx={4} fill="#F4EEE0" stroke="#2A2432" strokeWidth={3} transform="skewX(-8)" />
        </g>
      ))}
      <Hero look={PIP} pose={{ ...pose, ...face }} shadow={0} rimId="rimR" />
      <Foreground blur={16}>
        <Kid x={250} y={1330} s={3} look={KIDS[3]} t={FROZEN} />
      </Foreground>
    </g>
  );
};

// ---------- S13: top-down of two rows: mid-step, mid-laugh, mid-argument — all frozen ----------
const DesksTop: React.FC<{ y: number; seed: number }> = ({ y, seed }) => (
  <g>
    {[0, 1, 2, 3].map((i) => {
      const x = 330 + i * 380 + (i > 1 ? 120 : 0) - (y > 600 ? 60 : 0);
      const kid = KIDS[(seed + i) % KIDS.length];
      return (
        <g key={i} transform={`translate(${x} ${y})`}>
          <ellipse cx={0} cy={96} rx={86} ry={30} fill="#000" opacity={0.25} />
          <rect x={-150} y={-70} width={300} height={140} rx={14} fill="#8A6452" stroke="#3A2826" strokeWidth={6} />
          <rect x={-110} y={-34} width={220} height={68} fill="#F4EEE0" opacity={0.92} transform="rotate(-3)" />
          <g transform="translate(0 122)">
            <ellipse rx={72} ry={44} fill={kid.top} stroke="#0E0B14" strokeWidth={4} />
            <circle cx={-4} cy={-28} r={40} fill={kid.hairC} />
          </g>
        </g>
      );
    })}
  </g>
);
export const S13: React.FC<ShotProps> = ({ t }) => {
  const walk = lerp(280, 960, clamp(t / 66));
  return (
    <g transform={camT(960, 540, kf(t, [[0, 1.0], [70, 1.08]]))}>
      <rect x={-400} y={-400} width={2720} height={1880} fill="#3A3240" />
      {Array.from({ length: 40 }).map((_, i) => (
        <path key={`t${i}`} d={`M -400 ${30 + i * 48} L 2320 ${30 + i * 48}`} stroke="#2E2838" strokeWidth={3} />
      ))}
      {/* Pip: hood and shoulders flowing down the aisle, the only thing moving */}
      <g transform={`translate(${walk} 940) rotate(6)`} opacity={0.97}>
        <ellipse rx={104} ry={64} fill="#24212F" />
        <circle cx={-20} cy={-38} r={42} fill="#1C1A26" />
        <path d="M -52 8 Q 0 30 52 6" stroke={C.jacket} strokeWidth={5} fill="none" opacity={0.75} />
        <ellipse cx={2} cy={110} rx={110} ry={30} fill="#000" opacity={0.25} />
      </g>
      {/* the mid-step kid frozen in the aisle */}
      <g transform="translate(1150 430)">
        <ellipse cx={-40} cy={44} rx={30} ry={15} fill="#20242C" transform="rotate(-14 -40 44)" />
        <ellipse cx={44} cy={28} rx={30} ry={15} fill="#20242C" transform="rotate(26 44 28)" />
        <ellipse rx={76} ry={48} fill={KIDS[1].top} />
        <circle cx={8} cy={-36} r={41} fill={KIDS[1].hairC} />
      </g>
      <DesksTop y={210} seed={0} />
      <DesksTop y={560} seed={2} />
      <DesksTop y={900} seed={3} />
      {/* the laughing pair: heads tipped, arcs frozen round them */}
      <g transform="translate(330 340)">
        <path d="M -46 6 A 46 46 0 0 1 22 -40" fill="none" stroke="#F6EFE3" strokeWidth={5} opacity={0.75} />
        <circle cx={-30} cy={-24} r={30} fill={KIDS[0].hairC} transform="rotate(-14 -30 -24)" />
      </g>
      <g transform="translate(520 330) rotate(-10)">
        <circle cx={0} cy={-26} r={30} fill={KIDS[2].hairC} />
      </g>
      {/* the argument pair: two heads squared up across the aisle */}
      <g transform="translate(1470 760)">
        <ellipse cx={-58} cy={0} rx={56} ry={40} fill="#4A6A8A" />
        <circle cx={-34} cy={-34} r={34} fill={KIDS[2].hairC} />
        <ellipse cx={60} cy={6} rx={54} ry={40} fill="#8A5A9A" />
        <circle cx={86} cy={-32} r={32} fill={KIDS[3].hairC} />
        <path d="M 2 -14 L 20 -14 M 4 2 L 22 2" stroke="#F6EFE3" strokeWidth={5} strokeLinecap="round" />
      </g>
      {S12_PAPERS.slice(0, 5).map((pp, i) => (
        <rect key={`pp${i}`} x={pp.x} y={pp.y} width={72} height={94} rx={4} fill="#F4EEE0" opacity={0.95} transform={`rotate(${pp.rot} ${pp.x} ${pp.y})`} />
      ))}
      {/* his pen, frozen mid-roll in the aisle */}
      <rect x={1240} y={560} width={126} height={15} rx={7} fill="#E9C46A" transform="rotate(24 1303 567)" />
      <Foreground blur={16}>
        <ellipse cx={60} cy={1000} rx={210} ry={140} fill="#140F1C" />
      </Foreground>
    </g>
  );
};

// ================================================================= FUN 1: the test
// ---------- S14: medium: strolls past the frozen argument to his marked test ----------
export const S14: React.FC<ShotProps> = ({ t }) => {
  const x = lerp(700, 980, easeOut(clamp(t / 44)));
  const pose = walkPose(x, t * 0.5, 792, 1, { armL: { a: 16, b: -8 }, headTilt: 2, sway: 7 });
  const face = faceAt(t, [[0, 'neutral'], [30, 'oops'], [58, 'cool']]);
  return (
    <g transform={camT(clamp(x + 240, 920, 1180), 500, kf(t, [[0, 1.62], [84, 1.72]]))}>
      <Classroom t={FROZEN} id="cls14" laugh={1} />
      <Hero look={PIP} pose={{ ...pose, ...face }} shadow={0} rimId="rimR" />
      <SchoolDesk x={1270} />
      <Paper x={1330} y={716} w={150} rot={-4} done={false} />
      <Tag x={1330} y={556} t={t - 10} text="3/20" mark="x" markT={8} w={170} />
      <Sparkle x={1180} y={470} t={t - 64} s={1.2} />
      <Foreground blur={7}>
        <Kid x={330} y={1240} s={2.8} look={KIDS[0]} t={FROZEN} />
      </Foreground>
    </g>
  );
};

// ---------- S15: top-down insert: the tagged test and a clock hand stopped mid-second ----------
export const S15: React.FC<ShotProps> = ({ t }) => {
  const hand = { x: kf(t, [[0, 1540], [20, 1470]]), y: kf(t, [[0, 40], [20, 120]]) };
  return (
    <g transform={`translate(960 540) rotate(${-2 + t * 0.015}) scale(${1 + t * 0.0035}) translate(-960 -540)`}>
      <Tabletop edge={1200} wood="#8A6452" grain="#764F42" lip="#6A4438" />
      <Glow x={760} y={420} r={720} o={0.3} />
      <Paper x={620} y={600} w={340} rot={-4} done={false} fill={0.25} />
      <Tag x={950} y={360} t={t - 4} text="3/20" mark="x" markT={12} w={210} />
      {/* the clock, set on the desk for the insert: its second hand stopped mid-second */}
      <g transform="translate(1180 800)">
        <circle r={94} fill="#EFE2CC" stroke="#1E1824" strokeWidth={13} />
        {Array.from({ length: 12 }).map((_, i) => (
          <path key={i} d="M 0 -76 L 0 -64" transform={`rotate(${i * 30})`} stroke="#1E1824" strokeWidth={i % 3 ? 4 : 8} strokeLinecap="round" />
        ))}
        <path d="M 0 0 L 0 -54" transform="rotate(312)" stroke="#1E1824" strokeWidth={6} strokeLinecap="round" />
        <path d="M 0 0 L 44 26" stroke="#1E1824" strokeWidth={8} strokeLinecap="round" />
        <circle r={9} fill="#1E1824" />
      </g>
      <rect x={220} y={310} width={210} height={26} rx={13} fill="#E9C46A" transform="rotate(-18 325 323)" />
      {/* his mitten resting on the corner: he can move; the world can't */}
      <g filter="url(#rimR)">
        <ArmIn x0={hand.x + 420} y0={-420} x1={hand.x + 40} y1={hand.y} look={PIP} w={120} />
        <BigHand x={hand.x} y={hand.y + 6} rot={36} s={5} look={PIP} />
      </g>
      <Foreground blur={10}>
        <ellipse cx={40} cy={950} rx={260} ry={180} fill="#140F1C" opacity={0.85} />
      </Foreground>
    </g>
  );
};

// ---------- S16: medium: twenty minutes of thinking inside one school second ----------
export const S16: React.FC<ShotProps> = ({ t, len }) => {
  const pose = poseAt(t, [
    { f: 0, p: { x: 1150, y: 758, yaw: 0.4, look: -0.9, armL: { a: 14, b: -8 }, armR: { a: 56, b: 128 }, headTilt: -7, tilt: 3 } },
    { f: 22, p: { armR: { a: 64, b: 138 } }, ease: easeOut },
    { f: 36, p: { armR: { a: 54, b: 122 }, look: -0.7 }, ease: easeOut },
    { f: 50, p: { armR: { a: 66, b: 134 }, look: -1, headTilt: -9 }, ease: easeOut },
  ]);
  const face = faceAt(t, [[0, 'neutral'], [18, 'worried'], [52, 'neutral']]);
  return (
    <g transform={camT(1140, 450, kf(t, [[0, 1.3], [len, 1.42]]))}>
      <Classroom t={FROZEN} id="cls16" laugh={1} />
      <Hero look={PIP} pose={{ ...pose, ...face, blink: t > 30 && t < 33 ? 1 : 0 }} shadow={0} rimId="rimR" />
      <SchoolDesk x={1270} />
      <Paper x={1330} y={724} w={150} rot={-3} done grade="A+" />
      <Foreground blur={10}>
        <path d="M -80 1080 Q 30 700 210 660 Q 310 700 300 1080 Z" fill="#14121C" />
      </Foreground>
    </g>
  );
};

// ================================================================= FUN 2: mum and the toast
const MOM_STAND = stand(KITCHEN, 0.42, 0.4);
// ---------- S17: medium two-shot: mum frozen mid-scold, the toast leaping frozen ----------
export const S17: React.FC<ShotProps> = ({ t }) => {
  const mom = poseAt(t, [
    { f: 0, p: { x: MOM_STAND.x, y: MOM_STAND.y, scale: MOM_STAND.scale, yaw: 0.35, look: 0.6, armL: { a: 158, b: -8 }, armR: { a: 24, b: -10 }, handL: 'point', headTilt: -4 } },
  ]);
  const pip = { x: 1350, y: 900 - LEG_LEN * 0.85, scale: 0.85, yaw: -0.5, armL: { a: 26, b: 40 }, armR: { a: 12, b: -8 } };
  const faceM = faceAt(t, [[0, 'shock']]);
  return (
    <g transform={camT(kf(t, [[0, 960], [56, 940]]), 560, kf(t, [[0, 1.64], [56, 1.7]]))}>
      <Kitchen t={FROZEN} id="k17" />
      <Hero look={MOM} pose={{ ...basePose, ...mom, ...faceM }} rimId="rimL" shadow={0} />
      <Hero look={PIP} pose={{ ...basePose, ...pip, ...faceAt(t, [[0, 'neutral']]) }} rimId="rimR" shadow={0} />
      <KitchenIsland />
      {/* the toaster on the back counter, its slice frozen mid-leap, crumbs stalled round it */}
      <g transform={`translate(${1120} ${640})`}>
        <ellipse cx={4} cy={30} rx={64} ry={11} fill="#000" opacity={0.3} />
        <rect x={-58} y={-34} width={120} height={66} rx={10} fill="#B9BFC4" stroke="#2A2A30" strokeWidth={3} />
        <rect x={-34} y={-22} width={60} height={10} rx={4} fill="#3A3A42" />
        <circle cx={44} cy={4} r={9} fill="#E9C46A" stroke="#2A2A30" strokeWidth={3} />
      </g>
      <ToastSlice x={1120} y={532} s={1.05} rot={-12} />
      {[0, 1, 2, 3].map((i) => (
        <circle key={i} cx={1096 + i * 20} cy={496 - i * 18} r={4} fill="#C9974A" />
      ))}
      <Sparkle x={1180} y={430} t={t - 24} s={1.2} />
      <Foreground blur={10}>
        <Kid x={260} y={1270} s={2.7} look={KIDS[2]} t={FROZEN} />
      </Foreground>
    </g>
  );
};

// ---------- S18: macro: his mitten pinches the frozen slice out of the air ----------
export const S18: React.FC<ShotProps> = ({ t }) => (
  <g transform={camT(960, 500, kf(t, [[0, 1.02], [26, 1.1]]))}>
    <g filter="url(#blur16)">
      <g transform="translate(-500 -240) scale(1.8)">
        <Kitchen t={FROZEN} id="k18" />
        <ToastSlotBurn />
      </g>
    </g>
    <rect x={-400} y={-400} width={2720} height={1880} fill="#0A0810" opacity={0.22} />
    <ToastSlice x={930} y={420} s={3.4} rot={-16} />
    {[0, 1, 2, 3].map((i) => (
      <circle key={i} cx={740 + i * 110} cy={420 - i * 46} r={9} fill="#C9974A" opacity={0.85} />
    ))}
    <g filter="url(#rimR)">
      <ArmIn x0={430 - t * 3} y0={1120} x1={960} y1={620} look={PIP} w={110} />
      <BigHand x={990} y={600} rot={-50} s={4.2} look={PIP} />
    </g>
    <Sparkle x={1200} y={340} t={t - 16} s={1.2} />
  </g>
);
function ToastSlotBurn() {
  return (
    <g transform="translate(1150 640)">
      <rect x={-58} y={-34} width={120} height={66} rx={10} fill="#B9BFC4" stroke="#2A2A30" strokeWidth={3} />
    </g>
  );
}

// ---------- S19: wide: unpause — mum's finger finishes its wag, the cat dashes, Pip strolls out ----------
export const S19: React.FC<ShotProps> = ({ t }) => {
  const mom = poseAt(t, [
    { f: 0, p: { x: MOM_STAND.x, y: MOM_STAND.y, scale: MOM_STAND.scale, yaw: 0.3, look: 0.5, armL: { a: 158, b: -8 }, armR: { a: 24, b: -10 }, handL: 'point', headTilt: -4 } },
    { f: 14, p: { armL: { a: 96, b: -4 }, look: -0.1 }, ease: easeOut },
    { f: 30, p: { armL: { a: 30, b: -6 }, headTilt: 3 }, ease: easeOut },
    { f: 44, p: { look: 0.4 }, ease: easeOut },
  ]);
  const pip = walkPose(lerp(700, 1500, clamp(t / 50)), t * 0.6, 900, 0.9, { armL: { a: 60, b: 96 }, sway: 10 });
  const face = faceAt(t, [[0, 'happy'], [36, 'smug']]);
  const pipFull: Pose = { ...pip, ...face };
  const hm = toWorld(pipFull, joints(pipFull).armL.end);
  const cat = KITCHEN.P(0.18 + clamp(t / 40) * 0.05, 1, 0.66);
  return (
    <g transform={camT(960, 540, kf(t, [[0, 0.85], [57, 0.9]]))}>
      <Kitchen t={t - 30} id="k19" veil={0.4} />
      <Hero look={MOM} pose={{ ...basePose, ...mom, expr: t > 24 ? 'neutral' : 'shock' }} rimId="rimL" shadow={0} />
      <Hero look={PIP} pose={{ ...pipFull, blink: t > 20 && t < 23 ? 1 : 0 }} rimId="rimR" shadow={0} />
      <Cookie x={hm.x + 30} y={hm.y + 60} s={1.05} bite={t > 18 ? 1 : 0} rot={-16} />
      <KitchenIsland />
      <Cat x={cat.x} y={cat.y} mood="alert" f={t} />
    </g>
  );
};

// ================================================================= FUN 3: sis and the scoop
const SIS_STAND = stand(KITCHEN, 0.34, 0.4);
const sisSmall = (o: Partial<Pose> = {}): Partial<Pose> => ({
  x: SIS_STAND.x + 130, y: SIS_STAND.y + 6, scale: MOM_STAND.scale * 0.82, yaw: -0.1, ...o,
});
// ---------- S20: medium: the scoop tilting off the cone, sis gasping ----------
export const S20: React.FC<ShotProps> = ({ t }) => {
  const fallT = clamp(t / 30);
  const fall = fallT * fallT * 90;
  const rot = fallT * fallT * 30;
  const pose = poseAt(t, [
    { f: 0, p: { ...sisSmall({ armR: { a: 106, b: 92 }, armL: { a: 128, b: 62 } }) } },
    { f: 12, p: { look: 0.8, headTilt: -6 } },
    { f: 24, p: { armR: { a: 118, b: 104 } }, ease: easeOut },
  ]);
  const pp: Pose = { ...basePose, ...pose };
  const hr = toWorld(pp, joints(pp).armR.end);
  const face = faceAt(t, [[0, 'happy'], [10, 'shock']]);
  return (
    <g transform={camT(kf(t, [[0, 840], [57, 870]]), 550, kf(t, [[0, 1.56], [57, 1.64]]))}>
      <Kitchen t={t} id="k20" />
      <Hero look={SIS} pose={{ ...pp, ...face }} rimId="rimL" shadow={0} />
      <ScoopCone x={hr.x + 34} y={hr.y + 30} s={1.55} rot={-8} scoop={0} />
      {/* the scoop, dropping live while the shot runs */}
      <g transform={`translate(${hr.x + 34} ${hr.y - 44 + fall}) rotate(${rot} 0 0)`}>
        <circle r={40} fill="#F7A8C4" stroke="#181420" strokeWidth={3.5} />
        <circle cx={-13} cy={-13} r={12} fill="#FFFFFF" opacity={0.65} />
        <circle cx={14} cy={7} r={5} fill="#D4689A" opacity={0.7} />
      </g>
      <KitchenIsland />
      <Foreground blur={10}>
        <path d="M 1520 1080 Q 1420 720 1580 600 Q 1660 800 1680 1080 Z" fill="#221826" />
      </Foreground>
    </g>
  );
};

// ---------- S21: top-down macro: the scoop frozen a hand's width above the surface ----------
export const S21: React.FC<ShotProps> = ({ t }) => {
  const hand = { x: kf(t, [[0, 1420], [14, 1150]]), y: kf(t, [[0, 300], [14, 480]]) };
  return (
    <g transform={`translate(960 540) rotate(2) scale(1.05) translate(-960 -540)`}>
      <Tabletop edge={1260} kind="stone" wood="#8A6452" grain="#764F42" floor="#2C2A30" floorLines="#232127" />
      <LightVeil id="s21veil" lights={[[940, 430, 640]]} o={0.4} />
      <Glow x={960} y={430} r={500} o={0.22} />
      {/* the scoop, huge, frozen a hand's width above the stone, shadow waiting below */}
      <ellipse cx={960} cy={640} rx={150} ry={30} fill="#000" opacity={0.3} />
      <g transform="translate(960 430)">
        <circle r={105} fill="#F7A8C4" stroke="#181420" strokeWidth={5} />
        <circle cx={-30} cy={-30} r={28} fill="#FFFFFF" opacity={0.7} />
        <circle cx={36} cy={18} r={10} fill="#D4689A" opacity={0.75} />
        <circle cx={-6} cy={44} r={7} fill="#D4689A" opacity={0.55} />
      </g>
      {[0, 1, 2].map((k) => (
        <ellipse key={k} cx={960} cy={640} rx={130 + k * 62} ry={18 + k * 13} fill="none" stroke="#E58BB4" strokeWidth={4} opacity={0.42 - k * 0.12} />
      ))}
      {/* sis's mitten reaching from the lower left; Pip's hand hovering above from the top right */}
      <g filter="url(#rimL)">
        <ArmIn x0={-60} y0={1030} x1={430} y1={706} look={SIS} w={72} />
        <BigHand x={480} y={682} rot={42} s={3.2} look={SIS} />
      </g>
      <g filter="url(#rimR)">
        <ArmIn x0={hand.x + 430} y0={-330} x1={hand.x + 30} y1={hand.y - 62} look={PIP} w={112} />
        <BigHand x={hand.x + 4} y={hand.y - 36} rot={40} s={5} look={PIP} />
      </g>
      <Foreground blur={8}>
        <circle cx={200} cy={1010} r={200} fill="#1C1620" />
      </Foreground>
    </g>
  );
};
// ---------- S22: medium: he sets the scoop back on and hands the cone over ----------
export const S22: React.FC<ShotProps> = ({ t }) => {
  const pose = poseAt(t, [
    { f: 0, p: { x: 820, y: 886 - LEG_LEN * 0.88, scale: 0.88, yaw: -0.3, look: -0.9, armR: { a: 84, b: 62 }, armL: { a: 16, b: -8 } } },
    { f: 8, p: { armR: { a: 72, b: 98 } }, ease: easeOut },
    { f: 26, p: { armR: { a: 60, b: 116 }, look: -0.3 }, ease: easeOut },
    { f: 38, p: { armR: { a: 22, b: -10 }, look: 0.5, headTilt: -3 } },
  ]);
  const ppf = faceAt(t, [[0, 'worried'], [30, 'neutral'], [44, 'smug']]);
  const pp: Pose = { ...basePose, ...pose };
  const hr = toWorld(pp, joints(pp).armR.end);
  const sis = poseAt(t, [
    { f: 0, p: { ...sisSmall({ armR: { a: 114, b: 88 }, armL: { a: 22, b: -8 } }) } },
    { f: 20, p: { look: -0.4 } },
    { f: 34, p: { expr: 'happy' as never, look: -0.6, headTilt: -5 } },
  ]);
  const sp: Pose = { ...basePose, ...sis };
  const hsr = toWorld(sp, joints(sp).armR.end);
  const cone = t < 30 ? { x: lerp(hsr.x + 30, hr.x - 10, clamp(t / 30)), y: lerp(hsr.y + 40, hr.y + 66, clamp(t / 30)) } : { x: hsr.x + 30, y: hsr.y + 40 };
  return (
    <g transform={camT(920, 540, kf(t, [[0, 1.5], [54, 1.58]]))}>
      <Kitchen t={FROZEN} id="k22" />
      <Hero look={SIS} pose={{ ...sp, expr: t > 30 ? 'happy' : 'shock', look: t > 30 ? -0.6 : 0.2 }} rimId="rimL" shadow={0} />
      <Hero look={PIP} pose={{ ...pp, ...ppf }} rimId="rimR" shadow={0} />
      <KitchenIsland />
      <ScoopCone x={cone.x} y={cone.y} s={1.5} rot={t < 30 ? -10 : -4} scoop={t >= 26 ? 1 : 0.98} />
      <Sparkle x={cone.x} y={cone.y - 70} t={t - 34} s={1} />
    </g>
  );
};

// ---------- S23: close-up: sis, mid-giggle, none of this ever happened to her ----------
export const S23: React.FC<ShotProps> = ({ t }) => {
  const sc = 4.9;
  const head = { x: 960, y: 760 };
  const pose: Pose = {
    ...basePose,
    x: head.x, y: head.y - HEAD.y * sc, scale: sc, yaw: -0.06, look: 0.15,
    headTilt: 5, tilt: -1,
    armL: { a: 16, b: -6 }, armR: { a: 108, b: 82 },
    ...faceAt(t, [[0, 'happy']]),
  };
  return (
    <g>
      <g filter="url(#blur16)">
        <g transform="translate(-620 -560) scale(2)">
          <Kitchen t={FROZEN} id="k23" />
        </g>
      </g>
      <rect x={-400} y={-400} width={2720} height={1880} fill="#07040C" opacity={0.25} />
      <Hero look={SIS} pose={{ ...pose, blink: t > 40 && t < 44 ? 1 : 0 }} shadow={0} rimId="rimR" />
      <ScoopCone x={1620} y={1000} s={2.2} rot={14} />
      <Foreground blur={16}>
        <path d="M -100 1080 Q 80 620 270 600 Q 320 880 250 1080 Z" fill="#0E0A14" />
      </Foreground>
    </g>
  );
};

// ================================================================= THE CLOSER + THE TURN
// ---------- S24: wide, low: the frozen city, the lights mid-sway, him mid-turn ----------
export const S24: React.FC<ShotProps> = ({ t }) => {
  const pose = poseAt(t, [
    { f: 0, p: { x: 1120, y: 950 - LEG_LEN * 1.15, scale: 1.15, yaw: -0.15, look: -0.5, armL: { a: 24, b: 6 }, armR: { a: 22, b: 6 } } },
    { f: 18, p: { look: 0.5, headTilt: 5 }, ease: easeOut },
    { f: 36, p: { yaw: 0, look: -0.2, headTilt: -2 }, ease: easeOut },
  ]);
  const face = faceAt(t, [[0, 'happy'], [14, 'cool']]);
  return (
    <g transform={camT(kf(t, [[0, 1150], [56, 1060]]), 500, kf(t, [[0, 1.0], [56, 1.12]]))}>
      <Rooftop t={FROZEN} sunX={1290} sunY={540} low={120} cityLit={1.6} />
      <Rain t={FROZEN} frozen n={70} wet={false} />
      <Hero look={PIP} pose={{ ...pose, ...face }} shadow={0} rimId="rimR" />
      <Foreground blur={10}>
        <path d="M -140 1080 Q -30 640 240 660 Q 310 900 280 1080 Z" fill="#0C0912" />
      </Foreground>
    </g>
  );
};

// ---------- S25: medium, slow push: the smile drops as the cost lands ----------
export const S25: React.FC<ShotProps> = ({ t }) => {
  const pose = poseAt(t, [
    { f: 0, p: { x: 960, y: 1130 - LEG_LEN * 1.8, scale: 1.8, yaw: 0, look: 0.1, armL: { a: 22, b: 8 }, armR: { a: 22, b: 8 } } },
    { f: 16, p: { look: -0.45, headTilt: 3 } },
    { f: 34, p: { look: 0, headTilt: -3, armL: { a: 16, b: -6 }, armR: { a: 16, b: -6 } } },
  ]);
  const face = faceAt(t, [[0, 'happy'], [12, 'neutral'], [32, 'worried']]);
  return (
    <g transform={camT(960, kf(t, [[0, 500], [64, 410]]), kf(t, [[0, 1.14], [64, 1.5]]))}>
      <Rooftop t={FROZEN} sunX={1290} sunY={540} low={300} />
      <rect x={-400} y={-400} width={2720} height={1880} fill="#18040E" opacity={0.42 * clamp((t - 14) / 40)} />
      <Hero look={PIP} pose={{ ...pose, ...face, blink: t > 22 && t < 25 ? 1 : 0 }} shadow={0} rimId={t > 24 ? 'rimRed' : 'rimR'} />
    </g>
  );
};

// ================================================================= THE SCHEMATIC
// ---------- S26: a room in cross-section: light crosses it in ten nanoseconds ----------
export const S26: React.FC<ShotProps> = ({ t }) => {
  const rayT = t - 26;
  return (
    <g transform={`translate(960 540) scale(${kf(t, [[0, 1.02], [71, 1.1]])}) translate(-960 -540)`}>
      <Schematic t={t} id="sch26" />
      {/* the room: floor, ceiling, far wall */}
      <DrawOn d="M 320 780 L 1600 780" t={t - 2} dur={8} />
      <DrawOn d="M 320 320 L 1600 320" t={t - 4} dur={8} />
      <DrawOn d="M 1600 320 L 1600 780" t={t - 6} dur={6} />
      <DrawOn d="M 330 320 L 330 780" t={t - 8} dur={5} color={SCH.dim} width={3} />
      {/* the lamp that crosses it */}
      {t > 16 ? (
        <g transform="translate(470 770)">
          <rect x={-38} y={0} width={76} height={30} rx={8} fill="none" stroke={SCH.line} strokeWidth={5} />
          <path d="M -24 0 Q 0 -32 24 0 M -9 -16 L 0 -40 L 9 -16" fill="none" stroke={SCH.live} strokeWidth={6} style={{ filter: `drop-shadow(0 0 12px ${SCH.glow})` }} />
        </g>
      ) : null}
      <Arrow x0={440} y0={860} x1={1480} y1={860} t={t - 14} color={SCH.dim} bend={-0.04} />
      <SchLabel x={960} y={918} t={t - 18} text="ONE ROOM · 3 m" size={42} />
      {/* the ray crawling across the room while the counter runs */}
      <DrawOn d={`M 470 720 L 1510 720`} t={rayT} dur={40} color={SCH.live} width={8} />
      {rayT > 0
        ? Array.from({ length: 6 }).map((_, i) => {
            const cx = 470 + clamp((rayT / 40) * 1040 - i * 60, 20, 1000);
            return <circle key={i} cx={cx} cy={720} r={9} fill={SCH.live} opacity={0.9} style={{ filter: `drop-shadow(0 0 8px ${SCH.glow})` }} />;
          })
        : null}
      <CountUp x={1180} y={230} t={rayT - 6} to={10} dur={34} size={104} format={(v) => v.toFixed(1)} suffix=" ns" />
      <SchLabel x={1180} y={150} t={t - 24} text="CROSSING TIME = 3 m ÷ c" size={34} color={SCH.dim} />
      <SchLabel x={520} y={990} t={t - 30} text="c = 299,792,458 m/s" size={30} color={SCH.dim} />
    </g>
  );
};

// ---------- S27: macro on the ray: it stops mid-flight; the eye it would never reach ----------
export const S27: React.FC<ShotProps> = ({ t }) => {
  const freezeAt = 24;
  const rayDone = clamp(t / 40);
  const rayLen = t < freezeAt ? rayDone : 0.48;
  const eyeIn = t > 62 ? backOut(clamp((t - 62) / 8)) : 0;
  const xT = clamp((t - 78) / 7);
  const blind = clamp((t - 92) / 9);
  const dim = clamp((t - 104) / 50);
  return (
    <g transform={`translate(960 540) scale(${kf(t, [[0, 1.5], [154, 1.66]])}) translate(-960 -540)`}>
      <Schematic t={FROZEN} id="sch27" />
      <DrawOn d="M 300 700 L 1620 700" t={2} dur={6} width={5} />
      {t > 6 ? (
        <g transform="translate(420 690)">
          <rect x={-36} y={0} width={72} height={28} rx={8} fill="none" stroke={SCH.line} strokeWidth={5} />
          <path d="M -22 0 Q 0 -30 22 0" fill="none" stroke={SCH.live} strokeWidth={6} style={{ filter: `drop-shadow(0 0 10px ${SCH.glow})` }} />
        </g>
      ) : null}
      {/* the ray: crawling, then stopped exactly where the pause found it */}
      <path d="M 420 640 L 1400 640" stroke={SCH.live} strokeWidth={8} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 12px ${SCH.glow})` }} strokeDasharray="980" strokeDashoffset={980 - 980 * rayLen} opacity={t < freezeAt ? 0.95 : 0.75} />
      {t >= freezeAt
        ? [0, 1, 2, 3, 4].map((i) => (
            <circle key={i} cx={420 + 980 * rayLen + 30 + i * 52} cy={640} r={9 + (i % 2) * 3} fill={SCH.live} opacity={0.9} style={{ filter: `drop-shadow(0 0 8px ${SCH.glow})` }} />
          ))
        : null}
      {t >= freezeAt ? (
        <g transform="translate(1060 500)">
          <rect x={-150} y={-34} width={300} height={64} rx={32} fill="#141018" opacity={0.92} />
          <text textAnchor="middle" y={14} fontFamily={FONT.ui} fontSize={38} fill={SCH.live} letterSpacing={5}>{'FROZEN MID-FLIGHT'}</text>
        </g>
      ) : null}
      <SchLabel x={500} y={830} t={t - 28} text="IT NEVER LANDS" size={40} color={SCH.dim} anchor="start" />
      {/* the eye at the far wall, then the X: what a light-freezing pause would cost */}
      <g transform={`translate(1450 510) scale(${eyeIn})`}>
        <path d="M -70 0 Q 0 -54 70 0 Q 0 54 -70 0 Z" fill="none" stroke={SCH.line} strokeWidth={6} />
        <circle r={24} fill={SCH.live} opacity={0.9} style={{ filter: `drop-shadow(0 0 10px ${SCH.glow})` }} />
        <circle r={24} fill="none" stroke={SCH.line} strokeWidth={4} />
      </g>
      {xT > 0 ? (
        <path d="M 1380 440 L 1520 580 M 1520 440 L 1380 580" stroke={UI.bad} strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={210} strokeDashoffset={210 * (1 - xT)} />
      ) : null}
      {blind > 0 ? (
        <g transform={`translate(1150 220) scale(${0.6 + 0.4 * blind})`}>
          <rect x={-140} y={-46} width={280} height={88} rx={80} fill="#141018" opacity={0.92} />
          <text textAnchor="middle" y={26} fontFamily={FONT.ui} fontSize={58} fill="#FF8AA0" letterSpacing={8}>{'BLIND'}</text>
        </g>
      ) : null}
      <rect x={-400} y={-400} width={2720} height={1880} fill="#08040E" opacity={0.42 * dim} />
    </g>
  );
};

// ---------- S28: extreme close-up, near dark: that's real ----------
export const S28: React.FC<ShotProps> = ({ t, len }) => {
  const sc = 6.6;
  const head = { x: 960, y: 680 };
  const pose: Pose = {
    ...basePose,
    x: head.x, y: head.y - HEAD.y * sc, scale: sc, yaw: 0, look: kf(t, [[0, 0.35], [30, -0.1]]),
    headTilt: -2,
    armL: { a: 10, b: -8 }, armR: { a: 10, b: -8 },
    ...faceAt(t, [[0, 'worried']]),
  };
  return (
    <g transform={camT(960, kf(t, [[0, 560], [len, 540]]), kf(t, [[0, 1.04], [len, 1.12]]))}>
      <rect x={-400} y={-400} width={2720} height={1880} fill="#08060E" />
      <circle cx={960} cy={640} r={720} fill="#241C2E" opacity={0.3} />
      <Hero look={PIP} pose={pose} shadow={0} rimId="rimR" />
      <Foreground blur={16}>
        <path d="M 1760 1080 Q 1600 560 1720 240 L 1920 200 L 1920 1080 Z" fill="#06040A" />
      </Foreground>
    </g>
  );
};

// ---------- S29: the exception: light already inside your eyes stays live ----------
export const S29: React.FC<ShotProps> = ({ t }) => {
  const eyeIn = t > 4 ? backOut(clamp((t - 4) / 8)) : 0;
  const worldPops = clamp((t - 42) / 8);
  const keepPops = clamp((t - 74) / 8);
  const pulse = 0.7 + 0.3 * Math.sin(t / 6);
  return (
    <g transform={`translate(960 540) scale(${kf(t, [[0, 1.06], [126, 1.14]])}) translate(-960 -540)`}>
      <Schematic t={t} id="sch29" />
      {/* the eye, drawn on big */}
      <DrawOn d="M 420 560 Q 760 360 1100 560 Q 760 760 420 560 Z" t={t - 2} dur={8} width={7} />
      <g transform={`translate(760 560) scale(${eyeIn})`}>
        <circle r={110} fill="#2C3038" stroke={SCH.line} strokeWidth={5} />
        <circle r={58} fill="#171B24" stroke={SCH.line} strokeWidth={4} />
        {/* light already inside: the cone between cornea and retina keeps working */}
        <g opacity={pulse}>
          <path d="M -170 -80 L 60 0 L -170 80 Z" fill={SCH.live} opacity={0.25} style={{ mixBlendMode: 'screen' }} />
          {[-60, 0, 60].map((dy, i) => (
            <path key={i} d={`M -180 ${dy} L 48 0`} stroke={SCH.live} strokeWidth={4} opacity={0.85} style={{ filter: `drop-shadow(0 0 8px ${SCH.glow})` }} />
          ))}
        </g>
        <circle cx={-190} cy={-84} r={12} fill={SCH.live} style={{ filter: `drop-shadow(0 0 10px ${SCH.glow})` }} />
      </g>
      <SchLabel x={760} y={372} t={t - 14} text="YOUR EYES" size={40} />
      <SchLabel x={760} y={770} t={t - 20} text="10 ns OF LIGHT IN HERE — SPARED" size={28} color={SCH.dim} />
      {/* the comparison: the world paused (dim) vs what's already inside you (live) */}
      <g opacity={worldPops}>
        <g transform="translate(330 260)">
          <circle r={54} fill="none" stroke={SCH.dim} strokeWidth={5} />
          <path d="M -34 0 L 34 0 M 0 -34 L 0 34 M -24 -24 L 24 24 M 24 -24 L -24 24" stroke={SCH.dim} strokeWidth={5} />
          <SchLabel x={0} y={104} t={t - 46} text="WORLD: PAUSED" size={26} color={SCH.dim} />
        </g>
      </g>
      <g opacity={keepPops}>
        <g transform="translate(330 850)">
          <Sparkle x={80} y={-40} t={t - 80} s={1.4} />
          <circle r={54} fill="none" stroke={SCH.live} strokeWidth={5} />
          <circle r={22} fill={SCH.live} opacity={pulse * 0.9} style={{ filter: `drop-shadow(0 0 10px ${SCH.glow})` }} />
          <SchLabel x={0} y={104} t={t - 78} text="ALREADY IN YOUR EYES: LIVE" size={26} color={SCH.live} />
        </g>
      </g>
    </g>
  );
};

// ================================================================= THE MAN IN THE SUIT
// ---------- S30: medium: a second figure moves at the frame edge where nothing should ----------
export const S30: React.FC<ShotProps> = ({ t }) => {
  const sx = 1560 + t * 2.2;
  const suit = poseAt(t, [
    { f: 0, p: { x: sx, y: 852 - LEG_LEN * 1.05, scale: 1.05, yaw: -0.9, look: 0, armL: { a: 12, b: 10 }, armR: { a: 10, b: 12 } } },
  ]);
  const pip = walkPose(clamp(560 - t * 2, 300, 560), t * 0.45, 830, 0.95, { headTilt: 4 });
  return (
    <g transform={camT(1160, 560, kf(t, [[0, 1.5], [54, 1.6]]))}>
      <Classroom t={FROZEN} id="cls30" laugh={1} />
      <rect x={-400} y={-400} width={2720} height={1880} fill="#0A0812" opacity={0.34} />
      <Hero look={PIP} pose={pip} shadow={0.2} rimId="rimR" />
      <Hero look={SUIT} pose={{ ...basePose, ...suit }} shadow={0.2} rimId="rimL" />
      <Foreground blur={6}>
        <path d="M -140 1080 Q -20 620 250 640 Q 330 850 290 1080 Z" fill="#0C0A12" />
      </Foreground>
    </g>
  );
};

// ---------- S31: wide, high: the frozen rows, the charcoal suit walking between them ----------
export const S31: React.FC<ShotProps> = ({ t }) => {
  const sx = lerp(700, 1020, clamp(t / 76));
  const suit = walkPose(sx, t * 0.28, 800, 1.0, { sway: 6 });
  const suitF = faceAt(t, [[0, 'neutral'], [30, 'cool']]);
  const pip = poseAt(t, [
    { f: 0, p: { x: 330, y: 850, scale: 0.95, yaw: 0.7, look: 0.9, armL: { a: 14, b: -8 }, armR: { a: 16, b: -8 } } },
    { f: 26, p: { headTilt: 4 } },
  ]);
  return (
    <g transform={camT(960, 480, kf(t, [[0, 0.92], [78, 1.04]]))}>
      <Classroom t={FROZEN} id="cls31" laugh={1} />
      <Hero look={SUIT} pose={{ ...suit, ...suitF }} shadow={0.3} rimId="rimL" />
      <Hero look={PIP} pose={{ ...basePose, ...pip, ...faceAt(t, [[0, 'worried']]) }} shadow={0} rimId="rimR" />
      <Foreground blur={12}>
        <path d="M 1560 1080 Q 1480 780 1680 680 Q 1780 780 1800 1080 Z" fill="#0C0A12" />
      </Foreground>
    </g>
  );
};

// ---------- S32: medium, closer: the suit mid-stride, frozen kids either side ----------
export const S32: React.FC<ShotProps> = ({ t }) => {
  const suit = poseAt(t, [
    { f: 0, p: { x: 780, y: 850 - LEG_LEN * 1.05, scale: 1.05, yaw: -0.4, armL: { a: 30, b: 24 }, armR: { a: 24, b: 18 }, tilt: -3 } },
    { f: 18, p: { armL: { a: 40, b: 30 } }, ease: easeOut },
    { f: 40, p: { armL: { a: 32, b: 22 }, headTilt: 2 }, ease: easeOut },
  ]);
  const face = faceAt(t, [[0, 'neutral'], [22, 'cool'], [50, 'neutral']]);
  return (
    <g transform={camT(kf(t, [[0, 800], [78, 860]]), 480, kf(t, [[0, 1.5], [78, 1.62]]))}>
      <Classroom t={FROZEN} id="cls32" laugh={1} />
      <Hero look={SUIT} pose={{ ...basePose, ...suit, ...face }} shadow={0.35} rimId="rimL" />
      <Foreground blur={8}>
        <Kid x={240} y={1220} s={2.6} look={KIDS[2]} t={FROZEN} />
      </Foreground>
    </g>
  );
};

// ---------- S33: close-up: his head turns, the eyes land on us ----------
export const S33: React.FC<ShotProps> = ({ t }) => {
  const sc = 4.5;
  const head = { x: 1000, y: 640 };
  const pose: Pose = {
    ...basePose,
    x: head.x, y: head.y - HEAD.y * sc, scale: sc, yaw: kf(t, [[0, 0.32], [26, -0.04]]),
    look: 0, headTilt: -3,
    armL: { a: 16, b: 6 }, armR: { a: 14, b: 8 },
    ...faceAt(t, [[0, 'neutral'], [20, 'cool']]),
  };
  return (
    <g transform={camT(1000, kf(t, [[0, 620], [77, 600]]), kf(t, [[0, 1.06], [77, 1.16]]))}>
      <g filter="url(#blur10)">
        <Classroom t={FROZEN} id="cls33" laugh={1} />
      </g>
      <rect x={-400} y={-400} width={2720} height={1880} fill="#0A0710" opacity={0.3} />
      <Hero look={SUIT} pose={pose} shadow={0} rimId="rimL" />
      <Foreground blur={16}>
        <path d="M -120 1080 Q 60 560 280 540 Q 340 800 280 1080 Z" fill="#08060C" />
      </Foreground>
    </g>
  );
};

// ---------- S34: macro: a stopwatch in a gloved hand, ticking off his taps ----------
export const S34: React.FC<ShotProps> = ({ t }) => {
  const ticks = Math.min(4, Math.floor(clamp((t - 18) / 22)) + (t > 18 ? 1 : 0));
  const lastTick = 18 + (ticks - (t > 18 ? 1 : 0)) * 22;
  const kick = Math.max(0, 4 - Math.abs(t - lastTick)) * (t > 18 ? 1 : 0);
  return (
    <g transform={`rotate(${settle(t, kick, 3, 3)} 960 540)`}>
      <g filter="url(#blur16)">
        <g transform="translate(-540 -420) scale(1.9)">
          <Classroom t={FROZEN} id="cls34" laugh={1} />
        </g>
      </g>
      <rect x={-400} y={-400} width={2720} height={1880} fill="#0A0610" opacity={0.3} />
      <StopWatch x={920} y={560} s={1.45} ticks={ticks} />
      {/* the gloved fist gripping the crown, in from the bottom right */}
      <g filter="url(#rimL)">
        <path d="M 1560 1120 Q 1240 720 1035 305" stroke="#0E0C14" strokeWidth={140} fill="none" strokeLinecap="round" />
        <ellipse cx={1005} cy={265} rx={104} ry={72} fill="#191620" stroke={SUIT.limb} strokeWidth={6} transform="rotate(-20 1005 265)" />
        <ellipse cx={938} cy={308} rx={42} ry={30} fill="#191620" transform="rotate(-28 938 308)" />
        <ellipse cx={1075} cy={300} rx={38} ry={26} fill="#191620" transform="rotate(24 1075 300)" />
      </g>
      {t > 58 ? <SchLabel x={760} y={230} t={t - 58} text={`TAP ${ticks}`} size={44} color={SCH.live} /> : null}
      <Foreground blur={10}>
        <path d="M -160 1080 Q -20 760 190 720 Q 260 900 220 1080 Z" fill="#0C0A12" />
      </Foreground>
    </g>
  );
};

// ================================================================= FAMILY AT STAKE
// ---------- S35: medium at the door: sis waves goodbye; the freeze lands mid-wave (t = 28) ----------
export const S35: React.FC<ShotProps> = ({ t, len }) => {
  const wave = t < 28 ? 96 + Math.sin(t / 2.6) * 20 : 96;
  const sis = poseAt(t, [
    { f: 0, p: { ...sisSmallDoor, armR: { a: 128, b: wave }, armL: { a: 20, b: -8 } } },
  ]);
  const pip = poseAt(t, [
    { f: 0, p: { x: 900, y: 900 - LEG_LEN * 1.05, scale: 1.05, yaw: -0.3, armR: { a: 20, b: -8 }, armL: { a: 130, b: 62 }, handL: 'point' } },
    { f: 16, p: { armL: { a: 130, b: 62 } } },
  ]);
  const sisFull: Pose = { ...basePose, ...sis };
  const faceS = faceAt(t, [[0, 'happy']]);
  return (
    <g transform={camT(kf(t, [[0, 900], [len, 920]]), 520, kf(t, [[0, 1.44], [len, 1.52]]))}>
      <Classroom t={t < 28 ? t + 60 : FROZEN} id="cls35" laugh={t < 28 ? 1 : 1} />
      {/* the door on the left, drawn on (school corridor door) */}
      <DrawOn d="M 200 1080 L 200 330 L 420 330 L 420 1080" t={2} dur={6} width={5} color="#EFE2CC" />
      <rect x={200} y={330} width={220} height={750} fill="#5A4638" opacity={0.28} transform={`rotate(2 310 705)`} />
      <circle cx={392} cy={720} r={9} fill="#E9C46A" />
      <Hero look={SIS} pose={{ ...sisFull, ...faceS, blink: t > 50 && t < 53 ? 1 : 0 }} rimId="rimR" shadow={0} />
      <Hero look={PIP} pose={{ ...basePose, ...pip, ...faceAt(t, [[0, 'cool'], [30, 'neutral']]) }} rimId="rimR" shadow={0} />
      <SchoolDesk x={1420} />
    </g>
  );
};
const sisSmallDoor: Partial<Pose> = { x: 640, y: 900 - LEG_LEN * 1.0 - 46, scale: 0.72, yaw: 0.25, look: -0.4, headTilt: 4, armL: { a: 20, b: -8 } };

// ---------- S36: wide, camera follows: his usual shortcut down the frozen aisle ----------
export const S36: React.FC<ShotProps> = ({ t }) => {
  const x = lerp(700, 1180, clamp(t / 70));
  const pose = walkPose(x, t * 0.5, 792, 1, { sway: 12, armL: { a: 30, b: 40 }, armR: { a: 26, b: 36 } });
  const face = faceAt(t, [[0, 'neutral']]);
  return (
    <g transform={camT(clamp(x + 140, 860, 1320), 500, kf(t, [[0, 1.24], [74, 1.34]]))}>
      <Classroom t={FROZEN} id="cls36" laugh={1} />
      {S12_PAPERS.filter((ppr) => !(ppr.x > 820 && ppr.x < 1500 && ppr.y < 640)).map((ppr, i) => (
        <g key={i} transform={`translate(${ppr.x} ${ppr.y}) rotate(${ppr.rot}) scale(${ppr.s})`}>
          <rect x={-46} y={-60} width={92} height={120} rx={4} fill="#F4EEE0" stroke="#2A2432" strokeWidth={3} transform="skewX(-8)" />
        </g>
      ))}
      <Hero look={PIP} pose={{ ...pose, ...face, blink: t > 30 && t < 33 ? 1 : 0 }} shadow={0} rimId="rimR" />
      <Foreground blur={10}>
        <Kid x={300} y={1290} s={3.1} look={KIDS[1]} t={FROZEN} />
      </Foreground>
    </g>
  );
};

// ---------- S37: wide, deep, high: far down the rows — the suit, standing at frozen sis ----------
export const S37: React.FC<ShotProps> = ({ t }) => {
  const sis = { x: 1385, y: 760, scale: 0.7, yaw: 0.3, look: -0.35, headTilt: -4, armR: { a: 118, b: 104 }, armL: { a: 24, b: -8 } };
  const suit = poseAt(t, [
    { f: 0, p: { x: 1545, y: 820 - LEG_LEN * 0.8, scale: 0.8, yaw: -0.75, armL: { a: 14, b: 8 }, armR: { a: 12, b: 10 } } },
    { f: 22, p: { headTilt: 3 } },
  ]);
  const face = faceAt(t, [[0, 'neutral'], [26, 'cool']]);
  return (
    <g transform={camT(1000, 470, kf(t, [[0, 0.84], [44, 0.95]]))}>
      <Classroom t={FROZEN} id="cls37" laugh={1} />
      <rect x={-400} y={-400} width={2720} height={1880} fill="#0C0912" opacity={0.22} />
      <Hero look={SIS} pose={{ ...basePose, ...sis, ...faceAt(t, [[0, 'happy']]) }} rimId="rimR" shadow={0} />
      <Hero look={SUIT} pose={{ ...basePose, ...suit, ...face }} shadow={0.2} rimId="rimL" />
      {/* Pip, downstage, staring down the aisle */}
      <g transform="translate(210 880) scale(2.6)" opacity={0.95}>
        <path d="M -120 200 L -96 -60 Q -40 -120 20 -70 L 60 40 L 90 200 Z" fill="#151219" />
        <circle cx={-30} cy={-90} r={46} fill="#1C1926" />
      </g>
      <Foreground blur={10}>
        <path d="M -140 1080 Q 0 780 260 760 Q 330 920 300 1080 Z" fill="#08060C" />
      </Foreground>
    </g>
  );
};

// ---------- S38: close-up: sis, mid-giggle, frozen; nothing about her knows ----------
export const S38: React.FC<ShotProps> = ({ t }) => {
  const sc = 4.7;
  const head = { x: 960, y: 740 };
  const pose: Pose = {
    ...basePose,
    x: head.x, y: head.y - HEAD.y * sc, scale: sc, yaw: 0.1, look: -0.3,
    headTilt: 6, tilt: -1,
    armL: { a: 14, b: -6 }, armR: { a: 118, b: 86 },
    ...faceAt(t, [[0, 'happy']]),
  };
  return (
    <g transform={camT(960, 560, kf(t, [[0, 1.04], [68, 1.1]]))}>
      <g filter="url(#blur10)">
        <Classroom t={FROZEN} id="cls38" laugh={1} />
      </g>
      <rect x={0} y={0} width={1920} height={1080} fill="#08050D" opacity={0.2} />
      <Hero look={SIS} pose={pose} shadow={0} rimId="rimR" />
      <Foreground blur={16}>
        <path d="M 1820 1080 Q 1680 560 1860 480 L 1920 480 L 1920 1080 Z" fill="#08060C" />
      </Foreground>
    </g>
  );
};

// ---------- S39: macro: a gloved hand, two steps from her shoulder ----------
export const S39: React.FC<ShotProps> = ({ t, len }) => {
  const creep = clamp(t / 66);
  const fx = 1520 - 120 * creep;
  const fy = 620 + 40 * creep;
  return (
    <g transform={camT(960, 520, kf(t, [[0, 1.12], [len, 1.24]]))}>
      <g filter="url(#blur10)">
        <Classroom t={FROZEN} id="cls39" laugh={1} />
      </g>
      <rect x={0} y={0} width={1920} height={1080} fill="#08050D" opacity={0.26} />
      {/* her shoulder, small, half out of frame at the lower left, teal with the coral band */}
      <g filter="url(#blur6)">
        <g transform="translate(150 930) scale(1.45)">
          <ellipse rx={105} ry={84} fill={SIS.jacket} stroke={SIS.line} strokeWidth={5} />
          <path d="M -92 -14 Q -30 -50 44 -30 L 22 42 L -98 38 Z" fill={SIS.accent} opacity={0.85} />
          <rect x={50} y={-120} width={24} height={120} rx={12} fill={SIS.hair} transform="rotate(20 50 -120)" />
        </g>
      </g>
      {/* the gap: empty frozen air, held between the two */}
      {/* his spread gloved hand rising from the bottom right, charcoal sleeve behind */}
      <g filter="url(#rimL)">
        <path d={`M 1980 1260 Q ${fx + 330} ${fy + 330} ${fx + 40} ${fy + 80}`} stroke="#131118" strokeWidth={126} fill="none" strokeLinecap="round" />
        <ellipse cx={fx + 70} cy={fy + 40} rx={66} ry={54} fill="#1A1720" stroke={SUIT.limb} strokeWidth={5} transform={`rotate(-24 ${fx + 70} ${fy + 40})`} />
        {[0, 1, 2, 3].map((i) => (
          <ellipse key={i} cx={fx + 14 - i * 46} cy={fy - 6 - i * 16} rx={19} ry={44 + i * 4} fill="#1A1720" stroke={SUIT.limb} strokeWidth={4} transform={`rotate(${-40 - i * 7} ${fx + 14 - i * 46} ${fy - 6 - i * 16})`} />
        ))}
        <ellipse cx={fx + 128} cy={fy + 74} rx={17} ry={34} fill="#1A1720" stroke={SUIT.limb} strokeWidth={4} transform={`rotate(34 ${fx + 128} ${fy + 74})`} />
      </g>
      <Sparkle x={1180} y={300} t={t - 56} s={1} />
    </g>
  );
};

// ================================================================= THE CLIFFHANGER
// ---------- S40: medium, low: backed against the doorframe, nowhere to go ----------
export const S40: React.FC<ShotProps> = ({ t, len }) => {
  const pose = poseAt(t, [
    { f: 0, p: { x: 640, y: 900 - LEG_LEN * 1.0, scale: 1.0, yaw: -0.5, look: 0.8, armL: { a: 12, b: -8 }, armR: { a: 18, b: -10 }, tilt: 4 } },
    { f: 10, p: { look: -0.6, headTilt: -4 } },
    { f: 24, p: { look: 0.4, headTilt: 3 } },
  ]);
  const face = faceAt(t, [[0, 'shock'], [12, 'worried']]);
  return (
    <g transform={camT(860, 560, kf(t, [[0, 1.5], [len, 1.6]]))}>
      <Classroom t={FROZEN} id="cls40" laugh={1} />
      <DrawOn d="M 220 1080 L 220 330 L 420 330 L 420 1080" t={2} dur={5} width={5} color="#EFE2CC" />
      <rect x={220} y={330} width={220} height={750} fill="#5A4638" opacity={0.28} />
      <Hero look={PIP} pose={{ ...basePose, ...pose, ...face, blink: t > 18 && t < 21 ? 1 : 0 }} shadow={0.2} rimId="rimL" />
      {/* the suit's shoulder and tie, entering screen right */}
      <Foreground blur={7}>
        <path d="M 1470 1080 Q 1400 640 1600 460 Q 1790 560 1830 1080 Z" fill="#0D0B13" />
        <path d="M 1652 520 L 1600 1080" stroke="#8E3240" strokeWidth={32} />
        <path d="M 1600 460 Q 1530 420 1462 436" stroke="#1E1B24" strokeWidth={36} fill="none" strokeLinecap="round" />
      </Foreground>
    </g>
  );
};

// ---------- S41: wide: he almost unpauses — a flash over the frozen crowd, and it holds ----------
export const S41: React.FC<ShotProps> = ({ t }) => {
  const suit = poseAt(t, [
    { f: 0, p: { x: 1060, y: 850 - LEG_LEN * 1.08, scale: 1.08, yaw: 0, armL: { a: 16, b: 8 }, armR: { a: 14, b: 10 } } },
    { f: 34, p: { headTilt: 4 } },
    { f: 60, p: { headTilt: -2, yaw: 0.06 } },
  ]);
  const suitF = faceAt(t, [[0, 'cool'], [50, 'neutral']]);
  const pip = { x: 1550, y: 880 - LEG_LEN * 0.9, scale: 0.9, yaw: -0.6, look: -0.9, armL: { a: 14, b: -8 }, armR: { a: 16, b: -10 } };
  const face = faceAt(t, [[0, 'worried']]);
  return (
    <g transform={camT(960, 486, kf(t, [[0, 0.94], [94, 1.04]]))}>
      <Classroom t={FROZEN} id="cls41" laugh={1} />
      <Hero look={SUIT} pose={{ ...basePose, ...suit, ...suitF }} shadow={0.3} rimId="rimR" />
      <Hero look={PIP} pose={{ ...basePose, ...pip, ...face }} shadow={0} rimId="rimR" />
      {S12_PAPERS.filter((ppr) => !(ppr.x > 860 && ppr.x < 1360 && ppr.y < 700)).map((ppr, i) => (
        <g key={i} transform={`translate(${ppr.x} ${ppr.y}) rotate(${ppr.rot}) scale(${ppr.s})`}>
          <rect x={-46} y={-60} width={92} height={120} rx={4} fill="#F4EEE0" stroke="#2A2432" strokeWidth={3} transform="skewX(-8)" />
        </g>
      ))}
      <Foreground blur={12}>
        <path d="M -160 1080 Q -40 800 200 780 Q 280 900 260 1080 Z" fill="#08060C" />
      </Foreground>
    </g>
  );
};

// ---------- S42: extreme close-up: who else is walking around in your pause? ----------
export const S42: React.FC<ShotProps> = ({ t }) => {
  const sc = 6.7;
  const head = { x: 960, y: 620 };
  const pose: Pose = {
    ...basePose,
    x: head.x, y: head.y - HEAD.y * sc, scale: sc, yaw: 0,
    look: lerp(-0.55, 0.5, easeInOut(clamp(t / 60))),
    headTilt: -2,
    armL: { a: 10, b: -8 }, armR: { a: 10, b: -8 },
    ...faceAt(t, [[0, 'worried']]),
  };
  return (
    <g transform={camT(960, kf(t, [[0, 540], [79, 560]]), kf(t, [[0, 1.04], [79, 1.14]]))}>
      <rect x={-400} y={-400} width={2720} height={1880} fill="#07050C" />
      <circle cx={960} cy={600} r={720} fill="#221A2E" opacity={0.28} />
      <Hero look={PIP} pose={pose} shadow={0} rimId="rimR" />
      <Foreground blur={16}>
        <path d="M -140 1080 Q 40 540 260 560 Q 320 820 240 1080 Z" fill="#05040A" />
      </Foreground>
    </g>
  );
};

// ---------- S43: the end card: PART 1 ----------
export const S43: React.FC<ShotProps> = ({ t }) => (
  <g>
    <rect x={-400} y={-400} width={2720} height={1880} fill="#060410" />
    {DROPS.slice(30, 36).map((p, i) => (
      <RainDrop key={i} x={lerp(120, 1800, p.x / 2100)} y={lerp(140, 940, i / 6)} s={0.9} rot={p.rot} />
    ))}
    <g transform={`translate(960 470) scale(${backOut(clamp((t - 4) / 8))})`}>
      <rect x={-350} y={-96} width={700} height={192} rx={96} fill={UI.pill} stroke={UI.text} strokeWidth={3} opacity={0.94} />
      <g transform="translate(-256 0)">
        <rect x={-16} y={-34} width={18} height={68} rx={7} fill={UI.live} />
        <rect x={16} y={-34} width={18} height={68} rx={7} fill={UI.live} opacity={t % 30 < 18 ? 1 : 0.35} />
      </g>
      <text x={-40} textAnchor="start" y={28} fontFamily={FONT.ui} fontSize={72} fill={UI.text} letterSpacing={6}>{'PART 1'}</text>
    </g>
    {t > 18 ? (
      <text textAnchor="middle" x={960} y={660} fontFamily={FONT.ui} fontSize={34} fill={UI.text} opacity={0.55} letterSpacing={6}>
        {'WHO ELSE IS WALKING AROUND IN YOUR PAUSE?'}
      </text>
    ) : null}
  </g>
);
