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
      attack    : 0.005,
      decay     : 0.1,
      detune    : 0,
      octaveMin : 2,
      octaveMax : 3,
      reverb    : 0.5,
      sustain   : 0.3,
      type      : 'triangle',
      oscillator1 : {
        type: 'triangle'
      },
      oscillator2: {
        detune : 0,
        type   : 'sawtooth'
      }
    };
    this.handleChangeControl = this.handleChangeControl.bind(this);
    this.handleChangeOsc = this.handleChangeOsc.bind(this);
  }

 /**
  * Handler for change in control values.
  * @method handleChangeControl
  * @param type {String} Property name.
  * @param value {Number|String} Property value.
  */
  handleChangeControl (type, value) {
    this.setState({
      [type]: value
    });
  }

 /**
  * Handler for change in oscillator type.
  * @method handleChangeType
  * @param osc {String} Oscillator name.
  * @param value {String} New type value.
  */
  handleChangeType (osc, value) {
    const obj = this.state[osc];
    obj.type = value;
    this.setState({
      [osc]: obj
    });
  }

 /**
  * Handler for change in oscillator property value.
  * @method handleChangeOsc
  * @param osc {String} Oscillator name.
  * @param prop {String} Property.
  * @param value {Number|String} New property value.
  */
  handleChangeOsc (osc, prop, value) {
    console.log('handleChangeOsc', osc, prop, value);
    const obj = this.state[osc];
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
    const WIDTH = 800;

    return (
      <div id="piano-wrap" style={{ width: WIDTH + 4 }}>
        <ControlBar
          attack={state.attack}
          decay={state.decay}
          detune={state.detune}
          height={260}
          onChange={this.handleChangeControl}
          onChangeOsc={this.handleChangeOsc}
          oscillator1={state.oscillator1}
          oscillator2={state.oscillator2}
          reverb={state.reverb}
          sustain={state.sustain}
          type={state.type}
          width={WIDTH}
        />
        <Piano
          attack={state.attack}
          decay={state.decay}
          detune={state.detune}
          height={200}
          octaveMin={state.octaveMin}
          octaveMax={state.octaveMax}
          reverb={state.reverb}
          sustain={state.sustain}
          type={state.type}
          width={WIDTH}
        />
      </div>
    );

  }

}
