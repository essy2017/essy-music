'use strict';

import React from 'react';
import PropTypes from 'prop-types';
import Tone from 'tone';

import Key from './Key';
import KeySharp from './KeySharp';

const OCTAVES = 3;

/**
 * Gets notes for keyboard.
 * @method getData
 * @param octaves {Number} Number of octaves.
 * @param range1 {Number} Octave range for first oscillator.
 * @param range2 {Number} Octave range for second oscillator.
 * @param range3 {Number} Octave range for third oscillator.
 * @param octaveEnd {Number} Octave ending point.
 * @return {Object[]} Each with properties:
 *    index {Number}
 *    note1 {String}
 *    note2 {String}
 *    note3 {String}
 *    sharp {Boolean}
 */
function getData (octaves, range1, range2, range3) {

  const notes  = 'CDEFGAB'.split('');
  const sharps = 'CDFGA';

  function freq (x) {
    return 440 * Math.pow(2, (x - 49) / 12);
  }

  let data  = [];
  let index = 0;
  let count = 0;
  let freqCount = 4;

  for (let octave = 0; octave < octaves; octave++) {
    for (let i = 0; i < notes.length; i++) {
      data.push({
        note1 : notes[i] + (range1 + count),
        note2 : notes[i] + (range2 + count),
        note3 : notes[i] + (range3 + count),
        freq3 : Math.pow(2, range3 - 1) * freq(freqCount),
        sharp : false,
        index : index
      });
      freqCount += 1;
      if (sharps.indexOf(notes[i]) > -1) {
        data.push({
          note1 : notes[i] + '#' + (range1 + count),
          note2 : notes[i] + '#' + (range2 + count),
          note3 : notes[i] + '#' + (range3 + count),
          freq3 : Math.pow(2, range3 - 1) * freq(freqCount),
          sharp : true,
          index : index
        });
        freqCount += 1;
      }
      index++;
    }
    count++;
  }

  data.push({
    note1 : 'C' + (range1 + count),
    note2 : 'C' + (range2 + count),
    note3 : 'C' + (range3 + count),
    freq3 : Math.pow(2, range3 - 1) * freq(freqCount),
    sharp : false,
    index : index
  });
  freqCount += 1;
  data.push({
    note1 : 'C#' + (range1 + count),
    note2 : 'C#' + (range2 + count),
    note3 : 'C#' + (range3 + count),
    freq3 : Math.pow(2, range3 - 1) * freq(freqCount),
    sharp : true,
    index : index
  });

  return data;
}






class Oscillators extends Tone.AudioNode {

  constructor (options) {

    options = Tone.defaultArg(options, Oscillators.defaults);

    super(/*options*/);

    this.createInsOuts(1, 1);

    this.osc1  = new Tone.Oscillator(options.oscillator1);
    this.osc2  = new Tone.Oscillator(options.oscillator2);
    this.osc3  = new Tone.Oscillator(options.oscillator3);
    this.noise = new Tone.Noise(options.noise);

    this.freq1 = this.osc1.frequency;
    this.freq2 = this.osc2.frequency;
    this.freq3 = this.osc3.frequency;

    //this.output = new Tone.Gain();

    this.connectComponent(this.osc1, options.oscillator1.on);
    this.connectComponent(this.osc2, options.oscillator2.on);
    this.connectComponent(this.osc3, options.oscillator3.on);
    this.connectComponent(this.noise, options.noise.on);
  }

  connectComponent (component, connect) {
    component.disconnect();
    if (connect) {
      component.on = true;
      component.connect(this.output);
    }
    else {
      component.on = false;
    }
    return this;
  }

  setComponent (component, options) {
    component.type = options.type;
    component.volume.value = options.volume;
    if ('detune' in options) {
      component.detune.value = options.detune;
    }
    if (options.on !== component.on) {
      this.connectComponent(component, options.on);
    }
    return this;
  }

  setNotes (note1, note2, note3, time, portamento) {
    if (portamento > 0) {
      this.freq1.setValueAtTime(this.freq1.value, time);
      this.freq2.setValueAtTime(this.freq2.value, time);
      this.freq3.setValueAtTime(this.freq3.value, time);
      this.freq1.exponentialRampToValueAtTime(note1, time + portamento);
      this.freq2.exponentialRampToValueAtTime(note2, time + portamento);
      this.freq3.exponentialRampToValueAtTime(note3, time + portamento);
    }
    else {
      this.freq1.setValueAtTime(note1, time);
      this.freq2.setValueAtTime(note2, time);
      this.freq3.setValueAtTime(note3, time);
    }
    return this;
  }

  start (time) {
    this.osc1.start(time);
    this.osc2.start(time);
    this.osc3.start(time);
    this.noise.start(time);
    return this;
  }

  stop (time) {
    this.osc1.stop(time);
    this.osc2.stop(time);
    this.osc3.stop(time);
    this.noise.stop(time);
    return this;
  }

  dispose () {
    return this;
  }

}

Oscillators.defaults = {
  noise: {
    on     : false,
    type   : 'pink',
    volume : 0
  },
  oscillator1: {
    on     : true,
    range  : 1,
    type   : 'triangle',
    volume : 0.5
  },
  oscillator2: {
    on      : true,
    detune  : 10,
    range   : 2,
    type    : 'sawtooth',
    volume  : 0.5
  },
  oscillator3: {
    on      : true,
    detune  : 0,
    range   : 2,
    type    : 'triangle',
    volume  : 0.5
  }
};


class Filter extends Tone.AudioNode {

  constructor (src1, src2, options) {

    options = Tone.defaultArg(options, Filter.defaults);

    super();

    this.createInsOuts(2, 1);

    this.eqOscSource    = this.input[0] = src1;
    this.lfoNoiseSource = this.input[1] = src2;
    this.crossFade      = this.output = new Tone.CrossFade();
    this.lfoNoiseFilter = new Tone.Filter(options.filter);
    this.eqOscFilter    = new Tone.Filter(options.filter);


    this.envelope = new Tone.ScaledEnvelope({
      attack  : options.envelope.attack,
      decacy  : options.envelope.decay,
      sustain : options.envelope.sustain,
      release : options.envelope.release,
      min     : 0,
      max     : options.filter.frequency
    });

    this.lfo = new Tone.LFO({
      frequency : options.lfoRate,
      min       : 0,
      max       : options.filter.frequency,
      type      : 'triangle'
    }).start();

    this.noiseScale = new Tone.Scale(0, options.filter.frequency);


    this._filterFreq = options.filter.frequency;

    this.eqOsc    = options.eqOsc;
    this.lfoNoise = options.lfoNoise;
    this.modulate = options.modulate;

    this.input[0].connect(this.eqOscFilter);
    this.input[1].connect(this.lfoNoiseFilter);
    this.eqOscFilter.connect(this.crossFade, 0, 0);
    this.lfoNoiseFilter.connect(this.crossFade, 0, 1);

  }

  setFilter (options) {

    this._filterFreq = options.frequency;

    this.eqOscFilter.set('Q', options.resonance);
    this.lfoNoiseFilter.set('Q', options.resonance);

    this.lfo.max = options.frequency;
    this.noiseScale.set('max', options.frequency);

    this.envelope.attack  = options.attack;
    this.envelope.decay   = options.decay;
    this.envelope.sustain = options.sustain;
    this.envelope.release = options.release;
    this.envelope.max     = options.frequency;

    if (!this._modulate) {
      this._resetFilter(options.frequency);
    }
  }

  triggerAttack (time) {
    this.envelope.triggerAttack(time);
  }

  triggerRelease (time) {
    this.envelope.triggerRelease(time);
  }

  set eqOsc (eqOsc) {
    this._eqOsc = eqOsc;

    if (eqOsc === 'eq') {
      this.envelope.connect(this.eqOscFilter.frequency);
    }
    console.log('eqOsc', eqOsc);
  }

  set lfoNoise (lfoNoise) {
    this._lfoNoise = lfoNoise;
    if (this._modulate) {
      this._connectLfoNoise(lfoNoise);
    }
  }

  _resetFilter (freq) {
    this.eqOscFilter.set('frequency', freq);
    this.lfoNoiseFilter.set('frequency', freq);
  }

  _disconnectNoise () {
    console.log('disconnectNoise');
    this.noiseScale.disconnect();
    this.lfoNoiseSource.noise.disconnect();
    this.lfoNoiseSource.noise.set('playbackRate', 1);
    this.lfoNoiseSource.connectComponent(this.lfoNoiseSource.noise, this.lfoNoiseSource.noise.on);
  }

  _connectLfoNoise (lfoNoise) {
    if (lfoNoise === 'lfo') {
      this._disconnectNoise();
      this.lfo.connect(this.lfoNoiseFilter.frequency);
    }
    else {
      console.log('connect noise');
      this.lfo.disconnect();
      this.lfoNoiseSource.noise.disconnect();
      this.lfoNoiseSource.noise.set('playbackRate', 0.2);
      this.lfoNoiseSource.noise.connect(this.noiseScale);
      this.noiseScale.set('max', this._filterFreq);
      this.noiseScale.connect(this.lfoNoiseFilter.frequency);
    }
  }

  set lfoRate (rate) {
    this.lfo.set('frequency', rate);
  }

  set mix (mix) {
    this.crossFade.fade.value = mix;
    console.log('mix', mix);
  }

  set modulate (mod) {
    if (this._modulate = mod) {
      this._connectLfoNoise(this._lfoNoise);
      if (this._eqOsc === 'eq') {
        this.envelope.connect(this.eqOscFilter.frequency);
      }
      else {
        // connect osc...
      }
    }
    else {
      if (this._lfoNoise === 'lfo') {
        this.lfo.disconnect();
      }
      else {
        this._disconnectNoise();
      }
      this._resetFilter(this._filterFreq);
    }

  }

}

Filter.defaults = {
  envelope : {
    attack  : 0.005,
    decay   : 0.1,
    sustain : 0.5
  },
  eqOsc : 'eq',
  filter : {
    frequency : 1,
    Q         : 0.5
  },
  lfoNoise : 'lfo',
  lfoRate  : 0,
  modulate : false
};


/*******************************************************************************
 *
 * A Moog synthesizer.
 * @class Moog
 * @extends Tone.Monophonic
 *
 ******************************************************************************/
class Moog extends Tone.Monophonic {

 /**
  * Constructor.
  * @method constructor
  * @param options {Object} See defaults for details.
  */
  constructor (options) {

    options = Tone.defaultArg(options, Moog.defaults);

    super(options);

    this.source      = new Oscillators(options);
    this.envelope    = new Tone.AmplitudeEnvelope(options.envelope);
    this._reverb     = new Tone.JCReverb(options.reverb);

    this.filter = new Filter(this.source, this.source, {
      filter   : options.filter,
      lfoNoise : options.lfoNoise,
      lfoRate  : options.lfoRate,
      modulate : options.filterModOn
    });

    //this.filter = new Tone.Filter(options.filter);
    this.lfoNoiseFilter = new Tone.Filter(options.filter);
    this.lfoNoiseSig    = new Tone.Signal();
    //this.lfoNoiseVol    = new Tone.Volume();

    this.eqOscFilter = new Tone.Filter(options.filter);
    this.eqOscSig    = new Tone.Signal();
    //this.eqOscVol    = new Tone.Volume();

    this.eq = new Tone.Envelope({
      attack  : options.filter.attack,
      decay   : options.filter.decay,
      sustain : options.filter.sustain,
      release : options.filter.decay
    });
    /*this.envelope = new Tone.ScaledEnvelope({
      attack  : options.envelope.attack,
      decay   : options.envelope.decay,
      sustain : options.envelope.sustain,
      release : options.envelope.decay,
      min     : this._node.value,
      max     : options.envelope.contour * this._node.value
    });*/

    this.lfo = new Tone.LFO({
      frequency : options.lfoRate,
      min       : 0,
      max       : options.filter.frequency,
      type      : 'triangle'
    }).start();
    this.lfo.connect(this.lfoNoiseSig);

    this.portamento  = options.portamento;
    //this.lfoNoise    = options.lfoNoise;
    //this.eqOsc       = options.eqOsc;
    //this.filterModOn = options.filterModOn;
    //this.modMix      = options.modMix;

    this._filterFreq  = options.filter.frequency;

    this.filter.chain(this.envelope, this._reverb, this.output);

  }



  /*set eqOsc (eqOsc) {
    //console.log('eqOsc', eqOsc);
    this._eqOsc = eqOsc;
  }*/

/*  set filterModOn (on) {
    return;
    //console.log('filterModOn', on);
    this._filterModOn = on;
    if (on) {
      if (this._lfoNoise === 'lfo') {
        this.lfoNoiseSig.connect(this.lfoNoiseFilter.frequency);
      }
    }
    else {
      if (this._lfoNoise === 'lfo') {
        this.lfoNoiseSig.disconnect();
        this.lfoNoiseFilter.set('frequency', this._filterFreq);
      }
    }
  }*/

  //set lfoNoise (lfoNoise) {
    //console.log('lfoNoise', lfoNoise);
  //  this._lfoNoise = lfoNoise;
  //}

 /**
  * Sets frequency for LFO.
  * @method lfoRate
  * @param rate {Number}
  */
  //set lfoRate (rate) {
  //  this.lfo.set('frequency', rate);
  //}

  /*set modMix (mix) {
    //this.lfo.amplitude.value = mix;
    //this.lfoNoiseVol.set('volume', -20 + 20*mix);
      console.log('modMix', -20 + 20 * mix);
  }*/

 /**
  * Setter for reverb.
  * @method reverb
  * @param reverb {Number}
  */
  set reverb (reverb) {
    this._reverb.roomSize.value = reverb;
  }

 /**
  * Sets amplitude envelope properties.
  * @method setEnvelope
  * @param options {Object} With properties:
  *   attack {Number}
  *   decay {Number}
  *   sustain {Number}
  */
  setEnvelope (options) {
    this.envelope.attack  = options.attack;
    this.envelope.decay   = options.decay;
    this.envelope.sustain = options.sustain;
    this.envelope.release = options.decay;
  }

 /**
  * Sets filter properties.
  * @method setFilter
  * @param options {Object} With properties:
  *   frequency {Number}
  *   resonance {Number}
  */
  //setFilter (options) {
    //this.filter.set('frequency', options.frequency);
    //this.filter.frequency.value = options.frequency;
    /*this._filterFreq = options.frequency;
    this.lfoNoiseFilter.set('Q', options.resonance);
    this.lfo.max = options.frequency;

    if (!this._filterModOn) {
      this.lfoNoiseFilter.set('frequency', options.frequency);
    }

  }*/

 /**
  * Sets rate on LFO for filter.
  * @method setLFORate
  * @param rate {Number}
  */
  /*setLFORate (rate) {
    this.lfoNoise.lfoRate = rate;
  }*/

 /**
  * Sets LFO / noise filter selection.
  * @method setLFONoise
  * @param lfoNoise {String} "lfo" or "noise".
  */
  /*setLFONoise (lfoNoise) {
    this.lfoNoise.lfoNoise = lfoNoise;
  }*/

 /**
  * Sets the modulation mix. 0 is pure filter / osc and 1 is pure LFO / noise.
  * @method setModMix
  * @param mix {Number}
  */
  /*setModMix (mix) {

    function getVol (x) {
      return -40 + x * 40;
    }
    this.volLFONoise.set('volume', getVol(mix));
    this.volEQOsc.set('volume', getVol(1 - mix));
  }*/

 /**
  * Sets a note value.
  * @method setNote
  * @param note1 {String} For first oscillator.
  * @param note2 {String} For second oscillator.
  * @param note3 {String} For third oscillator.
  * @param time {Number} Time.
  * @return {Moog}
  */
  setNote (note1, note2, note3, time) {
    time = this.toSeconds(time);
    this.source.setNotes(note1, note2, note3, time, this.portamento);
    return this;
  }

 /**
  * Triggers attack.
  * @method triggerAttack
  * @param note1 {String} For first oscillator.
  * @param note2 {String} For second oscillator.
  * @param note3 {String} For third oscillator.
  * @param time {Number}
  * @param velocity {Number}
  * @return {Moog}
  */
  triggerAttack (note1, note2, note3, time, velocity) {
    time = this.toSeconds(time);
    this._triggerEnvelopeAttack(time, velocity);
    this.setNote(note1, note2, note3, time);
    return this;
  }

 /**
  * Triggers envelope attack.
  * @method _triggerEnvelopeAttack
  * @param time {Number}
  * @param velocity {Number}
  * @return {Moog}
  */
  _triggerEnvelopeAttack (time, velocity) {
    this.filter.triggerAttack(time);
    this.envelope.triggerAttack(time, velocity);
    this.source.start(time);
    return this;
  }

 /**
  * Triggers envelope release.
  * @method _triggerEnvelopeRelease
  * @param time {Number}
  * @return {Moog}
  */
  _triggerEnvelopeRelease (time) {
    time = this.toSeconds(time);
    this.filter.triggerRelease(time);
    this.envelope.triggerRelease(time);
    this.source.stop(time + this.envelope.release);
    return this;
  }

  dispose () {
    return this;
  }

}

Moog.defaults = {
  envelope: {
    attack  : 0.005,
    decay   : 0.1,
    sustain : 0.3,
    release : 1
  },
  eqOsc : 'eq',
  filter: {
    type      : 'lowpass',
    frequency : 22000,
    Q         : 0.5,
    rolloff   : -24,
    attack    : 0.005,
    decay     : 0.1,
    sustain   : 0.5
  },
  filterModOn : true,
  lfoNoise : 'lfo',
  lfoRate  : 10,
  modMix   : 0.5,
  noise: {
    on     : false,
    type   : 'pink',
    volume : 0
  },
  oscillator1: {
    on     : true,
    range  : 1,
    type   : 'triangle',
    volume : 0.5
  },
  oscillator2: {
    on      : true,
    detune  : 10,
    range   : 2,
    type    : 'sawtooth',
    volume  : 0.5
  },
  oscillator3: {
    on      : true,
    detune  : 0,
    range   : 2,
    type    : 'triangle',
    volume  : 0.5
  },
  portamento : 0,
  reverb     : 0
};


/*******************************************************************************
 *
 * Creates a piano.
 * @class Piano
 * @extends React.Component
 *
 ******************************************************************************/
export default class Piano extends React.Component {

 /**
  * Constructor.
  * @method constructor
  * @param props {Object}
  */
  constructor (props) {
    super(props);
    this.state = {
      active: []
    };
    this.data  = getData(OCTAVES, props.oscillator1.range, props.oscillator2.range, props.oscillator3.range);
    this.synth = this.getSynth(
      props.oscillator1,
      props.oscillator2,
      props.oscillator3,
      props.noise,
      props.envelope,
      props.filter,
      props.controls
    );
    this.mouseDown        = false;
    this.handleMouseUpDoc = this.handleMouseUpDoc.bind(this);
  }

 /**
  * Lifecycle method to update synth as needed.
  * @method componentWillReceiveProps
  * @param nextProps {Object}
  */
  componentWillReceiveProps (nextProps) {

    const props    = this.props;
    const synth    = this.synth;
    const nextOsc1 = nextProps.oscillator1;
    const nextOsc2 = nextProps.oscillator2;
    const nextOsc3 = nextProps.oscillator3;
    const controls = props.controls;
    const nextControls = nextProps.controls;

    // Oscillators.
    if (
      props.oscillator1 !== nextOsc1 ||
      props.oscillator2 !== nextOsc2 ||
      props.oscillator3 !== nextOsc3
    ) {
      this.data = getData(OCTAVES, nextOsc1.range, nextOsc2.range, nextOsc3.range);
      synth.source.setComponent(synth.source.osc1, nextOsc1);
      synth.source.setComponent(synth.source.osc2, nextOsc2);
      synth.source.setComponent(synth.source.osc3, nextOsc3);
    }

    // Noise source.
    if (props.noise !== nextProps.noise) {
      synth.source.setComponent(synth.source.noise, nextProps.noise);
    }

    // Amplitude envelope.
    if (props.envelope !== nextProps.envelope) {
      synth.setEnvelope(nextProps.envelope);
    }

    // Filter and filter envelop properties.
    if (props.filter !== nextProps.filter) {
      synth.filter.setFilter(nextProps.filter);
    }

    // Filter-oscillator selection.
    if (controls.eqOsc !== nextControls.eqOsc) {
      synth.filter.eqOsc = nextControls.eqOsc;
    }

    // LFO rate.
    if (controls.lfoRate !== nextControls.lfoRate) {
      synth.filter.lfoRate = nextControls.lfoRate;
    }

    // LFO-noise selection.
    if (controls.lfoNoise !== nextControls.lfoNoise) {
      synth.filter.lfoNoise = nextControls.lfoNoise;
    }

    // Filter-oscillator/LFO-noise modulation mix.
    if (controls.modMix !== nextControls.modMix) {
      synth.filter.mix = nextControls.modMix;
    }

    // Filter modulation on or off.
    if (controls.filterModOn !== nextControls.filterModOn) {
      synth.filter.modulate = nextControls.filterModOn;
    }

    // Glide.
    if (controls.glide !== nextControls.glide) {
      synth.portamento = nextControls.glide;
    }

    // Reverb.
    if (controls.reverb !== nextControls.reverb) {
      synth.reverb = nextControls.reverb;
    }

  }

 /**
  * Gets a new synth.
  * @method getSynth
  * @param osc1 {Object} With properties:
  *   on {Boolean}
  *   volume {Number}
  * @param osc2 {Object} With properties:
  *   detune {Number}
  *   on {Boolean}
  *   volume {Number}
  * @param osc3 {Object} With properties:
  *   detune {Number}
  *   on {Boolean}
  *   volume {Number}
  * @param noise {Object} With properties:
  *   on {Boolean}
  *   type {String} "pink" or "white".
  *   volume {Number}
  * @param envelope {Object} With properties:
  *   attack {Number}
  *   decay {Number}
  *   sustain {Number}
  * @param filter {Object} With properties:
  *   frequency {Number}
  *   rolloff {Number}
  *   type {String}
  * @param controls {Object} With properties:
  *   eqOsc {String} "eq" or "osc".
  *   filterModOn {Boolean}
  *   glide {Number}
  *   lfoNoise {String} "lfo" or "noise".
  *   lfoRate {Number}
  *   reverb {Number}
  * @return {Moog}
  */
  getSynth (osc1, osc2, osc3, noise, envelope, filter, controls) {

    if (this.synth) {
      this.synth.dispose();
      this.synth = null;
    }

    const synth = new Moog({
      eqOsc       : controls.eqOsc,
      filterModOn : controls.filterModOn,
      lfoNoise    : controls.lfoNoise,
      lfoRate     : controls.lfoRate,
      noise       : noise,
      oscillator1 : osc1,
      oscillator2 : osc2,
      oscillator3 : osc3,
      envelope: {
        attack  : envelope.attack,
        decay   : envelope.decay,
        sustain : envelope.sustain,
        release : envelope.decay
      },
      filter : {
        attack     : filter.attack,
        decay      : filter.decay,
        freqeuency : filter.frequency,
        Q          : filter.resonance,
        rolloff    : filter.rolloff,
        sustain    : filter.sustain,
        type       : filter.type
      },
      portamento : controls.glide,
      reverb     : controls.reverb
    });
    return synth.toMaster();
  }

 /**
  * Starts playing a note.
  * @method startNote
  * @param note1 {String} First oscillator.
  * @param note2 {String} Second oscillator.
  * @param note3 {String} Third oscillator.
  * @param freq3 {Number} Third oscillator.
  */
  startNote (note1, note2, note3, freq3) {
    this.synth.triggerAttack(note1, note2, note3, freq3);
    let active = this.state.active.map(d => d);
    active.push(note1);
    this.setState({
      active: active
    });
  }

 /**
  * Stops playing all notes.
  * @method endAllNotes
  */
  endAllNotes () {
    this.synth.triggerRelease();
    this.setState({
      active: []
    });
  }

 /**
  * Stops playing a note.
  * @method endNote
  * @param note1 {String} First oscillator.
  * @param note2 {String} Second oscillator.
  * @param note3 {String} Third oscillator.
  * @param freq3 {Number} Third oscillator.
  */
  endNote (note1, note2, note3, freq3) {
    this.synth.triggerRelease(/*note*/);
    let active = this.state.active;
    active.splice(active.indexOf(note1), 1);
    this.setState({
      active: active
    });
  }

 /**
  * Handler for mousedown events on keys.
  * @method handleMouseDown
  * @param note1 {String} First oscillator.
  * @param note2 {String} Second oscillator.
  * @param note3 {String} Third oscillator.
  * @param freq3 {Number} Third oscillator.
  */
  handleMouseDown (note1, note2, note3, freq3) {
    this.mouseDown = true;
    window.addEventListener('mouseup', this.handleMouseUpDoc, false);
    this.startNote(note1, note2, note3, freq3);
  }

 /**
  * Handler for mouseenter events on keys.
  * @method handleMouseEnter
  * @param note1 {String} First oscillator.
  * @param note2 {String} Second oscillator.
  * @param note3 {String} Third oscillator.
  * @param freq3 {Number} Third oscillator.
  */
  handleMouseEnter (note1, note2, note3, freq3) {
    if (!this.mouseDown) return;
    this.startNote(note1, note2, note3, freq3);
  }

 /**
  * Handler for mouseleave events on keys.
  * @method handleMouseLeave
  * @param note1 {String} First oscillator.
  * @param note2 {String} Second oscillator.
  * @param note3 {String} Third oscillator.
  * @param freq3 {Number} Third oscillator.
  */
  handleMouseLeave (note1, note2, note3, freq3) {
    if (!this.mouseDown) return;
    this.endNote(note1, note2, note3);
  }

 /**
  * Handler for mouseup events on document.
  * @method handleMouseUpDoc
  * @param e {Event}
  */
  handleMouseUpDoc (e) {
    this.mouseDown = false;
    window.removeEventListener('mouseup', this.handleMouseUpDoc);
    this.endAllNotes();
  }

 /**
  * Renders component.
  * @method render
  */
  render () {

    const props      = this.props;
    const active     = this.state.active;
    const numKeys    = 7 * OCTAVES + 1;
    const keyWidth   = props.width / numKeys;
    const sharpWidth = 0.6 * keyWidth;
    const style      = {
      height : props.height,
      width  : props.width
    };

    return (
      <div id="piano" style={style}>
        {
          this.data.map( (d, i) =>
            d.sharp ?
              <KeySharp
                active={active.includes(d.note1)}
                key={i}
                height={0.8 * props.height - 2}
                left={(d.index + 1) * keyWidth - sharpWidth / 2}
                onMouseDown={this.handleMouseDown.bind(this, d.note1, d.note2, d.note3, d.freq3)}
                onMouseEnter={this.handleMouseEnter.bind(this, d.note1, d.note2, d.note3, d.freq3)}
                onMouseLeave={this.handleMouseLeave.bind(this, d.note1, d.note2, d.note3, d.freq3)}
                width={sharpWidth}
              />
              :
              <Key
                active={active.includes(d.note1)}
                key={i}
                height={props.height - 2}
                left={d.index * keyWidth}
                onMouseDown={this.handleMouseDown.bind(this, d.note1, d.note2, d.note3, d.freq3)}
                onMouseEnter={this.handleMouseEnter.bind(this, d.note1, d.note2, d.note3, d.freq3)}
                onMouseLeave={this.handleMouseLeave.bind(this, d.note1, d.note2, d.note3, d.freq3)}
                width={keyWidth}
              />
          )
        }
      </div>
    );
  }

}

Piano.propTypes = {
  controls    : PropTypes.object.isRequired,
  envelope    : PropTypes.object.isRequired,
  filter      : PropTypes.object.isRequired,
  height      : PropTypes.number.isRequired,
  noise       : PropTypes.object.isRequired,
  oscillator1 : PropTypes.object.isRequired,
  oscillator2 : PropTypes.object.isRequired,
  oscillator3 : PropTypes.object.isRequired,
  width       : PropTypes.number.isRequired
};
