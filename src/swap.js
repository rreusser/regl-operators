'use strict'

module.exports = swap

/*function swap (buffers, i1, i2) {
  i1 = i1 === undefined ? 1 : 0
  i2 = i2 === undefined ? 0 : 1

  var tmp = buffers[i2]
  buffers[i2] = buffers[i1]
  buffers[i1] = tmp

  return buffers
}*/

function swap (state) {
  var tmp = state.src;
  state.src = state.dst;
  state.dst = tmp;
}
