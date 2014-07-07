var rutil = require('../lib/rutil');

describe('rutil', function () {
  
  it('has function "sameArr" to check equality of two arrays, used by "same"', function () {
    var a1 = [1, 2, 3];
    var a2 = [1, 2, 3];
    expect(rutil.sameArr(a1, a2)).toBe(true);
    
    expect(rutil.sameArr([],[])).toBe(true);
    
    expect(rutil.sameArr(null, null)).toBe(true);
    
    a2 = [1, 3, 2];
    expect(rutil.sameArr(a1, a2)).toBe(false);    
    
    expect(rutil.sameArr(null, [])).toBe(false);
    
    expect(rutil.sameArr([], null)).toBe(false);    
  });
  
  it('has function "same" to check whether relations are equal or not', function () {
    var rel1 = {rel: 'A', kvf: [{k: 'k2', v: 'v2', f: ['fa', 'fb']}, {k: 'k'}]};
    var rel2 = {rel: 'A', kvf: [{k: 'k'}, {k: 'k2', v: 'v2', f: ['fa', 'fb']}]};
    expect(rutil.same(rel1, rel2)).toBe(true);
    
    rel2.rel = 'B';
    expect(rutil.same(rel1, rel2)).toBe(false);    
    
    rel2.rel = 'A';
    expect(rutil.same(rel1, rel2)).toBe(true);
    
    rel1.kvf.shift();
    expect(rutil.same(rel1, rel2)).toBe(false);
    
    rel2.kvf.shift();
    expect(rutil.same(rel1, rel2)).toBe(false);   
  });
  
  it('has function "removeDuplicates" used to get unique rels', function () {
    var rels = [
      {rel: 'A', kvf: [{k: 'k1', v: 'v1', f: ['fa', 'fb']}, {k: 'k2'}]},
      {rel: 'B', kvf: [{k: 'k2'}]},
      {rel: 'A', kvf: [{k: 'k2'}, {k: 'k1', v: 'v1', f: ['fa', 'fb']}]},
      {rel: 'A', kvf: [{k: 'k2'}, {k: 'k1', v: 'v1', f: ['fa', 'fb']}]},
      {rel: 'A', kvf: [{k: 'k2'}, {k: 'k1', v: 'v1', f: ['fa', 'fb']}]},
    ];
    
    var unique = rutil.removeDuplicates(rels);
    expect(unique.length).toBe(2);
    expect(unique[0].rel).toBe('B');
    expect(unique[1].rel).toBe('A');
  });
  
  it('has "countKeys" function to count k and v elements of kvf', function () {
    var rel = {rel: 'A', kvf: [{k: 1, v: 2}, {k: 3, v: 4}, {k: 5}]};
    expect(rutil.countKeys(rel)).toBe(5);
    
    expect(rutil.countKeys({rel: 'B', kvf: []})).toBe(0);
  });
  
  it('has "leastKeys" to say what is the least number of k- and v-s among all relations', function () {
    var rels = [{rel: 'A', kvf: [{k: 1}, {k: 2, v: 3}]}, {rel: 'B', kvf: [{k: 1}, {k: 2}, {k: 3}]}, {rel: 'C', kvf: [{k: 1, v: 2}]}];
    expect(rutil.leastKeys(rels)).toBe(2);
    
    rels.push({rel: 'D', kvf: [{k: 1}]});
    expect(rutil.leastKeys(rels)).toBe(1);
    
    rels.push({rel: 'D', kvf: []});
    expect(rutil.leastKeys(rels)).toBe(0);
  });
  
  it('has "containsKey" to define nlidb-specific stuff', function () {
    var rel = {rel: 'A', kvf: [{k: 'k1'}]};
    expect(rutil.containsKey(rel.kvf, 'k1')).toBe(true);
    expect(rutil.containsKey(rel.kvf, 'k2')).toBe(false);
    
    var rel = {rel: 'A', kvf: [{k: 'k1', v: 'v1'}]};
    expect(rutil.containsKey(rel.kvf, 'k1')).toBe(false);
    
    var rel = {rel: 'A', kvf: [{k: 'k1'}, {k: 'k2'}]};
    expect(rutil.containsKey(rel.kvf, 'k1')).toBe(true);    
  });
  
  it('has "mergeIfOneIsFunctional" merging two rels, when only one of them contains function definition', function () {
    var rel1 = {rel: 'F', kvf: [{f: ['func1']}]};
    var rel2 = {rel: 'F', kvf: [{f: ['func2']}]};
    var rel3 = {rel: 'N', kvf: [{k: 'k1', v: 'v1'}]};
    
    expect(rutil.mergeIfOneIsFunctional(rel1, rel2)).toBe(undefined);
    expect(rutil.mergeIfOneIsFunctional(rel1, rel3)).not.toBe(undefined);
    expect(rutil.mergeIfOneIsFunctional(rel3, rel2)).not.toBe(undefined);
  });
  
  it('has "oneIsFunc" merging first non-functional rel with second functional', function () {
    var rel1 = {rel: 'F', kvf: [{f: ['func1']}]};
    var rel2 = {rel: 'F', kvf: [{f: ['func2']}]};
    var rel3 = {rel: 'N', kvf: [{k: 'k1', v: 'v1'}]};
    
    expect(rutil.oneIsFunc(rel1, rel2)).toBe(undefined);
    expect(rutil.oneIsFunc(rel1, rel3)).toBe(undefined);
    expect(rutil.oneIsFunc(rel3, rel1)).not.toBe(undefined);
  });
  
});