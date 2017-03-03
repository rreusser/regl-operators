'use strict'

var test = require('tape')
var op = require('./')

test(function (t) {
  var copy = op()

  t.equal(copy.vert, [
    'precision mediump float;',
    'attribute vec2 xy;',
    'varying vec2 uv;',
    'void main () {',
    '  uv = 0.5 * xy + 0.5;',
    '  gl_Position = vec4(xy, 0, 1);',
    '}'
  ].join('\n'))

  t.equal(copy.frag, [
    'precision mediump float;',
    'varying vec2 uv;',
    'uniform sampler2D src;',
    'void main () {',
    '  vec4 color = texture2D(src, uv);',
    '  gl_FragColor = vec4(uv, 0, 1);',
    '}'
  ].join('\n'))

  t.deepEqual(copy.attributes, {xy: [[-4, -4], [0, 4], [4, -4]]})
  t.deepEqual(Object.keys(copy.uniforms), ['src', 'dxy'])
  t.equal(copy.primitive, 'triangles')
  t.deepEqual(copy.depth, {enable: false})
  t.equal(copy.count, 3)

  t.end()
})

test(function (t) {
  var copy = op({
    vert: 'foo',
    frag: 'bar',
    primitive: 'pentagons',
    depth: {enable: true},
    count: 4
  })

  t.equal(copy.vert, 'foo')
  t.equal(copy.frag, 'bar')
  t.deepEqual(copy.attributes, {
    xy: [[-4, -4], [0, 4], [4, -4]]
  })
  t.equal(copy.uniforms.src(null, {src: 'foo'}), 'foo')

  t.deepEqual(copy.uniforms.dxy({
    viewportWidth: 2,
    viewportHeight: 2
  }), [0.5, 0.5])

  t.equal(copy.framebuffer(null, {dst: 'foo'}), 'foo')
  t.equal(copy.primitive, 'pentagons')
  t.deepEqual(copy.depth, {enable: true})
  t.equal(copy.count, 4)

  t.end()
})
