import { useState, useRef, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Music, BookOpen, Radio, Lightbulb, ChevronRight,
  Award, Play, Square, Minus, Plus
} from 'lucide-react';
import './Learn.css';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS & TYPES
// ═══════════════════════════════════════════════════════════════════════════════

type Instrument = 'harmonium';
type Level = 'all' | 'beginner' | 'intermediate' | 'advanced';
type Tab = 'bols' | 'lehra';

const BASE_SA_FREQ = 261.63; // C4 Sa
const NOTE_SEMITONES: Record<string, number> = {
  Pa_: -5,
  Dha_k_: -4,
  Dha_: -3,
  Ni_k_: -2,
  Ni_: -1,
  Sa: 0,
  Re_k: 1,
  Re: 2,
  Ga_k: 3,
  Ga: 4,
  Ma: 5,
  Ma_t: 6,
  Pa: 7,
  Dha_k: 8,
  Dha: 9,
  Ni_k: 10,
  Ni: 11,
  SA: 12,
  RE_k: 13,
  RE: 14,
  GA_k: 15,
  GA: 16,
  MA: 17,
  MA_t: 18,
  PA: 19,
  _: -100 // rest
};

function getNoteFrequency(noteName: string): number {
  const semitoneOffset = NOTE_SEMITONES[noteName];
  if (semitoneOffset === undefined || semitoneOffset === -100) return 0;
  return BASE_SA_FREQ * Math.pow(2, semitoneOffset / 12);
}

// ═══════════════════════════════════════════════════════════════════════════════
// WEB AUDIO HELPERS & SYNTHESIZERS
// ═══════════════════════════════════════════════════════════════════════════════

function chain(nodes: AudioNode[]): void {
  for (let i = 0; i < nodes.length - 1; i++) {
    nodes[i].connect(nodes[i + 1]);
  }
}




function synthHarmonium(
  ctx: AudioContext, freq: number,
  t0: number, dur: number, vol: number, destNode: AudioNode = ctx.destination
): void {
  const master = ctx.createGain();
  master.connect(destNode);

  // Bellows low-pass filter (warmer tone, air pressure controlled)
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(800, t0);
  lp.frequency.exponentialRampToValueAtTime(2400, t0 + 0.08); // Bellows attack swell
  lp.frequency.exponentialRampToValueAtTime(1400, t0 + dur);   // Bellows release
  lp.connect(master);

  // Nasal reed formant filter (boosts 1.3kHz - 1.8kHz region for reedy character)
  const reedFilter = ctx.createBiquadFilter();
  reedFilter.type = 'peaking';
  reedFilter.frequency.value = 1500;
  reedFilter.Q.value = 2.2;
  reedFilter.gain.value = 9; // Rich harmonium bite
  reedFilter.connect(lp);

  // Bellows pressure LFO (tremolo effect)
  const bellowsLFO = ctx.createOscillator();
  const bellowsGain = ctx.createGain();
  bellowsLFO.frequency.value = 5.2; // 5.2Hz bellows pumping
  bellowsGain.gain.value = 0.06;
  bellowsLFO.connect(bellowsGain);
  bellowsGain.connect(master.gain);
  bellowsLFO.start(t0);
  bellowsLFO.stop(t0 + dur + 0.1);

  // Key click sound (mechanical key press noise)
  const clickBuf = ctx.createBuffer(1, ctx.sampleRate * 0.005, ctx.sampleRate);
  const clickData = clickBuf.getChannelData(0);
  for (let i = 0; i < clickBuf.length; i++) {
    clickData[i] = Math.random() * 2 - 1;
  }
  const clickNode = ctx.createBufferSource();
  clickNode.buffer = clickBuf;
  const clickFilter = ctx.createBiquadFilter();
  clickFilter.type = 'bandpass';
  clickFilter.frequency.value = 2800;
  const clickGainNode = ctx.createGain();
  clickGainNode.gain.setValueAtTime(vol * 0.05, t0);
  clickGainNode.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.005);
  chain([clickNode, clickFilter, clickGainNode, master]);
  clickNode.start(t0);

  // Male reed: Fundamental sawtooth detuned flat
  const oscMale = ctx.createOscillator();
  const gMale = ctx.createGain();
  oscMale.type = 'sawtooth';
  oscMale.frequency.value = freq;
  oscMale.detune.value = -12; // detuned for beating warmth
  gMale.gain.value = 0.38;

  // Female reed: Octave higher sawtooth detuned sharp
  const oscFemale = ctx.createOscillator();
  const gFemale = ctx.createGain();
  oscFemale.type = 'sawtooth';
  oscFemale.frequency.value = freq * 2;
  oscFemale.detune.value = 12; // detuned for beating warmth
  gFemale.gain.value = 0.22;

  // Sub-reed (Bass): Octave lower triangle for body warmth
  const oscBass = ctx.createOscillator();
  const gBass = ctx.createGain();
  oscBass.type = 'triangle';
  oscBass.frequency.value = freq * 0.5;
  gBass.gain.value = 0.30;

  chain([oscMale, gMale, reedFilter]);
  chain([oscFemale, gFemale, reedFilter]);
  chain([oscBass, gBass, reedFilter]);

  [oscMale, oscFemale, oscBass].forEach(o => {
    o.start(t0);
    o.stop(t0 + dur + 0.08);
  });

  // Soft envelope for air pressure buildup and release
  master.gain.setValueAtTime(0, t0);
  master.gain.linearRampToValueAtTime(vol * 0.85, t0 + 0.04);
  master.gain.setValueAtTime(vol, t0 + dur - 0.05);
  master.gain.linearRampToValueAtTime(0, t0 + dur + 0.03);
}

function synthNote(
  ctx: AudioContext,
  freq: number,
  t0: number,
  dur: number,
  vol: number,
  _instrument: Instrument,
  destNode: AudioNode = ctx.destination
): void {
  synthHarmonium(ctx, freq, t0, dur, vol, destNode);
}

// ═══════════════════════════════════════════════════════════════════════════════
// DATA DEFINITIONS (BOLS & LEHRAS)
// ═══════════════════════════════════════════════════════════════════════════════

interface TaalLehra {
  id: string;
  taal: string;
  subtitle: string;
  beats: number;
  vibhags: number[];
  sam: number[];
  khali: number[];
  notes: string[];
  defaultBpm: number;
  presets: { label: string; bpm: number }[];
  desc: string;
  theka: string;
}

const lehraData: TaalLehra[] = [
  {
    id: 'teen-taal',
    taal: 'Teen Taal',
    subtitle: '16 beats — 4+4+4+4',
    beats: 16,
    vibhags: [4, 4, 4, 4],
    sam: [0],
    khali: [8],
    notes: ['Pa','Pa','Ga','Ma', 'Pa','Pa','Dha','Ni', 'SA','Dha','Pa','Ma', 'Ga','Re','Sa','_'],
    defaultBpm: 60,
    presets: [{ label: 'Vilambit', bpm: 55 }, { label: 'Madhya', bpm: 85 }, { label: 'Drut', bpm: 120 }],
    desc: 'The most widely used taal in Hindustani classical music. Use for Kaida, Rela, Tihai and all levels.',
    theka: 'Dha Dhin Dhin Dha | Dha Dhin Dhin Dha | Dha Tin Tin Ta | Tete Dhin Dhin Dha',
  },
  {
    id: 'keherwa',
    taal: 'Keherwa',
    subtitle: '8 beats — 4+4',
    beats: 8,
    vibhags: [4, 4],
    sam: [0],
    khali: [4],
    notes: ['Sa', 'Re', 'Ga', 'Ma', 'Pa', 'Ma', 'Ga', 'Re'],
    defaultBpm: 80,
    presets: [{ label: 'Slow', bpm: 60 }, { label: 'Medium', bpm: 80 }, { label: 'Fast', bpm: 110 }],
    desc: 'Very popular in semi-classical, ghazals, folk and light music. 8 beats divided equally.',
    theka: 'Dha Ge Na Tin | Na Ke Dhin Na',
  },
  {
    id: 'dadra',
    taal: 'Dadra',
    subtitle: '6 beats — 3+3',
    beats: 6,
    vibhags: [3, 3],
    sam: [0],
    khali: [3],
    notes: ['Sa', 'Ga', 'Ma', 'Pa', 'Ma', 'Ga'],
    defaultBpm: 90,
    presets: [{ label: 'Slow', bpm: 72 }, { label: 'Medium', bpm: 90 }, { label: 'Fast', bpm: 130 }],
    desc: 'A light classical 6-beat cycle. Dominates thumri, dadra songs, and folk music.',
    theka: 'Dha Dhin Na | Dha Tin Na',
  },
  {
    id: 'rupak',
    taal: 'Rupak Taal',
    subtitle: '7 beats — 3+2+2',
    beats: 7,
    vibhags: [3, 2, 2],
    sam: [0],
    khali: [0],
    notes: ['Ga', 'Re', 'Ga', 'Ma', 'Pa', 'Dha', 'Ni'],
    defaultBpm: 75,
    presets: [{ label: 'Slow', bpm: 60 }, { label: 'Medium', bpm: 75 }, { label: 'Fast', bpm: 100 }],
    desc: 'Unique 7-beat cycle where the Sam is also the Khali (empty beat). Used in classical vocal and instrumental.',
    theka: 'Tin Tin Na | Dhin Na | Dhin Na',
  },
  {
    id: 'jhap-taal',
    taal: 'Jhap Taal',
    subtitle: '10 beats — 2+3+2+3',
    beats: 10,
    vibhags: [2, 3, 2, 3],
    sam: [0],
    khali: [5],
    notes: ['Sa', 'Re', 'Ga', 'Ma', 'Pa', 'Ma', 'Ga', 'Re', 'Sa', 'Ni_'],
    defaultBpm: 70,
    presets: [{ label: 'Slow', bpm: 55 }, { label: 'Medium', bpm: 70 }, { label: 'Fast', bpm: 100 }],
    desc: 'Energetic 10-beat cycle with unequal vibhags (2+3+2+3). Used in classical ragas and Kathak.',
    theka: 'Dhi Na | Dhi Dhi Na | Ti Na | Dhi Dhi Na',
  },
  {
    id: 'ek-taal',
    taal: 'Ek Taal',
    subtitle: '12 beats — 2+2+2+2+2+2',
    beats: 12,
    vibhags: [2, 2, 2, 2, 2, 2],
    sam: [0],
    khali: [4, 8],
    notes: ['Sa', 'Re', 'Ga', 'Ma', 'Pa', 'Dha', 'Ni', 'SA', 'Dha', 'Pa', 'Ma', 'Ga'],
    defaultBpm: 50,
    presets: [{ label: 'Slow', bpm: 40 }, { label: 'Medium', bpm: 55 }, { label: 'Fast', bpm: 80 }],
    desc: '12-beat taal with six equal vibhags. Used for Vilambit and Madhya Khayal in classical vocal music.',
    theka: 'Dhin Dhin | DhageTeTeKe | Tin Tin | DhageTeTeKe | Dhi Dhi | DhageTeTeKe',
  }
];

const bolsData = [
  {
    id: 'basic-strokes',
    level: 'beginner' as const,
    name: 'Basic Single Bols',
    taal: 'Fundamental strokes',
    desc: 'These are the fundamental syllables of Tabla — each representing a unique finger placement and hand movement.',
    notation: [
      { label: 'Dha', bols: 'Right hand index finger strike on boundary (Kinara) + Left hand bass ring (Ghe)' },
      { label: 'Ta / Na', bols: 'Right hand index finger sharp strike on Kinara' },
      { label: 'Tin', bols: 'Right hand index finger strike on inner circle (Siyah boundary) with resonance' },
      { label: 'Ge / Ghe', bols: 'Left hand heel press and strike with middle/ring fingers' },
      { label: 'Ke / Ka', bols: 'Left hand flat palm strike (non-resonant closed stroke)' },
      { label: 'Ta / Te', bols: 'Right hand middle/ring finger strike center of Siyah (closed stroke)' },
    ],
    tip: 'Ensure clean distinction between open (resonant like Dha, Tin, Ge) and closed (non-resonant like Ta, Ke) strokes.',
  },
  {
    id: 'teen-taal-theka',
    level: 'beginner' as const,
    name: 'Teen Taal — Theka',
    taal: 'Teen Taal (16 beats)',
    desc: 'The basic 16-beat cycle divided into 4 equal vibhags (4+4+4+4). The foundation of Hindustani rhythm.',
    notation: [
      { label: 'Vibhag 1 — Sam (X)', bols: 'Dha  Dhin  Dhin  Dha' },
      { label: 'Vibhag 2 — 2', bols: 'Dha  Dhin  Dhin  Dha' },
      { label: 'Vibhag 3 — Khali (0)', bols: 'Dha  Tin  Tin  Ta' },
      { label: 'Vibhag 4 — 3', bols: 'Ta  Dhin  Dhin  Dha' },
    ],
    tip: 'Clap on beat 1 (Sam), beat 5 (2nd tali), beat 13 (3rd tali). Wave your hand outward on beat 9 (Khali).',
  },
  {
    id: 'keherwa-theka',
    level: 'beginner' as const,
    name: 'Keherwa — Theka',
    taal: 'Keherwa Taal (8 beats)',
    desc: 'An 8-beat cycle (4+4) extensively used in light music, bhajans, ghazals and folk genres.',
    notation: [
      { label: 'Vibhag 1 — Sam (X)', bols: 'Dha  Ge  Na  Tin' },
      { label: 'Vibhag 2 — Khali (0)', bols: 'Na  Ke  Dhin  Na' },
    ],
    tip: 'The bounce on "Ge" and closed character of "Ke" creates the signature lilt of Keherwa.',
  },
  {
    id: 'dadra-theka',
    level: 'beginner' as const,
    name: 'Dadra — Theka',
    taal: 'Dadra Taal (6 beats)',
    desc: 'A breezy 6-beat cycle (3+3) common in ghazals, thumris, and folk songs.',
    notation: [
      { label: 'Vibhag 1 — Sam (X)', bols: 'Dha  Dhin  Na' },
      { label: 'Vibhag 2 — Khali (0)', bols: 'Dha  Tin  Na' },
    ],
    tip: 'Emphasize the first beat of each group to maintain the characteristic waltz-like syncopation.',
  },
  {
    id: 'jhap-theka',
    level: 'intermediate' as const,
    name: 'Jhap Taal — Theka',
    taal: 'Jhap Taal (10 beats)',
    desc: 'A 10-beat cycle in 4 unequal vibhags: 2+3+2+3. Energetic and forward-driving.',
    notation: [
      { label: 'Vibhag 1 — Sam (X)', bols: 'Dhi  Na' },
      { label: 'Vibhag 2 — 2', bols: 'Dhi  Dhi  Na' },
      { label: 'Vibhag 3 — Khali (0)', bols: 'Ti   Na' },
      { label: 'Vibhag 4 — 3', bols: 'Dhi  Dhi  Na' },
    ],
    tip: 'The 2+3+2+3 grouping is the key. Clap on vibhags 1, 2, 4 — wave on vibhag 3 (Khali).',
  },
  {
    id: 'ek-taal-theka',
    level: 'intermediate' as const,
    name: 'Ek Taal — Theka',
    taal: 'Ek Taal (12 beats)',
    desc: 'A 12-beat cycle in 6 equal vibhags of 2 matras. Used for Vilambit and Madhya classical compositions.',
    notation: [
      { label: 'Vibhag 1 — Sam (X)', bols: 'Dhin  Dhin' },
      { label: 'Vibhag 2 — 2', bols: 'DhageTeTeKe' },
      { label: 'Vibhag 3 — Khali (0)', bols: 'Tin  Tin' },
      { label: 'Vibhag 4 — 4', bols: 'DhageTeTeKe' },
      { label: 'Vibhag 5 — 3', bols: 'Dhi  Dhi' },
      { label: 'Vibhag 6 — 4', bols: 'DhageTeTeKe' },
    ],
    tip: '"DhageTeTeKe" is a compound bol — practise it as one fluid phrase before applying to the full cycle.',
  },
  {
    id: 'basic-kaida',
    level: 'intermediate' as const,
    name: 'Basic Kaida — Teen Taal',
    taal: 'Teen Taal (16 beats)',
    desc: 'A Kaida is a structured theme followed by systematic variations (Paltas). Every variation must resolve to the theme.',
    notation: [
      { label: 'Mukhada (Theme)', bols: 'Dha TirKiTe  Dha TirKiTe  DhaGe NaTi  NaKe NaTin' },
      { label: 'Palta 1', bols: 'Ge  TirKiTe  Ge  TirKiTe  GeNa TiNa  NaKe NaTin' },
      { label: 'Return', bols: 'Dha TirKiTe  Dha TirKiTe  DhaGe NaTi  NaKe NaTin' },
    ],
    tip: 'Focus on symmetrical patterns. The second half of the variation mimics the first but changes resonant bols to closed ones.',
  },
  {
    id: 'rela',
    level: 'advanced' as const,
    name: 'Rela — Teen Taal',
    taal: 'Teen Taal (16 beats)',
    desc: 'Rela is a rapid, cascading composition using small, light strokes that flow into each other like running water.',
    notation: [
      { label: 'Basic Rela (4-beat unit)', bols: 'Tete  Gege  Tete  Gege' },
      { label: 'Extended Rela', bols: 'DhaTete GeGeTe  TeTe KiTe  TeTe GeDha  GeTeTeGe TeTe' },
    ],
    tip: 'Loose wrists and light finger contact are required. Clarity of beats is always more important than raw speed.',
  },
  {
    id: 'tihai',
    level: 'advanced' as const,
    name: 'Tihai — Teen Taal',
    taal: 'Teen Taal (16 beats)',
    desc: 'A Tihai is a mathematical phrase repeated exactly three times so that the final stroke lands precisely on the Sam (Beat 1).',
    notation: [
      { label: 'Bedam Tihai', bols: 'DhaTiTe  |  DhaTiTe  |  DhaTiTe  +  Sam' },
      { label: 'Dam Tihai (with gaps)', bols: 'DhaTiTeDha  —  |  DhaTiTeDha  —  |  DhaTiTeDha  +  Sam' },
      { label: 'Formula', bols: '(Tihai length A - 3) + start beat = Sam position' },
    ],
    tip: 'Ensure that the gaps (Dams) in the three repetitions are exactly equal in duration.',
  },
];

const levelFilters = [
  { value: 'all' as Level,          label: 'All Levels' },
  { value: 'beginner' as Level,     label: 'Beginner' },
  { value: 'intermediate' as Level, label: 'Intermediate' },
  { value: 'advanced' as Level,     label: 'Advanced' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// LEHRA PLAYER CUSTOM HOOK
// ═══════════════════════════════════════════════════════════════════════════════

function useLehraPlayer() {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [currentBeat, setCurrentBeat] = useState<number>(-1);

  const ctxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const nextTimeRef = useRef<number>(0);
  const beatRef = useRef<number>(0);
  const seqRef = useRef<string[]>([]);
  const samRef = useRef<number[]>([]);
  const khaliRef = useRef<number[]>([]);
  const bpmRef = useRef<number>(60);
  const instrumentRef = useRef<Instrument>('harmonium');

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const tick = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    while (nextTimeRef.current < ctx.currentTime + 0.13) {
      const beat = beatRef.current;
      const note = seqRef.current[beat];
      const bps = 60 / bpmRef.current;
      const isSam = samRef.current.includes(beat);
      const isKhali = khaliRef.current.includes(beat) && !isSam;
      const playAt = nextTimeRef.current;

      const freq = getNoteFrequency(note);
      if (freq > 0) {
        const vol = isSam ? 0.65 : isKhali ? 0.35 : 0.5;
        const dur = bps * 0.88;
        synthNote(ctx, freq, playAt, dur, vol, instrumentRef.current, ctx.destination);
      }

      const uiDelay = Math.max(0, (playAt - ctx.currentTime) * 1000);
      setTimeout(() => setCurrentBeat(beat), uiDelay);

      nextTimeRef.current += bps;
      beatRef.current = (beat + 1) % seqRef.current.length;
    }
  }, []);

  const play = useCallback((taal: TaalLehra, bpm: number, instrument: Instrument) => {
    clearTimer();
    if (!ctxRef.current || ctxRef.current.state === 'closed') {
      ctxRef.current = new AudioContext();
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume();
    }

    seqRef.current = taal.notes;
    samRef.current = taal.sam;
    khaliRef.current = taal.khali;
    bpmRef.current = bpm;
    instrumentRef.current = instrument;
    beatRef.current = 0;
    nextTimeRef.current = ctxRef.current.currentTime + 0.05;

    setPlayingId(taal.id);
    setCurrentBeat(-1);
    timerRef.current = setInterval(tick, 25);
  }, [clearTimer, tick]);

  const stop = useCallback(() => {
    clearTimer();
    beatRef.current = 0;
    setPlayingId(null);
    setCurrentBeat(-1);
  }, [clearTimer]);

  const updateBpm = useCallback((bpm: number) => {
    bpmRef.current = bpm;
  }, []);

  const updateInstrument = useCallback((instrument: Instrument) => {
    instrumentRef.current = instrument;
  }, []);

  useEffect(() => () => {
    clearTimer();
    ctxRef.current?.close();
  }, [clearTimer]);

  return { playingId, currentBeat, play, stop, updateBpm, updateInstrument };
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEHRA CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface LehraCardProps {
  taal: TaalLehra;
  isPlaying: boolean;
  currentBeat: number;
  onPlay: (bpm: number) => void;
  onStop: () => void;
  onBpmChange: (bpm: number) => void;
}

function LehraCard({
  taal,
  isPlaying,
  currentBeat,
  onPlay,
  onStop,
  onBpmChange
}: LehraCardProps) {
  const [bpm, setBpm] = useState(taal.defaultBpm);

  const handleBpm = (next: number) => {
    const nextBpm = Math.max(30, Math.min(200, next));
    setBpm(nextBpm);
    if (isPlaying) {
      onBpmChange(nextBpm);
    }
  };

  const handlePreset = (presetBpm: number) => {
    setBpm(presetBpm);
    if (isPlaying) {
      onBpmChange(presetBpm);
    }
  };

  let idx = 0;
  const vibhagGroups = taal.vibhags.map(size => {
    const beats = Array.from({ length: size }, (_, i) => idx + i);
    idx += size;
    return beats;
  });

  return (
    <div className={`lehra-card${isPlaying ? ' lehra-card--playing' : ''}`} id={taal.id}>
      <div className="lehra-card__header">
        <div>
          <div className="lehra-card__taal-name">{taal.taal}</div>
          <div className="lehra-card__matras">{taal.subtitle}</div>
        </div>
        <span className="lehra-card__beats-badge">{taal.beats} Matras</span>
      </div>

      {/* Beat Visualizer */}
      <div className="lehra-beats-row">
        {vibhagGroups.map((group, gi) => (
          <div className="lehra-vibhag" key={gi}>
            {group.map(b => {
              const isSam = taal.sam.includes(b);
              const isKhali = taal.khali.includes(b) && !isSam;
              const active = isPlaying && currentBeat === b;
              return (
                <div
                  key={b}
                  title={isSam ? `Beat ${b+1} — Sam (X)` : isKhali ? `Beat ${b+1} — Khali (0)` : `Beat ${b+1}`}
                  className={[
                    'lehra-beat',
                    isSam ? 'lehra-beat--sam' : '',
                    isKhali ? 'lehra-beat--khali' : '',
                    active ? 'lehra-beat--active' : ''
                  ].filter(Boolean).join(' ')}
                >
                  <span className="lehra-beat__num">{b+1}</span>
                  <span className="lehra-beat__marker">{isSam ? 'X' : isKhali ? '0' : ''}</span>
                </div>
              );
            })}
            {gi < vibhagGroups.length - 1 && <div className="lehra-vibhag-sep">|</div>}
          </div>
        ))}
      </div>

      <div className="lehra-card__body">
        <p className="lehra-card__desc">{taal.desc}</p>
        <div className="lehra-card__theka">
          <div className="lehra-card__theka-label">Theka</div>
          <div className="lehra-card__theka-text">{taal.theka}</div>
        </div>
      </div>

      <div className="lehra-controls">
        <div className="lehra-presets">
          {taal.presets.map(p => (
            <button
              key={p.label}
              className={`lehra-preset-btn${bpm === p.bpm ? ' active' : ''}`}
              onClick={() => handlePreset(p.bpm)}
            >
              {p.label} ({p.bpm} BPM)
            </button>
          ))}
        </div>
        <div className="lehra-actions">
          <div className="lehra-bpm">
            <button className="lehra-bpm-btn" onClick={() => handleBpm(bpm - 5)}>
              <Minus size={14} />
            </button>
            <span className="lehra-bpm-value">
              {bpm} <small>BPM</small>
            </span>
            <button className="lehra-bpm-btn" onClick={() => handleBpm(bpm + 5)}>
              <Plus size={14} />
            </button>
          </div>
          <button
            className={`lehra-play-btn ${isPlaying ? 'lehra-play-btn--playing' : ''}`}
            onClick={() => isPlaying ? onStop() : onPlay(bpm)}
          >
            {isPlaying ? (
              <>
                <Square size={14} /> Stop Lehra
              </>
            ) : (
              <>
                <Play size={14} fill="currentColor" /> Play Lehra
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function Learn() {
  const [tab, setTab] = useState<Tab>('bols');
  const [level, setLevel] = useState<Level>('all');

  const {
    playingId,
    currentBeat,
    play,
    stop,
    updateBpm
  } = useLehraPlayer();

  const filteredBols = level === 'all' ? bolsData : bolsData.filter(b => b.level === level);

  return (
    <main className="learn-page" id="learn-main">
      {/* ── Hero ── */}
      <section className="learn-hero" id="learn-hero">
        <div className="learn-hero__overlay" />
        <div className="container learn-hero__content">
          <span className="ornament-text" style={{ display: 'block', marginBottom: '0.75rem' }}>
            Learning Centre
          </span>
          <h1 className="learn-hero__title">
            Tabla <span className="gradient-text">Bols</span> & Lehra
          </h1>
          <p className="learn-hero__sub">
            Learn bols from basic to advanced — practise with live audio harmonium lehra
          </p>
          <div className="learn-hero__badges">
            <span className="badge badge-gold">
              <Music size={13} /> Basic to Advanced Bols
            </span>
            <span className="badge badge-gold">
              <Radio size={13} /> Live Harmonium Lehra
            </span>
            <span className="badge badge-gold">
              <Award size={13} /> Curated by Guruji
            </span>
          </div>

          <div className="learn-tabs" id="learn-tabs" role="tablist">
            <button
              role="tab"
              aria-selected={tab === 'bols'}
              className={`learn-tab-btn${tab === 'bols' ? ' active' : ''}`}
              id="tab-bols"
              onClick={() => setTab('bols')}
            >
              <BookOpen size={16} /> Tabla Bols
            </button>
            <button
              role="tab"
              aria-selected={tab === 'lehra'}
              className={`learn-tab-btn${tab === 'lehra' ? ' active' : ''}`}
              id="tab-lehra"
              onClick={() => setTab('lehra')}
            >
              <Radio size={16} /> Lehra Practice
            </button>
          </div>
        </div>
      </section>

      {/* ── Bols Tab ── */}
      {tab === 'bols' && (
        <section className="section" id="bols-section">
          <div className="container">
            <div className="section-header">
              <span className="ornament-text">Rhythmic Language</span>
              <h2 className="section-title" style={{ marginTop: '0.5rem' }}>
                Tabla <span className="gradient-text">Bols</span>
              </h2>
              <div className="gold-divider" />
              <p className="section-subtitle">
                From thekas to relas and tihais — curated by Shri Subodh Ranjan Prasad.
              </p>
            </div>

            <div className="learn-level-bar" id="level-filter">
              {levelFilters.map(({ value, label }) => (
                <button
                  key={value}
                  id={`level-btn-${value}`}
                  className={`learn-level-btn${level === value ? ' active' : ''}`}
                  onClick={() => setLevel(value)}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="bols-grid" id="bols-grid">
              {filteredBols.map(bol => (
                <div className="bol-card" key={bol.id} id={bol.id}>
                  <div className="bol-card__header">
                    <div className="bol-card__title-wrap">
                      <div className="bol-card__icon">
                        <Music size={18} />
                      </div>
                      <div>
                        <div className="bol-card__name">{bol.name}</div>
                        <div className="bol-card__taal">{bol.taal}</div>
                      </div>
                    </div>
                    <span className={`bol-card__level-badge ${bol.level}`}>
                      {{ beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' }[bol.level]}
                    </span>
                  </div>
                  <div className="bol-card__body">
                    <p className="bol-card__desc">{bol.desc}</p>
                    {bol.notation.map(({ label: noteLabel, bols: noteBols }) => (
                      <div className="bol-notation" key={noteLabel}>
                        <div className="bol-notation__label">{noteLabel}</div>
                        <div className="bol-notation__text">{noteBols}</div>
                      </div>
                    ))}
                    <div className="bol-card__tip">
                      <Lightbulb size={14} />
                      <span>
                        <strong>Tip:</strong> {bol.tip}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Lehra Tab ── */}
      {tab === 'lehra' && (
        <section className="section" id="lehra-section">
          <div className="container">
            <div className="section-header">
              <span className="ornament-text">Practice Support</span>
              <h2 className="section-title" style={{ marginTop: '0.5rem' }}>
                Lehra <span className="gradient-text">Practice</span>
              </h2>
              <div className="gold-divider" />
              <p className="section-subtitle">
                Lehra is a melodic cycle that keeps the taal while you practise. Pick an instrument — audio is synthesised live in your browser.
              </p>
            </div>

            <p className="lehra-intro" id="lehra-intro">
              Playing lehra with{' '}
              <strong style={{ color: 'var(--accent)' }}>
                🎹 Harmonium
              </strong>{' '}
              — synthesised live in your browser. The <span style={{ color: 'var(--accent)' }}>gold beat</span> is Sam
              (X), the <span style={{ color: 'var(--gold-400)' }}>dashed beat</span> is Khali (0). Adjust BPM freely
              while playing.
            </p>

            <div className="lehra-grid" id="lehra-grid">
              {lehraData.map(taal => (
                <LehraCard
                  key={taal.id}
                  taal={taal}
                  isPlaying={playingId === taal.id}
                  currentBeat={playingId === taal.id ? currentBeat : -1}
                  onPlay={bpm => play(taal, bpm, 'harmonium')}
                  onStop={stop}
                  onBpmChange={updateBpm}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ── */}
      <section className="learn-tip-banner" id="learn-cta">
        <div className="container learn-tip-banner__inner">
          <h2 className="learn-tip-banner__title">
            {tab === 'bols' ? 'Want Personal Guidance on These Bols?' : 'Ready to Practise with a Live Teacher?'}
          </h2>
          <p className="learn-tip-banner__sub">
            {tab === 'bols'
              ? 'Shri Subodh Ranjan Prasad teaches all compositions with personalised correction — online & offline.'
              : 'Practising with lehra is excellent. A guru\'s real-time correction transforms your playing. Book a class today.'}
          </p>
          <Link to="/book" className="btn btn-primary" id="learn-cta-btn">
            Book a Class <ChevronRight size={16} />
          </Link>
        </div>
      </section>
    </main>
  );
}