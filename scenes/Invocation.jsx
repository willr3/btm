import React, {Component, PureComponent, PropTypes} from 'react'
import {connect} from 'react-redux'
import {fetchInvocation} from '../redux/actions.js'
import Stacks from '../selectors/stacks.js'
import Panel from '../components/Panel.jsx';
import Shell from '../components/Shell.jsx';
import Tree from '../components/Tree.jsx';

const getUid = (data)=>data.__callId

class Invocation extends PureComponent {
  constructor(props){
    super(props)
    this.i = 0;
    this.getFrame = this.getFrame.bind(this);
  }
  componentDidMount() {
    const {dispatch,runId,stackSetUid} = this.props;
    dispatch(fetchInvocation(runId,stackSetUid));
  }
  componentWillReceiveProps(nextProps){
    const {dispatch} = this.props;
    if(nextProps.runId != this.props.runId || nextProps.stackSetUid != this.props.stackSetUid){
      dispatch(fetchInvocation(nextProps.runId,nextProps.stackSetUid));
    }
  }
  getFrame(frameUid){
    return this.props.frames[frameUid]
  }
  render(){
    const {runId,stackSetUid,data} = this.props;


    let content = "Loading"
    if(!data.isLoading){

      // content = <div dangerouslySetInnerHTML={{__html:Stacks.debugTree(data.tree,this.props.frames)}}></div>
      content = <Tree
        getFrame={this.getFrame}
        getUid={getUid}
        flat={data.flat}
        tree={data.tree}/>
    }
    return (
      <Shell style={{ flex:'1'}}>
        <Panel style={{ flex:'1'}}>
          {content}
        </Panel>
        {/*<Panel left={true} resizable={true} width={200}>foo</Panel>*/}
      </Shell>
    )
  }
}
const empty = []
const isLoading = {isLoading: true}
function mapStateToProps(state, ownProps){
  const {runId,stackSetUid} = ownProps.params;
  return {
    runId : runId,
    stackSetUid: stackSetUid,
    frames: state.frames[runId] ? state.frames[runId] : empty,
    data : state.invocation[runId] ? state.invocation[runId][stackSetUid] || isLoading : isLoading
  }
}

export default connect(mapStateToProps)(Invocation)
