'use client';

/**
 * Nhạc nền 8-bit tự sinh bằng Web Audio, âm giai ngũ cung (cung thương giốc chủy vũ)
 * cho chất cổ phong. Giai điệu ghép từ nhiều câu nhạc chọn ngẫu nhiên nên ít lặp.
 * Hai chế độ: 'calm' (tu luyện) và 'battle' (trừ yêu, nhanh và dồn dập hơn).
 */

type Mode = 'calm' | 'battle';

// Ngũ cung Rê: D E F# A B (số MIDI)
const SCALE = [50, 52, 54, 57, 59, 62, 64, 66, 69, 71, 74, 76, 78, 81, 83];

// Câu nhạc: chỉ số trong SCALE, -1 là nghỉ, mỗi câu 16 nốt (móc đơn)
const CALM_PHRASES = [
  [7, -1, 8, 9, 10, -1, 9, 8, 7, -1, 5, -1, 7, -1, -1, -1],
  [9, 10, 12, 10, 9, -1, 7, -1, 8, 9, 8, 7, 5, -1, -1, -1],
  [5, -1, 7, 8, 7, 5, 4, -1, 5, -1, 7, -1, 9, -1, 8, -1],
  [10, -1, 9, -1, 10, 12, 13, 12, 10, -1, 9, 7, 8, -1, -1, -1],
  [7, 8, 9, -1, 12, -1, 10, 9, 7, -1, 8, -1, 5, -1, -1, -1],
  [12, -1, 10, -1, 9, -1, 10, 9, 7, 5, 7, -1, 7, -1, -1, -1],
];

const BATTLE_PHRASES = [
  [7, 7, 9, 7, 10, 7, 9, 7, 12, 10, 9, 7, 9, 10, 12, 13],
  [5, 7, 8, 9, 10, 9, 8, 7, 10, 12, 10, 9, 7, 8, 9, 10],
  [12, -1, 12, 10, 12, -1, 13, 12, 10, 9, 10, -1, 9, 7, 8, 9],
  [9, 10, 9, 7, 9, 10, 12, -1, 13, 12, 10, 12, 9, -1, 7, -1],
];

// Vòng hợp âm (gốc trầm): D - B - A - D / D - G(E) - A - B
const BASS_ROOTS = [
  [38, 47, 45, 38],
  [38, 40, 45, 47],
];

function midi(n: number) {
  return 440 * Math.pow(2, (n - 69) / 12);
}

class Chiptune {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private nextTime = 0;
  private step = 0;
  private phrase: number[] = CALM_PHRASES[0];
  private bassLine = BASS_ROOTS[0];
  mode: Mode = 'calm';
  playing = false;

  start() {
    if (this.playing) return;
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.11;
      this.master.connect(this.ctx.destination);
      const len = this.ctx.sampleRate * 0.1;
      this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    this.ctx.resume();
    this.playing = true;
    this.nextTime = this.ctx.currentTime + 0.1;
    this.timer = setInterval(() => this.schedule(), 60);
  }

  stop() {
    this.playing = false;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.ctx?.suspend();
  }

  setMode(m: Mode) {
    this.mode = m;
  }

  private tone(type: OscillatorType, freq: number, t: number, dur: number, vol: number) {
    if (!this.ctx || !this.master) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.01);
    g.gain.setValueAtTime(vol, t + dur * 0.6);
    g.gain.linearRampToValueAtTime(0, t + dur);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  private hat(t: number, vol: number) {
    if (!this.ctx || !this.master || !this.noise) return;
    const s = this.ctx.createBufferSource();
    s.buffer = this.noise;
    const f = this.ctx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = 6000;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    s.connect(f).connect(g).connect(this.master);
    s.start(t);
    s.stop(t + 0.06);
  }

  private schedule() {
    if (!this.ctx) return;
    const battle = this.mode === 'battle';
    const stepDur = battle ? 0.12 : 0.24; // móc đơn
    while (this.nextTime < this.ctx.currentTime + 0.3) {
      const i = this.step % 16;
      if (i === 0) {
        const pool = battle ? BATTLE_PHRASES : CALM_PHRASES;
        this.phrase = pool[Math.floor(Math.random() * pool.length)];
        if (this.step % 64 === 0) this.bassLine = BASS_ROOTS[Math.floor(Math.random() * BASS_ROOTS.length)];
      }
      const t = this.nextTime;
      const n = this.phrase[i];
      if (n >= 0) {
        // giai điệu: sóng vuông, thỉnh thoảng lên quãng tám cho bớt lặp
        const up = !battle && Math.random() < 0.08 ? 12 : 0;
        this.tone('square', midi(SCALE[n] + up), t, stepDur * (battle ? 0.9 : 1.6), battle ? 0.22 : 0.18);
      }
      // bè trầm: sóng tam giác
      const bar = Math.floor(this.step / 16) % 4;
      const root = this.bassLine[bar];
      if (battle ? i % 2 === 0 : i % 4 === 0) this.tone('triangle', midi(root + (battle && i % 4 === 2 ? 12 : 0)), t, stepDur * (battle ? 1.8 : 3.5), 0.4);
      // đệm hợp âm thưa kiểu đàn tranh
      if (!battle && i % 8 === 6) this.tone('square', midi(root + 24 + 7), t, stepDur * 0.8, 0.06);
      // trống
      if (battle) {
        if (i % 2 === 1) this.hat(t, 0.25);
        if (i % 4 === 0) this.tone('square', 70, t, 0.06, 0.35);
      } else if (i % 4 === 2) this.hat(t, 0.08);
      this.nextTime += stepDur;
      this.step++;
    }
  }
}

let music: Chiptune | null = null;
export function getMusic(): Chiptune {
  if (!music) music = new Chiptune();
  return music;
}

const KEY = 'vkl.music';
export function musicPref(): boolean {
  try {
    return localStorage.getItem(KEY) !== 'off';
  } catch {
    return true;
  }
}
export function setMusicPref(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? 'on' : 'off');
  } catch {
    /* bỏ qua */
  }
}
