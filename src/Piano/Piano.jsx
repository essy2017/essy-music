'use strict';

import React from 'react';
import PropTypes from 'prop-types';
import Tone from 'tone';

import Key from './Key';
import KeySharp from './KeySharp';

/**
 * Gets notes for keyboard.
 * @method getData
 * @param octaveStart {Number} Octave starting point.
 * @param octaveEnd {Number} Octave ending point.
 * @return {Object[]} Each with properties:
 *    index {Number}
 *    note {String}
 *    sharp {Boolean}
 */
function getData (octaveStart, octaveEnd) {

  const notes  = 'CDEFGAB'.split('');
  const sharps = 'CDFGA';

  let data  = [];
  let index = 0;

  for (let octave = octaveStart; octave <= octaveEnd; octave++) {
    for (let i = 0; i < notes.length; i++) {
      data.push({
        note  : notes[i] + octave,
        sharp : false,
        index : index
      });
      if (sharps.indexOf(notes[i]) > -1) {
        data.push({
          note  : notes[i] + '#' + octave,
          sharp : true,
          index : index
        });
      }
      index++;
    }
  }

  data.push({
    note  : 'C' + (octaveEnd + 1),
    sharp : false,
    index : index
  });
  data.push({
    note  : 'C#' + (octaveEnd + 1),
    sharp : true,
    index : index
  });

  return data;
}



class Moog extends Tone.Monophonic {

  constructor (options) {

    options = Tone.defaultArg(options, Moog.defaults);

    super(options);

    this.oscillator1 = new Tone.Oscillator(options.oscillator1);
    this.oscillator2 = new Tone.Oscillator(options.oscillator2);
    this.frequency1 = this.oscillator1.frequency;
    this.frequency2 = this.oscillator2.frequency;
    this.detune = this.oscillator2.detune;
    this.envelope = new Tone.AmplitudeEnvelope(options.envelope);
    this.oscillator1.chain(this.envelope, this.output);
    this.oscillator2.chain(this.envelope, this.output);
    this._readOnly(['oscillator1', 'oscillator2', 'frequency1', 'frequency2', 'detune', 'envelope']);
  }

  setNote (note, time) {
    time = this.toSeconds(time);
    if (this.portamento > 0) {
      this.frequency1.setValueAtTime(this.frequency1.value, time);
      this.frequency2.setValueAtTime(this.frequency2.value, time);
      const portTime = this.toSeconds(this.portamento);
      this.frequency1.exponentialRampToValueAtTime(note, time + portTime);
      this.frequency2.exponentialRampToValueAtTime(note, time + portTime);
    }
    else {
      this.frequency1.setValueAtTime(note, time);
      this.frequency2.setValueAtTime(note, time);
    }
    return this;
  }

  _triggerEnvelopeAttack (time, velocity) {
    this.envelope.triggerAttack(time, velocity);
    this.oscillator1.start(time);
    this.oscillator2.start(time);
    return this;
  }

  _triggerEnvelopeRelease (time) {
    time = this.toSeconds(time);
    this.envelope.triggerRelease(time);
    this.oscillator1.stop(time + this.envelope.release);
    this.oscillator2.stop(time + this.envelope.release);
    return this;
  }

  dispose () {
    return this;
  }

}

Moog.defaults = {
  oscillator1: {
    type: 'triangle'
  },
  oscillator2: {
    detune: 10,
    type: 'sawtooth'
  },
  envelope: {
    attack: 0.005,
    decay: 0.1,
    sustain: 0.3,
    release: 1
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
    this.data             = getData(props.octaveMin, props.octaveMax);
    this.synth            = this.getSynth(props.attack, props.decay, props.sustain, props.reverb, props.detune, props.type);
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
    if (
      this.props.reverb  !== nextProps.reverb ||
      this.props.attack  !== nextProps.attack ||
      this.props.decay   !== nextProps.decay  ||
      this.props.sustain !== nextProps.sustain ||
      this.props.detune  !== nextProps.detune ||
      this.props.type    !== nextProps.type
    ) {
      this.synth = this.getSynth(nextProps.attack, nextProps.decay, nextProps.sustain, nextProps.reverb, nextProps.detune, nextProps.type);
    }
  }

 /**
  * Gets a new synth.
  * @method getSynth
  * @param attack {Number}
  * @param decay {Number}
  * @param sustain {Number}
  * @param reverb {Number}
  * @param type {String}
  */
  getSynth (attack, decay, sustain, reverb, detune, type) {

    if (this.synth) {
      //this.synth.releaseAll();
      this.synth.dispose();
      this.synth = null;
    }

    //const synth = new Tone.PolySynth(12, Moog, {
    const synth = new Moog({
      oscillator1: {
        type: type
      },
      oscillator2: {
        detune: detune
      },
      envelope: {
        attack  : attack,
        decay   : decay,
        sustain : sustain,
        release : decay
      }
    });
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

  getTone () {
    const b = new Tone.FMSynth();
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
    b.chain(bPhaser, bVol);
    return b.chain(bVol, Tone.Master);
  }

 /**
  * Starts playing a note.
  * @method startNote
  * @param note {String}
  */
  startNote (note) {
    this.synth.triggerAttack(note);
    let active = this.state.active.map(d => d);
    active.push(note);
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
  endNote (note) {
    this.synth.triggerRelease(/*note*/);
    let active = this.state.active;
    active.splice(active.indexOf(note), 1);
    this.setState({
      active: active
    });
  }

 /**
  * Handler for mousedown events on keys.
  * @method handleMouseDown
  * @param note {String}
  */
  handleMouseDown (note) {
    this.mouseDown = true;
    window.addEventListener('mouseup', this.handleMouseUpDoc, false);
    this.startNote(note);
  }

 /**
  * Handler for mouseenter events on keys.
  * @method handleMouseEnter
  * @param note {String}
  */
  handleMouseEnter (note) {
    if (!this.mouseDown) return;
    this.startNote(note);
  }

 /**
  * Handler for mouseleave events on keys.
  * @method handleMouseLeave
  * @param note {String}
  */
  handleMouseLeave (note) {
    if (!this.mouseDown) return;
    this.endNote(note);
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
    const numKeys    = 7 * (props.octaveMax - props.octaveMin + 1) + 1;
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
                active={active.includes(d.note)}
                key={i}
                height={0.8 * props.height - 2}
                left={(d.index + 1) * keyWidth - sharpWidth / 2}
                onMouseDown={this.handleMouseDown.bind(this, d.note)}
                onMouseEnter={this.handleMouseEnter.bind(this, d.note)}
                onMouseLeave={this.handleMouseLeave.bind(this, d.note)}
                width={sharpWidth}
              />
              :
              <Key
                active={active.includes(d.note)}
                key={i}
                height={props.height - 2}
                label={d.note.indexOf('C') > -1 ? d.note : ''}
                left={d.index * keyWidth}
                onMouseDown={this.handleMouseDown.bind(this, d.note)}
                onMouseEnter={this.handleMouseEnter.bind(this, d.note)}
                onMouseLeave={this.handleMouseLeave.bind(this, d.note)}
                width={keyWidth}
              />
          )
        }
      </div>
    );
  }

}

Piano.propTypes = {
  attack     : PropTypes.number.isRequired,
  decay      : PropTypes.number.isRequired,
  detune     : PropTypes.number.isRequired,
  height     : PropTypes.number.isRequired,
  octaveMin  : PropTypes.number.isRequired,
  octaveMax  : PropTypes.number.isRequired,
  reverb     : PropTypes.number.isRequired,
  sustain    : PropTypes.number.isRequired,
  type       : PropTypes.string.isRequired,
  width      : PropTypes.number.isRequired
};
