'use strict';

import React from 'react';
import PropTypes from 'prop-types';

export default class Selector extends React.Component {

  handleClick (type) {
    this.props.onClick(type);
  }

  render () {

    const props = this.props;

    return (
      <div className="selector">
        {
          props.items.map( (d, i) =>
            <div
              className={'item' + (d === props.value ? ' active' : '')}
              key={i}
              onClick={this.handleClick.bind(this, d)}
            >
              {d}
            </div>
          )
        }
      </div>
    );
  }

}

Selector.propTypes = {
  items   : PropTypes.array.isRequired,
  onClick : PropTypes.func.isRequired,
  value   : PropTypes.string.isRequired
};
