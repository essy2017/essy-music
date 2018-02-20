'use strict';

import React from 'react';
import PropTypes from 'prop-types';

export default class Key extends React.Component {

  render () {
    const props = this.props;
    const style = {
      left   : props.left,
      height : props.height,
      width  : props.width
    };
    return (
      <div
        className={'key' + (props.active ? ' active' : '')}
        onMouseDown={props.onMouseDown}
        onMouseEnter={props.onMouseEnter}
        onMouseLeave={props.onMouseLeave}
        style={style}
      >
        <div className="label">{props.label}</div>
      </div>
    );
  }

}

Key.propTypes = {
  active        : PropTypes.bool,
  label         : PropTypes.string,
  left          : PropTypes.number.isRequired,
  height        : PropTypes.number.isRequired,
  onMouseDown   : PropTypes.func.isRequired,
  onMouseEnter  : PropTypes.func.isRequired,
  onMouseLeave  : PropTypes.func.isRequired,
  width         : PropTypes.number.isRequired
};
