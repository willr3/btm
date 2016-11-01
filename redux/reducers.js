import * as ActionTypes from './ActionTypes.js'

export function context(state = {},action){
  switch(action.type){
    case ActionTypes.RECEIVE_FRAMES:
      const rtrn = Object.assign({},state)
      try{
        action.data.forEach(function(frame,index){
          if(frame.startsWith("org.spec")){
            rtrn[index]="#e41a1c"
          }
          // else if (frame.startsWith("")){
          //   rtrn[index]="#377eb8"
          // }
          else if (frame.startsWith("org.apache.activemq.artemis.core.remoting.impl.invm.InVMConnection.createTransportBuffer")){
            rtrn[index]="#4daf4a"
          }
          // else if (frame.indexOf("onMessage") !== -1 ){
          //   rtrn[index]="#984ea3"
          // }
        })
      }catch(Ex){console.log(Ex)}
      return rtrn;
      break;
    default:
      return state;
  }
}
export function searchResult(state = {},action){
  switch(action.type){
    case ActionTypes.SEARCH_RESULT:
      console.log("search result "+action.q+" "+action.data.length);
      return {
        q: action.q,
        data: action.data
      }
      break;
    default: return state;
  }
}
export function frames(state = {},action){
  switch(action.type){
    case ActionTypes.REQUEST_FRAMES:
      if(!state[action.runId]){
        const rtrn = Object.assign({},state, {
          [action.runId] : {isLoading: true}
        })
        return rtrn;
      }else{
        return state;
      }
      break;
    case ActionTypes.RECEIVE_FRAMES:
      return Object.assign({},state, {
        [action.runId] : action.data
      })
      break;
    default:
      return state;
  }
}
export function summary(state = {}, action){
  switch(action.type){
    case ActionTypes.REQUEST_RUN:
      if(!state[action.runId]){
        const rtrn = Object.assign({},state, {
          [action.runId] : {isLoading: true}
        })
        return rtrn;
      }else{
        return state;
      }
      break;
    case ActionTypes.RECEIVE_RUN:
      return Object.assign({},state, {
        [action.runId] : action.data
      })
      break;
    default:
      return state
  }
}
export function invocation(state = {},action){
  let {runId,stackSetUid} = action;
  switch(action.type){
    case ActionTypes.REQUEST_INVOCATION:
      let newState = Object.assign({},state);
      if(!newState[runId]){
        newState[runId] = {}
      }
      if(!newState[runId][stackSetUid]){
        newState[runId][stackSetUid] = {isLoading: true}
      }
      return newState;
      break;
    case ActionTypes.RECEIVE_INVOCATION:
      let ns = Object.assign({},state);
      ns[runId][stackSetUid]=action.data
      return ns;
      break;
    default:
      return state;
  }
}
