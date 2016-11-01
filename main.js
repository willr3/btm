import 'babel-polyfill'
import styles from './public/styles/globals.css';
import {Router, Route, IndexRoute, browserHistory } from 'react-router'
import {connect,Provider} from 'react-redux'
import React from 'react'
import {render} from 'react-dom'

import {createStore, applyMiddleware, combineReducers} from 'redux'
import thunkMiddleware from 'redux-thunk'
import createLogger from 'redux-logger'
import {syncHistoryWithStore, routerReducer } from 'react-router-redux'
import {reducer as uiReducer} from 'redux-ui'
import {summary,invocation,frames,context,searchResult} from './redux/reducers.js'
import {fetchFrames} from './redux/actions.js'


import _ from 'lodash'

const loggerMiddleware = createLogger()

import axios from 'axios';


import Run from './scenes/Run.jsx';
import Invocation from './scenes/Invocation.jsx';

import Shell from './components/Shell.jsx'


function configureStore(initialState){
  return createStore(
    combineReducers({
      summary,
      invocation,
      frames,
      context,
      searchResult,
      routing: routerReducer,
      ui : uiReducer
    }),
    initialState,
    applyMiddleware(
      thunkMiddleware
    )
  )
}


browserHistory.listen(locaton=>{  })
const store = configureStore();

const history = syncHistoryWithStore(browserHistory,store);

const App = React.createClass({
  render () {
    return (
      <div>
        <span>TODO: create an app</span>
      </div>
    )
  }
})
render (
  (
    <Provider store={store}>
      <Router history={history}>
        <Route path="/">
          <IndexRoute component={App}/>
          <Route path=":runId" component={Run}>
            <Route path=":stackSetUid" component={Invocation}>
            </Route>
          </Route>
        </Route>
      </Router>
    </Provider>

  ),document.getElementById('app')
)
