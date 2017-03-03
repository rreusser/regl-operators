const extend = require('xtend/mutable')
require('regl')({onDone: require('fail-nicely')(run)})

function run (regl) {
  const op = params => regl(require('../map')(params))
  const state = {r: 0.5, g: 0.5, b: 0.5}

  require('control-panel')([
    {type: 'range', min: 0, max: 1, label: 'r', initial: state.r},
    {type: 'range', min: 0, max: 1, label: 'g', initial: state.g},
    {type: 'range', min: 0, max: 1, label: 'b', initial: state.b}
  ]).on('input', data => {
    dirty = true
    extend(state, data)
  })

  const setColor = op({
    frag: `
      precision mediump float;
      uniform vec3 color;
      void main () {
        gl_FragColor = vec4(color, 1);
      }
    `,
    uniforms: {
      color: () => [state.r, state.g, state.b]
    }
  })

  let dirty = true
  regl.frame(() => {
    dirty && setColor()
    dirty = false
  })
}
