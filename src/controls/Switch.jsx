'use strict';

import React from 'react';
import PropTypes from 'prop-types';

/*******************************************************************************
 *
 * Simple switch control.
 * @class Switch
 * @extends React.Component
 *
 ******************************************************************************/
export default class Switch extends React.Component {

 /**
  * Constructor.
  * @method constructor
  * @param props {Object}
  */
  constructor (props) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
  }

 /**
  * Click handler.
  * @method handleClick
  */
  handleClick (e) {
    const props = this.props;
    const index = props.values.indexOf(props.value) === 0 ? 1 : 0;
    props.onChange(props.values[index]);
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
    const isOn   = props.values.indexOf(props.value) === 1;
    const isVert = props.vertical;

    return (
      <div className={'switch ' + props.className + (isOn ? ' on' : ' off') + (isVert ? ' vertical' : '')}>
        { isVert && <div className="label label-top">{props.labels[0]}</div> }
        <div className="rocker" style={style} onClick={this.handleClick}>
          <div className="sq sq-1"></div>
          <div className="sq sq-2"></div>
          <div className="sq sq-3"></div>
          <div className="sq sq-4"></div>
        </div>
        {
          isVert ? <div className="label label-bottom">{props.labels[1]}</div> :
            <div className="labels">
              <div className="label label-left">{props.labels[0]}</div>
              <div className={'label label-right' + (props.labels[1] === 'on' ? ' label-on' : '')}>{props.labels[1]}</div>
            </div>
        }
      </div>
    );
  }

}

Switch.defaultProps = {
  className : '',
  labels    : ['', 'on'],
  values    : [false, true],
  vertical  : false
};

Switch.propTypes = {
  className : PropTypes.string,
  height    : PropTypes.number.isRequired,
  labels    : PropTypes.array,
  onChange  : PropTypes.func.isRequired,
  value     : PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
  values    : PropTypes.array,
  vertical  : PropTypes.bool,
  width     : PropTypes.number.isRequired
};
