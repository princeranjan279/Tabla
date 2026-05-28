import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Play, Square, Volume2, VolumeX, Sliders, Music,
  Activity, Info, Plus, Minus
} from 'lucide-react';
import './Practice.css';
import TrialBanner from '../components/TrialBanner';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS & TYPES
// ═══════════════════════════════════════════════════════════════════════════════

type Instrument = 'harmonium';
type Raag = 'bilawal' | 'yaman' | 'bhairav' | 'bhairavi' | 'kafi' | 'bhimpalasi';
type Taal = 'teen-taal' | 'keherwa' | 'dadra' | 'rupak' | 'jhap-taal' | 'ek-taal';
type TanpuraTuning = 'Pa' | 'Ma' | 'Ni';

interface TaalConfig {
  id: Taal;
  name: string;
  beats: number;
  vibhags: number[];
  sam: number[];
  khali: number[];
  theka: string;
  defaultBpm: number;
}

const TAALS: TaalConfig[] = [
  {
    id: 'teen-taal',
    name: 'Teen Taal',
    beats: 16,
    vibhags: [4, 4, 4, 4],
    sam: [0],
    khali: [8],
    theka: 'Dha Dhin Dhin Dha | Dha Dhin Dhin Dha | Dha Tin Tin Ta | Tete Dhin Dhin Dha',
    defaultBpm: 60,
  },
  {
    id: 'keherwa',
    name: 'Keherwa',
    beats: 8,
    vibhags: [4, 4],
    sam: [0],
    khali: [4],
    theka: 'Dha Ge Na Tin | Na Ke Dhin Na',
    defaultBpm: 80,
  },
  {
    id: 'dadra',
    name: 'Dadra',
    beats: 6,
    vibhags: [3, 3],
    sam: [0],
    khali: [3],
    theka: 'Dha Dhin Na | Dha Tin Na',
    defaultBpm: 72,
  },
  {
    id: 'rupak',
    name: 'Rupak Taal',
    beats: 7,
    vibhags: [3, 2, 2],
    sam: [0], // In Rupak, Sam is also Khali
    khali: [0],
    theka: 'Tin Tin Na | Dhin Na | Dhin Na',
    defaultBpm: 75,
  },
  {
    id: 'jhap-taal',
    name: 'Jhap Taal',
    beats: 10,
    vibhags: [2, 3, 2, 3],
    sam: [0],
    khali: [5],
    theka: 'Dhi Na | Dhi Dhi Na | Ti Na | Dhi Dhi Na',
    defaultBpm: 70,
  },
  {
    id: 'ek-taal',
    name: 'Ek Taal',
    beats: 12,
    vibhags: [2, 2, 2, 2, 2, 2],
    sam: [0],
    khali: [4, 8],
    theka: 'Dhin Dhin | DhageTeTeKe | Tin Tin | DhageTeTeKe | Dhi Dhi | DhageTeTeKe',
    defaultBpm: 50,
  }
];

const RAAGS: { id: Raag; name: string; desc: string }[] = [
  { id: 'bilawal', name: 'Raag Bilawal', desc: 'All natural notes (Morning)' },
  { id: 'yaman', name: 'Raag Yaman', desc: 'Teevra Ma (Evening)' },
  { id: 'bhairav', name: 'Raag Bhairav', desc: 'Komal Re & Komal Dha (Early Morning)' },
  { id: 'bhairavi', name: 'Raag Bhairavi', desc: 'All flat notes (Morning / Anytime)' },
  { id: 'kafi', name: 'Raag Kafi', desc: 'Komal Ga & Komal Ni (Late Evening)' },
  { id: 'bhimpalasi', name: 'Raag Bhimpalasi', desc: 'Komal Ga & Komal Ni (Afternoon)' }
];

const INSTRUMENTS: { id: Instrument; label: string; emoji: string; hint: string }[] = [
  { id: 'harmonium', label: 'Harmonium', emoji: '🎹', hint: 'Warm reed organ' }
];

const SCALE_KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

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

const LEHRA_SEQUENCES: Record<Taal, Record<Raag, string[]>> = {
  'teen-taal': {
    bilawal: ['Sa', 'Re', 'Ga', 'Ma', 'Pa', 'Dha', 'Ni', 'SA', 'SA', 'Dha', 'Pa', 'Ma', 'Ga', 'Re', 'Sa', '_'],
    yaman: ['Pa_', 'Ni_', 'Sa', 'Re', 'Ga', 'Re', 'Ga', 'Ma_t', 'Pa', 'Ma_t', 'Dha', 'Pa', 'SA', 'Ni', 'Dha', 'Pa'],
    bhairav: ['Sa', 'Re_k', 'Ga', 'Ma', 'Pa', 'Dha_k', 'Ni', 'SA', 'SA', 'Ni', 'Dha_k', 'Pa', 'Ma', 'Ga', 'Re_k', 'Sa'],
    bhairavi: ['Sa', 'Re_k', 'Ga_k', 'Ma', 'Pa', 'Dha_k', 'Ni_k', 'SA', 'SA', 'Ni_k', 'Dha_k', 'Pa', 'Ma', 'Ga_k', 'Re_k', 'Sa'],
    kafi: ['Sa', 'Re', 'Ga_k', 'Ma', 'Pa', 'Dha', 'Ni_k', 'SA', 'SA', 'Ni_k', 'Dha', 'Pa', 'Ma', 'Ga_k', 'Re', 'Sa'],
    bhimpalasi: ['Ni_', 'Sa', 'Ga_k', 'Ma', 'Pa', 'Pa', 'Dha', 'Ni_k', 'SA', 'Ni_k', 'Dha', 'Pa', 'Ma', 'Ga_k', 'Re', 'Sa']
  },
  'keherwa': {
    bilawal: ['Sa', 'Re', 'Ga', 'Ma', 'Pa', 'Ma', 'Ga', 'Re'],
    yaman: ['Sa', 'Re', 'Ga', 'Ma_t', 'Pa', 'Ma_t', 'Ga', 'Re'],
    bhairav: ['Sa', 'Re_k', 'Ga', 'Ma', 'Pa', 'Ma', 'Ga', 'Re_k'],
    bhairavi: ['Sa', 'Re_k', 'Ga_k', 'Ma', 'Pa', 'Ma', 'Ga_k', 'Re_k'],
    kafi: ['Sa', 'Re', 'Ga_k', 'Ma', 'Pa', 'Ma', 'Ga_k', 'Re'],
    bhimpalasi: ['Ni_', 'Sa', 'Ga_k', 'Ma', 'Pa', 'Ma', 'Ga_k', 'Sa']
  },
  'dadra': {
    bilawal: ['Sa', 'Ga', 'Ma', 'Pa', 'Ma', 'Ga'],
    yaman: ['Sa', 'Ga', 'Ma_t', 'Pa', 'Ma_t', 'Ga'],
    bhairav: ['Sa', 'Ga', 'Ma', 'Pa', 'Ma', 'Ga'],
    bhairavi: ['Sa', 'Ga_k', 'Ma', 'Pa', 'Ma', 'Ga_k'],
    kafi: ['Sa', 'Ga_k', 'Ma', 'Pa', 'Ma', 'Ga_k'],
    bhimpalasi: ['Sa', 'Ga_k', 'Ma', 'Pa', 'Ga_k', 'Sa']
  },
  'rupak': {
    bilawal: ['Ga', 'Re', 'Ga', 'Ma', 'Pa', 'Dha', 'Ni'],
    yaman: ['Ga', 'Re', 'Ga', 'Ma_t', 'Pa', 'Dha', 'Ni'],
    bhairav: ['Ga', 'Re_k', 'Ga', 'Ma', 'Pa', 'Dha_k', 'Ni'],
    bhairavi: ['Ga_k', 'Re_k', 'Ga_k', 'Ma', 'Pa', 'Dha_k', 'Ni_k'],
    kafi: ['Ga_k', 'Re', 'Ga_k', 'Ma', 'Pa', 'Dha', 'Ni_k'],
    bhimpalasi: ['Ni_', 'Sa', 'Ga_k', 'Ma', 'Pa', 'Ni_k', 'SA']
  },
  'jhap-taal': {
    bilawal: ['Sa', 'Re', 'Ga', 'Ma', 'Pa', 'Ma', 'Ga', 'Re', 'Sa', 'Ni_'],
    yaman: ['Sa', 'Re', 'Ga', 'Ma_t', 'Pa', 'Ma_t', 'Ga', 'Re', 'Sa', 'Ni_'],
    bhairav: ['Sa', 'Re_k', 'Ga', 'Ma', 'Pa', 'Ma', 'Ga', 'Re_k', 'Sa', 'Ni_'],
    bhairavi: ['Sa', 'Re_k', 'Ga_k', 'Ma', 'Pa', 'Ma', 'Ga_k', 'Re_k', 'Sa', 'Ni_k_'],
    kafi: ['Sa', 'Re', 'Ga_k', 'Ma', 'Pa', 'Ma', 'Ga_k', 'Re', 'Sa', 'Ni_k_'],
    bhimpalasi: ['Ni_', 'Sa', 'Ga_k', 'Ma', 'Pa', 'SA', 'Ni_k', 'Dha', 'Pa', '_']
  },
  'ek-taal': {
    bilawal: ['Sa', 'Re', 'Ga', 'Ma', 'Pa', 'Dha', 'Ni', 'SA', 'Dha', 'Pa', 'Ma', 'Ga'],
    yaman: ['Sa', 'Re', 'Ga', 'Ma_t', 'Pa', 'Dha', 'Ni', 'SA', 'Dha', 'Pa', 'Ma_t', 'Ga'],
    bhairav: ['Sa', 'Re_k', 'Ga', 'Ma', 'Pa', 'Dha_k', 'Ni', 'SA', 'Dha_k', 'Pa', 'Ma', 'Ga'],
    bhairavi: ['Sa', 'Re_k', 'Ga_k', 'Ma', 'Pa', 'Dha_k', 'Ni_k', 'SA', 'Dha_k', 'Pa', 'Ma', 'Ga_k'],
    kafi: ['Sa', 'Re', 'Ga_k', 'Ma', 'Pa', 'Dha', 'Ni_k', 'SA', 'Dha', 'Pa', 'Ma', 'Ga_k'],
    bhimpalasi: ['Sa', 'Ga_k', 'Ma', 'Pa', 'SA', 'Ni_k', 'Dha', 'Pa', 'Ma', 'Ga_k', 'Re', 'Sa']
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// WEB AUDIO SYNTHESIZERS
// ═══════════════════════════════════════════════════════════════════════════════

function chain(nodes: AudioNode[]): void {
  for (let i = 0; i < nodes.length - 1; i++) {
    nodes[i].connect(nodes[i + 1]);
  }
}

function createReverbBuffer(ctx: AudioContext, duration: number, decay: number): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const len = sampleRate * duration;
  const buffer = ctx.createBuffer(2, len, sampleRate);
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
  }
  return buffer;
}



// ═══════════════════════════════════════════════════════════════════════════════
// TANPURA PHYSICAL MODEL — Karplus-Strong Extended String Synthesis
// ═══════════════════════════════════════════════════════════════════════════════
//
// Research basis:
//  - Karplus & Strong (1983), "Digital Synthesis of Plucked String and Drum Timbres"
//  - Digital Waveguide Theory (Julius O. Smith III, Stanford CCRMA)
//  - Jawari/Jvari effect: nonlinear grazing contact of string on curved bridge
//    creates harmonic bloom (slowly evolving overtone cascade)
//  - Real tanpura: 4 strings Pa–Sa–Sa–Sa(low), cycled with ~1.5-2s spacing
//
// Implementation strategy:
//  We cannot run a true sample-accurate Karplus-Strong feedback loop with Web
//  Audio API nodes (DelayNode has minimum 1-block latency in the feedback path).
//  Instead we synthesize each string pluck as a pre-computed AudioBuffer filled
//  with physically-motivated waveform content, then play it with long decay.
//  The "evolving harmonics" bloom is achieved by layering multiple slightly-
//  detuned oscillators with staggered attack envelopes, and routing through
//  a resonant body filter chain (gourd cavity + neck wood modes).

// Build a single-string Karplus-Strong excitation buffer
// This fills a short buffer with a damped, noise-seeded waveform that
// approximates the string's initial transient.
function buildKarplusBuffer(
  ctx: AudioContext,
  freq: number,
  sampleRate: number
): AudioBuffer {
  // Period length in samples
  const N = Math.round(sampleRate / freq);
  // Buffer duration: long enough to capture full decay envelope (8 seconds)
  const totalSamples = Math.floor(sampleRate * 8);
  const buf = ctx.createBuffer(1, totalSamples, sampleRate);
  const data = buf.getChannelData(0);

  // Seed the delay line with a shaped noise burst (pluck excitation)
  const delayLine = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    // Pluck shape: noise burst with triangular window for soft finger pluck
    const t = i / N;
    const window = t < 0.5 ? 2 * t : 2 * (1 - t); // triangular window
    delayLine[i] = (Math.random() * 2 - 1) * window;
  }

  // Karplus-Strong feedback loop with jawari-inspired filtering
  // The loop filter determines timbre: a one-pole lowpass gives guitar,
  // a slightly higher cutoff (more highs preserved) gives the bright tanpura buzz
  let readPos = 0;
  let lastSample = 0;

  // Loop filter coefficient (0=dead, 1=infinite sustain)
  // Tanpura has very long sustain, so we use high feedback ~0.998
  const feedbackGain = 0.998;
  // Lowpass coefficient: 0=full lowpass (muffled), 1=highpass (bright)
  // Tanpura bridge preserves more harmonics → use 0.55 (brighter than guitar ~0.5)
  const lpCoeff = 0.55;

  for (let i = 0; i < totalSamples; i++) {
    const current = delayLine[readPos];
    // One-pole lowpass + gain = the Karplus-Strong filter
    const filtered = feedbackGain * (lpCoeff * current + (1 - lpCoeff) * lastSample);

    // Jawari bridge nonlinearity: subtle asymmetric soft-clip
    // This adds the characteristic buzz/shimmer of the tanpura bridge contact
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

function synthHarmonium(
  ctx: AudioContext, freq: number,
  t0: number, dur: number, vol: number, destNode: AudioNode
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



// synthTanpuraString — Karplus-Strong Physical Model
// Each call pre-computes a full 8-second string decay AudioBuffer offline
// (using the KS algorithm in JavaScript), then schedules it to play at t0.
// The body filter chain shapes the gourd cavity resonance.
// Called for each of the 4 string positions: Pa, Sa, Sa, Sa(low)
function synthTanpuraString(
  ctx: AudioContext,
  freq: number,
  t0: number,
  dur: number,
  vol: number,
  destNode: AudioNode
): void {
  // 1. Build the Karplus-Strong string buffer (runs offline, takes ~5ms)
  const ksBuffer = buildKarplusBuffer(ctx, freq, ctx.sampleRate);

  // 2. Source node to play the buffer once at t0
  const src = ctx.createBufferSource();
  src.buffer = ksBuffer;
  // Do NOT loop — Karplus-Strong already encodes the full natural decay

  // 3. Master volume + soft attack
  const master = ctx.createGain();
  master.gain.setValueAtTime(0, t0);
  master.gain.linearRampToValueAtTime(vol, t0 + 0.025);  // 25ms soft attack
  // Natural decay is already in the buffer; fade to silence at dur boundary
  master.gain.setValueAtTime(vol, t0 + dur - 0.08);
  master.gain.linearRampToValueAtTime(0, t0 + dur);

  // 4. Gourd body resonance: the hollow gourd boosts certain frequency bands
  //    Mode 1 — deep bass cavity (~100-200Hz), adds the "dark hollow" warmth
  const bodyBass = ctx.createBiquadFilter();
  bodyBass.type = 'peaking';
  bodyBass.frequency.value = 140;
  bodyBass.Q.value = 3.5;
  bodyBass.gain.value = 8;

  //    Mode 2 — mid-body wood resonance (~280-360Hz), adds wood projection
  const bodyMid = ctx.createBiquadFilter();
  bodyMid.type = 'peaking';
  bodyMid.frequency.value = 310;
  bodyMid.Q.value = 2.5;
  bodyMid.gain.value = 5;

  //    Mode 3 — neck/string overtone emphasis (~800Hz), adds the nasal character
  const bodyNeck = ctx.createBiquadFilter();
  bodyNeck.type = 'peaking';
  bodyNeck.frequency.value = 820;
  bodyNeck.Q.value = 1.8;
  bodyNeck.gain.value = 4;

  //    High shelving cut — tanpura is never harsh/bright above 4kHz
  const bodyHiShelf = ctx.createBiquadFilter();
  bodyHiShelf.type = 'highshelf';
  bodyHiShelf.frequency.value = 4000;
  bodyHiShelf.gain.value = -6;

  // 5. Subtle chorus to simulate the jiva thread modulation (cotton thread
  //    between string and bridge that creates micro-pitch variations)
  const jivaPitchLFO = ctx.createOscillator();
  jivaPitchLFO.type = 'sine';
  jivaPitchLFO.frequency.value = 0.22; // very slow — 0.22Hz wobble
  const jivaMod = ctx.createGain();
  jivaMod.gain.value = 3.5; // ±3.5 cents pitch wobble
  jivaPitchLFO.connect(jivaMod);
  jivaMod.connect(src.detune);
  jivaPitchLFO.start(t0);
  jivaPitchLFO.stop(t0 + dur + 0.1);

  // 6. Connect signal chain:
  //    src → master → bodyBass → bodyMid → bodyNeck → bodyHiShelf → destNode
  chain([src, master, bodyBass, bodyMid, bodyNeck, bodyHiShelf, destNode]);

  // 7. Schedule playback
  src.start(t0);
  src.stop(t0 + dur + 0.1);
}

function synthClick(
  ctx: AudioContext,
  t0: number,
  isSam: boolean,
  vol: number,
  destNode: AudioNode
): void {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.connect(g);
  g.connect(destNode);
  
  const freq = isSam ? 880 : 440;
  const dur = isSam ? 0.08 : 0.03;
  
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(freq, t0);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.4, t0 + dur);
  
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(vol, t0 + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function Practice() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(-1);
  const [isBeatFlash, setIsBeatFlash] = useState(false);
  const [taal, setTaal] = useState<Taal>('teen-taal');
  const [raag, setRaag] = useState<Raag>('bilawal');
  const [instrument, setInstrument] = useState<Instrument>('harmonium');
  const [scaleIdx, setScaleIdx] = useState(0);
  const [fineTune, setFineTune] = useState(0);
  const [bpm, setBpm] = useState(60);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [tanpuraVol, setTanpuraVol] = useState(0.5);
  const [isTanpuraMuted, setIsTanpuraMuted] = useState(false);
  const [clickVol, setClickVol] = useState(0.3);
  const [isClickMuted, setIsClickMuted] = useState(true); // muted by default
  const [tanpuraTuning, setTanpuraTuning] = useState<TanpuraTuning>('Pa');

  const tapTimesRef = useRef<number[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mainGainNodeRef = useRef<GainNode | null>(null);
  const tanpuraGainNodeRef = useRef<GainNode | null>(null);
  const clickGainNodeRef = useRef<GainNode | null>(null);
  const nextTimeRef = useRef<number>(0);
  const beatRef = useRef<number>(0);
  const nextTanpuraTimeRef = useRef<number>(0);
  const tanpuraBeatRef = useRef<number>(0);
  const stateRef = useRef({ taal, raag, inst: instrument, scaleIdx, fine: fineTune, bpm, tuning: tanpuraTuning });

  // Sync states with ref for low latency scheduler loop
  useEffect(() => {
    stateRef.current = { taal, raag, inst: instrument, scaleIdx, fine: fineTune, bpm, tuning: tanpuraTuning };
  }, [taal, raag, instrument, scaleIdx, fineTune, bpm, tanpuraTuning]);

  // Adjust volumes dynamically in the gain nodes
  useEffect(() => {
    const ctx = audioCtxRef.current;
    if (ctx && mainGainNodeRef.current) {
      const v = isMuted ? 0 : volume;
      mainGainNodeRef.current.gain.linearRampToValueAtTime(v, ctx.currentTime + 0.02);
    }
  }, [volume, isMuted]);

  useEffect(() => {
    const ctx = audioCtxRef.current;
    if (ctx && tanpuraGainNodeRef.current) {
      const v = isTanpuraMuted ? 0 : tanpuraVol;
      tanpuraGainNodeRef.current.gain.linearRampToValueAtTime(v, ctx.currentTime + 0.02);
    }
  }, [tanpuraVol, isTanpuraMuted]);

  useEffect(() => {
    const ctx = audioCtxRef.current;
    if (ctx && clickGainNodeRef.current) {
      const v = isClickMuted ? 0 : clickVol;
      clickGainNodeRef.current.gain.linearRampToValueAtTime(v, ctx.currentTime + 0.02);
    }
  }, [clickVol, isClickMuted]);

  const initAudio = () => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      const e = new AudioContext();
      audioCtxRef.current = e;
      
      const masterNode = e.createGain();
      masterNode.gain.value = 1;
      masterNode.connect(e.destination);
      
      // Setup room reverb
      const reverbNode = e.createConvolver();
      reverbNode.buffer = createReverbBuffer(e, 1.4, 3.8);
      
      const reverbGainNode = e.createGain();
      reverbGainNode.gain.value = 0.16;
      reverbNode.connect(reverbGainNode);
      reverbGainNode.connect(masterNode);
      
      const mainGain = e.createGain();
      mainGain.gain.value = isMuted ? 0 : volume;
      mainGain.connect(masterNode);
      mainGain.connect(reverbNode);
      mainGainNodeRef.current = mainGain;
      
      const tanpuraGain = e.createGain();
      tanpuraGain.gain.value = isTanpuraMuted ? 0 : tanpuraVol;
      tanpuraGain.connect(masterNode);
      tanpuraGain.connect(reverbNode);
      tanpuraGainNodeRef.current = tanpuraGain;
      
      const clickGain = e.createGain();
      clickGain.gain.value = isClickMuted ? 0 : clickVol;
      clickGain.connect(masterNode);
      clickGainNodeRef.current = clickGain;
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  const getNoteFrequency = (noteName: string, scaleIdx: number, fineTuneCents: number) => {
    const semitoneOffset = NOTE_SEMITONES[noteName];
    if (semitoneOffset === undefined || semitoneOffset === -100) return 0;
    return BASE_SA_FREQ * Math.pow(2, scaleIdx / 12) * Math.pow(2, fineTuneCents / 1200) * Math.pow(2, semitoneOffset / 12);
  };

  const tick = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    
    const state = stateRef.current;
    const currentTaal = TAALS.find(t => t.id === state.taal);
    if (!currentTaal) return;
    
    const notesSeq = LEHRA_SEQUENCES[state.taal]?.[state.raag];
    
    // 1. Schedule lehra notes & metronome clicks
    while (nextTimeRef.current < ctx.currentTime + 0.12) {
      const beatIndex = beatRef.current;
      const beatDuration = 60 / state.bpm;
      const playTime = nextTimeRef.current;
      
      const isSam = currentTaal.sam.includes(beatIndex);
      const isKhali = currentTaal.khali.includes(beatIndex) && !isSam;

      if (notesSeq) {
        const noteName = notesSeq[beatIndex % notesSeq.length];
        const freq = getNoteFrequency(noteName, state.scaleIdx, state.fine);
        
        if (freq > 0 && mainGainNodeRef.current) {
          const vol = isSam ? 0.62 : isKhali ? 0.28 : 0.44;
          const noteDuration = beatDuration * 0.9;
          
          synthHarmonium(ctx, freq, playTime, noteDuration, vol, mainGainNodeRef.current);
        }
      }
      
      if (clickGainNodeRef.current) {
        synthClick(ctx, playTime, isSam, 0.8, clickGainNodeRef.current);
      }
      
      // Update UI state in sync with AudioContext scheduler
      const uiDelay = Math.max(0, (playTime - ctx.currentTime) * 1000);
      setTimeout(() => {
        setCurrentBeat(beatIndex);
        setIsBeatFlash(true);
        setTimeout(() => setIsBeatFlash(false), 80);
      }, uiDelay);
      
      nextTimeRef.current += beatDuration;
      beatRef.current = (beatIndex + 1) % currentTaal.beats;
    }
    
    // 2. Schedule Tanpura plucks (every 1.5 seconds)
    while (nextTanpuraTimeRef.current < ctx.currentTime + 0.12) {
      const playTime = nextTanpuraTimeRef.current;
      const tBeat = tanpuraBeatRef.current;
      
      let semitoneOffset = 0;
      if (tBeat === 0) {
        semitoneOffset = state.tuning === 'Pa' ? -5 : state.tuning === 'Ma' ? -7 : -1;
      } else if (tBeat === 1 || tBeat === 2) {
        semitoneOffset = 0;
      } else {
        semitoneOffset = -12; // Lower octave Sa
      }
      
      const freq = BASE_SA_FREQ * Math.pow(2, state.scaleIdx / 12) * Math.pow(2, state.fine / 1200) * Math.pow(2, semitoneOffset / 12);
      
      if (tanpuraGainNodeRef.current) {
        synthTanpuraString(ctx, freq, playTime, 4.5, 0.45, tanpuraGainNodeRef.current);
      }
      
      nextTanpuraTimeRef.current += 1.5;
      tanpuraBeatRef.current = (tBeat + 1) % 4;
    }
  }, []);

  const togglePlay = () => {
    if (isPlaying) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setIsPlaying(false);
      setCurrentBeat(-1);
    } else {
      initAudio();
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      
      beatRef.current = 0;
      nextTimeRef.current = ctx.currentTime + 0.05;
      
      tanpuraBeatRef.current = 0;
      nextTanpuraTimeRef.current = ctx.currentTime + 0.02;
      
      setIsPlaying(true);
      setCurrentBeat(-1);
      timerRef.current = setInterval(tick, 25);
    }
  };

  const tapTempo = () => {
    const now = performance.now();
    const times = [...tapTimesRef.current, now];
    if (times.length > 4) times.shift();
    tapTimesRef.current = times;
    
    if (times.length >= 2) {
      let totalDiff = 0;
      for (let i = 1; i < times.length; i++) {
        totalDiff += times[i] - times[i - 1];
      }
      const avgDiff = totalDiff / (times.length - 1);
      const calculatedBpm = Math.round(60000 / avgDiff);
      setBpm(Math.max(30, Math.min(250, calculatedBpm)));
    }
  };

  useEffect(() => () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    audioCtxRef.current?.close();
  }, []);

  const selectedTaalConfig = TAALS.find(t => t.id === taal) || TAALS[0];
  const isSam = selectedTaalConfig.sam.includes(currentBeat);
  const isKhali = selectedTaalConfig.khali.includes(currentBeat) && !isSam;

  let linearBeatIndex = 0;
  const vibhagGroups = selectedTaalConfig.vibhags.map(size => {
    const beats = Array.from({ length: size }, (_, i) => linearBeatIndex + i);
    linearBeatIndex += size;
    return beats;
  });

  return (
    <main className="practice-page" id="practice-main">
      <TrialBanner />
      <div className="practice-container">
        {/* Header */}
        <header className="practice-header">
          <span className="practice-header__tag">Interactive Practice</span>
          <h1 className="practice-header__title">Riyaz Studio</h1>
          <p className="practice-header__subtitle">
            An advanced practice room inspired by LehraStudio Pro. Handcraft your accompaniment with live-synthesised Raag lehras, continuous Tanpura drones, and smart click-tracks.
          </p>
        </header>

        <div className="console-grid">
          {/* Left Column Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Lehra Accompaniment Card */}
            <div className="console-card">
              <h2 className="console-card__title">
                <Music size={18} /> Melodic Accompaniment
              </h2>
              <div className="selector-group">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label className="control-label" htmlFor="taal-select">Select Taal</label>
                    <div className="select-wrapper">
                      <select
                        id="taal-select"
                        value={taal}
                        onChange={e => {
                          const val = e.target.value as Taal;
                          setTaal(val);
                          if (isPlaying) {
                            beatRef.current = 0;
                            setCurrentBeat(0);
                          }
                          const matchedTaal = TAALS.find(t => t.id === val);
                          if (matchedTaal) {
                            setBpm(matchedTaal.defaultBpm);
                          }
                        }}
                      >
                        {TAALS.map(t => (
                          <option key={t.id} value={t.id}>
                            {t.name} ({t.beats} Beats)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="control-label" htmlFor="raag-select">Select Raag</label>
                    <div className="select-wrapper">
                      <select
                        id="raag-select"
                        value={raag}
                        onChange={e => setRaag(e.target.value as Raag)}
                      >
                        {RAAGS.map(r => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="control-label">Choose Instrument</label>
                  <div className="inst-pill-grid">
                    {INSTRUMENTS.map(inst => (
                      <button
                        key={inst.id}
                        type="button"
                        className={`inst-pill-btn${instrument === inst.id ? ' inst-pill-btn--active' : ''}`}
                        onClick={() => setInstrument(inst.id)}
                      >
                        <span className="inst-pill-btn__emoji">{inst.emoji}</span>
                        <span className="inst-pill-btn__name">{inst.label}</span>
                        <span className="inst-pill-btn__hint">{inst.hint}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Pitch Shifter Scale Card */}
            <div className="console-card">
              <h2 className="console-card__title">
                <Sliders size={18} /> Pitch Shifter (Scale)
              </h2>
              <label className="control-label">Tabla Scale (Sa Fundamental)</label>
              <div className="scale-board">
                {SCALE_KEYS.map((keyStr, idx) => (
                  <button
                    key={keyStr}
                    type="button"
                    className={`scale-key-btn${scaleIdx === idx ? ' scale-key-btn--active' : ''}`}
                    onClick={() => setScaleIdx(idx)}
                  >
                    {keyStr}
                  </button>
                ))}
              </div>
              <div className="fine-tune-panel">
                <div className="fine-tune-row">
                  <span className="control-label" style={{ margin: 0 }}>Fine Tune</span>
                  <span className="fine-tune-value">
                    {fineTune > 0 ? `+${fineTune}` : fineTune} cents
                  </span>
                </div>
                <input
                  type="range"
                  className="fine-tune-slider"
                  min="-50"
                  max="50"
                  value={fineTune}
                  onChange={e => setFineTune(parseInt(e.target.value, 10))}
                />
              </div>
            </div>

            {/* Tanpura Tuning Card */}
            <div className="console-card">
              <h2 className="console-card__title">
                <Music size={18} /> Tanpura Tuning
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: '0.8rem', color: '#a08a70', lineHeight: '1.4', margin: 0 }}>
                    Tanpura plays string cycles: <strong>Tuning String - Sa - Sa - Sa (low)</strong>. Select first string interval to match selected Raag.
                  </p>
                </div>
                <div>
                  <div className="select-wrapper">
                    <select
                      value={tanpuraTuning}
                      onChange={e => setTanpuraTuning(e.target.value as TanpuraTuning)}
                    >
                      <option value="Pa">Pa (Dominant)</option>
                      <option value="Ma">Ma (Subdominant)</option>
                      <option value="Ni">Ni (Leading Note)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Visualizer & Play Card */}
            <div className="console-card console-card--accent">
              <div className="visualizer-section">
                <div className={`beat-ring-outer${isPlaying ? (isSam ? ' beat-ring-outer--sam' : isBeatFlash ? ' beat-ring-outer--beat' : '') : ''}`}>
                  <div className="beat-ring-inner">
                    <span className="beat-display__number">
                      {isPlaying && currentBeat !== -1 ? currentBeat + 1 : '—'}
                    </span>
                    <span className="beat-display__label">
                      {isPlaying && currentBeat !== -1 ? (isSam ? 'Sam (X)' : isKhali ? 'Khali (0)' : 'Matra') : 'Studio Idle'}
                    </span>
                  </div>
                </div>
                <div className="beat-display__taal">
                  {selectedTaalConfig.name} — {selectedTaalConfig.beats} Matras
                </div>
                <div className="linear-beats" style={{ marginTop: '1.5rem' }}>
                  {vibhagGroups.map((group, gi) => (
                    <div key={gi} style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      {group.map(b => {
                        const isBsam = selectedTaalConfig.sam.includes(b);
                        const isBkhali = selectedTaalConfig.khali.includes(b) && !isBsam;
                        return (
                          <div
                            key={b}
                            className={`linear-beat${isBsam ? ' linear-beat--sam' : isBkhali ? ' linear-beat--khali' : ''}${isPlaying && currentBeat === b ? ' linear-beat--active' : ''}`}
                          >
                            <span className="linear-beat__num">{b + 1}</span>
                            <span className="linear-beat__marker">{isBsam ? 'X' : isBkhali ? '0' : ''}</span>
                          </div>
                        );
                      })}
                      {gi < vibhagGroups.length - 1 && (
                        <div style={{ color: 'rgba(232, 184, 75, 0.25)', fontWeight: 'bold' }}>|</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                className={`master-play-btn ${isPlaying ? 'master-play-btn--active' : 'master-play-btn--inactive'}`}
                onClick={togglePlay}
                id="btn-practice-master-play"
              >
                {isPlaying ? (
                  <>
                    <Square size={20} /> STOP RIYAZ
                  </>
                ) : (
                  <>
                    <Play size={20} fill="currentColor" /> START RIYAZ
                  </>
                )}
              </button>
            </div>

            {/* Studio Mixer Card */}
            <div className="console-card">
              <h2 className="console-card__title">
                <Sliders size={18} /> Studio Mixer
              </h2>
              <div className="mixer-console">
                {/* Channel 1: Lehra */}
                <div className="mixer-channel">
                  <span className="mixer-channel__vol">{isMuted ? 'Mute' : `${Math.round(volume * 100)}%`}</span>
                  <div className="mixer-channel__fader-container">
                    <input
                      type="range"
                      className="mixer-channel__fader"
                      min="0"
                      max="100"
                      value={isMuted ? 0 : Math.round(volume * 100)}
                      onChange={e => {
                        setVolume(parseFloat(e.target.value) / 100);
                        if (isMuted) setIsMuted(false);
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    className={`mixer-channel__mute-btn${isMuted ? ' mixer-channel__mute-btn--muted' : ''}`}
                    onClick={() => setIsMuted(!isMuted)}
                    title="Mute Lehra Channel"
                  >
                    {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                  </button>
                  <span className="mixer-channel__label">Lehra</span>
                  <span className="mixer-channel__sublabel">{instrument}</span>
                </div>

                {/* Channel 2: Tanpura */}
                <div className="mixer-channel">
                  <span className="mixer-channel__vol">{isTanpuraMuted ? 'Mute' : `${Math.round(tanpuraVol * 100)}%`}</span>
                  <div className="mixer-channel__fader-container">
                    <input
                      type="range"
                      className="mixer-channel__fader"
                      min="0"
                      max="100"
                      value={isTanpuraMuted ? 0 : Math.round(tanpuraVol * 100)}
                      onChange={e => {
                        setTanpuraVol(parseFloat(e.target.value) / 100);
                        if (isTanpuraMuted) setIsTanpuraMuted(false);
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    className={`mixer-channel__mute-btn${isTanpuraMuted ? ' mixer-channel__mute-btn--muted' : ''}`}
                    onClick={() => setIsTanpuraMuted(!isTanpuraMuted)}
                    title="Mute Tanpura Channel"
                  >
                    {isTanpuraMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                  </button>
                  <span className="mixer-channel__label">Tanpura</span>
                  <span className="mixer-channel__sublabel">{tanpuraTuning} drone</span>
                </div>

                {/* Channel 3: Metronome Click */}
                <div className="mixer-channel">
                  <span className="mixer-channel__vol">{isClickMuted ? 'Mute' : `${Math.round(clickVol * 100)}%`}</span>
                  <div className="mixer-channel__fader-container">
                    <input
                      type="range"
                      className="mixer-channel__fader"
                      min="0"
                      max="100"
                      value={isClickMuted ? 0 : Math.round(clickVol * 100)}
                      onChange={e => {
                        setClickVol(parseFloat(e.target.value) / 100);
                        if (isClickMuted) setIsClickMuted(false);
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    className={`mixer-channel__mute-btn${isClickMuted ? ' mixer-channel__mute-btn--muted' : ''}`}
                    onClick={() => setIsClickMuted(!isClickMuted)}
                    title="Toggle Click Track"
                  >
                    {isClickMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                  </button>
                  <span className="mixer-channel__label">Click</span>
                  <span className="mixer-channel__sublabel">Metronome</span>
                </div>
              </div>
            </div>

            {/* Tempo Card */}
            <div className="console-card">
              <h2 className="console-card__title">
                <Activity size={18} /> Tempo & Laya
              </h2>
              <div className="tempo-section">
                <div className="tempo-num-display">
                  <div className="tempo-num-display__value">{bpm}</div>
                  <div className="tempo-num-display__label">BPM</div>
                </div>
                <div className="tempo-slider-wrap">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <button
                      type="button"
                      style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer' }}
                      onClick={() => setBpm(e => Math.max(30, e - 1))}
                    >
                      <Minus size={15} />
                    </button>
                    <span style={{ fontSize: '0.75rem', color: '#a08a70' }}>30 to 250 BPM</span>
                    <button
                      type="button"
                      style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer' }}
                      onClick={() => setBpm(e => Math.min(250, e + 1))}
                    >
                      <Plus size={15} />
                    </button>
                  </div>
                  <input
                    type="range"
                    className="fine-tune-slider"
                    min="30"
                    max="250"
                    value={bpm}
                    onChange={e => setBpm(parseInt(e.target.value, 10))}
                  />
                </div>
                <button
                  type="button"
                  className="tap-tempo-btn"
                  onClick={tapTempo}
                  title="Tap beat 4 times to set speed"
                >
                  TAP TEMPO
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Info Footnotes */}
        <div className="practice-info">
          <p>
            <Info size={14} style={{ verticalAlign: 'middle', marginRight: '0.4rem', color: 'var(--accent)' }} />
            <strong>Riyaz Tip:</strong> Classical Tabla Riyaz (practice) is most effective when done at a steady tempo (Laya) with a clean backing pitch. Tuning your tabla's fundamental note (Sa) to match your scale is critical for ear training. Use the <strong>Scale buttons</strong> to pitch-shift the lehra and Tanpura to match your drum.
          </p>
          <p>
            The synthesizers operate 100% locally using your browser's Web Audio API. <strong>Bansuri</strong> models wind air turbulence, <strong>Sitar</strong> models jawari bridge twang with detuned harmonics, and <strong>Tanpura</strong> simulates cyclical plucking of four bronze strings.
          </p>
        </div>
      </div>
    </main>
  );
}