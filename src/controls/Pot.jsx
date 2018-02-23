'use strict';

import React from 'react';
import PropTypes from 'prop-types';

/*******************************************************************************
 *
 * Creates a potentiometer knob.
 * @class Pot
 * @extends React.Component
 *
 ******************************************************************************/
export default class Pot extends React.Component {

 /**
  * Constructor.
  * @method constructor
  * @param props {Object}
  */
  constructor (props) {

    super(props);

    this.margin     = 0.15 * props.size;
    this.fullAngle  = props.angle;
    this.startAngle = (360 - props.angle) / 2;
    this.endAngle   = this.startAngle + props.angle;
    this.center     = this.margin + props.size / 2;

    this.styles = this.createStyles(props, this.margin);
    this.ticks  = this.createTicks(props, this.center);

    this.state = {
      rotation : this.getRotationFromValue(props.value),
      value    : props.value
    };

    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseUp   = this.handleMouseUp.bind(this);
  }

 /**
  * Lifecycle method to update value and rotation.
  * @method componentWillReceiveProps
  * @param nextProps {Object}
  */
  componentWillReceiveProps (nextProps) {
    if (this.props.value !== nextProps.value) {
      this.setState({
        rotation : this.getRotationFromValue(nextProps.value),
        value    : nextProps.value
      });
    }
  }

 /**
  * Creates styles for elements.
  * @method createStyles
  * @param props {Object}
  * @param margin {Number}
  * @return {Object} Styles.
  */
  createStyles (props, margin) {
    return {
      pot: {
        height : 3*margin + props.size,
        width  : 2*margin + props.size
      },
      knobArea: {
        height : 2*margin + props.size,
        width  : 2*margin + props.size
      },
      ticks: {
        height : 2*margin + props.size,
        width  : 2*margin + props.size
      },
      knobOuter: {
        height : props.size,
        left   : margin,
        top    : margin,
        width  : props.size
      }
    };
  }

 /**
  * Creates ticks.
  * @method createTicks
  * @param props {Object}
  * @param size {Number} Height of ticks.
  * @return {Object[]} Tick configurations.
  */
  createTicks (props, size) {

    let ticks  = [];
    let steps  = [];
    let labels = [];

    const incr          = this.fullAngle / (props.ticks - 1);
    const sizeOuter     = this.margin + props.size / 2;
    const numLabels     = props.labels.length;
    const ticksPerLabel = (props.ticks - 1) / (numLabels - 1);

    for (let deg = this.startAngle, i = 0; deg <= this.endAngle; deg += incr, i++) {
      const fat    = i % ticksPerLabel === 0;
      const styles = {
        deg: deg,
        outerStyle: {
          height          : size,
          left            : sizeOuter - 1,
          top             : sizeOuter,
          transform       : 'rotate(' + Math.ceil(deg) + 'deg)',
          transformOrigin : 'top',
          width           : fat ? 2 : 1
        },
        labelStyle: {},
        label: ''
      };
      if (fat) {
        styles.labelStyle = {
          transform : 'translateX(-50%) rotate(' + (360 - Math.ceil(deg)) + 'deg)'
        };
        styles.label = props.labels[i / ticksPerLabel];
        labels.push(props.labels[i / ticksPerLabel]);
      }
      ticks.push(styles);
      steps.push(deg);
    }

    this.steps  = steps;
    this.labels = labels;

    return ticks;
  }

 /**
  * Handler for mousedown events.
  * @method handleMouseDown
  * @param e {Event}
  */
  handleMouseDown (e) {

    e.preventDefault();

    const bb      = e.target.getBoundingClientRect();
    this.xy       = [window.scrollX + bb.left + bb.width/2, window.scrollY + bb.top + bb.height / 2];
    this.rotation = this.state.rotation;
    this.startDeg = -1;

    window.addEventListener('mousemove', this.handleMouseMove, false);
    window.addEventListener('mouseup', this.handleMouseUp, false);
  }

 /**
  * Handler for mousemove events.
  * @method handleMouseMove
  * @param e {Event}
  */
  handleMouseMove (e) {

    let deg = Math.atan2(this.xy[1] - e.pageY, this.xy[0] - e.pageX) * (180 / Math.PI) - 90;

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

    if (tmp < this.startAngle) {
      tmp = this.startAngle;
    }
    if (tmp > this.endAngle) {
      tmp = this.endAngle;
    }

    if (this.props.snap) {
      tmp = this.snap(tmp);
    }

    this.setState({
      rotation: tmp
    });

  }

 /**
  * Snaps to position.
  * @method snap
  * @param deg {Number} Current degrees.
  * @return {Number} Snapped degrees.
  */
  snap (deg) {
    const steps = this.steps;
    for (let i = 1; i < steps.length; i++) {
      if (deg > steps[i - 1] && deg < steps[i]) {
        if (deg - steps[i - 1] > steps[i] - deg) {
          return steps[i];
        }
        else {
          return steps[i - 1];
        }
      }
    }
    return deg;
  }

 /**
  * Handler for mouseup events.
  * @method handleMouseUp
  * @param e {Event}
  */
  handleMouseUp (e) {
    let value = this.getValueFromRotation(this.state.rotation);
    if (this.props.snap && typeof value !== 'string') {
      value = Math.round(value);
    }
    this.props.onChange(value);
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('mouseup', this.handleMouseUp);
  }

 /**
  * Gets rotation from value.
  * @method getRotationFromValue
  * @param value {Number} Value in domain.
  * @return {Number} Rotation in degrees.
  */
  getRotationFromValue (value) {
    const d = this.props.domain;
    if (d === false) {
      return this.steps[this.labels.indexOf(value)];
    }
    else {
      return this.startAngle + ((value - d[0]) / (d[1] - d[0])) * this.fullAngle;
    }
  }

 /**
  * Gets value from rotation.
  * @method getValueFromRotation
  * @param r {Number} Rotation in degrees.
  * @return {Number} Value in domain.
  */
  getValueFromRotation (r) {
    const d = this.props.domain;
    if (d === false) {
      return this.labels[this.steps.indexOf(r)];
    }
    else {
      return d[0] + (d[1] - d[0]) * ((r - this.startAngle) / (this.endAngle - this.startAngle));
    }
  }

 /**
  * Renders component.
  * @method render
  */
  render () {

    const props     = this.props;
    const styles    = this.styles;
    const rotate    = this.state.rotation;
    const cum       = props.cumulative;
    const knobStyle = {
      height    : props.size,
      transform : 'rotate(' + rotate + 'deg)',
      width     : props.size
    };

    return (
      <div className={'pot' + (props.className.length ? ' ' + props.className : '')} style={styles.pot}>
        <div className="label">{props.label}</div>
        <div className="knob-area" style={styles.knobArea}>
          <div className="ticks" style={styles.ticks}>
            {
              this.ticks.map( (d, i) =>
                <div
                  key={i}
                  className={'tick' + (cum && d.deg <= rotate ? ' active' : '')}
                  style={d.outerStyle}
                >
                  <div className="tick-label" style={d.labelStyle}>{d.label}</div>
                </div>
              )
            }
          </div>
          <div className="knob-outer" style={styles.knobOuter} onMouseDown={this.handleMouseDown}>
            <div className="knob-inner" style={knobStyle}>
              <div className="marker"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

}

Pot.defaultProps = {
  angle      : 300,
  className  : '',
  cumulative : false,
  domain     : [0, 1],
  label      : '',
  labels     : [],
  size       : 60,
  snap       : false,
  ticks      : 20
};

Pot.propTypes = {
  angle      : PropTypes.number,
  className  : PropTypes.string,
  cumulative : PropTypes.bool,
  domain     : PropTypes.oneOfType([PropTypes.array, PropTypes.bool]),
  label      : PropTypes.string,
  labels     : PropTypes.array,
  onChange   : PropTypes.func.isRequired,
  size       : PropTypes.number,
  snap       : PropTypes.bool,
  ticks      : PropTypes.number,
  value      : PropTypes.oneOfType([PropTypes.number, PropTypes.string])
};
