'use strict';

import React from 'react';
import PropTypes from 'prop-types';

export default class KeySharp extends React.Component {

  render () {

    const props = this.props;
    const style = {
      height : props.height,
      left   : props.left,
      width  : props.width
    };
    return (
      <div
        className={'key sharp' + (props.active ? ' active' : '')}
        onMouseDown={props.onMouseDown}
        onMouseEnter={props.onMouseEnter}
        onMouseLeave={props.onMouseLeave}
        style={style}
      >
        <div className="sharp-top"></div>
      </div>
    );
  }

}

KeySharp.propTypes = {
  active       : PropTypes.bool,
  height       : PropTypes.number.isRequired,
  left         : PropTypes.number.isRequired,
  onMouseDown  : PropTypes.func.isRequired,
  onMouseEnter : PropTypes.func.isRequired,
  onMouseLeave : PropTypes.func.isRequired,
  width        : PropTypes.number.isRequired
};
