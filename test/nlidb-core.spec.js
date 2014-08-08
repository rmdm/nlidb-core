describe('A NLIDB core functionality', function(){
  
  var NlidbCore = require('../lib/nlidb-core');
  var sameArr = require('../lib/rutil').sameArr;
  
  /*
  Parse tree extended with semantic information from thesaurus
  tree
  |
  e_____
  |     |
  e     e______ ______
  |     |      |      |
  nil   leaf   e      e______
               |      |      |
               leaf   leaf   leaf
  */
  var tree = {
    e: [
      {e: {isLeaf: true, occurs: []}},
      {e: [
        {isLeaf: true, occurs: [{rel:'B', def: 'b', kvf: [{k: 'b', v: 'b'}]}]},
        {e: {isLeaf: true, occurs: [{rel:'A', def: 'a', kvf: [{k: 'ab', v: 'ab'}]}]}},
        {e: [
          {isLeaf: true, occurs: [{rel: 'A', kvf: [{k: 'a', v: 'a'}]}, {rel: 'C', kvf: [{k: 'c', v: 'c'}]}]},
          {isLeaf: true, occurs: [{rel: 'A', kvf: [{k: 'a', v: 'a'}]}, {rel: 'B', kvf: [{k: 'b', v: 'b'}]}]}
        ]}
      ]}
    ]
  };
  
  function expectKvfContains (kvf, what, value) {
    var contains = false;
    if (Array.isArray(value)) {
      var i = kvf.length;
      for (; i--;) {
        if (sameArr(value, kvf[i][what])) {
          contains = true;
          break;
        }
      }
    } else {
      var i = kvf.length;
      for (; i--;) {
        if (kvf[i][what] === value) {
          contains = true;
          break;
        }
      }
    }
    expect(contains).toBe(true);
  }
  
  //tree should be transformed into corresponding structured representation
  var struc_rep = [[{rel:'B', def: 'b', kvf: [{k: 'b', v: 'b'}]}],[{rel: 'A', kvf: [{k: 'ab', v: 'ab'}, {k: 'a', v: 'a'}]}]];
  var nlidb = new NlidbCore();
  
  it('has its main method "process" that transforms natural language query into strucured representation', function(){    
    var minimized = nlidb.process(tree);
    expect(minimized.length).toBe(2);
    expect(minimized[0].length).toBe(1);
    expect(minimized[1].length).toBe(1);
    expect(minimized[0][0].rel).toBe('B');
    expect(minimized[0][0].kvf.length).toBe(1);
    
    expectKvfContains(minimized[0][0].kvf, 'k', 'b');
    expectKvfContains(minimized[0][0].kvf, 'v', 'b');
    expectKvfContains(minimized[0][0].kvf, 'f', undefined);
    
    expect(minimized[1][0].rel).toBe('A');
    expect(minimized[1][0].kvf.length).toBe(2);
    
    expectKvfContains(minimized[1][0].kvf, 'k', 'a');
    expectKvfContains(minimized[1][0].kvf, 'v', 'a');
    expectKvfContains(minimized[1][0].kvf, 'f', undefined);
    expectKvfContains(minimized[1][0].kvf, 'k', 'ab');
    expectKvfContains(minimized[1][0].kvf, 'v', 'ab');
    expectKvfContains(minimized[1][0].kvf, 'f', undefined);
  });
  
  it('"process" should always return 2d array', function(){    
    
    function is2D (arr) {
      expect(Array.isArray(arr) && Array.isArray(arr[0])).toBe(true);
    }
    
    is2D(nlidb.process([]));
    is2D(nlidb.process([[]]));
    is2D(nlidb.process(null));
    is2D(nlidb.process(undefined));
    is2D(nlidb.process(0));
    is2D(nlidb.process(function () {}));
    is2D(nlidb.process([1]));
    is2D(nlidb.process({}));
    is2D(nlidb.process({isLeaf: true, occurs: [{rel: 'A', kvf: []}]}));
    is2D(nlidb.process({isLeaf: true, occurs: []}));
    is2D(nlidb.process({occurs: [{}]}));
    is2D(nlidb.process({isLeaf: true}));
    is2D(nlidb.process([{}, {}, {}]));
    is2D(nlidb.process([{e: [{}]}]));
    
  });
  
  it('static "isEmpty" checks meaning of results', function(){    
    
    function isEmpty (stuff, shouldBe) {
      expect(NlidbCore.isEmpty(stuff)).toBe(shouldBe);
    }
    
    isEmpty(nlidb.process([]), true);
    isEmpty(nlidb.process([[]]), true);
    isEmpty(nlidb.process(null), true);
    isEmpty(nlidb.process(undefined), true);
    isEmpty(nlidb.process(0), true);
    isEmpty(nlidb.process(function () {}), true);
    isEmpty(nlidb.process([1]), true);
    isEmpty(nlidb.process({}), true);
    isEmpty(nlidb.process({isLeaf: true, occurs: []}), true);
    isEmpty(nlidb.process({occurs: [{}]}), true);
    isEmpty(nlidb.process({isLeaf: true}), true);
    isEmpty(nlidb.process([{}, {}, {}]), true);
    isEmpty(nlidb.process([{e: [{}]}]), true);
    
    //at least one element of tree should have both "isLeaf" and non-empty array "occurs" properties
    isEmpty(nlidb.process({isLeaf: true, occurs: [{rel: 'A', kvf: []}]}), false);
    isEmpty(nlidb.process([{e: [{},{isLeaf: true, occurs: [{rel: 'A', kvf: []}]}]}]), false);
    
  });
  
  describe('lastLeafInLinearTree method', function () {
  
    it('used to define if tree has linear structure', function () {
      var tree = {e: {isLeaf: true}};
      expect(!!nlidb.lastLeafInLinearTree(tree)).toBe(true);
      
      var tree = {e: {e: {e: {e: {e: {isLeaf: true}}}}}};
      expect(!!nlidb.lastLeafInLinearTree(tree)).toBe(true);
      
      var tree = {e: [{isLeaf: true}, {isLeaf: true}]};
      expect(!!nlidb.lastLeafInLinearTree(tree)).toBe(false);    
    });
    
  });
  
  describe('minimize method', function () {
  
    it('used to cover minimal number of enitities and to remove duplicate rels', function () {
      var rels = [
        {rel: 'A', kvf: [{k: 'k2'}, {k: 'k1', v: 'v1'}]},
        {rel: 'A', kvf: [{k: 'k1', v: 'v1'}, {k: 'k2'}]},
        {rel: 'B', kvf: [{k: 'k1', v: 'v1'}, {k: 'k2'}, {k: 'k3'}]}
      ];
      var res = nlidb.minimize(rels);
      expect(res.length).toBe(1);
      expect(res[0].rel).toBe('A');
      
      expect(nlidb.minimize([]).length).toBe(0);
    });
  
  });
  
  describe('mergeRels method', function () {
  
    it('used to merge two rels', function () {
      var rel1 = {rel: 'A', kvf: [{k: 'k1'}]};
      var rel2 = {rel: 'A', kvf: [{k: 'k1', v: 'v1'}]};
      var res = nlidb.mergeRels(rel1, rel2);
      expect(res.kvf.length).toBe(1);
      expectKvfContains(res.kvf, 'k', 'k1');
      expectKvfContains(res.kvf, 'v', 'v1');
      expectKvfContains(res.kvf, 'f', undefined);
      
      
      var rel1 = {rel: 'A', kvf: [{f: ['f1']}]};
      var rel2 = {rel: 'A', kvf: [{k: 'k1', v: 'v1'}]};
      var res = nlidb.mergeRels(rel1, rel2);
      expect(res.kvf.length).toBe(1);  
      expect(res.kvf[0].f.length).toBe(1);
      expectKvfContains(res.kvf, 'k', 'k1');
      expectKvfContains(res.kvf, 'v', 'v1');
      expectKvfContains(res.kvf, 'f', ['f1']);
      
      var rel1 = {rel: 'A', kvf: [{k: 'k1', v: 'v1'}]};
      var rel2 = {rel: 'A', kvf: [{k: 'k1', v: 'v1'}]};
      var res = nlidb.mergeRels(rel1, rel2);
      expect(res.kvf.length).toBe(1);
      expectKvfContains(res.kvf, 'k', 'k1');
      expectKvfContains(res.kvf, 'v', 'v1');
      expectKvfContains(res.kvf, 'f', undefined);
      
      var rel1 = {rel: 'A', kvf: [{k: 'k1', v: 'v1'}]};
      var rel2 = {rel: 'A', kvf: [{k: 'k1', v: 'v2'}]};
      var res = nlidb.mergeRels(rel1, rel2);
      expect(res.kvf.length).toBe(2);
      expectKvfContains(res.kvf, 'k', 'k1');
      expectKvfContains(res.kvf, 'v', 'v1');
      expectKvfContains(res.kvf, 'f', undefined);
      expectKvfContains(res.kvf, 'k', 'k1');
      expectKvfContains(res.kvf, 'v', 'v2');
      expectKvfContains(res.kvf, 'f', undefined);;
      
      var rel1 = {rel: 'A', kvf: [{k: 'k1', f: ['f1']}]};
      var rel2 = {rel: 'A', kvf: [{k: 'k1', v: 'v2', f: ['f1']}]};
      var res = nlidb.mergeRels(rel1, rel2);
      expect(res.kvf.length).toBe(1);
      expectKvfContains(res.kvf, 'k', 'k1');
      expectKvfContains(res.kvf, 'v', 'v2');
      expectKvfContains(res.kvf, 'f', ['f1']);
      
      var rel1 = {rel: 'A', kvf: [{k: 'k1', f: ['f1']}]};
      var rel2 = {rel: 'A', kvf: [{k: 'k1', v: 'v2', f: ['f2']}]};
      var res = nlidb.mergeRels(rel1, rel2);
      expect(res.kvf.length).toBe(1);
      expectKvfContains(res.kvf, 'k', 'k1');
      expectKvfContains(res.kvf, 'v', 'v2');
      expectKvfContains(res.kvf, 'f', ['f2', 'f1']);
      
      var rel1 = {rel: 'A', kvf: [{k: 'k1', v: 'v2', f: ['f1']}]};
      var rel2 = {rel: 'A', kvf: [{k: 'k1', v: 'v2', f: ['f2']}]};
      var res = nlidb.mergeRels(rel1, rel2);
      expect(res.kvf.length).toBe(1);
      expectKvfContains(res.kvf, 'k', 'k1');
      expectKvfContains(res.kvf, 'v', 'v2');
      expectKvfContains(res.kvf, 'f', ['f2', 'f1']);
      
      var rel1 = {rel: 'A', kvf: [{k: 'k1', v: 'v1', f: ['f1']}]};
      var rel2 = {rel: 'A', kvf: [{k: 'k1', v: 'v2', f: ['f2']}]};
      var res = nlidb.mergeRels(rel1, rel2);
      expect(res.kvf.length).toBe(2);
      expectKvfContains(res.kvf, 'k', 'k1');
      expectKvfContains(res.kvf, 'k', 'k1');
      expectKvfContains(res.kvf, 'v', 'v1');
      expectKvfContains(res.kvf, 'v', 'v2');
      expectKvfContains(res.kvf, 'f', ['f1']);
      expectKvfContains(res.kvf, 'f', ['f2']);
      
      var rel1 = {rel: 'A', kvf: [{k: 'k1', v: 'v1'}]};
      var rel2 = {rel: 'A', kvf: [{k: 'k1', v: 'v2', f: ['f2']}]};
      var res = nlidb.mergeRels(rel1, rel2);
      expect(res.kvf.length).toBe(2);
      expectKvfContains(res.kvf, 'k', 'k1');
      expectKvfContains(res.kvf, 'v', 'v1');
      expectKvfContains(res.kvf, 'v', 'v2');
      expectKvfContains(res.kvf, 'f', ['f2']);
      expectKvfContains(res.kvf, 'f', undefined);
      
      var rel1 = {rel: 'A', kvf: [{k: 'k1', v: 'v1'}]};
      var rel2 = {rel: 'A', kvf: [{k: 'k1', v: 'v2', f: ['f2']}]};
      var res = nlidb.mergeRels(rel1, rel2);
      expect(res.kvf.length).toBe(2);
      expectKvfContains(res.kvf, 'k', 'k1');
      expectKvfContains(res.kvf, 'k', 'k1');
      expectKvfContains(res.kvf, 'v', 'v1');
      expectKvfContains(res.kvf, 'v', 'v2');
      expectKvfContains(res.kvf, 'f', ['f2']);
      expectKvfContains(res.kvf, 'f', undefined);
      
      var rel1 = {rel: 'A', kvf: [{k: 'k1', v: 'v1'}]};
      var rel2 = {rel: 'A', kvf: [{k: 'k1', v: 'v1', f: ['f2']}]};
      var res = nlidb.mergeRels(rel1, rel2);
      expect(res.kvf.length).toBe(1);
      expectKvfContains(res.kvf, 'k', 'k1');
      expectKvfContains(res.kvf, 'v', 'v1');
      expectKvfContains(res.kvf, 'f', ['f2']);
    });
    
  });
  
  describe('cross method', function () {
  
    it('used to merge rels of two sets', function () {
      var set1 = [
        {rel: 'A', kvf: [{k: 'k1', v: 'v1'}]},
        {rel: 'B', kvf: [{k: 'k2', v: 'v2'}]},
        {rel: 'C', kvf: [{k: 'k3', v: 'v3', f: ['f3']}, {k: 'k4'}]}
      ];
      var set2 = [
        {rel: 'C', kvf: [{k: 'k4', v: 'v4'}, {k: 'k3', f: ['f4']}]},
        {rel: 'D', kvf: [{k: 'k5'}]}
      ];
      var res = nlidb.cross(set1, set2);
      expect(res.length).toBe(1);
      var rel = res[0];
      expect(rel.rel).toBe('C');
      expect(rel.kvf.length).toBe(2);
      expectKvfContains(rel.kvf, 'k', 'k3');
      expectKvfContains(rel.kvf, 'v', 'v3');
      expectKvfContains(rel.kvf, 'f', ['f4', 'f3']);
      expectKvfContains(rel.kvf, 'k', 'k4');
      expectKvfContains(rel.kvf, 'v', 'v4');
      expectKvfContains(rel.kvf, 'f', undefined);
    });
  
  });
  
  describe('crossMany method', function () {
  
    it('used to cross many rel sets', function () {
      var set1 = [
        {rel: 'A', kvf: [{k: 'k1', v: 'v1'}]},
        {rel: 'B', kvf: [{k: 'k2', v: 'v2'}]},
        {rel: 'C', kvf: [{k: 'k3', v: 'v3', f: ['f3']}, {k: 'k4'}]}
      ];
      var set2 = [
        {rel: 'C', kvf: [{k: 'k4', v: 'v4'}, {k: 'k3', f: ['f4']}]},
        {rel: 'D', kvf: [{k: 'k5'}]}
      ];
      var set3 = [
        {rel: 'C', kvf: [{k: 'k3'}]}
      ];
      var res = nlidb.crossMany([set1, set2, set3]);
      expect(res.length).toBe(1);
      var rel = res[0][0];
      expect(rel.rel).toBe('C');
      expect(rel.kvf.length).toBe(2);
      expectKvfContains(rel.kvf, 'k', 'k3');
      expectKvfContains(rel.kvf, 'v', 'v3');
      expectKvfContains(rel.kvf, 'f', ['f4', 'f3']);
      expectKvfContains(rel.kvf, 'k', 'k4');
      expectKvfContains(rel.kvf, 'v', 'v4');
      expectKvfContains(rel.kvf, 'f', undefined);
    });
  
  });
  
  describe('onLeaf method', function () {
  
    it('used to return occurs of corresponding word in thesaurus', function () {
      var tree = {isLeaf: true, occurs: [1, 2]};
      var res = nlidb.onLeaf(tree);
      expect(res.length).toBe(2);
      expect(res[0]).toBe(1);
      expect(res[1]).toBe(2);
    });
  
  });
  
  describe('onSingleChild method', function () {
  
    it('used to return result of traversing of subtree', function () {
      var tree = {e: {isLeaf: true, occurs: 1}};
      var res = nlidb.onSingleChild(tree, 'e');
      expect(res).toBe(1);
    });
  
  });
  
  describe('onManyChilds method', function () {
  
    it('used to return result of traversing of subtrees', function () {
      var tree = {e: [
        {isLeaf: true, occurs: [{rel: 'A', kvf: [{k: 'k1'}]}]},
        {isLeaf: true, occurs: [{rel: 'A', kvf: [{k: 'k1', v: 'v1'}]}]}
      ]};
      var res = nlidb.onManyChilds(tree, 'e')[0];
      expect(res.length).toBe(1);
      expect(res[0].rel).toBe('A');
      expect(res[0].kvf.length).toBe(1);
      expect(res[0].kvf[0].k).toBe('k1');
      expect(res[0].kvf[0].v).toBe('v1');
    });
   
  });
  
  describe('generate method', function () {
  
    it('used to generate structural representation of nl query to which tree corresponds', function () {
      var tree = {e: [
        {isLeaf: true, occurs: [{rel: 'A', kvf: [{k: 'k1'}]}]},
        {isLeaf: true, occurs: [{rel: 'A', kvf: [{k: 'k1', v: 'v1'}]}]}
      ]};
      var res = nlidb.generate(tree)[0];
      expect(res.length).toBe(1);
      expect(res[0].rel).toBe('A');
      expect(res[0].kvf.length).toBe(1);
      expect(res[0].kvf[0].k).toBe('k1');
      expect(res[0].kvf[0].v).toBe('v1');
    });
  
  });
  
});