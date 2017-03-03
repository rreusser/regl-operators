'use strict'

var extendCommand = require('regl-extend').command

module.exports = function (opts) {
  return extendCommand({
    vert: [
      'precision mediump float;',
      'attribute vec2 xy;',
      'varying vec2 uv;',
      'void main () {',
      '  uv = 0.5 * xy + 0.5;',
      '  gl_Position = vec4(xy, 0, 1);',
      '}'
    ].join('\n'),
    frag: [
      'precision mediump float;',
      'varying vec2 uv;',
      'uniform sampler2D src;',
      'void main () {',
      '  vec4 color = texture2D(src, uv);',
      '  gl_FragColor = vec4(uv, 0, 1);',
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
    framebuffer: function (ctx, props) {
      return props && props.dst
    },
    primitive: 'triangles',
    depth: {enable: false},
    count: 3
  }, opts || {})
}
