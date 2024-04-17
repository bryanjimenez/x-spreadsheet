import assert from 'assert';
import { describe, it } from 'mocha';
import { infixExprToSuffixExpr } from '../../src/core/cell';

describe('infixExprToSuffixExpr', () => {
  it('simple', () => {
    assert.deepEqual(infixExprToSuffixExpr('(9+1)*(2+3)'),[
      '9',  '1', '+', 
      '2', '3', '+', '*'
    ])
    // assert.equal(infixExprToSuffixExpr('(9+(3-1))*(2+3)+4/2'), '931-+23+*42/+');
  });

  it('simple', () => {
    assert.deepEqual(infixExprToSuffixExpr('(9+(3-1))*(2+3)'),[
      '9', '3', '1', '-', '+', 
      '2', '3', '+', '*'
    ])
    // assert.equal(infixExprToSuffixExpr('(9+(3-1))*(2+3)+4/2'), '931-+23+*42/+');
  });
  it('should return 931-+23+*42/+ when the value is (9+(3-1))*(2+3)+4/2', () => {
 
    // assert.equal(infixExprToSuffixExpr('(9+(3-1))*(2+3)+4/2').join(''), '931-+23+*42/+');
    assert.deepEqual(infixExprToSuffixExpr('(9+(3-1))*(2+3)+4/2'), [
      '9', '3', '1', '-', '+', 
      '2', '3', '+', '*', 
      '4', '2', '/', '+'
    ]);
  });
});

