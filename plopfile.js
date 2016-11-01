var path = require( 'path' );
var fs = require('fs');

module.exports = function(plop){
  plop.addHelper('toUpperCase',(text)=>{return text.toUpperCase();});
  plop.setGenerator('component', {
    description: 'create a new react component',
    prompts: [{
      type: 'input',
      name: 'name',
      message: 'component name',
      validate: function(value){
        if ((/.+/).test(value)) {
          return true;
        } else {
           return "name required";
        }
      }
    }],
    actions: [
      { type: 'add',
        path: 'components/{{properCase name}}.jsx',
        template:
          "import React,{Component,PropTypes} from 'react';" +"\n"+
          "import styles from './{{properCase name}}.css';" +"\n"+
          "import ui from 'redux-ui';" + "\n" +
          "" +"\n"+
          "export default class {{properCase name}} extends Component { " +"\n"+
          "  constructor(props) {" +"\n"+
          "    super(props)" +"\n"+
          "    //this.state = {} //avoid state but set it here if needed" + "\n"+
          "    //bind event listeners here" +"\n"+
          "  }" +"\n"+
          "  render() {" +"\n"+
          "    return (" +"\n"+
          "      <div>{{properCase name}}</div>" +"\n"+
          "    )" +"\n"+
          "  }" +"\n"+
          "}" +"\n"+
          "{{properCase name}}.defaultProps = {"+"\n"+
          "}"+"\n"+
          "{{properCase name}}.propTypes = {"+"\n"+
          "}"
      },
      { type: 'add',
        path: 'components/{{properCase name}}.css',
        template:
          "/*** {{properCase name}} ***/" + "\n" +
          "@import \"../public/styles/colors.css\";" +"\n\n"
      }
    ]
  })
  plop.setGenerator('container', {
    description: 'create a new conatiner for a react component',
    prompts: [{
      type: 'input',
      name: 'name',
      message: 'container name',
      validate: function(value){
        if(/.+/.test(value) ) {
          return true;
        } else {
          return "name required";
        }
      }
    }, {
      type: 'input',
      name: 'component',
      message: 'component name',
      validate: function(value){
        if(/.+/.test(value)) {
          try {
            fs.accessSync(path.resolve(__dirname,"components",value+".jsx"), fs.F_OK);
            return true;
          } catch (e) {
            return "component "+value+" not found in ./components";
          }
        } else {
          return "component name required";
        }
      }
    }],
    actions: [
      { type: 'add',
        path: 'containers/{{properCase name}}.js',
        template:
          "import React, {Component, PropTypes} from 'react'" +"\n"+
          "import {connect} from 'react-redux'" +"\n"+
          "class {{properCase name}} extends Component {" +"\n"+
          "  constructor(props){" +"\n"+
          "    super(props)" +"\n"+
          "    //TODO bind event handlers (e.g. this.onClick=this.onClick.bind(this))" +"\n"+
          "    this.state={}" +"\n"+
          "  }" +"\n"+
          "  shouldComponentUpdate(nextProps,nextState){" +"\n"+
          "  }" +"\n"+
          "  componentDidMount(){" +"\n"+
          "    //window.addEventListener(...)" +"\n"+
          "  }" +"\n"+
          "  componentWillUnmount(){" +"\n"+
          "    //window.removeEventListener(...)" +"\n"+
          "  }" +"\n"+
          "  componentWillReceiveProps(){" +"\n"+
          "  }" +"\n"+
          "  componentDidUpdate(){" +"\n"+
          "  }" +"\n"+
          "  render(){" +"\n"+
          "    return(<div></div>)" +"\n"+
          "  }" +"\n"+
          "}" +"\n"+
          " " +"\n"+
          "//PropTypes.[array, bool, func, number, object, string, symbol," +"\n"+
          "//  instanceOf(Class), oneOf(['enumA','enumB']), oneOfType[PropTypes...]," +"\n"+
          "//  arrayOf(PropTypes), shape({key:PropTypes,...}) ].isRequired" +"\n"+
          "//https://facebook.github.io/react/docs/reusable-components.html" +"\n"+
          "{{properCase name}}.propTypes = {" +"\n"+
          "}" +"\n"+
          "{{properCase name}}.defaultProps = {}" +"\n"+
          "const mapStateToProps = (state, ownProps)=>{" +"\n"+
          "  return {" +"\n"+
          "  }" +"\n"+
          "}" +"\n"+
          "export default connect({{properCase name}})({{properCase component}})"
      }
    ]
  })
}
