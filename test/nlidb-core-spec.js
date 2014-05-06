describe('A NLIDB core functionality', function(){
  
  var nlidb = require('../lib/nlidb-core');
  
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
  
  //tree should be transformed into corresponding structured representation
  var struc_rep = [[{rel:'B', def: 'b', kvf: [{k: 'b', v: 'b'}]}],[{rel: 'A', kvf: [{k: 'ab', v: 'ab'}, {k: 'a', v: 'a'}]}]];
  
  it('has its main function - minimize - that transforms natural language query into strucured representation', function(){
    var minimized = nlidb.exec('minimize', [tree]);
    expect(minimized.length).toBe(2);
    expect(minimized[0].length).toBe(1);
    expect(minimized[1].length).toBe(1);
    expect(minimized[0][0].rel).toBe('B');
    expect(minimized[0][0].kvf.length).toBe(1);
    expect(minimized[0][0].kvf[0].k).toBe('b');
    expect(minimized[0][0].kvf[0].v).toBe('b');
    expect(minimized[0][0].kvf[0].f).not.toBeDefined();
    expect(minimized[1][0].rel).toBe('A');
    expect(minimized[1][0].kvf.length).toBe(2);
    expect(minimized[1][0].kvf[0].k).toBe('ab');
    expect(minimized[1][0].kvf[0].v).toBe('ab');
    expect(minimized[1][0].kvf[0].f).not.toBeDefined();
    expect(minimized[1][0].kvf[1].k).toBe('a');
    expect(minimized[1][0].kvf[1].v).toBe('a');
    expect(minimized[1][0].kvf[1].f).not.toBeDefined();
  });
  
});