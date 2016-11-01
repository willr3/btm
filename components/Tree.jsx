import React, {Component,PureComponent, PropTypes} from 'react'
import ReactDOM from 'react-dom';
import {Map,List} from 'immutable';
import styles from './Tree.css';
import ui from 'redux-ui';

const child = "├";
const lastChild = "└";
const moreChildren = "│";
const noMoreChildren = " ";

const collapsed = "◆";
const expanded = "◇";

class Branch extends Component {
  constructor(props){
    super(props)
    this.setLines = this.setLines.bind(this)
  }
  setLines(){
    let keys = Object.keys(this.props.tree.stackUids);
    if(keys.length!==0){
      this.props.setLines(this.props.tree);
    }
  }
  render(){
    let children = this.props.getChildren(this.props.tree)
    let isLast = this.props.last;

    let content = this.props.collapsed ? null : children.map((childTree,idx)=>{
      return (
        <Branch
          key={idx}
          tree={childTree}
          prefix = {this.props.first ? this.props.prefix : this.props.prefix.push(<span key={this.props.tree.__callId} className={ styles.prefix + " "+ (this.props.parentHighlighted ? styles.highlightedColor : "")}>{isLast ? noMoreChildren : moreChildren}</span> )}
          highlighted = {this.props.isHighlighted(childTree)}
          parentHighlighted = {this.props.highlighted}
          collapsed = {this.props.isCollapsed(childTree)}
          selected = {this.props.isSelected(childTree)}
          last = {(idx == children.length-1)}

          getFrame = {this.props.getFrame}
          toggleCollapse={this.props.toggleCollapse}
          toggleHighlight={this.props.toggleHighlight}
          setSelected={this.props.setSelected}
          setLines={this.props.setLines}

          isHighlighted={this.props.isHighlighted}
          isCollapsed={this.props.isCollapsed}
          isSelected={this.props.isSelected}
        >
        </Branch>)
    })
    let frameString = this.props.getFrame(this.props.tree)
    let methodIdx = frameString.lastIndexOf(".");
    let classIdx = frameString.lastIndexOf(".",methodIdx-2)+1;
    return (
      <div className={styles.branch}>
        {this.props.prefix.toArray()}
        <span className={styles.prefix+" "+(this.props.parentHighlighted ? styles.highlightedColor : "")}>{(this.props.first ? "" : this.props.last ? lastChild : child)}</span>
        <span className={styles.nodeToken+" "+(this.props.highlighted ? styles.highlightedColor:"")} onClick={(e)=>{this.props.toggleCollapse(this.props.tree)}}>
          {this.props.collapsed ? collapsed : expanded}
        </span>
        <span className={styles.frame+" "+(this.props.selected ? styles.selected : "")} onClick={(e)=>{e.preventDefault();this.setLines();this.props.setSelected(this.props.tree);}} onDoubleClick={(e)=>{e.preventDefault();this.props.toggleHighlight(this.props.tree);}}>
          <span className={styles.package}>{frameString.substring(0,classIdx)}</span>
          <span className={styles.class}>{frameString.substring(classIdx,methodIdx)}</span>
          <span className={styles.method}>{frameString.substring(methodIdx)}</span>
          {}
        </span>
        {content}
      </div>
    )
  }
}
Branch.defaultProps = {
  collapsed : false,
  highlighted : false,
  parentHighlighted : false,
  prefix : new List(),
  last : false,
  first : false,
  getChildren : (data)=>{return data.children},
  getFrame : (data)=>{return "--"},
  tree : {},
  isCollapsed : (data)=>{return false},
  isHighlighted : (data)=>{return true},
  isSelected : (data)=>{return false},

  toggleCollapse : (e)=>{console.log(e)},
  toggleHighlight: (e)=>{console.log(e)},
  setSelected: (e)=>{console.log(e)}
}
@ui({
  key : "myTree",
  state : {
    collapsed : new Map(),
    highlighted : new Map(),
    selected : false,
    flat : (props,state)=>{return props.flat}
  }
})
export default class Tree extends PureComponent {
  constructor(props){
    super(props)

    this.getNodeId = this.getNodeId.bind(this);
    this.isHighlighted = this.isHighlighted.bind(this)
    this.isCollapsed = this.isCollapsed.bind(this)
    this.isSelected = this.isSelected.bind(this)

    this.getFrame = this.getFrame.bind(this)

    this.toggleCollapse = this.toggleCollapse.bind(this)
    this.toggleHighlight = this.toggleHighlight.bind(this)
    this.setSelected = this.setSelected.bind(this)
    this.setLines = this.setLines.bind(this)
  }
  toggleCollapse(data){
    let id = this.getNodeId(data);
    let collapseState = this.props.ui.collapsed;
    let current = collapseState.get(id);

    collapseState = collapseState.set(id,!current);

    this.props.updateUI('collapsed',collapseState);
  }
  toggleHighlight(data){
    let id = this.getNodeId(data);
    let highlightState = this.props.ui.highlighted;
    let current = highlightState.get(id);
    highlightState = highlightState.set(id,!current);

    this.props.updateUI('highlighted',highlightState);
  }
  setSelected(data){
    let id = this.getNodeId(data);
    this.props.updateUI('selected',id);
  }
  setLines(data){
    let keys = Object.keys(data.stackUids);
    if(keys.length!==0){
      let stack = data.stackUids[keys[0]];
      let id = this.getNodeId(this.props.tree)


    }

  }
  getFrame(tree){
    let uid = tree.uid

    return this.props.getFrame(uid) || "<>";
  }
  getNodeId(data){
    return data.__callId
  }
  isHighlighted(data){
    let nodeId = this.getNodeId(data)
    return !!this.props.ui.highlighted.get(nodeId);
  }
  isCollapsed(data){
    let nodeId = this.getNodeId(data)
    return !!this.props.ui.collapsed.get(nodeId);
  }
  isSelected(data){
    return this.props.ui.selected==this.getNodeId(data);
  }
  render(){
    let children = this.props.getChildren(this.props.tree)
    let cx = children.map((childTree,idx)=>{
      return (<Branch
        key = {childTree.__callId}
        tree = {childTree}
        getFrame = {this.getFrame}

        first = {true}

        highlighted = {this.isHighlighted(childTree)}
        collapsed = {this.isCollapsed(childTree)}
        selected = {this.isSelected(childTree)}

        toggleCollapse={this.toggleCollapse}
        toggleHighlight={this.toggleHighlight}
        setSelected = {this.setSelected}
        setLines={this.setLines}

        isHighlighted={this.isHighlighted}
        isCollapsed={this.isCollapsed}
        isSelected={this.isSelected}
        >
      </Branch>)
    })
    return (
      <div className={styles.tree}>
        <pre>
        {cx}
        </pre>
      </div>
    )
  }
}
Tree.defaultProps = {
  getFrame : (frameUid)=>{return "--"},
  getUid : (data)=>{return data.uid},
  getNodeId : (data)=>{return data.__callId},
  getChildren : (data)=>{return data.children},
  flat : {},
  tree : {}
}
