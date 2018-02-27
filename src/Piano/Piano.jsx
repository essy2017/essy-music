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
        freq1 : Math.pow(2, range1 - 1) * freq(freqCount),
        freq2 : Math.pow(2, range2 - 1) * freq(freqCount),
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
          freq1 : Math.pow(2, range1 - 1) * freq(freqCount),
          freq2 : Math.pow(2, range2 - 1) * freq(freqCount),
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
    freq1 : Math.pow(2, range1 - 1) * freq(freqCount),
    freq2 : Math.pow(2, range2 - 1) * freq(freqCount),
    freq3 : Math.pow(2, range3 - 1) * freq(freqCount),
    sharp : false,
    index : index
  });
  freqCount += 1;
  data.push({
    note1 : 'C#' + (range1 + count),
    note2 : 'C#' + (range2 + count),
    note3 : 'C#' + (range3 + count),
    freq1 : Math.pow(2, range1 - 1) * freq(freqCount),
    freq2 : Math.pow(2, range2 - 1) * freq(freqCount),
    freq3 : Math.pow(2, range3 - 1) * freq(freqCount),
    sharp : true,
    index : index
  });

  return data;
}


class MoogFilter extends Tone.AudioNode {

  constructor (options) {

    options = Tone.defaultArg(options, MoogFilter.defaults);

    super();

    this.createInsOuts(1, 1);

    this.frequency = new Tone.Signal(options.filter.frequency, Tone.Type.Frequency);
    this.detune = new Tone.Signal(0, Tone.Type.Cents);
    this.gain = new Tone.Signal({ value: 0, convert: false });
    this.Q = new Tone.Signal(options.filter.Q);
    this._type = options.filter.type;
    this._rolloff = options.filter.rolloff;

    this.env = new Tone.ScaledEnvelope({
      attack  : options.envelope.attack,
      decay   : options.envelope.decay,
      sustain : options.envelope.sustain,
      release : options.envelope.decay,
      min    : options.filter.frequency,
      max : options.contour * options.filter.frequency
    });
    this._contour = options.contour;
    this._frequency = options.filter.frequency;
    this.env.connect(this.frequency);

    this.lfo = new Tone.LFO(10, 0, options.filter.frequency);
    //this.setModulation(options.modOn);
    this.modulation = options.modOn;
    this.rolloff = options.filter.rolloff;

  }

  start (time, velocity) {
    this.env.triggerAttack(time, velocity);
  }

  stop (time) {
    this.env.triggerRelease(time);
  }

  setEnvelope (options) {

    this.env.attack  = options.attack;
    this.env.decay   = options.decay;
    this.env.sustain = options.sustain;
    this.env.release = options.decay;
    this.env.max = options.contour * this._frequency;
    this._contour = options.contour;
    console.log(this.frequency, options.contour);
    console.log(this.env.min, this.env.max);
  }

  setFrequency (freq) {
    this._frequency = freq;
    this.frequency.value = freq;
    if (this._modOn) {
      this.lfo.max = freq;
      this.lfo.disconnect();
      this.lfo.connect(this.frequency);
    }
    else {
      this.env.min = freq;
      this.env.max = freq * this._contour;
      this.env.disconnect();
      this.env.connect(this.frequency);
    }
/*    this.lfo.max = freq;
    this.env.disconnect();
    this.env.connect(this.frequency);
    if (this.modOn) {
      this.lfo.disconnect();
      this.lfo.connect(this.frequency);
    }*/
  }

 /**
  * Gets modulation state.
  * @method modulation
  * @return {Boolean}
  */
  get modulation () {
    return this._modOn;
  }

 /**
  * Sets modulation state.
  * @method modulation
  * @param mod {Boolean} True to turn on.
  */
  set modulation (mod) {

    if (mod) {
      if (!this._modOn) {
        this.env.disconnect();
        this.lfo.connect(this.frequency);
        this.lfo.start();
      }
      this._modOn = true;
    }
    else {
      if (this._modOn) {
        this.lfo.stop();
        this.lfo.disconnect();
        this.env.connect(this.frequency);
      }
      this._modOn = false;
    }
  }

 /**
  * Gets rolloff property.
  * @method rolloff
  * @return {Number}
  */
  get rolloff () {
    return this._rolloff;
  }

 /**
  * Sets rolloff property.
  * @method rolloff
  * @param rolloff {Number}
  */
  set rolloff (rolloff) {
    const possibilities = [-12, -24, -48, -96];
    let cascadingCount = possibilities.indexOf(rolloff);
    this._rolloff = rolloff;
    cascadingCount += 1;
    this.input.disconnect();
    this._filters = new Array(cascadingCount);
    for (let count = 0; count < cascadingCount; count++) {
      const filter = this.context.createBiquadFilter();
      filter.type = this._type;
      this.frequency.connect(filter.frequency);
      this.detune.connect(filter.detune);
      this.Q.connect(filter.Q);
      this.gain.connect(filter.gain);
      this._filters[count] = filter;
    }
    const connectionChain = [this.input].concat(this._filters).concat([this.output]);
    Tone.connectSeries.apply(Tone, connectionChain);
  }

}

/**
 * Default property values.
 * @property defaults
 * @type Object
 * @static
 */
MoogFilter.defaults = {
  contour  : 5,
  envelope : {
    attack  : 0.1,
    decay   : 0.2,
    sustain : 0.3
  },
  filter : {
    frequency : 22000,
    Q         : 0,
    type      : 'lowpass',
    rolloff   : -24
  },
  modOn : false
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

    this.oscillator1 = new Tone.Oscillator(options.oscillator1);
    this.oscillator2 = new Tone.Oscillator(options.oscillator2);
    this.oscillator3 = new Tone.Oscillator(options.oscillator3);
    this.noise       = new Tone.Noise(options.noise);
    this.envelope    = new Tone.AmplitudeEnvelope(options.envelope);
    this.filter      = new MoogFilter({
      envelope : options.filter,
      filter   : options.filter,
      modOn    : options.filter.modOn
    });

    this.frequency1 = this.oscillator1.frequency;
    this.frequency2 = this.oscillator2.frequency;
    this.frequency3 = this.oscillator3.frequency;


    this.connectComponent(this.oscillator1, options.oscillator1.on);
    this.connectComponent(this.oscillator2, options.oscillator2.on);
    this.connectComponent(this.oscillator3, options.oscillator3.on);
    this.connectComponent(this.noise, options.noise.on);

    this._readOnly(['oscillator1', 'oscillator2', 'oscillator3', 'frequency1', 'frequency2', 'frequency3', 'envelope']);
  }

 /**
  * Connects or disconnects a component.
  * @method connectComponent
  * @param component {Tone.AudioNode} Component to connect or disconnect.
  * @param connect {Boolean} True to connect, false to disconnect.
  */
  connectComponent (component, connect) {
    if (connect) {
      component.on = true;
      component.chain(this.filter, this.envelope, this.output);
    }
    else {
      component.on = false;
      component.disconnect();
    }
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
  *   attack {Number}
  *   decay {Number}
  *   frequency {Number}
  *   modOn {Boolean}
  *   resonance {Number}
  *   sustain {Number}
  */
  setFilter (options) {
    this.filter.setFrequency(options.frequency);
    this.filter.setEnvelope(options);
    this.filter.set('Q', options.resonance);
    this.filter.modulation = options.modOn;
  }

 /**
  * Sets oscillator properties.
  * @method setOscillator
  * @param oscillator {Tone.Oscillator}
  * @param options {Object} With properties:
  *   detune {Number} [optional]
  *   on {Boolean}
  *   type {String}
  *   volume {Number}
  */
  setOscillator (oscillator, options) {
    oscillator.type = options.type;
    oscillator.volume.value = options.volume;
    if ('detune' in options) {
      oscillator.detune.value = options.detune;
    }
    if (options.on !== oscillator.on) {
      this.connectComponent(oscillator, options.on);
    }
  }

 /**
  * Sets noise properties.
  * @method setNoise
  * @param options {Object} With properties:
  *   on {Boolean}
  *   type {String}
  *   volume {Number}
  */
  setNoise (options) {
    this.noise.type = options.type;
    this.noise.volume.value = options.volume;
    if (options.on !== this.noise.on) {
      this.connectComponent(this.noise, options.on);
    }
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
    if (this.portamento > 0) {
      this.frequency1.setValueAtTime(this.frequency1.value, time);
      this.frequency2.setValueAtTime(this.frequency2.value, time);
      this.frequency3.setValueAtTime(this.frequency3.value, time);
      const portTime = this.toSeconds(this.portamento);
      this.frequency1.exponentialRampToValueAtTime(note1, time + portTime);
      this.frequency2.exponentialRampToValueAtTime(note2, time + portTime);
      this.frequency3.exponentialRampToValueAtTime(note3, time + portTime);
    }
    else {
      this.frequency1.setValueAtTime(note1, time);
      this.frequency2.setValueAtTime(note2, time);
      this.frequency3.setValueAtTime(note3, time);
    }
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
    this.envelope.triggerAttack(time, velocity);
    this.noise.start(time);
    this.oscillator1.start(time);
    this.oscillator2.start(time);
    this.oscillator3.start(time);
    this.filter.start(time, velocity);
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
    this.envelope.triggerRelease(time);
    this.noise.stop(time + this.envelope.release);
    this.oscillator1.stop(time + this.envelope.release);
    this.oscillator2.stop(time + this.envelope.release);
    this.oscillator3.stop(time + this.envelope.release);
    this.filter.stop(time + this.envelope.release);
    return this;
  }

  dispose () {
    return this;
  }

}

Moog.defaults = {
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
  envelope: {
    attack  : 0.005,
    decay   : 0.1,
    sustain : 0.3,
    release : 1
  },
  filter: {
    type      : 'lowpass',
    frequency : 22000,
    modOn     : false,
    Q         : 0.5,
    rolloff   : -24,
    attack    : 0.005,
    decay     : 0.1,
    sustain   : 0.5
  },
  portamento: 0
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
    this.data = getData(OCTAVES, props.oscillator1.range, props.oscillator2.range, props.oscillator3.range);
    this.synth = this.getSynth(
      props.oscillator1,
      props.oscillator2,
      props.oscillator3,
      props.noise,
      props.envelope,
      props.filter
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

    if (
      props.oscillator1 !== nextOsc1 ||
      props.oscillator2 !== nextOsc2 ||
      props.oscillator3 !== nextOsc3
    ) {
      this.data = getData(OCTAVES, nextOsc1.range, nextOsc2.range, nextOsc3.range);
      synth.setOscillator(synth.oscillator1, nextOsc1);
      synth.setOscillator(synth.oscillator2, nextOsc2);
      synth.setOscillator(synth.oscillator3, nextOsc3);

    }

    if (props.noise !== nextProps.noise) {
      synth.setNoise(nextProps.noise);
    }

    if (props.envelope !== nextProps.envelope) {
      synth.setEnvelope(nextProps.envelope);
    }

    if (props.filter !== nextProps.filter) {
      synth.setFilter(nextProps.filter);
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
  * @return {Moog}
  */
  getSynth (osc1, osc2, osc3, noise, envelope, filter) {

    if (this.synth) {
      this.synth.dispose();
      this.synth = null;
    }

    const synth = new Moog({
      noise: noise,
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
        freqeuency : filter.frequency,
        modOn      : filter.modOn,
        Q          : filter.resonance,
        rolloff    : filter.rolloff,
        type       : filter.type,
        attack     : filter.attack,
        decay      : filter.decay,
        sustain    : filter.sustain
      }
    });
    const reverb = 0.5;
    const rev = new Tone.JCReverb(reverb);
    //return synth.toMaster();
    return synth.chain(rev, Tone.Master);
    /*const synth = new Tone.PolySynth(12, Tone.Synth, {
      oscillator: {
        type: type
      },
      envelope: {
        attack  : attack,
        decay   : decay,
        sustain : sustain,
        release : decay
      }
    });

    const rev = new Tone.JCReverb(reverb);
    return synth.chain(rev, Tone.Master);*/
  }

 /**
  * Starts playing a note.
  * @method startNote
  * @param note {String}
  */
  startNote (note1, note2, note3, freq1, freq2, freq3) {
    this.synth.triggerAttack(note1, note2, note3);
    //this.synth.triggerAttack(freq1, freq2, freq3);
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
    //this.synth.releaseAll();
    this.synth.triggerRelease();
    this.setState({
      active: []
    });
  }

 /**
  * Stops playing a note.
  * @method endNote
  * @param note {String}
  */
  endNote (note1, note2, note3) {
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
  * @param note {String}
  */
  handleMouseDown (note1, note2, note3, freq1, freq2, freq3) {
    this.mouseDown = true;
    window.addEventListener('mouseup', this.handleMouseUpDoc, false);
    this.startNote(note1, note2, note3, freq1, freq2, freq3);
  }

 /**
  * Handler for mouseenter events on keys.
  * @method handleMouseEnter
  * @param note {String}
  */
  handleMouseEnter (note1, note2, note3, freq1, freq2, freq3) {
    if (!this.mouseDown) return;
    this.startNote(note1, note2, note3, freq1, freq2, freq3);
  }

 /**
  * Handler for mouseleave events on keys.
  * @method handleMouseLeave
  * @param note {String}
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
                onMouseDown={this.handleMouseDown.bind(this, d.note1, d.note2, d.note3, d.freq1, d.freq2, d.freq3)}
                onMouseEnter={this.handleMouseEnter.bind(this, d.note1, d.note2, d.note3, d.freq1, d.freq2, d.freq3)}
                onMouseLeave={this.handleMouseLeave.bind(this, d.note1, d.note2, d.note3, d.freq1, d.freq2, d.freq3)}
                width={sharpWidth}
              />
              :
              <Key
                active={active.includes(d.note1)}
                key={i}
                height={props.height - 2}
                left={d.index * keyWidth}
                onMouseDown={this.handleMouseDown.bind(this, d.note1, d.note2, d.note3, d.freq1, d.freq2, d.freq3)}
                onMouseEnter={this.handleMouseEnter.bind(this, d.note1, d.note2, d.note3, d.freq1, d.freq2, d.freq3)}
                onMouseLeave={this.handleMouseLeave.bind(this, d.note1, d.note2, d.note3, d.freq1, d.freq2, d.freq3)}
                width={keyWidth}
              />
          )
        }
      </div>
    );
  }

}

Piano.propTypes = {
  envelope    : PropTypes.object.isRequired,
  filter      : PropTypes.object.isRequired,
  height      : PropTypes.number.isRequired,
  noise       : PropTypes.object.isRequired,
  oscillator1 : PropTypes.object.isRequired,
  oscillator2 : PropTypes.object.isRequired,
  oscillator3 : PropTypes.object.isRequired,
  width       : PropTypes.number.isRequired
};
