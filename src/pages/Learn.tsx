import { useState, useRef, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Music, BookOpen, Radio, Lightbulb, ChevronRight,
  Award, Play, Square, Minus, Plus
} from 'lucide-react';
import './Learn.css';
import TrialBanner from '../components/TrialBanner';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS & TYPES
// ═══════════════════════════════════════════════════════════════════════════════

type Instrument = 'harmonium';
type Level = 'all' | 'beginner' | 'intermediate' | 'advanced';
type Tab = 'bols' | 'lehra';
type TanpuraTuning = 'Pa' | 'Ma' | 'Ni';

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

// ═══════════════════════════════════════════════════════════════════════════════
// TANPURA PHYSICAL MODEL — Karplus-Strong Extended String Synthesis
// Identical engine to Riyaz Studio (Practice.tsx)
// ═══════════════════════════════════════════════════════════════════════════════

function buildKarplusBuffer(
  ctx: AudioContext,
  freq: number,
  sampleRate: number
): AudioBuffer {
  const N = Math.round(sampleRate / freq);
  const totalSamples = Math.floor(sampleRate * 8);
  const buf = ctx.createBuffer(1, totalSamples, sampleRate);
  const data = buf.getChannelData(0);

  const delayLine = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const t = i / N;
    const window = t < 0.5 ? 2 * t : 2 * (1 - t);
    delayLine[i] = (Math.random() * 2 - 1) * window;
  }

  let readPos = 0;
  let lastSample = 0;
  const feedbackGain = 0.998;
  const lpCoeff = 0.55;

  for (let i = 0; i < totalSamples; i++) {
    const current = delayLine[readPos];
    const filtered = feedbackGain * (lpCoeff * current + (1 - lpCoeff) * lastSample);
    const jawariClip = filtered > 0
      ? Math.tanh(filtered * 1.8) * 0.7 + filtered * 0.3
      : filtered * 0.85;
    data[i] = jawariClip;
    delayLine[readPos] = filtered;
    lastSample = current;
    readPos = (readPos + 1) % N;
  }
  return buf;
}

function synthTanpuraString(
  ctx: AudioContext,
  freq: number,
  t0: number,
  dur: number,
  vol: number,
  destNode: AudioNode
): void {
  const ksBuffer = buildKarplusBuffer(ctx, freq, ctx.sampleRate);
  const src = ctx.createBufferSource();
  src.buffer = ksBuffer;

  const master = ctx.createGain();
  master.gain.setValueAtTime(0, t0);
  master.gain.linearRampToValueAtTime(vol, t0 + 0.025);
  master.gain.setValueAtTime(vol, t0 + dur - 0.08);
  master.gain.linearRampToValueAtTime(0, t0 + dur);

  const bodyBass = ctx.createBiquadFilter();
  bodyBass.type = 'peaking';
  bodyBass.frequency.value = 140;
  bodyBass.Q.value = 3.5;
  bodyBass.gain.value = 8;

  const bodyMid = ctx.createBiquadFilter();
  bodyMid.type = 'peaking';
  bodyMid.frequency.value = 310;
  bodyMid.Q.value = 2.5;
  bodyMid.gain.value = 5;

  const bodyNeck = ctx.createBiquadFilter();
  bodyNeck.type = 'peaking';
  bodyNeck.frequency.value = 820;
  bodyNeck.Q.value = 1.8;
  bodyNeck.gain.value = 4;

  const bodyHiShelf = ctx.createBiquadFilter();
  bodyHiShelf.type = 'highshelf';
  bodyHiShelf.frequency.value = 4000;
  bodyHiShelf.gain.value = -6;

  const jivaPitchLFO = ctx.createOscillator();
  jivaPitchLFO.type = 'sine';
  jivaPitchLFO.frequency.value = 0.22;
  const jivaMod = ctx.createGain();
  jivaMod.gain.value = 3.5;
  jivaPitchLFO.connect(jivaMod);
  jivaMod.connect(src.detune);
  jivaPitchLFO.start(t0);
  jivaPitchLFO.stop(t0 + dur + 0.1);

  chain([src, master, bodyBass, bodyMid, bodyNeck, bodyHiShelf, destNode]);
  src.start(t0);
  src.stop(t0 + dur + 0.1);
}

function synthHarmonium(
  ctx: AudioContext, freq: number,
  t0: number, dur: number, vol: number, destNode: AudioNode = ctx.destination
): void {
  const master = ctx.createGain();
  master.connect(destNode);

  // 1. Air Leak/Turbulence Noise (Bellows wind)
  const noiseLength = Math.floor(ctx.sampleRate * (dur + 0.1));
  const noiseBuf = ctx.createBuffer(1, noiseLength, ctx.sampleRate);
  const noiseData = noiseBuf.getChannelData(0);
  for (let i = 0; i < noiseLength; i++) {
    noiseData[i] = (Math.random() * 2 - 1) * 0.015;
  }
  const noiseNode = ctx.createBufferSource();
  noiseNode.buffer = noiseBuf;

  const noiseLP = ctx.createBiquadFilter();
  noiseLP.type = 'bandpass';
  noiseLP.frequency.value = 350; // Low frequency bellows air rumble
  noiseLP.Q.value = 1.0;

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0, t0);
  noiseGain.gain.linearRampToValueAtTime(vol * 0.08, t0 + 0.05); // air builds up
  noiseGain.gain.setValueAtTime(vol * 0.08, t0 + dur - 0.04);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + 0.08);

  chain([noiseNode, noiseLP, noiseGain, master]);
  noiseNode.start(t0);
  noiseNode.stop(t0 + dur + 0.1);

  // 2. Bellows LFO (Pumping Tremolo & Vibrato)
  const bellowsLFO = ctx.createOscillator();
  bellowsLFO.frequency.value = 5.2; // 5.2Hz pumping

  const bellowsGainMod = ctx.createGain();
  bellowsGainMod.gain.value = 0.08; // volume tremolo depth

  const bellowsPitchMod = ctx.createGain();
  bellowsPitchMod.gain.value = 8; // vibrato depth in cents

  bellowsLFO.connect(bellowsGainMod);
  bellowsLFO.connect(bellowsPitchMod);

  const bellowsModNode = ctx.createGain();
  bellowsModNode.gain.value = 1.0;
  bellowsGainMod.connect(bellowsModNode.gain);

  bellowsLFO.start(t0);
  bellowsLFO.stop(t0 + dur + 0.1);

  // 3. Formant Filters (Wood cabinet resonance)
  const woodFilterLow = ctx.createBiquadFilter();
  woodFilterLow.type = 'peaking';
  woodFilterLow.frequency.value = 400; // Wood body resonance
  woodFilterLow.Q.value = 2.0;
  woodFilterLow.gain.value = 6;

  const woodFilterHigh = ctx.createBiquadFilter();
  woodFilterHigh.type = 'peaking';
  woodFilterHigh.frequency.value = 1200; // Reed chamber resonance
  woodFilterHigh.Q.value = 1.8;
  woodFilterHigh.gain.value = 8;

  const mainLP = ctx.createBiquadFilter();
  mainLP.type = 'lowpass';
  mainLP.frequency.setValueAtTime(800, t0);
  mainLP.frequency.exponentialRampToValueAtTime(2800, t0 + 0.06); // brightness swell
  mainLP.frequency.exponentialRampToValueAtTime(1600, t0 + dur);

  chain([woodFilterLow, woodFilterHigh, mainLP, bellowsModNode, master]);

  // 4. Oscillators (Multi-Reed Chorus)
  const oscs: OscillatorNode[] = [];

  // Male Reeds (fundamental chorus): Two detuned sawtooths
  const maleDets = [-6, 6];
  maleDets.forEach(det => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sawtooth';
    o.frequency.value = freq;
    o.detune.value = det;
    g.gain.value = 0.26;
    
    bellowsPitchMod.connect(o.detune);
    chain([o, g, woodFilterLow]);
    oscs.push(o);
  });

  // Female Reeds (high octave chorus): Detuned sawtooth
  const femaleDets = [-4, 8];
  femaleDets.forEach(det => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sawtooth';
    o.frequency.value = freq * 2;
    o.detune.value = det;
    g.gain.value = 0.16;
    
    bellowsPitchMod.connect(o.detune);
    chain([o, g, woodFilterLow]);
    oscs.push(o);
  });

  // Bass Reed (low octave body): Rich triangle/sawtooth blend
  const bassO1 = ctx.createOscillator();
  const bassO2 = ctx.createOscillator();
  const gBass1 = ctx.createGain();
  const gBass2 = ctx.createGain();

  bassO1.type = 'triangle';
  bassO1.frequency.value = freq * 0.5;
  bassO1.detune.value = -3;
  gBass1.gain.value = 0.22;

  bassO2.type = 'sawtooth';
  bassO2.frequency.value = freq * 0.5;
  bassO2.detune.value = 3;
  gBass2.gain.value = 0.14;

  bellowsPitchMod.connect(bassO1.detune);
  bellowsPitchMod.connect(bassO2.detune);

  chain([bassO1, gBass1, woodFilterLow]);
  chain([bassO2, gBass2, woodFilterLow]);
  oscs.push(bassO1, bassO2);

  // Start & Stop all oscillators
  oscs.forEach(o => {
    o.start(t0);
    o.stop(t0 + dur + 0.1);
  });

  // 5. Key press mechanical clicks
  const clickBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.005), ctx.sampleRate);
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

  // 6. Key release click sound (mechanical key release noise)
  const releaseBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.008), ctx.sampleRate);
  const releaseData = releaseBuf.getChannelData(0);
  for (let i = 0; i < releaseBuf.length; i++) {
    releaseData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / releaseBuf.length, 1.5);
  }
  const releaseNode = ctx.createBufferSource();
  releaseNode.buffer = releaseBuf;
  
  const releaseFilter = ctx.createBiquadFilter();
  releaseFilter.type = 'bandpass';
  releaseFilter.frequency.value = 1400; // lower pitch click for release
  
  const releaseGain = ctx.createGain();
  releaseGain.gain.setValueAtTime(vol * 0.03, t0 + dur);
  releaseGain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + 0.008);
  
  chain([releaseNode, releaseFilter, releaseGain, master]);
  releaseNode.start(t0 + dur);

  // Main Volume Envelope (build-up and release)
  master.gain.setValueAtTime(0, t0);
  master.gain.linearRampToValueAtTime(vol * 0.85, t0 + 0.05); // smooth attack
  master.gain.setValueAtTime(vol, t0 + dur - 0.04);
  master.gain.linearRampToValueAtTime(0, t0 + dur + 0.06); // release
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
  const [tanpuraVol, setTanpuraVol] = useState(0.45);
  const [isTanpuraMuted, setIsTanpuraMuted] = useState(false);
  const [tanpuraTuning, setTanpuraTuning] = useState<TanpuraTuning>('Pa');

  const ctxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const nextTimeRef = useRef<number>(0);
  const beatRef = useRef<number>(0);
  const seqRef = useRef<string[]>([]);
  const samRef = useRef<number[]>([]);
  const khaliRef = useRef<number[]>([]);
  const bpmRef = useRef<number>(60);
  const instrumentRef = useRef<Instrument>('harmonium');

  // Tanpura scheduling refs
  const nextTanpuraTimeRef = useRef<number>(0);
  const tanpuraBeatRef = useRef<number>(0);
  const tanpuraGainRef = useRef<GainNode | null>(null);
  const tanpuraVolRef = useRef(0.45);
  const isTanpuraMutedRef = useRef(false);
  const tanpuraTuningRef = useRef<TanpuraTuning>('Pa');

  // Sync tanpura params to refs
  useEffect(() => { tanpuraVolRef.current = tanpuraVol; }, [tanpuraVol]);
  useEffect(() => { isTanpuraMutedRef.current = isTanpuraMuted; }, [isTanpuraMuted]);
  useEffect(() => { tanpuraTuningRef.current = tanpuraTuning; }, [tanpuraTuning]);

  // Live volume update on gain node
  useEffect(() => {
    const ctx = ctxRef.current;
    if (ctx && tanpuraGainRef.current) {
      const v = isTanpuraMuted ? 0 : tanpuraVol;
      tanpuraGainRef.current.gain.linearRampToValueAtTime(v, ctx.currentTime + 0.05);
    }
  }, [tanpuraVol, isTanpuraMuted]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const tick = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    // 1. Schedule lehra notes
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

    // 2. Schedule tanpura strings — Pa→Sa→Sa→Sa(low) every 1.5s
    const tanpGain = tanpuraGainRef.current;
    if (!tanpGain) return;
    while (nextTanpuraTimeRef.current < ctx.currentTime + 0.13) {
      const tBeat = tanpuraBeatRef.current;
      const playAt = nextTanpuraTimeRef.current;

      // String tuning: beat 0 = Pa (or Ma/Ni), beats 1&2 = Sa, beat 3 = Sa low octave
      let semitoneOffset = 0;
      if (tBeat === 0) {
        const tuning = tanpuraTuningRef.current;
        semitoneOffset = tuning === 'Pa' ? 7 : tuning === 'Ma' ? 5 : 11;
      } else if (tBeat === 1 || tBeat === 2) {
        semitoneOffset = 0; // Middle Sa
      } else {
        semitoneOffset = -12; // Low octave Sa
      }

      const stringFreq = BASE_SA_FREQ * Math.pow(2, semitoneOffset / 12);
      const vol = isTanpuraMutedRef.current ? 0 : tanpuraVolRef.current;
      if (vol > 0) {
        synthTanpuraString(ctx, stringFreq, playAt, 4.5, vol, tanpGain);
      }

      nextTanpuraTimeRef.current += 1.5;
      tanpuraBeatRef.current = (tBeat + 1) % 4;
    }
  }, []);

  const play = useCallback((taal: TaalLehra, bpm: number, instrument: Instrument) => {
    clearTimer();
    if (!ctxRef.current || ctxRef.current.state === 'closed') {
      ctxRef.current = new AudioContext();
    }
    const ctx = ctxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    // Setup tanpura gain node routed to destination
    if (!tanpuraGainRef.current) {
      const tg = ctx.createGain();
      tg.gain.value = isTanpuraMutedRef.current ? 0 : tanpuraVolRef.current;
      tg.connect(ctx.destination);
      tanpuraGainRef.current = tg;
    }

    seqRef.current = taal.notes;
    samRef.current = taal.sam;
    khaliRef.current = taal.khali;
    bpmRef.current = bpm;
    instrumentRef.current = instrument;
    beatRef.current = 0;
    nextTimeRef.current = ctx.currentTime + 0.05;

    tanpuraBeatRef.current = 0;
    nextTanpuraTimeRef.current = ctx.currentTime + 0.1;

    setPlayingId(taal.id);
    setCurrentBeat(-1);
    timerRef.current = setInterval(tick, 25);
  }, [clearTimer, tick]);

  const stop = useCallback(() => {
    clearTimer();
    beatRef.current = 0;
    tanpuraBeatRef.current = 0;
    setPlayingId(null);
    setCurrentBeat(-1);
    // Close audio context to stop all sound cleanly
    if (ctxRef.current) {
      ctxRef.current.close();
      ctxRef.current = null;
      tanpuraGainRef.current = null;
    }
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

  return {
    playingId, currentBeat, play, stop, updateBpm, updateInstrument,
    tanpuraVol, setTanpuraVol,
    isTanpuraMuted, setIsTanpuraMuted,
    tanpuraTuning, setTanpuraTuning,
  };
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
    updateBpm,
    tanpuraVol,
    setTanpuraVol,
    isTanpuraMuted,
    setIsTanpuraMuted,
    tanpuraTuning,
    setTanpuraTuning,
  } = useLehraPlayer();

  const filteredBols = level === 'all' ? bolsData : bolsData.filter(b => b.level === level);

  return (
    <main className="learn-page" id="learn-main">
      <TrialBanner />
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

            {/* ── Tanpura Control Bar ── */}
            <div className="lehra-tanpura-bar" id="lehra-tanpura-bar">
              <div className="lehra-tanpura-bar__icon">🎵</div>
              <div className="lehra-tanpura-bar__label">Tanpura Drone</div>

              {/* Tuning selector */}
              <div className="lehra-tanpura-bar__tuning">
                {(['Pa', 'Ma', 'Ni'] as const).map(t => (
                  <button
                    key={t}
                    id={`tanpura-tuning-${t.toLowerCase()}`}
                    className={`lehra-tanpura-tuning-btn${tanpuraTuning === t ? ' active' : ''}`}
                    onClick={() => setTanpuraTuning(t)}
                    title={`First string tuned to ${t}`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Volume slider */}
              <div className="lehra-tanpura-bar__vol">
                <span className="lehra-tanpura-bar__vol-label">Vol</span>
                <input
                  id="lehra-tanpura-vol"
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={tanpuraVol}
                  onChange={e => setTanpuraVol(parseFloat(e.target.value))}
                  className="lehra-tanpura-slider"
                />
                <span className="lehra-tanpura-bar__vol-pct">{Math.round(tanpuraVol * 100)}%</span>
              </div>

              {/* Mute toggle */}
              <button
                id="lehra-tanpura-mute"
                className={`lehra-tanpura-mute-btn${isTanpuraMuted ? ' muted' : ''}`}
                onClick={() => setIsTanpuraMuted(m => !m)}
                title={isTanpuraMuted ? 'Unmute tanpura' : 'Mute tanpura'}
              >
                {isTanpuraMuted ? '🔇 Muted' : '🔊 On'}
              </button>

              <div className="lehra-tanpura-bar__info">
                Pa · Sa · Sa · Sā
              </div>
            </div>

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