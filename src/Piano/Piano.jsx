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

  //function freq (x) {
  //  return 440 * Math.pow(2, (x - 49) / 12);
  //}

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
        //freq3 : Math.pow(2, range3 - 1) * freq(freqCount),
        sharp : false,
        index : index
      });
      freqCount += 1;
      if (sharps.indexOf(notes[i]) > -1) {
        data.push({
          note1 : notes[i] + '#' + (range1 + count),
          note2 : notes[i] + '#' + (range2 + count),
          note3 : notes[i] + '#' + (range3 + count),
          //freq3 : Math.pow(2, range3 - 1) * freq(freqCount),
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
    //freq3 : Math.pow(2, range3 - 1) * freq(freqCount),
    sharp : false,
    index : index
  });
  freqCount += 1;
  data.push({
    note1 : 'C#' + (range1 + count),
    note2 : 'C#' + (range2 + count),
    note3 : 'C#' + (range3 + count),
    //freq3 : Math.pow(2, range3 - 1) * freq(freqCount),
    sharp : true,
    index : index
  });

  return data;
}





/*******************************************************************************
 *
 * Provides three oscillators and noise generator.
 * @class Oscillators
 * @extends Tone.AudioNode
 *
 ******************************************************************************/
class Oscillators extends Tone.AudioNode {

 /**
  * Constructor.
  * @method constructor
  * @param options {Object} See Oscillators.defaults.
  */
  constructor (options) {

    options = Tone.defaultArg(options, Oscillators.defaults);

    super();

    this.createInsOuts(1, 1);

    this.osc1  = new Tone.OmniOscillator(options.oscillator1);
    this.osc2  = new Tone.OmniOscillator(options.oscillator2);
    this.osc3  = new Tone.OmniOscillator(options.oscillator3);
    this.noise = new Tone.Noise(options.noise);

    this.freq1 = this.osc1.frequency;
    this.freq2 = this.osc2.frequency;
    this.freq3 = this.osc3.frequency;

    this.connectComponent(this.osc1, options.oscillator1.on);
    this.connectComponent(this.osc2, options.oscillator2.on);
    this.connectComponent(this.osc3, options.oscillator3.on);
    this.connectComponent(this.noise, options.noise.on);
  }

 /**
  * Connects or disconnects a component to output.
  * @method connectComponent
  * @param component {Object} Oscillator or noise.
  * @param connect {Boolean} True to connect.
  * @return {Oscillators}
  */
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

 /**
  * Sets component properties.
  * @method setComponent
  * @param component {Object} Oscillator or noise.
  * @param options {Object} With properties:
  *   detune {Number} [optional]
  *   on {Boolean}
  *   type {String}
  *   volume {Number}
  * @return {Oscillators}
  */
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

 /**
  * Sets oscillator notes.
  * @method setNotes
  * @param note1 {String} For first oscillator.
  * @param note2 {String} For second oscillator.
  * @param note3 {String} For third oscillator.
  * @param time {Number}
  * @param portamento {Number}
  */
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

 /**
  * Starts oscillators.
  * @method start
  * @param time {Number}
  */
  start (time) {
    this.osc1.start(time);
    this.osc2.start(time);
    this.osc3.start(time);
    this.noise.start(time);
    return this;
  }

 /**
  * Stops oscillators.
  * @method stop
  * @param time {Number}
  * @return {Oscillators}
  */
  stop (time) {
    this.osc1.stop(time);
    this.osc2.stop(time);
    this.osc3.stop(time);
    this.noise.stop(time);
    return this;
  }

 /**
  * Disposes instance.
  * @method dispose
  * @return {Oscillators}
  */
  dispose () {
    return this;
  }

}

/**
 * Default properties.
 * @property defaults
 * @type Object
 * @static
 */
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


/*******************************************************************************
 *
 * Filter with available modulation sources.
 * @class Filter
 * @extends Tone.AudioNode
 *
 ******************************************************************************/
class Filter extends Tone.AudioNode {

 /**
  * Constructor.
  * @method constructor
  * @param src1 {Oscillators} First oscillator source.
  * @param src2 {Oscillators} Second oscillator source.
  * @param options {Object} See Filter.defaults.
  */
  constructor (src1, src2, options) {

    options = Tone.defaultArg(options, Filter.defaults);

    super();

    this.createInsOuts(2, 1);

    this.input[0]  = src1;
    this.input[1]  = src2;
    this.crossFade = this.output = new Tone.CrossFade();
    this.envFilter = new Tone.Filter(options.filter);
    this.lfoFilter = new Tone.Filter(options.filter);

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

    this._filterFreq = options.filter.frequency;
    this.modulate    = options.modulate;

    this.input[0].connect(this.envFilter);
    this.input[1].connect(this.lfoFilter);
    this.envFilter.connect(this.crossFade, 0, 0);
    this.lfoFilter.connect(this.crossFade, 0, 1);

  }

 /**
  * Triggers envelope attack.
  * @method triggerAttack
  * @param time {Number}
  */
  triggerAttack (time) {
    this.envelope.triggerAttack(time);
  }

 /**
  * Triggers envelope release.
  * @method triggerRelease
  * @param time {Number}
  */
  triggerRelease (time) {
    this.envelope.triggerRelease(time);
  }


 /**
  * Setter for filter properties.
  * @method filterProps
  * @param options {Object} With properties:
  *   frequency {Number}
  *   resonance {Number}
  */
  set filterProps (options) {

    this._filterFreq = options.frequency;

    this.envFilter.set('Q', options.resonance);
    this.lfoFilter.set('Q', options.resonance);

    this.lfo.max = options.frequency;
    this.envelope.max = options.frequency;

    if (!this._modulate) {
      this._resetFilter(options.frequency);
    }
  }

 /**
  * Setter for envelope properties.
  * @method envelopeProps
  * @param options {Object} With properties:
  *   attack {Number}
  *   decay {Number}
  *   sustain {Number}
  */
  set envelopeProps (options) {
    this.envelope.attack  = options.attack;
    this.envelope.decay   = options.decay;
    this.envelope.sustain = options.sustain;
    this.envelope.release = options.release;
  }

 /**
  * Setter for LFO frequency.
  * @method lfoRate
  * @param rate {Number}
  */
  set lfoRate (rate) {
    this.lfo.set('frequency', rate);
  }

 /**
  * Setter for modulation mix.
  * @method mix
  * @param mix {Number} 0 is filter/osc and 1 is lfo/noise.
  */
  set mix (mix) {
    this.crossFade.fade.value = mix;
  }

 /**
  * Setter for filter modulation.
  * @method modulate
  * @param mod {Boolean} True to modulate.
  */
  set modulate (mod) {
    if (this._modulate = mod) {
      this.envelope.connect(this.envFilter.frequency);
      this.lfo.connect(this.lfoFilter.frequency);
    }
    else {
      this.envelope.disconnect();
      this.lfo.disconnect();
      this._resetFilter(this._filterFreq);
    }

  }

 /**
  * Resets main filter frequencies.
  * @method _resetFilter
  * @param freq {Number} New frequency.
  */
  _resetFilter (freq) {
    this.envFilter.set('frequency', freq);
    this.lfoFilter.set('frequency', freq);
  }

}

/**
 * Default instance properties.
 * @property defaults
 * @type Object
 * @static
 */
Filter.defaults = {
  envelope : {
    attack  : 0.005,
    decay   : 0.1,
    sustain : 0.5
  },
  filter : {
    type      : 'lowpass',
    frequency : 22000,
    Q         : 0.5,
    rolloff   : -24
  },
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

    this.source   = new Oscillators(options);
    this.envelope = new Tone.AmplitudeEnvelope(options.envelope);
    this._reverb  = new Tone.JCReverb(options.reverb);

    this.filter = new Filter(this.source, this.source, {
      envelope : options.filterEnv,
      filter   : options.filter,
      lfoRate  : options.lfoRate,
      modulate : options.filterModOn
    });

    this.portamento  = options.portamento;

    this.filter.chain(this.envelope, this._reverb, this.output);
  }

 /**
  * Setter for filter envelope properties.
  * @method filterEnvProps
  * @param props {Object} With properties:
  *   attack {Number}
  *   decay {Number}
  *   sustain {Number}
  */
  set filterEnvProps (props) {
    this.filter.envelopeProps = props;
  }

 /**
  * Setter for filter LFO rate.
  * @method filterLfoRate
  * @param rate {Number}
  */
  set filterLfoRate (rate) {
    this.filter.lfoRate = rate;
  }

 /**
  * Setter for filter modulation mix.
  * @method filterMix
  * @param mix {Number} 0 is all filter/osc and 1 is all LFO/noise.
  */
  set filterMix (mix) {
    this.filter.mix = mix;
  }

 /**
  * Setter to turn filter modulation on or off.
  * @method filterMod
  * @param filterMod {Boolean} True to turn on.
  */
  set filterMod (filterMod) {
    this.filter.modulate = filterMod;
  }

 /**
  * Setter for filter properties.
  * @method filterProps
  * @param props {Object} With properties:
  *   frequency {Number}
  *   resonance {Number}
  */
  set filterProps (props) {
    this.filter.filterProps = props;
  }

 /**
  * Setter for reverb.
  * @method reverb
  * @param reverb {Number}
  */
  set reverb (reverb) {
    this._reverb.roomSize.value = reverb;
  }

 /**
  * Setter for amplitude envelope properties.
  * @method envelopeProps
  * @param props {Object} With properties:
  *   attack {Number}
  *   decay {Number}
  *   sustain {Number}
  */
  set envelopeProps (props) {
    this.envelope.attack  = props.attack;
    this.envelope.decay   = props.decay;
    this.envelope.sustain = props.sustain;
    this.envelope.release = props.decay;
  }

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
    this.filter.disconnect();
    this.filter.dispose();
    this.source.dispose();
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
  filter: {
    type      : 'lowpass',
    frequency : 22000,
    Q         : 0.5,
    rolloff   : -24
  },
  filterEnv : {
    attack    : 0.005,
    contour   : 1,
    decay     : 0.1,
    sustain   : 0.5
  },
  filterModOn : true,
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
  reverb     : 0,
  volume     : 0
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
      props.filterEnv,
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

    const props        = this.props;
    const synth        = this.synth;
    const nextOsc1     = nextProps.oscillator1;
    const nextOsc2     = nextProps.oscillator2;
    const nextOsc3     = nextProps.oscillator3;
    const controls     = props.controls;
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
      synth.envelopeProps = nextProps.envelope;
    }

    // Filter properties.
    if (props.filter !== nextProps.filter) {
      synth.filterProps = nextProps.filter;
    }

    // Filter envelope properties.
    if (props.filterEnv !== nextProps.filterEnv) {
      synth.filterEnvProps = nextProps.filterEnv;
    }

    // LFO rate.
    if (controls.lfoRate !== nextControls.lfoRate) {
      synth.filterLfoRate = nextControls.lfoRate;
    }

    // Filter-oscillator/LFO-noise modulation mix.
    if (controls.modMix !== nextControls.modMix) {
      synth.filterMix = nextControls.modMix;
    }

    // Filter modulation on or off.
    if (controls.filterModOn !== nextControls.filterModOn) {
      synth.filterMod = nextControls.filterModOn;
    }

    // Glide.
    if (controls.glide !== nextControls.glide) {
      synth.portamento = nextControls.glide;
    }

    // Reverb.
    if (controls.reverb !== nextControls.reverb) {
      synth.reverb = nextControls.reverb;
    }

    // Volume.
    if (controls.volume !== nextControls.volume) {
      synth.set('volume', nextControls.volume);
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
  * @param filterEnv {Object} With properties:
  *   attack {Number}
  *   contour {Number}
  *   decay {Number}
  *   sustain {Number}
  * @param controls {Object} With properties:
  *   filterModOn {Boolean}
  *   glide {Number}
  *   lfoRate {Number}
  *   reverb {Number}
  *   volume {Number}
  * @return {Moog}
  */
  getSynth (osc1, osc2, osc3, noise, envelope, filter, filterEnv, controls) {

    if (this.synth) {
      this.synth.dispose();
      this.synth = null;
    }

    const synth = new Moog({
      filterModOn : controls.filterModOn,
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
      filterEnv  : filterEnv,
      portamento : controls.glide,
      reverb     : controls.reverb,
      volume     : controls.volume
    });
    return synth.toMaster();
  }

 /**
  * Starts playing a note.
  * @method startNote
  * @param note1 {String} First oscillator.
  * @param note2 {String} Second oscillator.
  * @param note3 {String} Third oscillator.
  */
  startNote (note1, note2, note3, freq3) {
    this.synth.triggerAttack(note1, note2, note3);
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
  */
  endNote (note1, note2, note3) {
    this.synth.triggerRelease();
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
  */
  handleMouseDown (note1, note2, note3) {
    this.mouseDown = true;
    window.addEventListener('mouseup', this.handleMouseUpDoc, false);
    this.startNote(note1, note2, note3);
  }

 /**
  * Handler for mouseenter events on keys.
  * @method handleMouseEnter
  * @param note1 {String} First oscillator.
  * @param note2 {String} Second oscillator.
  * @param note3 {String} Third oscillator.
  */
  handleMouseEnter (note1, note2, note3) {
    if (!this.mouseDown) return;
    this.startNote(note1, note2, note3);
  }

 /**
  * Handler for mouseleave events on keys.
  * @method handleMouseLeave
  * @param note1 {String} First oscillator.
  * @param note2 {String} Second oscillator.
  * @param note3 {String} Third oscillator.
  */
  handleMouseLeave (note1, note2, note3) {
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
                onMouseDown={this.handleMouseDown.bind(this, d.note1, d.note2, d.note3)}
                onMouseEnter={this.handleMouseEnter.bind(this, d.note1, d.note2, d.note3)}
                onMouseLeave={this.handleMouseLeave.bind(this, d.note1, d.note2, d.note3)}
                width={sharpWidth}
              />
              :
              <Key
                active={active.includes(d.note1)}
                key={i}
                height={props.height - 2}
                left={d.index * keyWidth}
                onMouseDown={this.handleMouseDown.bind(this, d.note1, d.note2, d.note3)}
                onMouseEnter={this.handleMouseEnter.bind(this, d.note1, d.note2, d.note3)}
                onMouseLeave={this.handleMouseLeave.bind(this, d.note1, d.note2, d.note3)}
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
  filterEnv   : PropTypes.object.isRequired,
  height      : PropTypes.number.isRequired,
  noise       : PropTypes.object.isRequired,
  oscillator1 : PropTypes.object.isRequired,
  oscillator2 : PropTypes.object.isRequired,
  oscillator3 : PropTypes.object.isRequired,
  width       : PropTypes.number.isRequired
};
