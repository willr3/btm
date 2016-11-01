import React, {Component, PropTypes} from 'react'
import {connect} from 'react-redux'
import {fetchFrames,fetchRun,search} from '../redux/actions.js'
import {Link} from 'react-router'

import Panel from '../components/Panel.jsx';
import Shell from '../components/Shell.jsx';
import Table from '../components/Table.jsx';

var stackSelectors = require('../selectors/stacks.js');



var SortTypes = {
  ASC: 'ASC',
  DESC: 'DESC'
}
function reverseSortDirection(sortDir){
  return sortDir == SortTypes.DESC ? SortTypes.ASC : SortTypes.DESC;
}

class SortHeaderCell extends Component {
  constructor(props){
    super(props)
    this._onSortChange = this._onSortChange.bind(this);
  }
  _onSortChange(e){
    e.preventDefault()
    if(this.props.onSortChange){
      this.props.onSortChange(this.props.columnKey,this.props.sortDir ? reverseSortDirection(this.props.sortDir) : SortTypes.DESC)
    }
  }
  render (){
    var {sortDir,children, ...props} = this.props;
    return (
      <Cell {...props}>
        <a onClick={this._onSortChange}>
          {children} {sortDir ? (sortDir == SortTypes.DESC ? '▼' : '▲') : ''}
        </a>
      </Cell>
    );
  }
}

const TextCell = ({rowIndex, data,columnKey, ...props}) => (
  <Cell {...props}>
    {data.getObjectAt(rowIndex)[columnKey]}
  </Cell>
);

class Run extends Component {
  constructor(props){
    super(props)

  }
  componentDidMount() {
    const {dispatch, runId} = this.props;
    dispatch(fetchFrames(runId));
    dispatch(fetchRun(runId));
  }
  render(){
    if(!this.props.data.isLoading){
      this.props.data.sort((a,b)=>{
        let threadSort  = Math.max.apply(null,Object.keys(b.threadCounts)) - Math.max.apply(null,Object.keys(a.threadCounts));
        if(threadSort!=0){
          return threadSort
        }
        let countSort = b.invocationCount - a.invocationCount
        if(countSort!=0){
          return countSort
        }
        return b.stackUid - a.stackUid;
      })
    }
    const {runId} = this.props;
    var context = this.props.context
    var content = this.props.data.isLoading ? (<div>Loading</div>) :
      (<Table data={this.props.data} context={this.props.context} runId={runId} stackSetUid={this.props.stackSetUid}></Table>)
    /*(
      <table cellSpacing="0">
        <thead>
          <tr>
            <th>shape</th>
            <th>Uid</th>
            <th>invocations</th>
            <th>stacks</th>
            <th>depth</th>
            <th>threads</th>
          </tr>
        </thead>
        <tbody>
            {this.props.data.map(function(entry,index){
              return (
                <tr key={entry.stackUid}>
                  <td><img src={"data:image/svg+xml;base64,"+( new Buffer(stackSelectors.svgShape(entry.tree,context))).toString('base64')}/></td>
                  <td><Link to={"/"+runId+"/"+entry.stackUid}>{entry.stackUid}</Link></td>
                  <td>{entry.invocationCount}</td>
                  <td>{entry.stackCount}</td>
                  <td>{entry.maxDepth}</td>
                  <td>{Math.max.apply(null,Object.keys(entry.threadCounts))}</td>
                </tr>
              )
            })}
        </tbody>
      </table>
    )*/
    return (
      <Shell>
        <Panel resizable={true} width={300} >
          {content}
        </Panel>
        {this.props.children}
      </Shell>
    )
  }
}
Run.defaaultProps = {
  runId : "runId"
}
function mapStateToProps(state, ownProps){
  let runId = ownProps.params.runId
  let stackSetUid = ownProps.params.stackSetUid || -1
  return {
    runId: runId,
    stackSetUid : stackSetUid,
    data : state.summary[runId] || {isLoading:true},
    context : state.context || {},
    searchResult : state.searchResult
  }
}
export default connect(mapStateToProps)(Run)
