import React, {Component,PureComponent, PropTypes} from 'react'
import ReactDOM from 'react-dom';
import styles from './Table.css';
import {Link} from 'react-router'
import ui from 'redux-ui';

var stackSelectors = require('../selectors/stacks.js');


@ui({
  key: "myTableHeader"
})
class TableHeader extends PureComponent {
  constructor(props){
    super(props)
    this._filter = this._filter.bind(this);
    this._keyHandler = this._keyHandler.bind(this);
    this.state = {filter : ""}
  }
  _filter(e){
    //this.props.updateUI('filter',e.target.value)
    this.setState({filter:e.target.value})
  }
  _keyHandler(e){
    switch(e.key){
      case "Enter":
      if(this.props.onSearch){
        this.props.onSearch(e.target.value)
      }
      break;
    }
  }
  render(){

    return (
      <div className={styles.header}>
        <select className={styles.option}>
          <option>Filter</option>
          <option>Highlight</option>
        </select>
        <input className={styles.input} placeholder="search invocations" type="text" onChange={this._filter} onKeyDown={this._keyHandler} value={this.state.filter}/>
      </div>
    )
  }
}

class TableBody extends PureComponent {
  constructor(props){
    super(props)
  }
  render(){

    let {runId,context} = this.props;
    let content = this.props.data.isLoading ? ( <li>Loading...</li> ) : (
      this.props.data.map(function(entry,index){
        return (
          <li className={styles.entry} key={entry.stackUid}>
          <Link className={styles.entryLink} activeClassName={styles.active} to={"/"+runId+"/"+entry.stackUid}>
            <div className={styles.infoContainer}>
              <div className={styles.info}>{entry.stackUid}</div>
              <div className={styles.info}>invocations: {entry.invocationCount}</div>
              <div className={styles.info}>stacks: {entry.stackCount}</div>
              <div className={styles.info}>depth: {entry.maxDepth}</div>
              <div className={styles.info}>threads: {Math.max.apply(null,Object.keys(entry.threadCounts))}</div>
            </div>
            <div className={styles.shape} dangerouslySetInnerHTML={{__html: stackSelectors.svgShape(entry.tree,context)}}></div>
          </Link>
          </li>
        )
      })
    )
    return (
      <ul className={styles.list}>
        {content}
      </ul>
    )
  }
}
TableBody.defaultProps = {
  data : [],
  runId: -1,
  stackSetUid: -1,
  context: {},
  filter: ""
}

@ui({
  key : "myTable",
  state : {
    sorted : false,
    direction : false,
  }
})
export default class Table extends PureComponent {
  constructor(props){
    super(props)
  }
  render() {
    let {onSearch=(e)=>{},...props} = this.props;
    /*<div className={styles.shape} dangerouslySetInnerHTML={stackSelectors.svgShape(entry.tree,context)}></div>*/
    /*<div className={styles.shape}><img src={"data:image/svg+xml;base64,"+( new Buffer(stackSelectors.svgShape(entry.tree,context))).toString('base64')}/></div>*/
    return (
      <div className={styles.table}>
        <TableHeader onSearch={onSearch}/>
        <div className={styles.scroller}>
          <TableBody runId={this.props.runId} stackSetUid={this.props.stackSetUid} data={this.props.data} context={this.props.context}/>
        </div>
      </div>
    )
  }
}
Table.defaultProps = {
  data : {isLoading: true},
  context : {},
  runId : "",
  stackSetUid: ""
}
