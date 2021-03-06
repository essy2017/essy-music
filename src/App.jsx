'use strict';

import React from 'react';

import ControlBar from './controls/ControlBar';
import Piano from './Piano/Piano';

/*******************************************************************************
 *
 * Main application entry point.
 * @class App
 * @extends React.Component
 *
 ******************************************************************************/
export default class App extends React.Component {

 /**
  * Constructor.
  * @method constructor
  * @param props {Object}
  */
  constructor (props) {
    super(props);
    this.state = {
      controls: {
        eqOsc       : 'eq',
        filterModOn : false,
        glide       : 0,
        lfoNoise    : 'lfo',
        lfoRate     : 10,
        modMix      : 0.5,
        reverb      : 0.5,
        volume      : -10
      },
      envelope: {
        attack  : 0.005,
        decay   : 0.01,
        sustain : 0.3
      },
      filter: {
        resonance : 0,
        frequency : 22000,
        rolloff   : -24,
        type      : 'lowpass'
      },
      filterEnv: {
        attack  : 0.005,
        contour : 2,
        decay   : 0.1,
        sustain : 0.1
      },
      noise : {
        on     : true,
        type   : 'pink',
        volume : 0
      },
      oscillator1 : {
        on     : true,
        range  : 3,
        type   : 'triangle',
        volume : 0
      },
      oscillator2 : {
        detune : 0,
        on     : true,
        range  : 3,
        type   : 'fatsawtooth',
        volume : 0
      },
      oscillator3 : {
        detune : 0,
        on     : true,
        range  : 3,
        type   : 'sawtooth',
        volume : 0
      }
    };
    this.handleChangeControl = this.handleChangeControl.bind(this);
  }

 /**
  * Handler for change in oscillator property value.
  * @method handleChangeControl
  * @param osc {String} Oscillator name.
  * @param prop {String} Property.
  * @param value {Number|String} New property value.
  */
  handleChangeControl (osc, prop, value) {
    const obj = {};
    for (let o in this.state[osc]) {
      obj[o] = this.state[osc][o];
    }
    obj[prop] = value;
    this.setState({
      [osc]: obj
    });
  }

 /**
  * Renders component.
  * @method render
  */
  render () {

    const state = this.state;
    const WIDTH = 1000;

    return (
      <div id="piano-wrap" style={{ width: WIDTH + 4 }}>
        <ControlBar
          controls={state.controls}
          envelope={state.envelope}
          filter={state.filter}
          filterEnv={state.filterEnv}
          height={300}
          noise={state.noise}
          onChange={this.handleChangeControl}
          oscillator1={state.oscillator1}
          oscillator2={state.oscillator2}
          oscillator3={state.oscillator3}
          width={WIDTH}
        />
        <Piano
          controls={state.controls}
          envelope={state.envelope}
          filter={state.filter}
          filterEnv={state.filterEnv}
          height={200}
          noise={state.noise}
          oscillator1={state.oscillator1}
          oscillator2={state.oscillator2}
          oscillator3={state.oscillator3}
          width={WIDTH}
        />
      </div>
    );

  }

}
