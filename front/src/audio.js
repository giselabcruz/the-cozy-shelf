/**
 * Cozy Ambient Sound Synthesizer using Web Audio API.
 * Generates soft fireplace crackle and ambient rain white noise.
 */

class CozyAudio {
  constructor() {
    self = this;
    this.ctx = null;
    this.isPlaying = false;
    this.crackleNode = null;
    this.gainNode = null;
    this.timer = null;
  }

  init() {
    if (this.ctx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContext();
  }

  toggle() {
    if (!this.ctx) this.init();

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    if (this.isPlaying) {
      this.stop();
    } else {
      this.start();
    }

    return this.isPlaying;
  }

  start() {
    if (!this.ctx) return;
    this.isPlaying = true;

    // Master volume gain
    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.setValueAtTime(0.08, this.ctx.currentTime);
    this.gainNode.connect(this.ctx.destination);

    // Warm Low-pass filtered pink noise for fireplace rumble
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      let white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      output[i] *= 0.11;
      b6 = white * 0.115926;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(350, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(this.gainNode);
    whiteNoise.start();

    this.crackleNode = whiteNoise;

    // Random pops & crackles
    this.schedulePop();
  }

  schedulePop() {
    if (!this.isPlaying) return;

    const nextPop = Math.random() * 400 + 100;
    setTimeout(() => {
      if (!this.isPlaying || !this.ctx) return;
      
      const popOsc = this.ctx.createOscillator();
      const popGain = this.ctx.createGain();

      popOsc.type = 'triangle';
      popOsc.frequency.setValueAtTime(Math.random() * 400 + 100, this.ctx.currentTime);

      popGain.gain.setValueAtTime(Math.random() * 0.04 + 0.01, this.ctx.currentTime);
      popGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

      popOsc.connect(popGain);
      popGain.connect(this.gainNode);

      popOsc.start();
      popOsc.stop(this.ctx.currentTime + 0.05);

      this.schedulePop();
    }, nextPop);
  }

  stop() {
    this.isPlaying = false;
    if (this.crackleNode) {
      try {
        this.crackleNode.stop();
        this.crackleNode.disconnect();
      } catch (e) {}
    }
  }
}

export const cozyAudio = new CozyAudio();
