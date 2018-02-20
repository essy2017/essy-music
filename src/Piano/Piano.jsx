'use strict';

import React from 'react';
import PropTypes from 'prop-types';
import Tone from 'tone';

import Key from './Key';
import KeySharp from './KeySharp';

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

export default class Piano extends React.Component {

 /**
  * Constructor.
  * @method constructor
  * @param props {Object}
  */
  constructor (props) {
    super(props);
    this.state = {
      //active: {}
      active: []
    };
    this.data = getData(props.octaveMin, props.octaveMax);
    this.synth = this.getSynth(props.reverb);
    this.mouseDown = false;
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

  componentWillReceiveProps (nextProps) {
    if (this.props.reverb !== nextProps.reverb) {
      this.synth = this.getSynth(nextProps.reverb);
    }
  }

  getSynth (reverb) {
    if (this.synth) {
      this.synth.releaseAll();
      this.synth.dispose();
    }
    const synth = new Tone.PolySynth(12, Tone.Synth);
    const rev = new Tone.JCReverb(reverb);
    return synth.chain(rev, Tone.Master);
  }

  getTone () {
    //const eff = new Tone.Vibrato().toMaster();
    //const eff = new Tone.Tremolo().toMaster();
    //const eff = new Tone.JCReverb(0.8).toMaster();
    //const eff = new Tone.Freeverb().toMaster();
    //const eff = new Tone.Phaser().toMaster();
    //const eff = new Tone.Distortion(0.8).toMaster();
    //const eff = new Tone.BitCrusher().toMaster();
    //return new Tone.Synth().connect(eff);

    //return new Tone.Synth().toMaster();
    //return new Tone.PluckSynth().toMaster();
    //return new Tone.MembraneSynth().toMaster();
    //return new Tone.PolySynth(3, Tone.Synth, {
    /*return new Tone.Synth({
      oscillator: {
        type: 'fatsawtooth',
        count: 3,
        spread: 30
      },
      envelope: {
        attack: 0.01,
        decay: 0.1,
        sustain: 0.1,
        release: 0.5,
        attackCurve: 'exponential'
      }
    }).toMaster();*/
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
    this.synth.releaseAll();
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
    this.synth.triggerRelease(note);
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
  height    : PropTypes.number.isRequired,
  octaveMin : PropTypes.number.isRequired,
  octaveMax : PropTypes.number.isRequired,
  reverb    : PropTypes.number.isRequired,
  width     : PropTypes.number.isRequired
};
