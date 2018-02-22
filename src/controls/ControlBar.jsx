'use strict';

import React from 'react';
import PropTypes from 'prop-types';

import Knob from './Knob';
import Pot from './Pot';
import Selector from './Selector';

const OSC_MAP = {
  'saw' : 'sawtooth',
  'sin' : 'sine',
  'sqr' : 'square',
  'tri' : 'triangle'
};

function oscValue (value) {
  for (let k in OSC_MAP) {
    if (OSC_MAP[k] === value) {
      return k;
    }
  }
}

export default class ControlBar extends React.Component {

 /**
  * Constructor.
  * @method constructor
  * @param props {Object}
  */
  constructor (props) {
    super(props);
    this.state = {
      attackTmp  : props.attack,
      decayTmp   : props.decay,
      detuneTmp  : props.detune,
      reverbTmp  : props.reverb,
      sustainTmp : props.sustain
    };
  }

 /**
  * Handler for changes in values.
  * @method handleChange
  * @param type {String} Property type.
  * @param value {Number} Property value.
  */
  handleChange (type, value) {
    this.props.onChange(type, value);
  }

 /**
  * Handler for change in temporary value.
  * @method handleChangeTmp
  * @param type {String} Property.
  * @param value {Number} New value.
  */
  handleChangeTmp (type, value) {
    this.setState({
      [type + 'Tmp']: value
    });
  }

 /**
  * Handler for change in oscillator type.
  * @method handleChangeType
  * @param osc {String} Oscillator name.
  * @param value {String} New type.
  */
  handleChangeType (osc, value) {
    this.props.onChangeType(osc, OSC_MAP[value]);
  }

  handleChangeOsc (osc, prop, value) {
    if (prop === 'type') {
      value = OSC_MAP[value];
    }
    this.props.onChangeOsc(osc, prop, value);
    //console.log(osc, prop, value);
  }

 /**
  * Renders component.
  * @method render
  */
  render () {

    const props = this.props;
    const style = {
      height : props.height,
      width  : props.width
    }

    return (
      <div id="controls" style={style}>
        <div id="ctrl-osc">
          <div className="ctrl-row-label">Oscillator 1</div>
          <div className="ctrl-row">
            <Pot
              angle={270}
              cumulative={false}
              domain={false}
              label="Range"
              labels={['LO', 32, 16, 8, 4, 2]}
              onChange={this.handleChange.bind(this, 'range')}
              size={0.2 * props.height}
              snap={true}
              ticks={6}
              value={16}
            />
            <div className="ctrl-row-label-sm">Frequency</div>
            <Pot
              angle={270}
              cumulative={false}
              domain={false}
              label="Waveform"
              labels={Object.keys(OSC_MAP)}
              onChange={this.handleChangeOsc.bind(this, 'oscillator1', 'type')}
              size={0.2 * props.height}
              snap={true}
              ticks={4}
              value={oscValue(props.oscillator1.type)}
            />
          </div>
          <div className="ctrl-row-label mt-2">Oscillator 2</div>
          <div className="ctrl-row">
            <Pot
              angle={270}
              cumulative={false}
              domain={false}
              labels={['LO', 32, 16, 8, 4, 2]}
              onChange={this.handleChange.bind(this, 'range')}
              size={0.2 * props.height}
              snap={true}
              ticks={6}
              value={16}
            />
            <Pot
              angle={270}
              cumulative={false}
              domain={[-7, 7]}
              labels={[-7, -5, -3, -1, 1, 3, 5, 7]}
              onChange={this.handleChangeOsc.bind(this, 'oscillator2', 'detune')}
              size={0.2 * props.height}
              snap={true}
              ticks={15}
              value={0}
            />
            <Pot
              angle={270}
              cumulative={false}
              domain={false}
              labels={Object.keys(OSC_MAP)}
              onChange={this.handleChangeOsc.bind(this, 'oscillator2', 'type')}
              size={0.2 * props.height}
              snap={true}
              ticks={4}
              value={oscValue(props.oscillator2.type)}
            />
          </div>
        </div>
      </div>
    );
  }

}

ControlBar.propTypes = {
  //attack       : PropTypes.number.isRequired,
  //decay        : PropTypes.number.isRequired,
  //detune       : PropTypes.number.isRequired,
  height       : PropTypes.number.isRequired,
  onChange     : PropTypes.func.isRequired,
  onChangeOsc  : PropTypes.func.isRequired,
  //onChangeType : PropTypes.func.isRequired,
  oscillator1  : PropTypes.object.isRequired,
  oscillator2  : PropTypes.object.isRequired,
  //reverb       : PropTypes.number.isRequired,
  //sustain      : PropTypes.number.isRequired,
  //type         : PropTypes.string.isRequired,
  width        : PropTypes.number.isRequired
};
