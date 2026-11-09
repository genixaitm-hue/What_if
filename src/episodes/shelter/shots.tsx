import React from 'react';
import {
  kf, clamp, lerp, easeOut, easeIn, easeInOut, backOut, rnd, settle,
  Foreground, Sparkle, TitleCard, Tag, UI, FONT, Glow, LightVeil,
  ShotProps,
} from '../../engine';

// Vertical 1080 x 1920 short. Palette: turquoise, warm orange, soft yellow, deep navy, muted violet, clean neutrals.
const TURQ = '#2EC4B6';
const ORANGE = '#FF7F50';
const YELLOW = '#FFD166';
const NAVY = '#1B2A4A';
const VIOLET = '#7B68EE';
const CREAM = '#F4F1EA';
const INK = '#1A2332';

const vCam = (cx: number, cy: number, s: number) => `translate(540 960) scale(${s}) translate(${-cx} ${-cy})`;

// ---- a simple geometric character: rounded body, circle head, circular (fingerless) hands
interface CharProps { x: number; y: number; s?: number; yaw?: number; armL?: number; armR?: number; face?: 'neutral' | 'worried' | 'surprised' | 'smile'; }
const Char: React.FC<CharProps> = ({ x, y, s = 1, yaw = 0, armL = 0, armR = 0, face = 'neutral' }) => {
  const sc = s;
  return (
    <g transform={`translate(${x} ${y}) scale(${sc}) rotate(${yaw * 12})`}>
      {/* body */}
      <ellipse cx={0} cy={-40} rx={46} ry={62} fill={NAVY} />
      <ellipse cx={0} cy={-40} rx={46} ry={62} fill="none" stroke={INK} strokeWidth={3} />
      {/* head */}
      <circle cx={0} cy={-128} r={40} fill={CREAM} stroke={INK} strokeWidth={3} />
      {/* eyes */}
      {face === 'surprised' ? (
        <>
          <circle cx={-14} cy={-134} r={6} fill={INK} />
          <circle cx={14} cy={-134} r={6} fill={INK} />
          <ellipse cx={0} cy={-120} rx={5} ry={7} fill={INK} />
        </>
      ) : face === 'worried' ? (
        <>
          <path d="M -20 -140 Q -14 -132 -8 -140" stroke={INK} strokeWidth={3} fill="none" />
          <path d="M 8 -140 Q 14 -132 20 -140" stroke={INK} strokeWidth={3} fill="none" />
          <path d="M -8 -118 Q 0 -112 8 -118" stroke={INK} strokeWidth={3} fill="none" />
        </>
      ) : face === 'smile' ? (
        <>
          <circle cx={-14} cy={-134} r={5} fill={INK} />
          <circle cx={14} cy={-134} r={5} fill={INK} />
          <path d="M -12 -120 Q 0 -110 12 -120" stroke={INK} strokeWidth={3} fill="none" />
        </>
      ) : (
        <>
          <circle cx={-14} cy={-134} r={5} fill={INK} />
          <circle cx={14} cy={-134} r={5} fill={INK} />
          <line x1={-8} y1={-120} x2={8} y2={-120} stroke={INK} strokeWidth={3} />
        </>
      )}
      {/* arms: simple segments ending in circular (fingerless) hands */}
      <g transform={`rotate(${armL})`}>
        <line x1={-34} y1={-70} x2={-70} y2={-20} stroke={NAVY} strokeWidth={12} strokeLinecap="round" />
        <circle cx={-70} cy={-20} r={14} fill={TURQ} stroke={INK} strokeWidth={3} />
      </g>
      <g transform={`rotate(${armR})`}>
        <line x1={34} y1={-70} x2={70} y2={-20} stroke={NAVY} strokeWidth={12} strokeLinecap="round" />
        <circle cx={70} cy={-20} r={14} fill={TURQ} stroke={INK} strokeWidth={3} />
      </g>
      {/* legs */}
      <line x1={-16} y1={20} x2={-22} y2={78} stroke={NAVY} strokeWidth={14} strokeLinecap="round" />
      <line x1={16} y1={20} x2={22} y2={78} stroke={NAVY} strokeWidth={14} strokeLinecap="round" />
      <ellipse cx={-24} cy={84} rx={16} ry={6} fill={INK} />
      <ellipse cx={24} cy={84} rx={16} ry={6} fill={INK} />
    </g>
  );
};

// ---- helpers for drawing ground cutaway (vertical cross-section)
const GroundCutaway: React.FC<{ t: number; depth?: number }> = ({ t, depth = 1 }) => {
  const layers = [
    { y: 0, h: 260, fill: '#8B6F47', label: 'topsoil' },
    { y: 260, h: 200, fill: '#6B5233', label: 'clay' },
    { y: 460, h: 260, fill: '#4A3A2A', label: 'rock' },
    { y: 720, h: 400, fill: '#2E2418', label: 'deep rock' },
  ];
  return (
    <g>
      {layers.map((l, i) => (
        <rect key={i} x={0} y={l.y} width={1080} height={l.h} fill={l.fill} />
      ))}
      {/* surface line */}
      <line x1={0} y1={0} x2={1080} y2={0} stroke={INK} strokeWidth={3} />
      {/* grass tufts */}
      {Array.from({ length: 14 }).map((_, i) => (
        <path key={i} d={`M ${60 + i * 78} 0 Q ${72 + i * 78} -18 ${84 + i * 78} 0`} fill="#5FA35F" stroke="#3F7A3F" strokeWidth={2} />
      ))}
    </g>
  );
};

// ---------- S1: hook
export const S1: React.FC<ShotProps> = ({ t }) => {
  const dig = clamp(t / 18);
  return (
    <g>
      <rect x={0} y={0} width={1080} height={1920} fill={CREAM} />
      <GroundCutaway t={t} />
      {/* character digging */}
      <Char x={540} y={200 - dig * 60} s={1.1} armL={-60 + dig * 40} armR={60 - dig * 40} face="smile" />
      {/* shovel */}
      <g transform={`translate(620 ${140 - dig * 60}) rotate(${10 + dig * 30})`}>
        <rect x={-4} y={0} width={8} height={90} fill={INK} />
        <path d="M -18 90 L 18 90 L 14 118 L -14 118 Z" fill={TURQ} stroke={INK} strokeWidth={3} />
      </g>
      {/* dirt pile */}
      <ellipse cx={420} cy={120} rx={90} ry={30} fill="#6B5233" />
      <ellipse cx={420} cy={110} rx={70} ry={22} fill="#8B6F47" />
      {/* title */}
      <g transform={`translate(540 1500) scale(${backOut(clamp((t - 6) / 10))})`}>
        <text textAnchor="middle" y={0} fontFamily={FONT.title} fontSize={74} fill={NAVY} fontWeight={800}>{'NUCLEAR'}</text>
        <text textAnchor="middle" y={86} fontFamily={FONT.title} fontSize={74} fill={ORANGE} fontWeight={800}>{'SHELTER?'}</text>
      </g>
      <Glow x={540} y={1540} r={420} o={0.18} />
    </g>
  );
};

// ---------- S2: cutaway — hole becomes shelter
export const S2: React.FC<ShotProps> = ({ t }) => {
  const grow = easeOut(clamp(t / 22));
  const shelterW = 260 + grow * 120;
  const shelterH = 200 + grow * 80;
  const cx = 540;
  const cy = 520;
  return (
    <g>
      <rect x={0} y={0} width={1080} height={1920} fill={CREAM} />
      <GroundCutaway t={t} />
      {/* cutaway hole */}
      <rect x={cx - shelterW / 2} y={cy - shelterH / 2} width={shelterW} height={shelterH} fill="#1A2332" rx={12} />
      {/* shelter interior glow */}
      <rect x={cx - shelterW / 2 + 12} y={cy - shelterH / 2 + 12} width={shelterW - 24} height={shelterH - 24} fill={YELLOW} opacity={0.18 + grow * 0.1} rx={8} />
      {/* walls highlight */}
      <rect x={cx - shelterW / 2} y={cy - shelterH / 2} width={shelterW} height={shelterH} fill="none" stroke={TURQ} strokeWidth={5} rx={12} />
      {/* character inside */}
      <Char x={cx} y={cy + 20} s={0.7} face="smile" armL={-20} armR={20} />
      {/* depth markers */}
      <g opacity={0.7}>
        <line x1={cx + shelterW / 2 + 20} y1={cy - shelterH / 2} x2={cx + shelterW / 2 + 20} y2={cy + shelterH / 2} stroke={INK} strokeWidth={2} />
        <text x={cx + shelterW / 2 + 34} y={cy} fontFamily={FONT.ui} fontSize={22} fill={INK}>{'~3 m'}</text>
      </g>
      <text x={540} y={1780} textAnchor="middle" fontFamily={FONT.ui} fontSize={30} fill={NAVY} fontWeight={700}>{'ملجأ "بسيط" تحت الأرض'}</text>
    </g>
  );
};

// ---------- S3: blast — translucent expanding rings + heat flash
export const S3: React.FC<ShotProps> = ({ t }) => {
  const rings = [0, 1, 2, 3].map((i) => {
    const r = 60 + (t * 18 + i * 90) % 720;
    const op = Math.max(0, 0.55 - r / 900);
    return { r, op, i };
  });
  const heat = easeOut(clamp(t / 12));
  return (
    <g>
      <rect x={0} y={0} width={1080} height={1920} fill={NAVY} />
      {/* ground cutaway small at bottom */}
      <g transform="translate(0 1380) scale(1 0.6)">
        <GroundCutaway t={t} />
      </g>
      {/* heat flash */}
      <rect x={0} y={0} width={1080} height={1920} fill={ORANGE} opacity={0.18 * heat} />
      <Glow x={540} y={700} r={600 + heat * 200} o={0.35 * heat} />
      {/* blast rings */}
      {rings.map((rg, i) => (
        <circle key={i} cx={540} cy={700} r={rg.r} fill="none" stroke={ORANGE} strokeWidth={6} opacity={rg.op} />
      ))}
      {/* mushroom cloud hint */}
      <g opacity={0.85}>
        <ellipse cx={540} cy={520} rx={120} ry={70} fill={VIOLET} opacity={0.5} />
        <rect x={520} y={560} width={40} height={120} fill={VIOLET} opacity={0.4} />
      </g>
      {/* character reacts */}
      <Char x={540} y={1500} s={1.0} face="surprised" armL={-110} armR={110} />
      <text x={540} y={260} textAnchor="middle" fontFamily={FONT.ui} fontSize={34} fill={CREAM} fontWeight={700}>{'موجة ضغط + حرارة + غبار مشع'}</text>
    </g>
  );
};

// ---------- S4: principle 1 — distance
export const S4: React.FC<ShotProps> = ({ t }) => {
  const p = easeOut(clamp(t / 20));
  return (
    <g>
      <rect x={0} y={0} width={1080} height={1920} fill={CREAM} />
      <text x={540} y={160} textAnchor="middle" fontFamily={FONT.ui} fontSize={40} fill={NAVY} fontWeight={800}>{'1. المسافة'}</text>
      {/* concentric damage rings */}
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={540} cy={960} r={260 + i * 180} fill="none" stroke={ORANGE} strokeWidth={4} opacity={0.5 - i * 0.12} />
      ))}
      {/* shelter dot moving outward */}
      <circle cx={540 + p * 0} cy={960 - 120 - p * 260} r={26} fill={TURQ} stroke={INK} strokeWidth={3} />
      <line x1={540} y1={960} x2={540} y2={960 - 120 - p * 260} stroke={INK} strokeWidth={2} strokeDasharray="6 6" />
      <text x={540} y={960 + 360} textAnchor="middle" fontFamily={FONT.ui} fontSize={26} fill={NAVY}>{'كل كيلومتر أبعد، الضغط يقل'}</text>
      {/* small legend */}
      <g transform="translate(120 1720)">
        <circle cx={0} cy={0} r={12} fill={ORANGE} />
        <text x={24} y={6} fontFamily={FONT.ui} fontSize={22} fill={INK}>{'منطقة الضرر'}</text>
      </g>
      <g transform="translate(120 1770)">
        <circle cx={0} cy={0} r={12} fill={TURQ} />
        <text x={24} y={6} fontFamily={FONT.ui} fontSize={22} fill={INK}>{'الملجأ'}</text>
      </g>
    </g>
  );
};

// ---------- S5: principle 2 — mass/shielding
export const S5: React.FC<ShotProps> = ({ t }) => {
  const layers = clamp(t / 18);
  const arrowY = 600 + layers * 0;
  return (
    <g>
      <rect x={0} y={0} width={1080} height={1920} fill={CREAM} />
      <text x={540} y={160} textAnchor="middle" fontFamily={FONT.ui} fontSize={40} fill={NAVY} fontWeight={800}>{'2. الكتلة (الدرع)'}</text>
      {/* wall layers */}
      <rect x={200} y={420} width={680} height={60} fill="#8B6F47" rx={6} />
      <rect x={200} y={480} width={680} height={60} fill="#6B5233" rx={6} />
      <rect x={200} y={540} width={680} height={60} fill="#4A3A2A" rx={6} />
      <rect x={200} y={600} width={680} height={60} fill="#2E2418" rx={6} />
      <text x={540} y={720} textAnchor="middle" fontFamily={FONT.ui} fontSize={24} fill={INK}>{'~3 أقدام تراب ≈ حماية قوية'}</text>
      {/* radiation arrows from top, blocked */}
      {[0, 1, 2, 3, 4].map((i) => {
        const ax = 260 + i * 140;
        const progress = clamp((t - i * 2) / 14);
        const hitY = 420 + progress * 180;
        const blocked = progress > 0.35;
        return (
          <g key={i}>
            <line x1={ax} y1={260} x2={ax} y2={Math.min(hitY, 420)} stroke={VIOLET} strokeWidth={4} opacity={0.8} />
            {blocked && <circle cx={ax} cy={420} r={8} fill={VIOLET} opacity={0.9} />}
            {!blocked && <circle cx={ax} cy={hitY} r={6} fill={VIOLET} opacity={0.9} />}
          </g>
        );
      })}
      {/* shelter interior */}
      <rect x={240} y={760} width={600} height={220} fill={TURQ} opacity={0.15} rx={12} stroke={TURQ} strokeWidth={3} />
      <Char x={540} y={880} s={0.7} face="smile" />
      <text x={540} y={1040} textAnchor="middle" fontFamily={FONT.ui} fontSize={26} fill={NAVY}>{'الإشعاع يُمتص بالكتلة'}</text>
    </g>
  );
};

// ---------- S6: principle 3 — protected entrance
export const S6: React.FC<ShotProps> = ({ t }) => {
  const p = easeOut(clamp(t / 22));
  return (
    <g>
      <rect x={0} y={0} width={1080} height={1920} fill={CREAM} />
      <text x={540} y={160} textAnchor="middle" fontFamily={FONT.ui} fontSize={40} fill={NAVY} fontWeight={800}>{'3. المدخل المحمي'}</text>
      {/* shelter box */}
      <rect x={300} y={700} width={480} height={360} fill={NAVY} opacity={0.12} rx={14} stroke={NAVY} strokeWidth={3} />
      {/* entrance corridor with two right-angle turns */}
      <path d="M 300 960 L 180 960 L 180 760 L 300 760" fill="none" stroke={TURQ} strokeWidth={26} strokeLinecap="round" strokeLinejoin="round" />
      {/* radiation path trying to get in, scatters */}
      <g opacity={0.8}>
        <path d={`M 120 960 Q 200 960 240 ${960 - p * 40}`} stroke={VIOLET} strokeWidth={3} fill="none" strokeDasharray="6 4" />
        <circle cx={240} cy={960 - p * 40} r={7} fill={VIOLET} />
      </g>
      <text x={180} y={700} textAnchor="middle" fontFamily={FONT.ui} fontSize={22} fill={INK}>{'دورتان'}</text>
      <text x={540} y={1120} textAnchor="middle" fontFamily={FONT.ui} fontSize={24} fill={NAVY}>{'الإشعاع يتشتت around corners'}</text>
      <text x={540} y={1160} textAnchor="middle" fontFamily={FONT.ui} fontSize={20} fill={INK} opacity={0.7}>{'لا تغيّر تخطيط المدخل'}</text>
    </g>
  );
};

// ---------- S7: principle 4 — ventilation
export const S7: React.FC<ShotProps> = ({ t }) => {
  const fan = t * 0.4;
  return (
    <g>
      <rect x={0} y={0} width={1080} height={1920} fill={CREAM} />
      <text x={540} y={160} textAnchor="middle" fontFamily={FONT.ui} fontSize={40} fill={NAVY} fontWeight={800}>{'4. التهوية والفلترة'}</text>
      {/* shelter box */}
      <rect x={260} y={700} width={560} height={400} fill={NAVY} opacity={0.1} rx={14} stroke={NAVY} strokeWidth={3} />
      {/* fan */}
      <g transform={`translate(820 780) rotate(${fan * 60})`}>
        <circle cx={0} cy={0} r={26} fill={TURQ} stroke={INK} strokeWidth={3} />
        {[0, 1, 2].map((i) => (
          <rect key={i} x={-6} y={-40} width={12} height={28} fill={INK} transform={`rotate(${i * 120})`} rx={3} />
        ))}
      </g>
      {/* air flow particles */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const px = 260 + (t * 22 + i * 60) % 560;
        const py = 760 + (i % 3) * 40;
        return <circle key={i} cx={px} cy={py} r={5} fill={TURQ} opacity={0.7} />;
      })}
      {/* contaminated outside particles blocked */}
      {[0, 1, 2].map((i) => {
        const py = 620 + i * 30;
        return <circle key={i} cx={540} cy={py} r={6} fill={VIOLET} opacity={0.8} />;
      })}
      <line x1={540} y1={560} x2={540} y2={700} stroke={VIOLET} strokeWidth={2} strokeDasharray="4 4" opacity={0.6} />
      <text x={540} y={1180} textAnchor="middle" fontFamily={FONT.ui} fontSize={24} fill={NAVY}>{'فلترة الهواء، وبدونها اختناق'}</text>
      <text x={540} y={1220} textAnchor="middle" fontFamily={FONT.ui} fontSize={20} fill={INK} opacity={0.7}>{'5 ft³/min per person'}</text>
    </g>
  );
};

// ---------- S8: principle 5 — supplies + time decay
export const S8: React.FC<ShotProps> = ({ t }) => {
  const p = clamp(t / 28);
  // decay curve: y = 100 * exp-ish
  const decay = Math.max(0.05, 1 - p * 0.82);
  return (
    <g>
      <rect x={0} y={0} width={1080} height={1920} fill={CREAM} />
      <text x={540} y={160} textAnchor="middle" fontFamily={FONT.ui} fontSize={40} fill={NAVY} fontWeight={800}>{'5. الوقت والمؤن'}</text>
      {/* decay curve */}
      <path d={`M 160 600 Q 320 ${600 + (1 - 0.5) * 260} 540 ${600 + (1 - decay) * 260} T 920 ${600 + (1 - 0.18) * 260}`} fill="none" stroke={VIOLET} strokeWidth={5} />
      <circle cx={160} cy={600} r={8} fill={VIOLET} />
      <circle cx={920} cy={600 + (1 - 0.18) * 260} r={8} fill={VIOLET} />
      <text x={160} y={570} textAnchor="middle" fontFamily={FONT.ui} fontSize={20} fill={INK}>{'0 h'}</text>
      <text x={920} y={570 + (1 - 0.18) * 260} textAnchor="middle" fontFamily={FONT.ui} fontSize={20} fill={INK}>{'24 h'}</text>
      <text x={540} y={920} textAnchor="middle" fontFamily={FONT.ui} fontSize={26} fill={NAVY}>{'80% من الإشعاع يضمحل خلال 24 ساعة'}</text>
      {/* supplies icons */}
      <g transform="translate(260 1200)">
        <rect x={-40} y={-30} width={80} height={60} fill={TURQ} rx={8} stroke={INK} strokeWidth={3} />
        <text x={0} y={8} textAnchor="middle" fontFamily={FONT.ui} fontSize={20} fill={INK}>{'ماء'}</text>
      </g>
      <g transform="translate(540 1200)">
        <rect x={-40} y={-30} width={80} height={60} fill={YELLOW} rx={8} stroke={INK} strokeWidth={3} />
        <text x={0} y={8} textAnchor="middle" fontFamily={FONT.ui} fontSize={20} fill={INK}>{'طعام'}</text>
      </g>
      <g transform="translate(820 1200)">
        <rect x={-40} y={-30} width={80} height={60} fill={ORANGE} rx={8} stroke={INK} strokeWidth={3} />
        <text x={0} y={8} textAnchor="middle" fontFamily={FONT.ui} fontSize={20} fill={INK}>{'راديو'}</text>
      </g>
      <text x={540} y={1320} textAnchor="middle" fontFamily={FONT.ui} fontSize={22} fill={INK} opacity={0.7}>{'خطة لـ 24–48 ساعة'}</text>
    </g>
  );
};

// ---------- S9: conclusion
export const S9: React.FC<ShotProps> = ({ t }) => {
  const p = backOut(clamp((t - 4) / 12));
  return (
    <g>
      <rect x={0} y={0} width={1080} height={1920} fill={NAVY} />
      <Glow x={540} y={960} r={500} o={0.18} />
      <g transform={`translate(540 700) scale(${p})`}>
        <text textAnchor="middle" y={0} fontFamily={FONT.title} fontSize={46} fill={CREAM} fontWeight={800}>{'تحت الأرض قد يخفف'}</text>
        <text textAnchor="middle" y={70} fontFamily={FONT.title} fontSize={46} fill={ORANGE} fontWeight={800}>{'لكن لا يضمن'}</text>
      </g>
      <g transform={`translate(540 980) scale(${p})`}>
        <text textAnchor="middle" y={0} fontFamily={FONT.ui} fontSize={30} fill={TURQ} fontWeight={700}>{'القاعدة:'}</text>
        <text textAnchor="middle" y={46} fontFamily={FONT.ui} fontSize={28} fill={CREAM}>{'ادخل · ابقَ · تابع التعليمات'}</text>
      </g>
      <Char x={540} y={1420} s={1.0} face="neutral" armL={-30} armR={30} />
      <text x={540} y={1760} textAnchor="middle" fontFamily={FONT.ui} fontSize={20} fill={CREAM} opacity={0.6}>{'Ready.gov · CDC · FEMA · ICRP'}</text>
    </g>
  );
};
