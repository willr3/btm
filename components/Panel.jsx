import React, {Component,PureComponent, PropTypes} from 'react'
import ReactDOM from 'react-dom';

import styles from './Panel.css';

import ui from 'redux-ui';

@ui({
  state : {
    width : (props)=>{return props.width || false},
    x: -1,
    dragging: false
  }
})
export default class Panel extends PureComponent {
  constructor(props){
    super(props)
    this.mouseDown = this.mouseDown.bind(this);
    this.mouseUp = this.mouseUp.bind(this);
    this.mouseMove = this.mouseMove.bind(this);
    this.fitWidth = this.fitWidth.bind(this);
  }
  componentWillMount(){
    window.addEventListener('mousemove',this.mouseMove,true);
    window.addEventListener('mouseup',this.mouseUp,true);
  }
  componentWillUnmount(){
    window.removeEventListener('mousemove',this.mouseMove,true);
    window.removeEventListener('mouseup',this.mouseUp,true);
  }
  mouseDown(e){
    if(e.target.className.indexOf(styles.sizer)>-1 && this.props.resizable){
      if(e.target.setCapture){
        e.target.setCapture();
      }
      this.props.updateUI('x',e.pageX);
      e.preventDefault();
      this.props.updateUI('dragging',true);
      if(!this.props.ui.width){
        this.props.updateUI('width',ReactDOM.findDOMNode(this).clientWidth);
      }
      return false;
    }
  }
  mouseMove(e){
    if(this.props.ui.dragging){
      let delta = this.props.left ? this.props.ui.x - e.pageX : e.pageX - this.props.ui.x;

      this.props.updateUI('x',e.pageX)
      this.props.updateUI('width',this.props.ui.width+delta)
    }
  }
  mouseUp(e){
    this.props.updateUI('dragging',false)

  }
  fitWidth(){
    let thisDom = ReactDOM.findDOMNode(this);
    let thisWidth = thisDom.clientWidth;
    let wrappers = thisDom.getElementsByClassName(styles.content);
    let max = 0;
    let maxDiff = 0;
    for(let i=0; i< wrappers.length; i++){
      let wrapperWidth = wrappers.item(i).clientWidth;
      if(maxDiff < thisWidth - wrapperWidth){
        maxDiff = thisWidth - wrapperWidth
      }
      let children = wrappers.item(i).childNodes;
      for(let c = 0; c< children.length; c++){
        if (children.item(c).clientWidth > max){
          max = children.item(c).clientWidth
        }
      }
    }
    this.props.updateUI('width',max+maxDiff);
  }
  render() {
    let {className,style={},...props} = this.props;

    if(this.props.resizable && this.props.ui.width){
      style.width = this.props.ui.width+"px"
    }
    let resizer = this.props.resizable ? (<div className={styles.sizer +" "+ (this.props.left ? styles.left : styles.right)} draggable={false} onMouseDown={this.mouseDown} onDoubleClick={this.fitWidth}></div>) : null
    return (
      <div className={styles.panel} style={style}>
        <div className={styles.content+" "+(this.props.resizable ? this.props.left ? styles.left : styles.right : "")}>
          {this.props.children}
        </div>
        {resizer}
      </div>
    )
  }
}
Panel.defaultProps = {
  resizable : false,
  left: false,

}
