var fs = require('fs')
var path = require('path')
var async = require('async')
var Promise = require('promise')
var parse = require('url').parse;

var btoa = require('btoa');

var _ = require('lodash');

var stackSelectors = require('../../../selectors/stacks.js');

var express = require('express');
var router = express.Router();

var basePath = "/home/wreicher/perfWork/byteBuffer/"
var promises = {}

var classes = []
var frames = []
var stacks = []
var stackSets = []

var readFile = Promise.denodeify(fs.readFile)
var readJson = function(pathname){
  return readFile(pathname,'utf8')
    .then(function(str){
      var rtrn = JSON.parse(str);
      return rtrn;
    })
};
var getDb = function(name){

  if(!promises[name]){

    var dbPath = path.resolve(basePath,name,"allData.json");
    promises[name]= Promise.all([
      readJson(path.resolve(dbPath))])
      .then(function(all){

        var allData = all[0]
        try{
          allData.frameToStack={}
          allData.stackToSet={}
          allData.frames.forEach(function (frame,index){
            frames[index]=frame;
          })

          allData.classNames.forEach(function(className,index){
            classes[index]=className;
          })

          Object.keys(allData.stacks).forEach(function(index){
            var stack = allData.stacks[index];
            stacks[index]=stack;
            stack.frames.forEach(function(frameId,frameIndex){
              if(!allData.frameToStack[frameId]){
                allData.frameToStack[frameId]={}
              }
                allData.frameToStack[frameId][stack.uid]=frameIndex;

            })
          })

          Object.keys(allData.stackSets).forEach(function(index){
            var stackSet = allData.stackSets[index];
            stackSets[index]=stackSet;
            stackSet.stacks.forEach(function(stackUid,stackIndex){
              if(!allData.stackToSet[stackUid]){
                allData.stackToSet[stackUid]={}
              }
              allData.stackToSet[stackUid][stackSet.uid]=stackIndex;
            })
          })

        }catch(Ex){console.log(Ex)}
          return allData;
        },function(err){
          console.log("getDb("+name+") error ");
          console.log(err);
        })
  }
  return promises[name];
};
var size = function(data){
  var rtrn=0;
  var todo=[data];
  var current;
  while(current=todo.shift()){
    if(current.children){
      rtrn+=current.children.length;
      current.children.forEach(function(child){
        todo.push(child);
      })
    }
  }
  return rtrn;
}
router.get("/",function(req,res){
  res.json(Object.keys(promises));
})
router.get("/:dbName",function(req,res){
  getDb(req.params.dbName)
  .then(function(dbInstance){
    var invocationSummary = {}
    var invocationCount = 0;
    Object.keys(dbInstance.stackSetInvocations).forEach(function(index){
      invocationSummary[index]= dbInstance.stackSetInvocations[index].length
      invocationCount+=invocationSummary[index];
    })
    res.json({
      name: req.params.dbName,
      classNames: dbInstance.classNames.length,
      frames: dbInstance.frames.length,
      stacks: Object.keys(dbInstance.stacks).length,
      stackSets: Object.keys(dbInstance.stackSets).length,
      stackSetInvocations: invocationSummary,
      invocationCount: invocationCount,
    })
    },function(err){
      console.log(err);
      res.send(err)
  })
})
router.get("/:dbName/search",function(req,res){
  getDb(req.params.dbName).then(function(dbInstance){
    var q = req.query.q || false;
    if(q){
      try{
      let frames = [];
      console.log("search q="+q);
      dbInstance.frames.forEach(function(frameString,frameIndex){
        if(frameString.indexOf(q)!==-1){

          frames.push(frameIndex);
        }
      })
      let stacks = [];
      frames.forEach(function(frameUid){
        if(frameUid in dbInstance.frameToStack){
          var frameStacks = Object.keys(dbInstance.frameToStack[frameUid]);
          stacks = stacks.concat(frameStacks);
        }
      });
      let sets = {};
      let addAll = function(toAdd){
        sets[toAdd]=1;
      }
      stacks.forEach(function(stackUid){
        if(stackUid in dbInstance.stackToSet){
          var stackSets = Object.keys(dbInstance.stackToSet[stackUid]);
          stackSets.forEach(addAll);
          //sets = sets.concat(stackSets);
        }
      })

      res.json(Object.keys(sets));
    }catch(Ex){console.log(Ex)}
    }else{
      res.send("misssing q query param");
    }

  },function(err){
    res.send("ERROR "+req.params.dbName+"does not search");
  })
})
router.get("/:dbName/stackSets",function(req,res){
  getDb(req.params.dbName).then(function(dbInstance){
    var dbName = req.params.dbName
    var section = dbInstance["stackSets"]
    var setSummary = {};
    try{
      console.log("stackSets with tree");
    Object.keys(section).forEach(function(index){
      setSummary[index]={
        stackCount : section[index].stacks.length,
        invocationCount : dbInstance["stackSetInvocations"][index].length,
        tree : ((stackSetUid)=>{
          var frameArray = section[stackSetUid].stacks.map(function(stackUid){
            return dbInstance.stacks[stackUid];
          })
          var treeNode = stackSelectors.buildTree(frameArray,0,0,frameArray.length-1);
          return treeNode
        })(index)
      }
    });
  }catch(Ex){
    console.log(Ex);
  }
    return res.json(setSummary);

  },function(err){
    res.send("ERROR "+dbName+" does not contain stackSets")
  })
})

let uid=0;
const getChildren = (data)=>data.children||[]
const assignUid = function(data){
  if(!data){
    console.log("assignUid data "+data);
  }
  data.__callId=uid;
  uid++;
  getChildren(data).forEach((child)=>{assignUid(child)})
}
const getUid = (data)=>data.__callId

router.get("/:dbName/stackSets/:id",function(req,res){
  getDb(req.params.dbName).then(function(dbInstance){
    var dbName = req.params.dbName
    var section = dbInstance["stackSets"]
    var setSummary = {};
    var fill = req.query.fill || false;
    var debug = req.query.debug || false;
    var id = section[""+req.params.id]
    if(section.hasOwnProperty(req.params.id)){
      if(fill){
        var frameArray = id.stacks.map(function(stackId){
          return dbInstance.stacks[stackId];
        })
        var treeNode = stackSelectors.buildTree(frameArray,0,0,frameArray.length-1);
        if(debug){
            return res.send(stackSelectors.debugTree(treeNode,dbInstance));
        }else{
          assignUid(treeNode);
          var result = stackSelectors.flattenTree(treeNode,getChildren,getUid);
          return res.json(result);
          return res.json(frameArray.map(function(stack){return stack.frames}))
        }
      }else{
        return res.json(id)
      }
    }else{
      res.send("ERROR "+req.params.dbName+".stackSets["+req.params.id+"] does not exist")
    }
    return res.json(setSummary);

  },function(err){
    res.send("ERROR "+dbName+" does not contain stackSets")
  })
})

var histogram = function(array){
  var rtrn = {}
  array.forEach(function(entry){
    rtrn[entry] = (rtrn[entry] || 0 ) + 1;
  })
  return rtrn;
}

router.get("/:dbName/stackSetInvocations/",function(req,res){
  getDb(req.params.dbName).then(function(dbInstance){
    var dbName = req.params.dbName
    var section = dbInstance["stackSetInvocations"]
    var fill = req.query.fill || false;
    var debug = req.query.debug || false;

    var invocationSummary = [];
    try{
      Object.keys(section).forEach(function(index){
        invocationSummary.push({
          stackUid: index,
          invocationCount: section[index].length,
          threadCounts : histogram(section[index].map(function(setInvocation){
            var threadNameMap = {}
            setInvocation.stackInvocations.forEach(function(stackInvocation){
              threadNameMap[stackInvocation.data.threadName] = true;
            })
            return Object.keys(threadNameMap).length;
          })),
          maxDepth : Math.max.apply(null,dbInstance.stackSets[index].stacks.map(function(stackUid){
            return dbInstance.stacks[stackUid].frames.length
          })),
          tree : ((stackSetUid)=>{
            var frameArray = dbInstance.stackSets[stackSetUid].stacks.map(function(stackUid){
              return dbInstance.stacks[stackUid];
            })
            var treeNode = stackSelectors.buildTree(frameArray,0,0,frameArray.length-1);
            return treeNode
          })(index),
          shape :
            ((stackUid)=>{
              var frameArray = dbInstance.stackSets[stackUid].stacks.map(function(stackId){
                return dbInstance.stacks[stackId];
              })
              var treeNode = stackSelectors.buildTree(frameArray,0,0,frameArray.length-1);
              var shape = stackSelectors.svgShape(treeNode)
              var buff = new Buffer(shape);
              shape = btoa(shape)
              return buff.toString('base64')
            })(index),
          stackCount : dbInstance.stackSets[index].stacks.length,
          duration: histogram(section[index].map(function(setInvocation){
            var min = Number.MAX_VALUE, max = Number.MIN_VALUE;
            setInvocation.stackInvocations.forEach(function(stackInvocation){
              if(stackInvocation.data.timestamp > max){
                max = stackInvocation.data.timestamp;
              }
              if(stackInvocation.data.timestamp < min){
                min = stackInvocation.data.timestamp;
              }
            })
            return max - min;
          }))
        })
      })

      res.json(invocationSummary);
    }catch(Err){
      console.log(Err);
    }

  },function(err){
    res.send("ERROR "+dbName+" does not contain stackSets")
  })
})

router.get("/:dbName/stackSetInvocations/:id",function(req,res){
  getDb(req.params.dbName).then(function(dbInstance){
    var dbName = req.params.dbName
    var section = dbInstance["stackSetInvocations"]
    var fill = req.query.fillStack || false;
    var tree = req.query.tree || false;
    var debug = req.query.debug || false;
    var map = req.query.debug || false;
    var stackUid = req.params.id;
    var invocation =section[req.params.id];
    var setInvocationMaps = [];
    try{
      invocation.forEach(function(setInvocation,setInvocationIndex){
        var setUid = setInvocation.setUid;
        var currentInvocation = {};
        setInvocation.stackInvocations.forEach(function(stackInvocation,stackInvocationIndex){
          var invokedStackUid = stackInvocation.stackUid;
          if(!currentInvocation[invokedStackUid]){
            currentInvocation[invokedStackUid] = [];
          }
          currentInvocation[invokedStackUid].push(stackInvocation.data);
        })
        setInvocationMaps.push(currentInvocation);
      })
    }catch(Ex){console.log(Ex)}
    try{
      if(fill){
        var frameArray = dbInstance.stackSets[stackUid].stacks.map(function(stackId){
          return dbInstance.stacks[stackId];
        })
        if(tree){
          var treeNode = stackSelectors.buildTree(frameArray,0,0,frameArray.length-1);
          assignUid(treeNode)
          var flatTree = stackSelectors.flattenTree(treeNode,getChildren,getUid);
          return res.json({
            tree: treeNode,
            invocations : setInvocationMaps
            });
        }
        else if(debug){
            var treeNode = stackSelectors.buildTree(frameArray,0,0,frameArray.length-1);
            return res.send(stackSelectors.debugTree(treeNode,dbInstance.frames));
        }else{
          return res.json(frameArray.map(function(stack){return stack.frames}))
        }

      }else{
        return res.json(invocation)
      }
    }catch(Ex){console.log(Ex)}
  },function(err){
    res.send("ERROR "+dbName+" does not contain stackSetInvocations");
  })
})
router.get("/:dbName/:sectionName",function(req,res){
  getDb(req.params.dbName).then(function(dbInstance){
    var dbName = req.params.dbName
    var sectionName = req.params.sectionName
    var section = dbInstance[sectionName]
    console.log("dbName="+dbName+"/sectionName="+sectionName);
    if(section){
      switch(sectionName){
        case "threadNames":
        case "classNames":
        case "frames":
          return res.json(section);
          break;
        case "stacks":
          return res.json(section);
          break;
        case "stackSets":
          return res.json(section);
          // var setSummary = {};
          // Object.keys(section).forEach(function(index){
          //   setSummary[index]=section[index].stacks.length;
          // })
          // return res.json(setSummary);
          break;
        case "stackSetInvocations":
          var invocationSummary = {};
          Object.keys(section).forEach(function(index){
            invocationSummary[index]=section[index].length;
          })

          return res.json(invocationSummary)
          break;
        case "objectsToSets":
          var summary = {};
          Object.keys(section).forEach(function(index){
            summary[index]=section[index].length;
          })
          return res.json(summary)
          break;
        default:
          return res.json(section);
      }
    }else{
      res.send("ERROR "+dbName+" does not contain "+sectionName)
    }
  },function(err){
    res.send(err)
  })
})
router.get("/:dbName/:sectionName/:id",function(req,res){
  getDb(req.params.dbName).then(function(dbInstance){
    var section = dbInstance[req.params.sectionName]
    if(section){
      var id = section[""+req.params.id]
      if(section.hasOwnProperty(req.params.id)){
        res.json(id)
      }else{
      res.send("ERROR "+req.params.dbName+"."+req.params.sectionName+"["+req.params.id+"] does not exist")
      }
    }else{
      res.send("ERROR "+req.params.dbName+" does not contain "+req.params.sectionName)
    }
  },function(err){
    console.log("ERR "+err)
    res.send(err)
  })
})

module.exports = router;
