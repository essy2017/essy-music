'use strict';

import React from 'react';
import PropTypes from 'prop-types';

import Knob from './Knob';

export default class ControlBar extends React.Component {

  constructor (props) {
    super(props);
    this.state = {
      reverbTmp: props.reverb
    };
  }

  handleChange (type, value) {
    this.props.onChange(type, value);
  }

  handleChangeTmp (type, value) {
    this.setState({
      [type + 'Tmp']: value
    });
    //this.props.onChange(type, value);
  }

  render () {

    const props = this.props;
    const style = {
      height : props.height,
      width  : props.width
    }

    return (
      <div id="controls" style={style}>
        <Knob
          domain={[0, 1]}
          label="Reverb"
          left={20}
          onChange={this.handleChange.bind(this, 'reverb')}
          onChangeTmp={this.handleChangeTmp.bind(this, 'reverb')}
          size={0.5 * props.height}
          top={0.1 * props.height}
          value={this.state.reverbTmp}
        />
      </div>
    );
  }

}

ControlBar.propTypes = {
  height   : PropTypes.number.isRequired,
  onChange : PropTypes.func.isRequired,
  reverb   : PropTypes.number.isRequired,
  width    : PropTypes.number.isRequired
};
