import React,{Component,PropTypes} from 'react';
import styles from './SideBar.css';
import ui from 'redux-ui';

export default class SideBar extends Component { 
  constructor(props) {
    super(props)
    //this.state = {} //avoid state but set it here if needed
    //bind event listeners here
  }
  render() {
    return (
      <div>SideBar</div>
    )
  }
}
SideBar.defaultProps = {
}
SideBar.propTypes = {
}