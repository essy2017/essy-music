'use strict';

import React from 'react';

import ControlBar from './controls/ControlBar';
import Piano from './Piano/Piano';

export default class App extends React.Component {

  constructor (props) {
    super(props);
    this.state = {
      reverb: 0.5
    };
    this.handleChangeControl = this.handleChangeControl.bind(this);
  }

  handleChangeControl (type, value) {
    this.setState({
      [type]: value
    });
  }

  render () {
    const WIDTH = 800;
    return (
      <div id="piano-wrap" style={{ width: WIDTH + 4 }}>
        <ControlBar
          height={140}
          onChange={this.handleChangeControl}
          reverb={this.state.reverb}
          width={WIDTH}
        />
        <Piano
          height={200}
          octaveMin={2}
          octaveMax={4}
          reverb={this.state.reverb}
          width={WIDTH}
        />
      </div>
    );

  }

}
