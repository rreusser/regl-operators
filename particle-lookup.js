'use strict'

module.exports = function (width, height) {
  height = height || width
  var n = width * height
  var xy = []
  for (var i = 0; i < n; i++) {
    xy.push([
      (i % width) / Math.max(1, width - 1),
      Math.floor(i / width) / Math.max(1, height - 1)
    ])
  }
  return xy
}
