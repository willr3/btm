import React from 'react';
import styles from './Shell.css';
import {Link} from 'react-router';

export default React.createClass({
  getDefaultProps() {
    return {}
  },
  getInitialState() {
    return {}
  },
  render() {
    return (
      <div className={styles.shell}>
        {this.props.children}
      </div>
    )
  }
});
