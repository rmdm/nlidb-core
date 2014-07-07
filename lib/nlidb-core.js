module.exports = NlidbCore;

function NlidbCore () {}

NlidbCore.prototype.process = function (tree) { 
  var leaf = this.isLinear(tree).leaf;
  if (leaf) {
    return [this.minimize(leaf.occurs)];  //-
  } else {
    return this.generate(tree);
  }
};

NlidbCore.prototype.generate = function (tree) {
  var rels = [];
  var childKey = Object.keys(tree)[0];
  if(tree.isLeaf){
    rels = this.onLeaf(tree);
  } else {
    if(Array.isArray(tree[childKey])){
      rels = this.onManyChilds(tree, childKey);
    } else {
      rels = this.onSingleChild(tree, childKey);	 
    }
  }
  return rels;
};

NlidbCore.prototype.isLinear = function (tree) {
  if (tree.isLeaf) {
    return tree;
  }
  var subtrees = tree[Object.keys(tree)[0]];
  if (Array.isArray(subtrees)) {
    if (subtrees.length > 1) {
      return false;
    } else {
      return isLinear(subtrees[0]);
    }
  } else {
    return isLinear(subtrees);
  }
};

NlidbCore.prototype.onLeaf = function (tree) {
  if (tree.occurs) {
    return tree.occurs;
  } else {
    return [];
  }
};

NlidbCore.prototype.onManyChilds = function (tree, childKey) {
  var rels = [];  
  for(var subtree in tree[childKey]){
    var t = this.generate(tree[childKey][subtree]);
    if(t.length){
      if(Array.isArray(t[0])){
        t.forEach(function (e) {
        rels.push(e);
      });
      } else {
        rels.push(t);
      }
    }
  }
  return this.mergeMany(rels);
};

NlidbCore.prototype.onSingleChild = function (tree, childKey) {
  return this.generate(tree[childKey]);
};
 
NlidbCore.prototype.mergeMany = function (rels) {
  do {
    var merged = false;
    var chooseFirst = true;
    var layer = [];
    for (var i = 0; i < rels.length - 1; i++) {
    var t = this.cross(rels[i], rels[i + 1]);
    if (t === null) {
      layer.push(chooseFirst ? rels[i] : rels[i + 1]);
      if (chooseFirst && i === rels.length - 2) {
        layer.push(rels[i + 1]);
      }
    } else {	  	    
      layer.push(t);
      chooseFirst = false;
      merged = true;
      }
    }
    if (merged) {
      rels = layer;
    }
  } while(merged);
  return rels.filter(function (e) {return e;});
}; 

NlidbCore.prototype.cross = function(relsLeft, relsRight){
  var merged = [];
  for(var l in relsLeft){
    for(var r in relsRight){
      if(relsLeft[l].rel && relsLeft[l].rel === relsRight[r].rel){
        var m = this.mergeRels(relsLeft[l], relsRight[r]);
        merged.push(m);
      }
    }
  }      
  return this.minimize(merged);
}

NlidbCore.prototype.mergeRels = function (r, l) {
  if(r.kvf.length === 1 && !r.kvf[0].k){
    if(!(l.kvf.length === 1 && !l.kvf[0].k)){
      var arr = [];
      l.kvf.forEach(function(e){
        arr.push({k: e.k, v: e.v, f: e.f});
      });
      if(l.syn){
        var obj = {rel: l.rel, def: l.def || r.def, kvf: arr, syn: l.syn};
      } else {
        var obj = {rel: l.rel, def: l.def || r.def, kvf: arr};
      } 
      for(var kv = obj.kvf.length - 1; kv >= 0; kv--){
        if(obj.kvf[kv].k){
          if(!obj.kvf[kv].f){
            obj.kvf[kv].f = [];
          }
          r.kvf[0].f.forEach(function(e){obj.kvf[kv].f.unshift(e)});
          return obj;
        }
      }
    }
  }
  if(l.kvf.length === 1 && !l.kvf[0].k){
    if(!(r.kvf.length === 1 && !r.kvf[0].k)){
      var arr = [];
      r.kvf.forEach(function(e){       
        arr.push({k: e.k, v: e.v, f: e.f});
      });
      if(r.syn){
        var obj = {rel: r.rel, def: r.def || l.def, kvf: arr, syn: r.syn};
      } else {
        var obj = {rel: r.rel, def: r.def || l.def, kvf: arr};
      } 
      for(var kv in obj.kvf){
        if(obj.kvf[kv].k){		
          if(!obj.kvf[kv].f){
            obj.kvf[kv].f = [];
          }
          l.kvf[0].f.forEach(function(e){obj.kvf[kv].f.push(e)});
          return obj;
        }
      }
    }
  }
  var arr = [];
  l.kvf.forEach(function(e){
    arr.push({k: e.k, v: e.v, f: e.f});
  });
  if(l.syn){
    var obj = {rel: l.rel, def: l.def || r.def, kvf: arr, syn: l.syn};
  } else {
    var obj = {rel: l.rel, def: l.def || r.def, kvf: arr};
  } 
  r.kvf.forEach(function(kv2){
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

NlidbCore.prototype.minimize = function (rels) {
  var rutil = require('./rutil');
  if(rels.length){
    rels.sort(function(a, b){
      return (a.kvf.length > b.kvf.length) ? 1 : (a.kvf.length < b.kvf.length) ? -1 : 0;
    });
    
    var temp = rels.filter(function(e){
      return e.kvf.length === rels[0].kvf.length;
    });
    var min = rutil.leastKeys(temp);
    temp = temp.filter(function(e){
      return rutil.countKeys(e) === min;
    });
    
    var p1 = [];
    var p2 = [];
    
    p1 = temp.filter(function (e) {
      return rutil.containsKey(e.kvf, e.rel);
    });
    
    p2 = temp.filter(function (e) {
      return rutil.containsKey(e.kvf, e.def);
    });
    
    
    
    if (p1.length) {
      return rutil.removeDuplicates(p1);
    } else if (p2.length) {
      return rutil.removeDuplicates(p2);
    }
    
    return rutil.removeDuplicates(temp);
    
  } else {
    return null;
  }
};
