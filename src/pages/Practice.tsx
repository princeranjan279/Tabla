import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Play, Square, Volume2, VolumeX, Sliders, Music,
  Activity, Info, Plus, Minus
} from 'lucide-react';
import './Practice.css';

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



// Tanpura Jawari Waveshaping Curve
let tanpuraCurveCache: Float32Array | null = null;
function getTanpuraJawariCurve(): Float32Array {
  if (tanpuraCurveCache) return tanpuraCurveCache;
  const len = 44100;
  const curve = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const x = (i * 2) / len - 1;
    if (x < -0.2) {
      curve[i] = x * 0.8;
    } else if (x > 0.2) {
      curve[i] = 0.16 + 0.24 * Math.sin(x * Math.PI * 0.4);
    } else {
      curve[i] = x * 1.2;
    }
  }
  tanpuraCurveCache = curve;
  return curve;
}

function synthHarmonium(
  ctx: AudioContext, freq: number,
  t0: number, dur: number, vol: number, destNode: AudioNode
): void {
  const master = ctx.createGain();
  master.connect(destNode);

  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(800, t0);
  lp.frequency.exponentialRampToValueAtTime(2400, t0 + 0.08);
  lp.frequency.exponentialRampToValueAtTime(1400, t0 + dur);
  lp.connect(master);

  const reedFilter = ctx.createBiquadFilter();
  reedFilter.type = 'peaking';
  reedFilter.frequency.value = 1500;
  reedFilter.Q.value = 2.2;
  reedFilter.gain.value = 9;
  reedFilter.connect(lp);

  const bellowsLFO = ctx.createOscillator();
  const bellowsGain = ctx.createGain();
  bellowsLFO.frequency.value = 5.2;
  bellowsGain.gain.value = 0.06;
  bellowsLFO.connect(bellowsGain);
  bellowsGain.connect(master.gain);
  bellowsLFO.start(t0);
  bellowsLFO.stop(t0 + dur + 0.1);

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

  const oscMale = ctx.createOscillator();
  const gMale = ctx.createGain();
  oscMale.type = 'sawtooth';
  oscMale.frequency.value = freq;
  oscMale.detune.value = -12;
  gMale.gain.value = 0.38;

  const oscFemale = ctx.createOscillator();
  const gFemale = ctx.createGain();
  oscFemale.type = 'sawtooth';
  oscFemale.frequency.value = freq * 2;
  oscFemale.detune.value = 12;
  gFemale.gain.value = 0.22;

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

  master.gain.setValueAtTime(0, t0);
  master.gain.linearRampToValueAtTime(vol * 0.85, t0 + 0.04);
  master.gain.setValueAtTime(vol, t0 + dur - 0.05);
  master.gain.linearRampToValueAtTime(0, t0 + dur + 0.03);
}



function synthTanpuraString(
  ctx: AudioContext,
  freq: number,
  t0: number,
  dur: number,
  vol: number,
  destNode: AudioNode
): void {
  const master = ctx.createGain();
  master.connect(destNode);

  master.gain.setValueAtTime(0, t0);
  master.gain.linearRampToValueAtTime(vol, t0 + 0.020);
  master.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

  const detunes = [-2.2, 2.2];
  detunes.forEach(det => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.value = freq;
    osc.detune.value = det;

    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(0.35, t0 + 0.025);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur * 0.85);

    osc.connect(g);
    g.connect(master);

    osc.start(t0);
    osc.stop(t0 + dur + 0.1);
  });

  const jawariPartials = [2, 3, 4, 5, 6, 7];
  jawariPartials.forEach(ratio => {
    const jOsc = ctx.createOscillator();
    const jG = ctx.createGain();
    
    jOsc.type = 'sawtooth';
    jOsc.frequency.value = freq * ratio;
    jOsc.detune.value = (Math.random() * 8 - 4);

    const peakFilter = ctx.createBiquadFilter();
    peakFilter.type = 'peaking';
    peakFilter.frequency.value = 1800;
    peakFilter.gain.value = 8;
    peakFilter.Q.value = 1.5;

    const shaper = ctx.createWaveShaper();
    shaper.curve = getTanpuraJawariCurve() as any;

    jG.gain.setValueAtTime(0, t0);
    jG.gain.linearRampToValueAtTime(0.08 / ratio, t0 + 0.035); 
    jG.gain.exponentialRampToValueAtTime(0.0001, t0 + dur * 0.40); 

    jOsc.connect(shaper);
    shaper.connect(peakFilter);
    peakFilter.connect(jG);
    jG.connect(master);

    jOsc.start(t0);
    jOsc.stop(t0 + dur * 0.45);
  });
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