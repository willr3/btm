const debugTree = (node,frames)=>{
  console.log("debugTree frames.length="+frames.length)
  var chars = "▼▶▽▷";
  var child = "├";
  var lastChild = "└";
  var moreChildren = "│";
  var noMoreChildren = " ";


  var print = function(target,prefix,isFirst,isLastChild){
    var hasChildren = target.children.length > 0
    var stackUidInfo = Object.keys(target.stackUids).length > 0 ? " ["+Object.keys(target.stackUids)+"]" : ""
    var frameString = (frames[target.uid]||"--").replace("<","&lt;").replace(">","&gt;")
    return "<div title=\""+target.uid+"-"+target.children.length+"\">"+prefix+ (isFirst ? "" : isLastChild ? lastChild : child)+(hasChildren ? "<span>◇</span>": "◆") +frameString+stackUidInfo+"</div>"+
    target.children.map(function(child,index){
      var childIsLast = (index == target.children.length-1);
      return print(child,prefix + (isFirst ? "" : isLastChild ? noMoreChildren : moreChildren), false, childIsLast);
    }).join("");


  }
  return "<pre>"+print(node,"",true,true)+"</pre>";
}
const svgFill = (data,context)=>{
  let uid = data.uid;
  if(context && context[uid]){
    return context[uid]
  } else if (data.children.length == 0){//has Children
    return 'grey'
  } else {
    return 'grey'
  }
}
const svgShape = (tree,invocationMap)=>{
  let top=0,left=0;
  let q = [];
  let rects = [];
  q.push({
      data:  tree,
      left: 0,
    })

  while(q.length>0){
    let current = q.shift();
    let children = current.data.children;
    let fill = svgFill(current.data,invocationMap)
    let width= invocationMap && invocationMap[current.data.uid] ? 8 : 1
    rects.push("<rect style=\"fill:"+fill+"\" width=\""+width+"\" height=\"1\" x=\""+current.left+"\" y=\""+top+"\"></rect>")
    if(children.length>0){
      if(current.left+1> left){
        left = current.left+1;
      }
      for(let i=children.length-1; i>=0; i--){
        let child = children[i];
        q.unshift({
          data: child,
          left: current.left+1
        })

      }
    }
    top++;

  }
  return "<svg xmlns=\"http://www.w3.org/2000/svg\" height=\""+top+"\" width=\""+(left+4)+"\">"+rects.join("")+"</svg>"
  //return "<svg xmlns=\"http://www.w3.org/2000/svg\" height=\"50\" width=\"50\" viewBox=\"0 0 "+top+" "+(left+4)+"\">"+rects.join("")+"</svg>"
}
const flattenTree = (treeData,getChildren,getUid)=>{
  let tree = {};
  let stack = [];
  let current = null;

  stack.push(treeData)

  while(stack.length>0){
    current = stack.shift();
    let data = Object.assign({},current);
    delete data.children;
    let currentUid = getUid(current);
    let children = getChildren(current);
    let stackUid = stack.length > 0 ? getUid(stack[0]) : null
    if(!tree[currentUid]){
      tree[currentUid]={
        parent : null,
        previous : null
      }
    }
    tree[currentUid]={
        uid : currentUid,
        firstChild : children.length > 0 ? getUid(children[0]) : null,
        next : stackUid,
        parent : tree[currentUid].parent,//already set
        previous : tree[currentUid].previous,//already set
        collapsed : false,
        data : data,
        children : []
    }
    if(stackUid){
      tree[stackUid].previous=currentUid
    }
    for(let i=children.length-1; i>=0; i--){
      let uid = getUid(children[i]);
      if(!tree[uid]){
        tree[uid]={
          previous: currentUid
        }
      }
      tree[currentUid].children.unshift(uid);//because we traverse in reverse order
      tree[uid].parent = currentUid

      stack.unshift(children[i]);
    }
  }
  return tree;
}
const buildTree = function(stacks,index,start,end){
  var q = [];
  var rtrn = {
    stackUids: {},
    children: []

  }
  q.push({
    index : index||0,
    start: start||0,
    end : end||(stacks.length-1),
    currentNode : rtrn
  })
  var c = null;
  while(c = q.shift()) {
    try{
    var toAdd = false;
    var start = c.start;
    var i;
    for(i = c.start; i<=c.end; i++){
      var targetStack = stacks[i];
      var targetFrameUid = targetStack.frames.hasOwnProperty(c.index) ? targetStack.frames[c.index] : -1;
      var hasMore = targetStack.frames.length > c.index+1;

      if(toAdd && toAdd.uid != targetFrameUid){
        c.currentNode.children.push(toAdd);
        q.push({
          index: c.index+1,
          start : start,
          end : i-1,
          currentNode : toAdd
        })
        toAdd = false;
      }
      if(!toAdd && targetFrameUid > -1){
        toAdd = {
          uid: targetFrameUid,
          stackUids: {},
          children: []
        }
        start = i;
      }
      if(toAdd && !hasMore){
        toAdd.stackUids[targetStack.uid]=targetStack.lineNumbers;
      }
    } // for each stack in the set
    if(toAdd){//if the last entry didn't get included from the for loop
      c.currentNode.children.push(toAdd);
      q.push({
        index: c.index+1,
        start : start,
        end : c.end,
        currentNode : toAdd
      })
      toAdd = false;
    }
  }catch(Ex){console.log(Ex)}
  }
  return rtrn;
}
module.exports = {
  debugTree,
  flattenTree,
  buildTree,
  svgShape,
}
