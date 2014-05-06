module.exports = (function(){
  
  var chain = require('dyn-chain');
    
  chain.define('minimize', ['process', 'postProcess'], function(process, postProcess){
    return function(tree){
      return postProcess(process(tree));
    }
  });
  
  chain.define('postProcess', [], function(){
  
    function filterBySyn(rels){
      l: for(var rel in rels){
        if(rels[rel].syn){
          for(var r in rels){
            if(rels[r].rel === rels[rel].syn){
              delete rels[rel];
              continue l;
            }
          }
        }
      }
      return rels.filter(function(e){return e;});
    }
  
    return function(processed){
      var buf = [];
      if(Array.isArray(processed[0])){		  
        for(var i in processed){
          processed[i] = filterBySyn(filterByDef(processed[i]));
        }
      } else {
        processed = filterBySyn(filterByDef(processed));
      }
      
      return processed;
      
    };
  });
  
  chain.define('process', ['mergeMany'], function(mergeMany){
    return function process(tree){
      var data = [];
      var key = Object.keys(tree)[0];
      if(tree.isLeaf){
        if(tree.occurs){
          data = tree.occurs;
        }
      } else {
        if(Array.isArray(tree[key])){
          for(var subtree in tree[key]){
            var t = process(tree[key][subtree]);
            if(t.length){
              if(Array.isArray(t[0])){
                t.forEach(function(e){
                data.push(e);
              });
              } else {
                data.push(t);
              }
            }
          }
          data = mergeMany(data);
        } else {
          data = process(tree[key]);	 
        }
      }
      return data;
    };
  });
  
  chain.define('mergeMany', ['cross'], function(cross){
    return function(occurs){
      do {
        var merged = false;
        var chooseFirst = true;
        var layer = [];
        for(var i = 0; i < occurs.length - 1; i++){
        var t = cross(occurs[i], occurs[i + 1]);
        if(t === null){
          layer.push(chooseFirst ? occurs[i] : occurs[i + 1]);
          if(chooseFirst && i === occurs.length - 2){
            layer.push(occurs[i + 1]);
          }
        } else {	  	    
          layer.push(t);
          chooseFirst = false;
          merged = true;
          }
        }
        if(merged){
          occurs = layer;
        }
      } while(merged);
      return occurs.filter(function(e){return e;});
    };
  });
  
  chain.define('cross', ['mergeRels'], function(mergeRels){
  
    function eq(arr1, arr2){
      if(!arr1 && !arr2){
        return true;
      } else if(!arr1 || !arr2){
        return false;
      } else if(arr1.length !== arr2.length){
        return false;
      }
      var t1 = arr1.slice().sort();
      var t2 = arr2.slice().sort();
      for(var i in t1){
        if(t1[i] !== t2[i]){
          return false;
        }
      }
      return true;
    }
    
    function leastKeys(cross){
      var min = countKeys(cross[0]);
      cross.forEach(function(c){
        var count = countKeys(c);
          if(count < min){
          min = count;
        }
      });
      return min;
    }
  
    function countKeys(rel){
      var count = 0;
      rel.kvf.forEach(function(kvf){
        count += kvf.k ? 1 : 0;
        count += kvf.v ? 1 : 0;
      });
      return count;
    }
  
    return function(occursLeft, occursRight){
      var fd = true;
      var merged = [];
      for(var d in occursLeft){
        for(var m in occursRight){
          if(occursLeft[d].rel && occursLeft[d].rel === occursRight[m].rel){
            var t = mergeRels(occursLeft[d], occursRight[m]);
            merged.push(t);
            var pd = false;
            for(var i in t.kvf){
              if(t.kvf[i].f){
                pd = true;
                break;
              }
            }
            if(!pd){
              fd = false;
            }
          }
        }
      }  
      if(merged.length){
        var t = [];	
        for(var i = 0; i < merged.length - 1; i++){
          var unique = true;
          l: for(var k = i + 1; k < merged.length; k++){
            var a = merged[i];
            var b = merged[k];
            if(a.kvf.length !== b.kvf.length || a.rel !== b.rel){
              continue;
            } else {
              for(var kva in a.kvf){
                var find = false;
                for(var kvb in b.kvf){
                  if(a.kvf[kva].k === b.kvf[kvb].k && a.kvf[kva].v === b.kvf[kvb].v && eq(a.kvf[kva].f, b.kvf[kvb].f)){
                    find = true;				
                  }
                }
                if(!find){
                  continue l;
                }
              }
              unique = false;
            }	
          }
          if(unique){
            t.push(merged[i]);
          }
        }
        t.push(merged.pop());
        merged = t;
          
        merged.sort(function(a, b){
          return (a.kvf.length > b.kvf.length) ? 1 : (a.kvf.length < b.kvf.length) ? -1 : 0;
        });
        var datas = [];
        
        var temp = merged.filter(function(e){
          return e.kvf.length === merged[0].kvf.length;
        });
        var min = leastKeys(temp);
        temp = temp.filter(function(e){
          return countKeys(e) === min;
        });
        
        if(fd){
          temp = filterByDef(temp);
        }    
            
        temp.forEach(function(e){datas.push(e);});
        
        return datas;	
      }
      return null;
    };
  });
  
  chain.define('mergeRels', [], function(){
    return function(rel1, rel2){
      if(rel2.kvf.length === 1 && !rel2.kvf[0].k){
        if(!(rel1.kvf.length === 1 && !rel1.kvf[0].k)){
          var arr = [];
          rel1.kvf.forEach(function(e){
            arr.push({k: e.k, v: e.v, f: e.f});
          });
          if(rel1.syn){
            var obj = {rel: rel1.rel, def: rel1.def || rel2.def, kvf: arr, syn: rel1.syn};
          } else {
            var obj = {rel: rel1.rel, def: rel1.def || rel2.def, kvf: arr};
          } 
          for(var kv = obj.kvf.length - 1; kv >= 0; kv--){
            if(obj.kvf[kv].k){
              if(!obj.kvf[kv].f){
                obj.kvf[kv].f = [];
              }
              rel2.kvf[0].f.forEach(function(e){obj.kvf[kv].f.unshift(e)});
              return obj;
            }
          }
        }
      }
      if(rel1.kvf.length === 1 && !rel1.kvf[0].k){
        if(!(rel2.kvf.length === 1 && !rel2.kvf[0].k)){
          var arr = [];
          rel2.kvf.forEach(function(e){       
            arr.push({k: e.k, v: e.v, f: e.f});
          });
          if(rel2.syn){
            var obj = {rel: rel2.rel, def: rel2.def || rel1.def, kvf: arr, syn: rel2.syn};
          } else {
            var obj = {rel: rel2.rel, def: rel2.def || rel1.def, kvf: arr};
          } 
          for(var kv in obj.kvf){
            if(obj.kvf[kv].k){		
              if(!obj.kvf[kv].f){
                obj.kvf[kv].f = [];
              }
              rel1.kvf[0].f.forEach(function(e){obj.kvf[kv].f.push(e)});
              return obj;
            }
          }
        }
      }
      var arr = [];
      rel1.kvf.forEach(function(e){
        arr.push({k: e.k, v: e.v, f: e.f});
      });
      if(rel1.syn){
        var obj = {rel: rel1.rel, def: rel1.def || rel2.def, kvf: arr, syn: rel1.syn};
      } else {
        var obj = {rel: rel1.rel, def: rel1.def || rel2.def, kvf: arr};
      } 
      rel2.kvf.forEach(function(kv2){
        var sameK = false;
        var sameV = false;
        obj.kvf.forEach(function(kv){
          if(kv.k === kv2.k){
            sameK = true;
            if(kv.f){
              if(kv2.f){
                if(!kv.v || kv.v === kv2.v)
                  kv2.f.forEach(function(e){if(kv.f.indexOf(e) === -1){kv.f.unshift(e)}});
              }
            } else if(kv2.f){
              if(!kv.v || kv.v === kv2.v)
                kv.f = kv2.f;
            }
            if(kv.v && kv2.v){
              if(kv.v === kv2.v){
                sameV = true;
              }
            } else if(kv2.v){
              kv.v = kv2.v;
              sameV = true;
            } else {
              sameV = true;
            }
          }
        });
        if(!sameK || !sameV){	  
          obj.kvf.push({k: kv2.k, v: kv2.v, f: kv2.f});
        }
      }); 
      return obj;
    };
  });
  
  function filterByDef(rels){
    var buf = [];
    for(var i in rels){
      for(var k in rels[i].kvf){
        if(rels[i].def === rels[i].kvf[k].k){
          buf.push(rels[i]);
          break;
        }
      }
    }
    if(buf.length){
      rels.length = 0;
      return buf;
    }
    return rels;
  }
  
  return chain;
  
})();