var ndarray = require('ndarray');
var show = require('ndarray-show');
var squeeze = require('ndarray-squeeze');
var glsl = require('glslify');

var regl = require('regl')({
  extensions: ['oes_texture_float'],
  onDone: require('fail-nicely')(run)
});


function run (regl) {
  var ops = require('../')(regl)

  var fbos = new Array(2).fill(0).map(() =>
    regl.framebuffer({
      depthStencil: false,
      color: regl.texture({
        width: 4,
        height: 1,
        data: new Array(16).fill(0).map(Math.random),
        type: 'float',
        format: 'rgba',
      })
    })
  )

  var computeLuma = ops.map({
    frag: glsl(`
      precision mediump float;
      #pragma glslify: luma = require(glsl-luma)
      varying vec2 uv;
      uniform sampler2D src;
      void main () {
        float l = luma(texture2D(src, uv));
        gl_FragColor = vec4(l, l, 0, 0);
      }
    `),
    framebuffer: regl.prop('dst')
  })

  var minmax = ops.scan({
    reduce: {
      frag: `
        precision mediump float;
        varying vec2 sumLocation;
        varying vec2 prefixLocation;
        uniform sampler2D src;

        void main () {
          vec2 prefix = texture2D(src, prefixLocation).xy;
          vec2 sum = texture2D(src, sumLocation).xy;
          gl_FragColor = vec4(min(prefix.x, sum.x), max(prefix.y, sum.y), 0, 0);
        }
      `
    },
  })

  var state = {src: fbos[0], dst: fbos[1]}

  state.src.use(() => console.log('input:\n' + show(ndarray(regl.read(), [4, 4]))));

  computeLuma(state);
  ops.swap(state)
  minmax(state)

  state.dst.use(() => console.log('output:\n' + show(ndarray(regl.read(), [4, 4]))));
}
