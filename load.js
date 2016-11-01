var PouchDB = require('pouchdb');
var MyPouchDB = PouchDB.defaults({
  prefix: './pouch/db/',//must already exist on FS
  "log.file": "./pouch/log.txt"
})
var fs = require('fs')
var path = require('path')
var Promise = require('promise')

var basePath = "/home/wreicher/perfWork/byteBuffer/"
var runName = "9O-AMQBuffer"
var fileName = 'allData.json'

var readFile = Promise.denodeify(fs.readFile)
var readJson = function(pathname){
  return readFile(pathname,'utf8')
    .then(function(str){
      console.log(pathname+" resolved ");
      return JSON.parse(str)
    })
};

console.log(new Date());

var filePath = path.resolve(basePath,runName,fileName)
var remoteCouchBase="http://localhost:3000/pouch/"
var opts = {live: true, retry: true};

var globalPouch = MyPouchDB('stack');
var runPouch = MyPouchDB(runName);
globalPouch.replicate.to(remoteCouchBase+'stack',opts,function(e){console.log("SYNCERROR "+e)} );
globalPouch.replicate.from(remoteCouchBase+'stack',opts,function(e){console.log("SYNCERROR "+e)} );
globalPouch.changes({
  since: 'now',
  live: true
}).on('change',function(x){
  // console.log("POUCH Change ");
  // console.log(x);
});

var nameIndex = {
  _id: '_design/name_index',
  views: {
    'name_index': {
      map: function(doc){ emit(doc.name); }.toString()
    }
  }
};
var hashCodeIndex = {
  _id: '_design/object_index',
  views: {
    'object_index': {
      map: function(doc){
        var queue = [doc];
        var uniques = {}
        var process = function(key){
          var value = target[key];
          if(key.indexOf('hashCode') > -1 ){
            uniques[value]=true;
          }else if (value !== null && typeof value === 'object'){
            queue.push(value);
          }
        };
        while(queue.length>0){
          var target = queue.shift();
          Object.keys(target).forEach(process);
        }
        console.log(doc.id+" -> "+Object.keys(uniques));
        Object.keys(uniques).forEach(function(hash){emit(hash);})
      }.toString()
    }
  }
}
var loadIndex = function(name,prefix){
  return function(json){
    return Promise.all(json[name].map(function(entry,index){
      return globalPouch.query('name_index', {key: entry})
        .then(function(result){
          if(result.rows.length == 0 ){
            return globalPouch.put({
              _id : prefix+'/'+index,
              name : entry,
              uid : index
            })
          }else {
            return false
          }
        })
    })).then(function (args){
      var count = args.map(function(arg){return arg ? 1 : 0}).reduce(function(s,n){return s+n})
      console.log(name+" added "+count+" / "+args.length);
      return json;
    })
  }
}
Promise.resolve()
.then(globalPouch.put(nameIndex))
.then(function(){
  return globalPouch.query('name_index', {stale: 'update_after'});
})
.then(runPouch.put(hashCodeIndex))
.catch(function(e){ console.log("object_index"); console.log(e); return true})
.then(function(){
  return runPouch.query('object_index',{stale:'update_after'});
}).catch(function(e){ console.log("object_index"); console.log(e); return true})
.then(function(){
  console.log("saved indexes");
  return readJson(filePath)
})
.then(loadIndex('classNames','className'))
.then(loadIndex('frames','frame'))
.then(function(json){//stacks
  var stacks = json.stacks;
  return Promise.all(Object.keys(stacks).map(function(key){
    var stack = stacks[key];
    return globalPouch.get('stack/'+stack.uid)
    .then(function(response){
      return false//not adding a new stack
    }).catch(function(error){
      return globalPouch.put({
        _id: 'stack/'+stack.uid,
        frames: stack.frames,
        lineNumbers: stack.lineNumbers
      })
    }).then(function(arg){
      return arg;
    })
  }))
  .then(function(args){
    var count = args.map(function(r){return r ? 1 : 0}).reduce(function(s,n){return s+n})
    console.log("stacks added "+count+" / "+args.length);
    return json;
  })
})
.then(function(json){//stackSets
  var stackSets = json.stackSets;
  return Promise.all(Object.keys(stackSets).map(function(key){
    var stackSet = stackSets[key];
    return globalPouch.get('stackSet/'+stackSet.uid)
    .then(function(response){
      return false//not adding a new stackSet
    }).catch(function(error){
      return globalPouch.put({
        _id : 'stackSet/'+stackSet.uid,
        stacks: stackSet.stacks
      }).then(function(arg){//post add operation
        return arg;
      })
    })
  }))
  .then(function(args){
    var count = args.map(function(r){return r ? 1 : 0}).reduce(function(s,n){return s+n})
    console.log("stackSets added "+count+" / "+args.length);
    return json;
  })
})
.then(function(json){//stackSetInvocations
  var stackSetInvocations = json.stackSetInvocations;
  return Promise.all(Object.keys(stackSetInvocations).map(function(stackSetUid){
    var stackSetInvocationList = stackSetInvocations[stackSetUid];
    return Promise.all(stackSetInvocationList.map(function(stackSetInvocation,index){
      var setUid = stackSetInvocation.setUid;
      var stackInvocations = stackSetInvocation.stackInvocations;
      var invocationUid = 'stackSetInvocation/'+setUid+'/'+index;
      return runPouch.get(invocationUid)
      .then(function(response){
        return false//already added the stackSetInvocation? unlikely
      }).catch(function(error){
        var toLoad = {
          _id: invocationUid,
          setUid: setUid,
          stackInvocations: stackInvocations
        }
        return runPouch.put(toLoad).then(function(arg){//post add operation
          return arg;
        })
      })
    }))//all invocations for the current stackSetUid
  }))//all the stack
  .then(function(args){
    console.log("then args");
    console.log(args.length+" sets invoked")
    console.log(args.map(function(l){return l.length}).reduce(function(a,b){return a+b})+" set invocations");
    return json
  })
})
.catch(function(error){
  console.log("catch");
  console.log(error);
})
.finally(function(){
  console.log("finally @ "+new Date());
  globalPouch.close();
  process.exit();
})
  // .then(function(json){
  //   return Promise.all(json.classNames.map(function(entry,index){
  //     return globalPouch.query('name_index', {key: entry})
  //       .then(function(result){
  //         if( result.total_rows == 0 ){
  //           var toAdd = {
  //             _id : 'className/'+index,
  //             name: entry,
  //             uid : index
  //           };
  //           return globalPouch.put(toAdd);
  //         } else {
  //           return false
  //         }
  //       })
  //   })).then(function(args){
  //
  //     var count = args.map(function(arg){
  //       if(arg){
  //         return 1;
  //       }else{
  //         return 0;
  //       }
  //     }).reduce(function(total,next){
  //       return total+next;
  //     })
  //     console.log(' classNames added = '+count+' / '+args.length);
  //     return json;
  //   })
  // })
  // .then(function(json){
  //   return Promise.all(json.frames.map(function(entry,index){
  //     return globalPouch.query('name_index', {key: entry})
  //       .then(function(result){
  //         if( result.total_rows == 0 ){
  //           var toAdd = {
  //             _id : 'frame/'+index,
  //             name: entry,
  //             uid : index
  //           };
  //           return globalPouch.put(toAdd);
  //         }
  //       })
  //   })).then(function(args){
  //     console.log(' frames length = '+args.length);
  //     return json;
  //   })
  // })
  // .catch(function(error){
  //   console.log(error);
  // })
  // .finally(function(){
  //   globalPouch.close();
  //   process.exit();
  // })


// readJson(filePath)
//   .then(function(json){
//     json.classNames.forEach(function(entry,index){
//       globalPouch.query('name_index', {key: entry})
//         .then(function(result){
//           if( result.total_rows == 0 ){
//             globalPouch.put({
//               _id: 'className/'+index,
//               name: entry,
//               uid: index
//             }).then(function(success){
//               console.log("put className "+entry);
//             },function(failure){
//               console.log("put className FAILED "+entry);
//               console.log(failure);
//             })
//           } else {
//               console.log("already contain className = "+entry);
//               console.log(result.rows.length);
//               console.log(result.rows[0]);
//           }
//
//         }, function(error){
//           console.log("name_index error");
//           console.log(error);
//         })
//     })
//     json.frames.forEach(function(entry,index){
//       globalPouch.query('name_index',{key: entry})
//         .then(function(result){
//           if( result.total_rows == 0 ){
//             globalPouch.put({
//               _id: 'frame/'+index,
//               name: entry,
//               uid: index
//             }).then(function(success){
//               console.log("put frame = "+entry);
//             },function(failure){
//               console.log("put frame FAILED for "+entry);
//               console.log(failure);
//             })
//           } else {
//             console.log("already contain frame = "+entry);
//             console.log(result.rows.length);
//             console.log(result.rows[0]);
//           }
//         },function(error){
//           console.log("name_index error");
//           console.log(error);
//         })
//     })
//
//     // json.frames.forEach(function(frame,index){
//     //   var lastDot = frame.lastIndexOf('.');
//     //   var method = frame.substring(lastDot+1);
//     //   var classDot = frame.lastIndexOf('.',lastDot-2)+1;
//     //   var className = frame.substring(classDot,lastDot);
//     //   var packageName = frame.substring(0,classDot-1);
//     //
//     //   console.log(frame.substring(0,classDot-1)+" "+className+" "+method);
//     // })
//   },function(err){
//     console.log(err);
//   })
