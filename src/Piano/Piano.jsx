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

  for (let octave = 0; octave < octaves; octave++) {
    for (let i = 0; i < notes.length; i++) {
      data.push({
        note1 : notes[i] + (range1 + count),
        note2 : notes[i] + (range2 + count),
        note3 : notes[i] + (range3 + count),
        sharp : false,
        index : index
      });
      if (sharps.indexOf(notes[i]) > -1) {
        data.push({
          note1 : notes[i] + '#' + (range1 + count),
          note2 : notes[i] + '#' + (range2 + count),
          note3 : notes[i] + '#' + (range3 + count),
          sharp : true,
          index : index
        });
      }
      index++;
    }
    count++;
  }

  data.push({
    note1 : 'C' + (range1 + count),
    note2 : 'C' + (range2 + count),
    note3 : 'C' + (range3 + count),
    sharp : false,
    index : index
  });
  data.push({
    note1 : 'C#' + (range1 + count),
    note2 : 'C#' + (range2 + count),
    note3 : 'C#' + (range3 + count),
    sharp : true,
    index : index
  });

  return data;
}



class Moog extends Tone.Monophonic {

  constructor (options) {

    options = Tone.defaultArg(options, Moog.defaults);

    super(options);

    this.noise = new Tone.Noise(options.noise);

    this.oscillator1 = new Tone.Oscillator(options.oscillator1);
    this.oscillator2 = new Tone.Oscillator(options.oscillator2);
    this.oscillator3 = new Tone.Oscillator(options.oscillator3);

    this.frequency1 = this.oscillator1.frequency;
    this.frequency2 = this.oscillator2.frequency;
    this.frequency3 = this.oscillator3.frequency;

    this.detune = this.oscillator2.detune;
    this.envelope = new Tone.AmplitudeEnvelope(options.envelope);
    //this.scaledEnv = new Tone.LowpassCombFilter(options.scaledEnv);
    //this.scaledEnv.connect(this.oscillator1.frequency);
    this.feedback = new Tone.FeedbackCombFilter({ delay: 0.01, resonance: 0.9 });
    this.filter = new Tone.Filter(options.filter);
    //this.filter.connect(this.oscillator1.frequency);
    //this.filter.connect(this.feedback);
    //this.feedback.connect(this.oscillator1.frequency);
    if (options.oscillator1.on) {
      this.connectOsc1(true);
      //this.oscillator1.chain(this.filter, this.feedback, this.envelope, this.output);
    }
    if (options.oscillator2.on) {
      this.connectOsc2(true);
      //this.oscillator2.chain(this.filter, this.feedback, this.envelope, this.output);
    }
    if (options.oscillator3.on) {
      this.connectOsc3(true);
    }
    if (options.noise.on) {
      this.connectNoise(true);
    }
    this._readOnly(['oscillator1', 'oscillator2', 'oscillator3', 'frequency1', 'frequency2', 'frequency3', 'envelope']);
  }

  connectNoise (connect) {
    if (connect) {
      this.noise.chain(/*this.filter, this.feedback,*/ this.envelope, this.output);
    }
    else {
      this.noise.disconnect();
    }
  }

  connectOsc1 (connect) {
    if (connect) {
      this.oscillator1.chain(/*this.filter, this.feedback,*/ this.envelope, this.output);
    }
    else {
      this.oscillator1.disconnect();
    }
  }

  connectOsc2 (connect) {
    if (connect) {
      this.oscillator2.chain(/*this.filter, this.feedback,*/ this.envelope, this.output);
    }
    else {
      this.oscillator2.disconnect();
    }
  }

  connectOsc3 (connect) {
    if (connect) {
      this.oscillator3.chain(this.envelope, this.output);
    }
    else {
      this.oscillator3.disconnect();
    }
  }

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

  triggerAttack (note1, note2, note3, time, velocity) {
    time = this.toSeconds(time);
    this._triggerEnvelopeAttack(time, velocity);
    this.setNote(note1, note2, note3, time);
    return this;
  }

  _triggerEnvelopeAttack (time, velocity) {
    this.envelope.triggerAttack(time, velocity);
    //this.scaledEnv.triggerAttack(time, velocity);
    this.noise.start(time);
    this.oscillator1.start(time);
    this.oscillator2.start(time);
    this.oscillator3.start(time);
    return this;
  }

  _triggerEnvelopeRelease (time) {
    time = this.toSeconds(time);
    this.envelope.triggerRelease(time);
    this.noise.stop(time + this.envelope.release);
    this.oscillator1.stop(time + this.envelope.release);
    this.oscillator2.stop(time + this.envelope.release);
    this.oscillator3.stop(time + this.envelope.release);
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
    on    : true,
    range : 1,
    type  : 'triangle'
  },
  oscillator2: {
    on      : true,
    detune  : 10,
    range   : 2,
    type    : 'sawtooth'
  },
  oscillator3: {
    on      : true,
    detune  : 0,
    range   : 2,
    type    : 'triangle'
  },
  envelope: {
    attack: 0.005,
    decay: 0.1,
    sustain: 0.3,
    release: 1
  },
  filter: {
    type: 'lowpass',
    frequency : 2000,
    rolloff: -24
  },
  scaledEnv: {
    delayTime: 0.0,
    resonance: 0.4,
    dampening: 10000
    /*attack  : 0.005,
    decay   : 0.1,
    sustain : 0.3,
    release : 0.1,
    min     : 0,
    max     : 1000*/
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
    this.synth            = this.getSynth(props.oscillator1, props.oscillator2, props.oscillator3, props.noise, props.envelope);
    this.mouseDown        = false;
    this.handleMouseUpDoc = this.handleMouseUpDoc.bind(this);

    /*const b = new Tone.FMSynth();
    const bVol = new Tone.Volume(-4.25);
    const bDist = new Tone.Distortion(2.5);
    const bDelay = new Tone.FeedbackDelay(0.25);
    const bPhaser = new Tone.Phaser({
      frequency: 12.6,
      depth: 15,
      baseFrequency: 2500
    });
    b.chain(bDist, bDelay);
    b.chain(bDist, bPhaser);
    b.chain(bPhaser, bVol);*/

    /*this.synth = new Tone.PolySynth(12, Tone.FMSynth);
    const bDist = new Tone.Distortion(2.5);
    const bDelay = new Tone.FeedbackDelay(0.25);
    const bPhaser = new Tone.Phaser({
      frequency: 12.6,
      depth: 15,
      baseFrequency: 2500
    });
    const reverb = new Tone.JCReverb(0.5);
    this.synth.chain(bDist, bDelay);
    this.synth.chain(bDist, bPhaser, reverb, Tone.Master);*/

    //this.synth.chain(bPhaser, Tone.Master);


    /*this.synth = new Tone.PolySynth(12, Tone.Synth, {
      oscillator: {
        type: 'sawtooth'
      },
      envelope: {
        sustain: 0.1
      }
    }).toMaster();*/
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
    const nextEnv  = nextProps.envelope;

    if (
      props.oscillator1 !== nextOsc1 ||
      props.oscillator2 !== nextOsc2 ||
      props.oscillator3 !== nextOsc3
    ) {
      this.data = getData(OCTAVES, nextOsc1.range, nextOsc2.range, nextOsc3.range);
      synth.oscillator1.type         = nextOsc1.type;
      synth.oscillator1.volume.value = nextOsc1.volume;
      synth.oscillator2.detune.value = nextOsc2.detune;
      synth.oscillator2.type         = nextOsc2.type;
      synth.oscillator2.volume.value = nextOsc2.volume;
      synth.oscillator3.detune.value = nextOsc3.detune;
      synth.oscillator3.type         = nextOsc3.type;
      synth.oscillator3.volume.value = nextOsc3.volume;

      if (props.oscillator1.on !== nextOsc1.on) {
        synth.connectOsc1(nextOsc1.on);
      }
      if (props.oscillator2.on !== nextOsc2.on) {
        synth.connectOsc2(nextOsc2.on);
      }
      if (props.oscillator3.on !== nextOsc3.on) {
        synth.connectOsc3(nextOsc3.on);
      }
    }

    if (props.noise !== nextProps.noise) {
      synth.noise.type = nextProps.noise.type;
      synth.noise.volume.value = nextProps.noise.volume;
      if (props.noise.on !== nextProps.noise.on) {
        synth.connectNoise(nextProps.noise.on);
      }
    }

    if (props.envelope !== nextProps.envelope) {
      synth.envelope.attack  = nextEnv.attack;
      synth.envelope.decay   = nextEnv.decay;
      synth.envelope.sustain = nextEnv.sustain;
      synth.envelope.release = nextEnv.decay;
    }
    /*if (
      this.props.reverb  !== nextProps.reverb ||
      this.props.attack  !== nextProps.attack ||
      this.props.decay   !== nextProps.decay  ||
      this.props.sustain !== nextProps.sustain ||
      this.props.detune  !== nextProps.detune ||
      this.props.type    !== nextProps.type //||
      //this.props.oscillator1 !== nextProps.oscillator1 ||
      //this.props.oscillator2 !== nextProps.oscillator2
    ) {
      this.synth = this.getSynth(nextProps.oscillator1, nextProps.oscillator2);
      //this.synth = this.getSynth(nextProps.attack, nextProps.decay, nextProps.sustain, nextProps.reverb, nextProps.detune, nextProps.type);
    }*/
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
  * @return {Moog}
  */
  getSynth (osc1, osc2, osc3, noise, envelope) {

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
      }
    });
    const reverb = 0.5;
    const rev = new Tone.JCReverb(reverb);
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
  startNote (note1, note2, note3) {
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
  handleMouseDown (note1, note2, note3) {
    this.mouseDown = true;
    window.addEventListener('mouseup', this.handleMouseUpDoc, false);
    this.startNote(note1, note2, note3);
  }

 /**
  * Handler for mouseenter events on keys.
  * @method handleMouseEnter
  * @param note {String}
  */
  handleMouseEnter (note1, note2, note3) {
    if (!this.mouseDown) return;
    this.startNote(note1, note2, note3);
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
  envelope    : PropTypes.object.isRequired,
  height      : PropTypes.number.isRequired,
  noise       : PropTypes.object.isRequired,
  oscillator1 : PropTypes.object.isRequired,
  oscillator2 : PropTypes.object.isRequired,
  oscillator3 : PropTypes.object.isRequired,
  width       : PropTypes.number.isRequired
};
