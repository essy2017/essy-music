'use strict';

import React from 'react';
import PropTypes from 'prop-types';

import Pot from './Pot';
import Switch from './Switch';

const DB_MIN = -20;
const DB_MAX = 20;

/**
 * Steps for attack and decay knobs.
 * @property ATTACK_STEPS
 * @type Number[]
 */
const ATTACK_STEPS = [0, 0.01, 0.2, 0.6, 1, 5, 10, 15];

/**
 * Map from control to actual values for oscillator ranges.
 * @property RANGE_MAP
 * @type Object
 */
const RANGE_MAP = {
  'LO' : 1,
  '32' : 2,
  '16' : 3,
  '8'  : 4,
  '4'  : 5,
  '2'  : 6
};

/**
 * Map from control to actual values for oscillator types.
 * @property TYPE_MAP
 * @type Object
 */
const TYPE_MAP = {
  'saw' : 'sawtooth',
  'sin' : 'sine',
  'sqr' : 'square',
  'tri' : 'triangle'
};

/**
 * Gets key from value in map.
 * @method mapValue
 * @param map {Object} A map.
 * @return {Function} That returns key for value.
 */
function mapValue (map) {
  return function (value) {
    for (let k in map) {
      if (map[k] === value) {
        return k;
      }
    }
  };
}

/**
 * Gets range control value from actual value.
 * @method rangeValue
 * @param value {Number} Actual value.
 * @return {Number} Control value.
 */
const rangeValue = mapValue(RANGE_MAP);

/**
 * Gets type control value from actual value.
 * @method typeValue
 * @param value {String} Actual value.
 * @return {String} Control value.
 */
const typeValue = mapValue(TYPE_MAP);

/**
 * Converts DB [-20, 20] to volume [0, 10].
 * @method dbToVol
 * @param db {Number} Decibels.
 * @return {Number} Volume.
 */
function dbToVol (db) {
  return ((db - DB_MIN) / (DB_MAX - DB_MIN)) * 10;
}

/**
 * Converts volume [0, 10] to DB [-20, 20].
 * @method volToDb
 * @param vol {Number} Volume.
 * @return {Number} Decibels.
 */
function volToDb (vol) {
  return DB_MIN + (DB_MAX - DB_MIN) * (vol / 10);
}

/**
 * Converts attack / decay value to control value.
 * @method attackToCtrlVal
 * @param attack {Number} Attack or decay value.
 * @return {Number} Control value.
 */
function attackToCtrlVal (attack) {

  const N     = ATTACK_STEPS.length;
  const RANGE = ATTACK_STEPS[N - 1] - ATTACK_STEPS[0];

  let min;
  let minIndex = N - 2;
  let maxIndex = N - 1;

  for (let i = 0; i < N - 1; i++) {
    if (attack >= ATTACK_STEPS[i] && attack <= ATTACK_STEPS[i+1]) {
      minIndex = i;
      maxIndex = i + 1;
      break;
    }
  }

  min = RANGE * (minIndex / (N - 1));

  return min + (RANGE / N) * ((attack - ATTACK_STEPS[minIndex]) / (ATTACK_STEPS[maxIndex] - ATTACK_STEPS[minIndex]));
}

/**
 * Converts control value to attack / decay value.
 * @method ctrlValToAttack
 * @param val {Number} Control value.
 * @return {Number} Attack or decay value.
 */
function ctrlValToAttack (val) {

  const n     = ATTACK_STEPS.length;
  const max   = ATTACK_STEPS[n - 1];
  const range = max - ATTACK_STEPS[0];
  const index = Math.floor((n - 1) * (val / max));

  if (index === n) {
    return val;
  }

  const minVal = ATTACK_STEPS[index];
  const maxVal = ATTACK_STEPS[index + 1];
  const minAttack = (range / (n - 1)) * index;
  const maxAttack = (range / (n - 1)) * (index + 1);

  return minVal + (maxVal - minVal) * ((val - minAttack) / (maxAttack - minAttack));


}


/*******************************************************************************
 *
 * The control panel.
 * @class ControlBar
 * @extends React.Component
 *
 ******************************************************************************/
export default class ControlBar extends React.Component {

 /**
  * Handler for changes in properties.
  * @method handleChange
  * @param obj {String} Property object.
  * @param prop {String} Property name.
  * @param value {String|Number} New value.
  */
  handleChange (obj, prop, value) {
    if (prop === 'type' && obj !== 'noise') {
      value = TYPE_MAP[value];
    }
    else if (prop === 'range') {
      value = RANGE_MAP[String(value)];
    }
    else if (prop === 'volume') {
      value = volToDb(value);
    }
    else if (prop === 'attack' || prop === 'decay') {
      value = ctrlValToAttack(value);
    }
    this.props.onChange(obj, prop, value);
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
    };
    const knobSize     = 0.1 * props.height;
    const labelsType   = Object.keys(TYPE_MAP);
    const labelsRange  = Object.keys(RANGE_MAP).reverse();
    const switchHeight = 16;
    const switchWidth  = 32;

    return (
      <div id="controls" style={style}>

        <div id="ctrl-osc" className="ctrl-panel">
          <div className="ctrl-row-label">Oscillator 1</div>
          <div className="ctrl-row">
            <Pot
              angle={270}
              domain={false}
              label="Range"
              labels={labelsRange}
              onChange={this.handleChange.bind(this, 'oscillator1', 'range')}
              size={knobSize}
              snap={true}
              ticks={6}
              value={rangeValue(props.oscillator1.range)}
            />
            <div className="ctrl-row-label-sm">Frequency</div>
            <Pot
              angle={270}
              className="wave"
              domain={false}
              label="Waveform"
              labels={labelsType}
              onChange={this.handleChange.bind(this, 'oscillator1', 'type')}
              size={knobSize}
              snap={true}
              ticks={4}
              value={typeValue(props.oscillator1.type)}
            />
          </div>
          <div className="ctrl-row-label mt-25">Oscillator 2</div>
          <div className="ctrl-row">
            <Pot
              angle={270}
              domain={false}
              labels={labelsRange}
              onChange={this.handleChange.bind(this, 'oscillator2', 'range')}
              size={knobSize}
              snap={true}
              ticks={6}
              value={rangeValue(props.oscillator2.range)}
            />
            <Pot
              angle={270}
              domain={[-1000, 1000]}
              labels={[-7, -5, -3, -1, 1, 3, 5, 7]}
              onChange={this.handleChange.bind(this, 'oscillator2', 'detune')}
              size={knobSize}
              snap={true}
              ticks={15}
              value={props.oscillator2.detune}
            />
            <Pot
              angle={270}
              className="wave"
              domain={false}
              labels={labelsType}
              onChange={this.handleChange.bind(this, 'oscillator2', 'type')}
              size={knobSize}
              snap={true}
              ticks={4}
              value={typeValue(props.oscillator2.type)}
            />
          </div>
          <div className="ctrl-row-label mt-25">Oscillator 3</div>
          <div className="ctrl-row">
            <Pot
              angle={270}
              domain={false}
              labels={labelsRange}
              onChange={this.handleChange.bind(this, 'oscillator3', 'range')}
              size={knobSize}
              snap={true}
              ticks={6}
              value={rangeValue(props.oscillator3.range)}
            />
            <Pot
              angle={270}
              domain={[-1000, 1000]}
              labels={[-7, -5, -3, -1, 1, 3, 5, 7]}
              onChange={this.handleChange.bind(this, 'oscillator3', 'detune')}
              size={knobSize}
              snap={true}
              ticks={15}
              value={props.oscillator3.detune}
            />
            <Pot
              angle={270}
              className="wave"
              domain={false}
              labels={labelsType}
              onChange={this.handleChange.bind(this, 'oscillator3', 'type')}
              size={knobSize}
              snap={true}
              ticks={4}
              value={typeValue(props.oscillator3.type)}
            />
          </div>
          <div className="ctrl-row-label-lg mt-25">Oscillators</div>
        </div>

        <div id="ctrl-mixer" className="ctrl-panel">
          <div className="vol-1">
            <Pot
              angle={300}
              domain={[0, 10]}
              label="Volume"
              labels={[0, 2, 4, 6, 8, 10]}
              onChange={this.handleChange.bind(this, 'oscillator1', 'volume')}
              size={knobSize}
              ticks={11}
              value={dbToVol(props.oscillator1.volume)}
            />
            <div className="switch-left switch-wrap">
              <div className="switch-line"></div>
              <Switch
                className="blue"
                height={switchHeight}
                onChange={this.handleChange.bind(this, 'oscillator1', 'on')}
                value={props.oscillator1.on}
                width={switchWidth}
              />
            </div>
          </div>
          <div className="noise">
            <div className="switch-wrap switch-right on">
              <Switch
                className="blue"
                height={switchHeight}
                onChange={this.handleChange.bind(this, 'noise', 'on')}
                value={props.noise.on}
                width={switchWidth}
              />
              <div className="switch-line"></div>
            </div>
            <Pot
              angle={300}
              domain={[0, 10]}
              label="Noise Volume"
              labels={[0, 2, 4, 6, 8, 10]}
              onChange={this.handleChange.bind(this, 'noise', 'volume')}
              size={knobSize}
              ticks={11}
              value={dbToVol(props.noise.volume)}
            />
            <div className="switch-wrap type">
              <Switch
                className="blue"
                height={switchHeight}
                labels={['pink', 'white']}
                onChange={this.handleChange.bind(this, 'noise', 'type')}
                value={props.noise.type}
                values={['pink', 'white']}
                vertical={true}
                width={switchWidth}
              />
            </div>
          </div>
          <div className="vol-2">
            <Pot
              angle={300}
              domain={[0, 10]}
              labels={[0, 2, 4, 6, 8, 10]}
              onChange={this.handleChange.bind(this, 'oscillator2', 'volume')}
              size={knobSize}
              ticks={11}
              value={dbToVol(props.oscillator2.volume)}
            />
            <div className="switch-left switch-wrap">
              <div className="switch-line"></div>
              <Switch
                className="blue"
                height={switchHeight}
                onChange={this.handleChange.bind(this, 'oscillator2', 'on')}
                value={props.oscillator2.on}
                width={switchWidth}
              />
            </div>
          </div>

          <div className="vol-3">
            <Pot
              angle={300}
              domain={[0, 10]}
              labels={[0, 2, 4, 6, 8, 10]}
              onChange={this.handleChange.bind(this, 'oscillator3', 'volume')}
              size={knobSize}
              ticks={11}
              value={dbToVol(props.oscillator3.volume)}
            />
            <div className="switch-left switch-wrap">
              <div className="switch-line"></div>
              <Switch
                className="blue"
                height={switchHeight}
                onChange={this.handleChange.bind(this, 'oscillator3', 'on')}
                value={props.oscillator3.on}
                width={switchWidth}
              />
            </div>
          </div>

          <div className="ctrl-row-label-lg">Mixer</div>
        </div>

        <div id="ctrl-cont" className="ctrl-panel">
          <div className="ctrl-row mod-mix">
            <Pot
              angle={270}
              domain={[0, 1]}
              label="Modulation Mix"
              labels={['Env', 2, 4, 6, 8, 'LFO']}
              onChange={this.handleChange.bind(this, 'controls', 'modMix')}
              size={knobSize}
              ticks={11}
              value={props.controls.modMix}
            />
          </div>
          <div className="ctrl-row lfo-rate">
            <Pot
              angle={270}
              domain={[0.1, 20]}
              label="LFO Rate"
              labels={[0, 2, 4, 6, 8, 10]}
              onChange={this.handleChange.bind(this, 'controls', 'lfoRate')}
              size={knobSize}
              ticks={11}
              value={props.controls.lfoRate}
            />
          </div>

          <div className="ctrl-row-label-lg">Controllers</div>
        </div>

        <div id="ctrl-mod" className="ctrl-panel">
          <div className="filter-switch switch-wrap">
            <div className="ctrl-row-label-sm">Filter Modulation</div>
            <Switch
              height={switchHeight}
              onChange={this.handleChange.bind(this, 'controls', 'filterModOn')}
              value={props.controls.filterModOn}
              width={switchWidth}
            />
          </div>
          <div className="ctrl-row-label">Filter</div>
          <div className="ctrl-row">
            <Pot
              angle={270}
              domain={[0, 32000]}
              label="Cutoff"
              labels={[-4, -2, 0, 2, 4]}
              onChange={this.handleChange.bind(this, 'filter', 'frequency')}
              size={knobSize}
              ticks={9}
              value={props.filter.frequency}
            />
            <Pot
              angle={270}
              domain={[0, 20]}
              label="Emphasis"
              labels={[0, 2, 4, 6, 8, 10]}
              onChange={this.handleChange.bind(this, 'filter', 'resonance')}
              size={knobSize}
              ticks={11}
              value={props.filter.resonance}
            />
          </div>
          <div className="ctrl-row filter-2">
            <Pot
              angle={270}
              domain={[0, 15]}
              label="Attack Time"
              labels={['msec', 10, 200, 600, 1, 5, 10, 'sec']}
              onChange={this.handleChange.bind(this, 'filterEnv', 'attack')}
              size={knobSize}
              ticks={15}
              value={attackToCtrlVal(props.filterEnv.attack)}
            />
            <Pot
              angle={270}
              domain={[0, 15]}
              label="Decay Time"
              labels={['msec', 10, 200, 600, 1, 5, 10, 'sec']}
              onChange={this.handleChange.bind(this, 'filterEnv', 'decay')}
              size={knobSize}
              ticks={15}
              value={attackToCtrlVal(props.filterEnv.decay)}
            />
            <Pot
              angle={270}
              domain={[0, 1]}
              label="Sustain"
              labels={[0, 2, 4, 6, 8, 10]}
              onChange={this.handleChange.bind(this, 'filterEnv', 'sustain')}
              size={knobSize}
              ticks={11}
              value={props.filterEnv.sustain}
            />
          </div>
          <div className="ctrl-row-label mt-25">Loudness Control</div>
          <div className="ctrl-row">
            <Pot
              angle={270}
              domain={[0, 15]}
              label="Attack Time"
              labels={['msec', 10, 200, 600, 1, 5, 10, 'sec']}
              onChange={this.handleChange.bind(this, 'envelope', 'attack')}
              size={knobSize}
              ticks={15}
              value={attackToCtrlVal(props.envelope.attack)}
            />
            <Pot
              angle={270}
              domain={[0, 15]}
              label="Decay Time"
              labels={['msec', 10, 200, 600, 1, 5, 10, 'sec']}
              onChange={this.handleChange.bind(this, 'envelope', 'decay')}
              size={knobSize}
              ticks={15}
              value={attackToCtrlVal(props.envelope.decay)}
            />
            <Pot
              angle={270}
              domain={[0, 1]}
              label="Sustain"
              labels={[0, 2, 4, 6, 8, 10]}
              onChange={this.handleChange.bind(this, 'envelope', 'sustain')}
              size={knobSize}
              ticks={11}
              value={props.envelope.sustain}
            />
          </div>

          <div className="ctrl-row-label-lg">Modifiers</div>
        </div>

        <div id="ctrl-out" className="ctrl-panel">
          <div className="ctrl-row glide">
            <Pot
              angle={270}
              domain={[0, 3]}
              label="Glide"
              labels={[0, 2, 4, 6, 8, 10]}
              onChange={this.handleChange.bind(this, 'controls', 'glide')}
              size={knobSize}
              ticks={11}
              value={props.controls.glide}
            />
          </div>
          <div className="ctrl-row reverb">
            <Pot
              angle={270}
              domain={[0, 1]}
              label="Reverb"
              labels={[0, 2, 4, 6, 8, 10]}
              onChange={this.handleChange.bind(this, 'controls', 'reverb')}
              size={knobSize}
              ticks={11}
              value={props.controls.reverb}
            />
          </div>
          <div className="ctrl-row volume">
            <Pot
              angle={270}
              domain={[0, 10]}
              label="Volume"
              labels={[0, 2, 4, 6, 8, 10]}
              onChange={this.handleChange.bind(this, 'controls', 'volume')}
              size={knobSize}
              ticks={11}
              value={dbToVol(props.controls.volume)}
            />
          </div>
          <div className="ctrl-row-label-lg">Output</div>
        </div>

      </div>
    );
  }

}

ControlBar.propTypes = {
  controls    : PropTypes.object.isRequired,
  filter      : PropTypes.object.isRequired,
  height      : PropTypes.number.isRequired,
  noise       : PropTypes.object.isRequired,
  onChange    : PropTypes.func.isRequired,
  oscillator1 : PropTypes.object.isRequired,
  oscillator2 : PropTypes.object.isRequired,
  width       : PropTypes.number.isRequired
};
