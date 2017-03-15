'use strict'

var extendCommand = require('regl-extend').command

module.exports = function (regl, opts) {
  return regl(extendCommand({
    vert: [
      'precision mediump float;',
      'attribute vec2 xy;',
      'varying vec2 uv;',
      'void main () {',
      '  uv = xy * 0.5 + 0.5;',
      '  gl_Position = vec4(xy, 0, 1);',
      '}'
    ].join('\n'),
    frag: [
      'precision mediump float;',
      'varying vec2 uv;',
      'uniform sampler2D src;',
      'void main () {',
      '  gl_FragColor = texture2D(src, uv);',
      '}'
    ].join('\n'),
    attributes: {
      xy: [[-4, -4], [0, 4], [4, -4]]
    },
    uniforms: {
      src: function (ctx, props) {
        return props.src
      },
      dxy: function (ctx) {
        return [
          1 / ctx.viewportWidth,
          1 / ctx.viewportHeight
        ]
      }
    },
    primitive: 'triangles',
    depth: {enable: false},
    count: 3
  }, opts || {}))
}
