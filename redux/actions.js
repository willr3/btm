import axios from 'axios'
import * as ActionTypes from './ActionTypes.js'

const instance = axios.create({
  //baseURL: 'https://some-domain.com/api/',
  //timeout: 20000,
  responseType: 'json',
  headers: {'Content-Type': 'application/json'},
  data : {}
});
function requestFrames(runId){
  return {
    type: ActionTypes.REQUEST_FRAMES,
    runId
  }
}
function receiveFrames(runId,json){
  return {
    type: ActionTypes.RECEIVE_FRAMES,
    runId,
    data: json
  }
}
function requestInvocation(runId,stackSetUid){
  return {
    type: ActionTypes.REQUEST_INVOCATION,
    runId,
    stackSetUid
  }
}
function receiveInvocation(runId,stackSetUid,json){
  return {
    type : ActionTypes.RECEIVE_INVOCATION,
    runId,
    stackSetUid,
    data : json
  }
}
function requestStackSet(runId,stackSetUid){
  return {
    type: ActionTypes.REQUEST_STACKSET,
    runId,
    stackSetUid
  }
}
function receiveStackSet(runId,stackSetUid,json){
  return {
    type: ActionTypes.RECEIVE_STACKSET,
    runId,
    stackSetUid,
    data: json
  }
}
function requestRun(runId){
  return {
    type: ActionTypes.REQUEST_RUN,
    runId
  }
}
function receiveRun(runId,json){
  return {
    type: ActionTypes.RECEIVE_RUN,
    runId,
    data: json
  }
}
function shouldFetchFrames(runId,state){
  return !state.frames || !state.frames[runId];
}

//searching sets
function searchRequest(runId,q){
  return {
    type: ActionTypes.SET_SEARCH_REQUEST,
    runId,
    q
  }
}
function searchResponse(runId,q,json){
  return {
    type: ActionTypes.SET_SEARCH_RESPONSE,
    runId,
    q,
    data: json
  }
}
export function removeSearch(runId,q){
  return {
    type: ActionTypes.REMOVE_SET_SEARCH,
    runId,
    q
  }
}
export function updateSearch(runId,q,color){
  return {
    type: ActionTypes.UPDATE_SET_SEARCH,
    runId,
    q,
    color
  }
}
export function search(runId,q){
  return (dspatch,getState)=>{
    dispatch(sendSearch(runId,q))
    return instance.get("/db/"+runId+"/search?q="+q)
    .then(json=>{
      dispatch(receiveSearchResult(runId,q,json.data))
    }).catch(error=>{ console.log(error)});
  }
}
export function fetchFrames(runId){
  return (dispatch,getState)=>{
    if( shouldFetchFrames(runId,getState()) ){
      dispatch(requestFrames(runId));
      return instance.get("/db/"+runId+"/frames")
        .then(json=>{
          dispatch(receiveFrames(runId,json.data))
        }).catch(error=>{ console.error(error)});
    }else{
      console.log("not fetching frames for "+runId);
    }
  }
}
function shouldFetchRun(runId,state){
  return !state.summary[runId]
}
export function fetchRun(runId){
  return (dispatch,getState)=>{
    if( shouldFetchRun(runId,getState()) ){
      dispatch(requestRun(runId));
      return instance.get("/db/"+runId+"/stackSetInvocations/")
        .then(json=>{
          dispatch(receiveRun(runId,json.data))
        }).catch(error=>{ console.error(error)});
    }else{
      console.log("not fetching "+runId);
    }
  }
}
function shouldFetchInvocation(runId,stackSetUid,state){
  return !state.invocation[runId] || !state.invocation[runId][stackSetUid];
}
export function fetchInvocation(runId,stackSetUid){
  return (dispatch,getState)=>{
      if( shouldFetchInvocation(runId,stackSetUid,getState())){
        dispatch(requestInvocation(runId,stackSetUid));
        return instance.get("/db/"+runId+"/stackSetInvocations/"+stackSetUid+"?fillStack=true&tree=true")
          .then(json=>{
            dispatch(receiveInvocation(runId,stackSetUid,json.data))
          }).catch(error=>{ console.error(error)});
      }else{
        console.log("not fetching"+runId+" "+stackSetUid);
      }
  }
}
export function fetchStackSet(runId,stackSetUid){
  return (dispatch)=>{
    dispatch(requestStackSet(runId,stackSetuId));
    return instance.get("/db/"+runId+"/stackSets/"+stackSetUid+"?fill=true")
    .then(json=>{
      dispatch(receiveStackSet(runId,stackSetUid,json.data))
    }).catch(error=>{ console.error(error)});
  }
}
