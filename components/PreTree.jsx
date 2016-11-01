import React,{Component,PropTypes} from 'react';
import styles from './PreTree.css';
import ui from 'redux-ui';

export default class PreTree extends Component {
  constructor(props) {
    super(props)
    //this.state = {} //avoid state but set it here if needed
    //bind event listeners here
  }
  render() {
    return (
      <div>PreTree</div>
    )
  }
}
PreTree.defaultProps = {
  data : {children : [],},
  getChildren : (data)=>{return data.children},
  getEntry : (data,prefix)=>{},
  childPrefix : "├",
  lastChildPrefix : "└",
  moreChildrenPrefix : "│",
  noMoreChildrenPrefix : " ",
  openPrefix : "◇",
  closedPrefix : "◆"

}
PreTree.propTypes = {
}
