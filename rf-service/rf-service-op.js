export function Column(name) {
  this.name = name;
}

Column.isColumn = obj => obj instanceof Column;

export const Op = {
  eq: Symbol('eq'),
  
  or: Symbol('or'),
  and: Symbol('and'),

  like: Symbol('like'),
};