// Utility to generate procedural audio tracks via OfflineAudioContext into WAV Blobs
// Renders rich multi-timbral synth and beat audio tracks entirely client-side.

function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const numSamples = buffer.length;
  const dataByteCount = numSamples * blockAlign;
  const headerByteCount = 44;
  const totalByteCount = headerByteCount + dataByteCount;

  const arrayBuffer = new ArrayBuffer(totalByteCount);
  const view = new DataView(arrayBuffer);

  function writeString(offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  // RIFF identifier
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataByteCount, true);
  writeString(8, 'WAVE');
  // FMT sub-chunk
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  // data sub-chunk
  writeString(36, 'data');
  view.setUint32(40, dataByteCount, true);

  // Interleave channel samples
  const channelData: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) {
    channelData.push(buffer.getChannelData(c));
  }

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    for (let c = 0; c < numChannels; c++) {
      let sample = channelData[c][i];
      // Clamp
      sample = Math.max(-1, Math.min(1, sample));
      // Scale to 16-bit signed integer
      const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, int16, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

// Track 1: Ambient Space & Deep Sub Drone
export async function generateAmbientTrack(duration = 45): Promise<string> {
  const sampleRate = 44100;
  const ctx = new OfflineAudioContext(2, sampleRate * duration, sampleRate);

  // Master compressor
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.setValueAtTime(-18, 0);
  comp.ratio.setValueAtTime(4, 0);
  comp.connect(ctx.destination);

  // Sub bass drone
  const sub = ctx.createOscillator();
  sub.type = 'sine';
  sub.frequency.setValueAtTime(55, 0); // A1

  const subGain = ctx.createGain();
  subGain.gain.setValueAtTime(0.4, 0);
  sub.connect(subGain);
  subGain.connect(comp);
  sub.start(0);
  sub.stop(duration);

  // Warm pad chords (A minor 9: A2, C3, E3, G3, B3)
  const padNotes = [110, 130.81, 164.81, 196.00, 246.94];
  padNotes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    osc.type = idx % 2 === 0 ? 'triangle' : 'sawtooth';
    osc.frequency.setValueAtTime(freq, 0);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, 0);
    // Subtle LFO modulation
    for (let t = 0; t < duration; t += 4) {
      filter.frequency.exponentialRampToValueAtTime(1200, t + 2);
      filter.frequency.exponentialRampToValueAtTime(500, t + 4);
    }

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.08, 0);

    const panner = ctx.createStereoPanner();
    panner.pan.setValueAtTime((idx / (padNotes.length - 1)) * 1.4 - 0.7, 0);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(panner);
    panner.connect(comp);

    osc.start(0);
    osc.stop(duration);
  });

  // Melodic arpeggio chimes
  const arpmelody = [220, 261.63, 329.63, 392.00, 493.88, 523.25, 659.25];
  const step = 0.5;
  for (let t = 1; t < duration - 2; t += step) {
    if (Math.random() > 0.3) {
      const freq = arpmelody[Math.floor(Math.random() * arpmelody.length)];
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.12, t + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);

      const panner = ctx.createStereoPanner();
      panner.pan.setValueAtTime((Math.random() * 2) - 1, t);

      osc.connect(gain);
      gain.connect(panner);
      panner.connect(comp);

      osc.start(t);
      osc.stop(t + 1.2);
    }
  }

  const renderedBuffer = await ctx.startRendering();
  const blob = audioBufferToWav(renderedBuffer);
  return URL.createObjectURL(blob);
}

// Track 2: Beat Focus & Electronic Rhythm (120 BPM)
export async function generateBeatTrack(duration = 40): Promise<string> {
  const sampleRate = 44100;
  const ctx = new OfflineAudioContext(2, sampleRate * duration, sampleRate);

  const comp = ctx.createDynamicsCompressor();
  comp.threshold.setValueAtTime(-14, 0);
  comp.ratio.setValueAtTime(6, 0);
  comp.connect(ctx.destination);

  const bpm = 124;
  const beat = 60 / bpm; // ~0.483s
  const sixteenth = beat / 4;

  // 4-on-the-floor Punchy Bass Kick
  for (let t = 0; t < duration - 1; t += beat) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(42, t + 0.12);

    gain.gain.setValueAtTime(0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);

    osc.connect(gain);
    gain.connect(comp);
    osc.start(t);
    osc.stop(t + 0.35);
  }

  // Snappy Snare / Clap on beats 2 and 4
  for (let t = beat; t < duration - 1; t += beat * 2) {
    // Noise burst
    const bufferSize = sampleRate * 0.15;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1200, t);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(comp);
    whiteNoise.start(t);
    whiteNoise.stop(t + 0.15);
  }

  // Rolling Hi-hats
  for (let t = 0; t < duration - 1; t += sixteenth) {
    const isOffbeat = (Math.round(t / sixteenth) % 4) === 2;
    const vol = isOffbeat ? 0.18 : 0.08;

    const bufferSize = sampleRate * 0.04;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const hihat = ctx.createBufferSource();
    hihat.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7500, t);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    hihat.connect(filter);
    filter.connect(gain);
    gain.connect(comp);
    hihat.start(t);
    hihat.stop(t + 0.04);
  }

  // Driving Bassline (F minor synth bass: F1, Ab1, Bb1, C2)
  const bassNotes = [43.65, 51.91, 58.27, 65.41];
  for (let t = 0; t < duration - 1; t += beat / 2) {
    const noteIdx = Math.floor((t / (beat * 2)) % bassNotes.length);
    const freq = bassNotes[noteIdx];

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, t);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(350, t);
    filter.frequency.exponentialRampToValueAtTime(180, t + beat / 2);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + (beat / 2) * 0.9);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(comp);

    osc.start(t);
    osc.stop(t + beat / 2);
  }

  // Synth Arpeggiator Lead
  const arpNotes = [174.61, 207.65, 261.63, 311.13, 349.23, 415.30];
  let stepIdx = 0;
  for (let t = beat * 4; t < duration - 1; t += sixteenth * 2) {
    const freq = arpNotes[stepIdx % arpNotes.length];
    stepIdx++;

    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, t);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2400, t);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + sixteenth * 1.8);

    const panner = ctx.createStereoPanner();
    panner.pan.setValueAtTime(Math.sin(t * 2) * 0.6, t);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(panner);
    panner.connect(comp);

    osc.start(t);
    osc.stop(t + sixteenth * 2);
  }

  const renderedBuffer = await ctx.startRendering();
  const blob = audioBufferToWav(renderedBuffer);
  return URL.createObjectURL(blob);
}
