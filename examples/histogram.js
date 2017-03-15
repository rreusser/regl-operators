var extend = require('xtend/mutable');
var ndarray = require('ndarray');
var baboonData = require('baboon-image');
var squeeze = require('ndarray-squeeze');
var glsl = require('glslify');

var regl = require('regl')({
  extensions: ['oes_texture_float'],
  attributes: {
    antialias: false
  },
  onDone: require('fail-nicely')(run)
});


function run (regl) {
  var ops = require('../')(regl)

  var baboonData = require('baboon-image');
  var baboon = new Array(2).fill(0).map(() => regl.framebuffer({
    depthStencil: false,
    color: regl.texture({
      data: baboonData,
      flipY: true
    }),
    colorType: 'uint8',
    colorFormat: 'rgba',
  }))

  var blur = ops.map({
    frag: `
      precision mediump float;
      varying vec2 uv;
      uniform vec2 dxy;
      uniform sampler2D src;
      void main () {
        vec3 c = texture2D(src, uv).xyz;
        vec3 n = texture2D(src, uv + vec2(0, dxy.y)).xyz;
        vec3 s = texture2D(src, uv - vec2(0, dxy.y)).xyz;
        vec3 e = texture2D(src, uv + vec2(dxy.x, 0)).xyz;
        vec3 w = texture2D(src, uv - vec2(dxy.x, 0)).xyz;
        gl_FragColor = vec4(c * 0.2 + 0.8 * 0.25 * (n + s + e + w), 1);
      }
    `,
    framebuffer: regl.prop('dst')
  })

  var draw = ops.map({
    vert: `
      precision mediump float;
      attribute vec2 xy;
      varying vec2 uv;
      void main () {
        uv = xy * 0.5 + 0.5;
        vec2 pos = vec2(xy.x, xy.y * 0.8 + 0.2);
        gl_Position = vec4(pos, 0, 1);
      }
    `,
    framebuffer: regl.prop('dst'),
    scissor: {
      enable: true,
      box: {y: ctx => ctx.viewportHeight * 0.2}
    }
  })

  var histogram = regl.framebuffer({
    depthStencil: false,
    color: regl.texture({
      width: 256,
      height: 1,
      data: new Float32Array(256 * 4),
      type: 'float',
      format: 'rgba'
    })
  })

  var histogramRange = new Array(2).fill(0).map(() => regl.framebuffer({
    depthStencil: false,
    width: 256,
    height: 1,
    colorType: 'float',
    colorFormat: 'rgba'
  }))

  var preRange = ops.map({
    frag: `
      precision mediump float;
      varying vec2 uv;
      uniform sampler2D src;
      void main () {
        vec4 value = texture2D(src, uv);
        float mn1 = min(value.x, value.y);
        float mn2 = min(value.z, value.w);
        float mx1 = max(value.x, value.y);
        float mx2 = max(value.z, value.w);
        gl_FragColor = vec4(min(mn1, mn2), max(mx1, mx2), 0, 0);
      }
    `
  })

  var accum = ops.particles({
    width: baboonData.shape[0],
    height: baboonData.shape[1],
  }, {
    vert: `
      precision mediump float;
      attribute vec2 uv;
      uniform sampler2D position;
      uniform vec4 uInput;
      void main () {
        vec4 color = texture2D(position, uv);
        gl_Position = vec4(dot(uInput, color) * 2.0 - 1.0, 0, 0, 1);
        gl_PointSize = 1.0;
      }
    `,
    frag: `
      precision mediump float;
      uniform vec4 uOutput;
      void main () {
        gl_FragColor = uOutput;
      }
    `,
    uniforms: {
      uInput: regl.prop('input'),
      uOutput: regl.prop('output'),
    }
  })

  var inputs = [
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 1, 0],
    [0.299, 0.587, 0.114, 0],
  ];

  var outputs = [
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 1, 0],
    [0, 0, 0, 1]
  ];

  var colors = [
    [1, 0, 0, 1],
    [0, 1, 0, 1],
    [0, 0, 1, 1],
    [1, 1, 1, 1]
  ];

  var computMinMax = ops.reduce({
    reduce: {
      frag: `
        precision mediump float;
        uniform sampler2D src;
        varying vec2 prefixLocation, sumLocation;
        void main () {
          vec2 prefix = texture2D(src, prefixLocation).xy;
          vec2 sum = texture2D(src, sumLocation).xy;
          gl_FragColor = vec4(min(prefix.x, sum.x), max(prefix.y, sum.y), 0, 0);
        }
      `
    },
  })

  var drawHistogram = regl({
    vert: `
      precision mediump float;
      attribute float x;
      uniform sampler2D histogram, bounds;
      uniform vec4 srcChannel;
      void main () {
        vec2 minmax = texture2D(bounds, vec2(1, 1)).xy;
        vec4 sample = texture2D(histogram, vec2(x, 0));
        float y = dot(vec4(1), sample * srcChannel) / minmax.y * 0.2;
        gl_Position = vec4(vec2(x, y) * 2.0 - 1.0, 0, 1);
      }
    `,
    frag: `
      precision mediump float;
      uniform vec4 color;
      void main () {
        gl_FragColor = color;
      }
    `,
    attributes: {
      x: new Array(256).fill(0).map((d, i) => ([i / 256, (i + 1) / 256]))
    },
    uniforms: {
      srcChannel: regl.prop('srcChannel'),
      histogram: histogram,
      color: regl.prop('color'),
      bounds: regl.prop('bounds'),
    },
    primitive: 'lines',
    count: 512,
    depth: {enable: false},
  })


  regl.frame(() => {

    blur({src: baboon[0], dst: baboon[1]});
    var tmp = baboon[1];
    baboon[1] = baboon[0];
    baboon[0] = tmp;

    histogram.use(() => {
      regl.clear({color: [0, 0, 0, 1]})
      accum(inputs.map((d, i) => ({
        src: baboon[0],
        input: inputs[i],
        output: outputs[i]
      })))
    })

    // Send min/max of all channels into x/y:
    histogramRange[0].use(() => preRange({src: histogram}))

    // Reduce the value to a single min/max across the whole histogram:
    var histogramRangeState = computMinMax({src: histogramRange[0], dst: histogramRange[1]});

    // Draw the baboon:
    regl.clear({color: [0, 0, 0, 1]})
    draw({src: baboon[0]})

    // Draw the histogram:
    drawHistogram(inputs.map((d, i) => ({
      srcChannel: outputs[i],
      color: colors[i],
      bounds: histogramRangeState.dst
    })));
  })
}
