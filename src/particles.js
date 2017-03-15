'use strict'

var extendCommand = require('regl-extend').command
var createLookup = require('./particle-lookup')
var color = require('./color')

module.exports = function (regl, opts, reglParams) {
  opts = opts || {}

  const width = opts.width || opts.radius
  const height = opts.height || opts.radius
  const lookup = opts.particleLookup || createLookup(width, height)
  const pointSize = opts.pointSize || 1
  const dimension = opts.dimension || 3

  return regl(extendCommand({
    vert: dimension === 2 ? (`
      precision mediump float;
      attribute vec2 uv;
      uniform sampler2D position;
      void main () {
        gl_Position = vec4(texture2D(position, uv).xy, 0, 1);
        gl_PointSize = ${pointSize.toFixed(2)};
      }
    `) : (`
      precision mediump float;
      attribute vec2 uv;
      uniform sampler2D position;
      uniform mat4 projection, view;
      void main () {
        vec3 p = texture2D(position, uv).xyz;
        gl_Position = projection * view * vec4(p, 1);
        gl_PointSize = ${pointSize.toFixed(2)};
      }
    `),
    frag: `
      precision mediump float;
      void main () {
        gl_FragColor = vec4(${color(opts.color)});
      }
    `,
    attributes: {
      uv: lookup
    },
    depth: {
      enable: false
    },
    blend: {
      enable: true,
      func: {
        srcRGB: 1,
        srcAlpha: 1,
        dstRGB: 1,
        dstAlpha: 1
      },
      equation: {
        rgb: 'add',
        alpha: 'add'
      }
    },
    uniforms: {
      position: function (ctx, props) {
        return props && props.src
      }
    },
    primitive: 'points',
    count: width * height
  }, reglParams))
}
