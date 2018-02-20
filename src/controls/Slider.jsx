'use strict';

import React from 'react';
import PropTypes from 'prop-types';

export default class Slider extends React.Component {

  constructor (props) {
    super(props);
    this.controlHeight = 0.8 * props.height;
    this.knobHeight    = 0.2 * this.controlHeight;

    this.handleMouseDownGroove = this.handleMouseDownGroove.bind(this);
    this.handleMouseDownKnob   = this.handleMouseDownKnob.bind(this);
    this.handleMouseMove       = this.handleMouseMove.bind(this);
    this.handleMouseUp         = this.handleMouseUp.bind(this);
  }

 /**
  * Handler for mousedown events on groove.
  * @method handleMouseDownGroove
  * @param e {Event}
  */
  handleMouseDownGroove (e) {
    const y = e.pageY - e.target.getBoundingClientRect().top - window.scrollY - this.knobHeight / 2;
    this.props.onChange(this.valueFromY(y));
  }

 /**
  * Handler for mousedown events on knob.
  * @method handleMouseDownKnob
  * @param e {Event}
  */
  handleMouseDownKnob (e) {
    this.offsetY = e.pageY - e.target.offsetTop - window.scrollY;
    window.addEventListener('mouseup', this.handleMouseUp, false);
    window.addEventListener('mousemove', this.handleMouseMove, false);
  }

 /**
  * Handler for mousemove events when dragging knob.
  * @method handleMouseMove
  * @param e {Event}
  */
  handleMouseMove (e) {
    this.props.onChange(this.valueFromY(e.pageY - this.offsetY));
  }

 /**
  * Handler for mouseup events when dragging knob.
  * @method handleMouseUp
  * @param e {Event}
  */
  handleMouseUp (e) {
    window.removeEventListener('mouseup', this.handleMouseUp);
    window.removeEventListener('mousemove', this.handleMouseMove);
  }

 /**
  * Gets knob position from value.
  * @method getKnobPosition
  * @param value {Number} Value in domain.
  * @return {Number} Position in DOM.
  */
  getKnobPosition (value) {
    return value * (this.controlHeight - this.knobHeight);
  }

 /**
  * Gets slider value from DOM position.
  * @method valueFromY
  * @param y {Number} Y position in DOM.
  * @return {Number} Corresponding value in domain.
  */
  valueFromY (y) {
    const d = this.props.domain;
    return (d[1] - d[0]) *
      Math.max(0,
        Math.min(this.controlHeight - this.knobHeight, y) / (this.controlHeight - this.knobHeight)
      );
  }

  render () {

    const props = this.props;
    const style = {
      height : props.height,
      left   : props.left,
      top    : props.top,
      width  : props.width
    };
    const styleControl = {
      height : this.controlHeight
    };
    const styleKnob = {
      height : this.knobHeight,
      top    : this.getKnobPosition(props.value)
    };

    return (
      <div className="slider" style={style}>
        <div className="control" style={styleControl}>
          <div className="groove" onMouseDown={this.handleMouseDownGroove}></div>
          <div
            className="knob"
            onMouseDown={this.handleMouseDownKnob}
            style={styleKnob}
          ></div>
        </div>
        <div className="label">{props.label}</div>
      </div>
    );
  }

}

Slider.propTypes = {
  domain   : PropTypes.array.isRequired,
  height   : PropTypes.number.isRequired,
  label    : PropTypes.string.isRequired,
  left     : PropTypes.number.isRequired,
  onChange : PropTypes.func.isRequired,
  top      : PropTypes.number.isRequired,
  value    : PropTypes.number.isRequired,
  width    : PropTypes.number.isRequired
};
