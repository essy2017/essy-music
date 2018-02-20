'use strict';

import React from 'react';
import PropTypes from 'prop-types';

const RAD2DEG    = 180 / Math.PI;
const ROTATE_MIN = 45;
const ROTATE_MAX = 315;

/*******************************************************************************
 *
 * A control knob.
 * @class Knob
 * @extends React.Component
 *
 ******************************************************************************/
export default class Knob extends React.Component {

 /**
  * Constructor.
  * @method constructor
  * @param props {Object}
  */
  constructor (props) {
    super(props);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp   = this.onMouseUp.bind(this);
  }

 /**
  * Handler for mousedown events.
  * @method onMouseDown
  * @param e {Event}
  */
  onMouseDown (e) {
    const bb = e.target.getBoundingClientRect();
    this.xy = [window.scrollX + bb.left + bb.width / 2, window.scrollY + bb.top + bb.height / 2];
    this.rotation = this.getRotationFromValue(this.props.value);
    this.startDeg = -1;

    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mouseup', this.onMouseUp);
  }

 /**
  * Handler for mousemove events.
  * @method onMouseMove
  * @param e {Event}
  */
  onMouseMove (e) {

    let deg = Math.atan2(this.xy[1] - e.pageY, this.xy[0] - e.pageX) * RAD2DEG - 90;

    if (deg < 0) {
      deg = 360 + deg;
    }
    if (this.startDeg === -1) {
      this.startDeg = deg;
    }

    let tmp = Math.floor((deg - this.startDeg) + this.rotation);
    if (tmp < 0) {
      tmp = 360 + tmp;
    }
    else if (tmp > 359) {
      tmp = tmp % 360;
    }

    if (tmp < ROTATE_MIN) {
      tmp = ROTATE_MIN;
    }
    else if (tmp > ROTATE_MAX) {
      tmp = ROTATE_MAX;
    }
    this.tmp = tmp;

    this.props.onChangeTmp(this.getValueFromRotation(tmp));

  }

 /**
  * Handler for mouseup events.
  * @method onMouseUp
  * @param e {Event}
  */
  onMouseUp (e) {
    this.props.onChange(this.getValueFromRotation(this.tmp));
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseup', this.onMouseUp);
  }

 /**
  * Gets rotation from value.
  * @method getRotationFromValue
  * @param value {Number} Value in domain.
  * @return {Number} Rotation in degrees.
  */
  getRotationFromValue (value) {
    const d = this.props.domain;
    return ROTATE_MIN + (value / (d[1] - d[0])) * (ROTATE_MAX - ROTATE_MIN);
  }

 /**
  * Gets value from rotation.
  * @method getValueFromRotation
  * @param r {Number} Rotation in degrees.
  * @return {Number} Value in domain.
  */
  getValueFromRotation (r) {
    const d = this.props.domain;
    return (d[1] - d[0]) * ((r - ROTATE_MIN) / (ROTATE_MAX - ROTATE_MIN));
  }

 /**
  * Renders tick marks.
  * @method renderTicks
  * @param rotate {Number} Current rotation.
  * @return {React.Component[]} Tick marks.
  */
  renderTicks (rotate) {

    const COUNT = 20;
    const INCR  = (ROTATE_MAX - ROTATE_MIN) / COUNT;
    const START = ROTATE_MIN + 180;
    const END   = ROTATE_MAX + 180;

    rotate = rotate + 180;

    let ticks = [];

    for (let deg = START; deg <= END; deg += INCR) {
      ticks.push(
        <div
          className={'tick' + (deg <= rotate ? ' active' : '')}
          key={deg}
          style={{ transform: 'rotate(' + deg + 'deg)' }}
        >
        </div>
      );
    }
    return ticks;
  }

  render () {

    const props  = this.props;
    const rotate = this.getRotationFromValue(props.value);
    const style  = {
      left  : props.left,
      top   : props.top,
      width : props.size
    };
    const styleTicks = {
      height : props.size,
      width  : props.size
    };
    const styleControl = {
      height    : props.size,
      width     : props.size,
      transform : 'rotate(' + rotate + 'deg)'
    };

    return (
      <div className="knob-control" style={style}>
        <div className="label">{props.label}</div>
        <div className="control" style={styleTicks}>
          <div className="ticks" style={styleTicks}>
            {this.renderTicks(rotate)}
          </div>
          <div className="knob" style={styleControl} onMouseDown={this.onMouseDown}>

          </div>
        </div>
      </div>
    );
  }

}

Knob.propTypes = {
  domain      : PropTypes.array.isRequired,
  label       : PropTypes.string.isRequired,
  left        : PropTypes.number.isRequired,
  onChange    : PropTypes.func.isRequired,
  onChangeTmp : PropTypes.func.isRequired,
  size        : PropTypes.number.isRequired,
  top         : PropTypes.number.isRequired,
  value       : PropTypes.number.isRequired
};
