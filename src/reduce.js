'use strict'

var extendCommand = require('regl-extend').command
var ndarray = require('ndarray');
var show = require('ndarray-show')

module.exports = function (regl, opts) {
  opts = opts || {};
  var doScanDflt = typeof opts.scan === 'undefined' ? false : opts.scan;

  var setCommon = regl({
    attributes: {
      points: [-4, -4, 0, 4, 4, -4]
    },
    depth: {enable: false},
    count: 3,
  })

  var baseOp = {
    uniforms: {
      src: regl.prop('src'),
    },
    framebuffer: regl.prop('dst'),
  }

  var identity = regl(extendCommand(baseOp, {
    vert: `
      precision mediump float;
      attribute vec2 points;
      varying vec2 sumLocation;
      void main () {
        sumLocation = 0.5 * (points + 1.0);
        gl_Position = vec4(points, 0, 1);
      }
    `,
    frag: `
      precision mediump float;
      varying vec2 sumLocation;
      uniform sampler2D src;
      void main () {
        gl_FragColor = texture2D(src, sumLocation);
      }
    `,
    scissor: {
      enable: function (context, props) {
        if (props.scissor !== undefined) {
          return props.scissor;
        } else {
          return true;
        }
      },
      box: {
        x: function (context, props) {
          return props.axis === 0 ? Math.floor(props.shift / 2) : 0;
        },
        y: function (context, props) {
          return props.axis === 0 ? 0 : Math.floor(props.shift / 2);
        },
        width: function (context, props) {
          return props.axis === 0 ? props.shift : context.framebufferWidth;
        },
        height: function (context, props) {
          return props.axis === 0 ? context.framebufferHeight : props.shift;
        }
      }
    }
  }, opts.identity))

  var reduce = regl(extendCommand(baseOp, {
    vert: `
      precision mediump float;
      attribute vec2 points;
      uniform vec2 shift;
      varying vec2 sumLocation;
      varying vec2 prefixLocation;
      void main () {
        sumLocation = 0.5 * (points + 1.0);
        prefixLocation = sumLocation + shift;
        gl_Position = vec4(points, 0, 1);
      }
    `,
    frag: `
      precision mediump float;
      uniform sampler2D src;
      varying vec2 prefixLocation, sumLocation;

      void main () {
        gl_FragColor = texture2D(src, prefixLocation) + texture2D(src, sumLocation);
      }
    `,
    uniforms: {
      shift: function (context, props) {
        return props.axis === 0 ?
          [-1.0 / context.framebufferWidth * props.shift, 0] :
          [0, -1.0 / context.framebufferHeight * props.shift];
      },
    },
    scissor: {
      enable: true,
      box: {
        x: function (context, props) {
          return props.axis === 0 ? props.shift : 0;
        },
        y: function (context, props) {
          return props.axis === 0 ? 0 : props.shift;
        },
      }
    },
  }, opts.reduce));


  function swap (params) {
    var tmp = params.src;
    params.src = params.dst;
    params.dst = tmp;
  }

  function log (msg, params) {
    console.log(msg);
    params.src.use(function () {
      console.log('  src:   ' + show(ndarray(regl.read()).step(1)));
    });

    params.dst.use(function () {
      console.log('  dst:  ' + show(ndarray(regl.read()).step(1)));
    });
  }

  return function (buffers, execOpts) {
    execOpts = execOpts || {}

    var doScan = typeof execOpts.scan === 'undefined' ? doScanDflt : execOpts.doScan;

    var state = {
      src: buffers.src,
      dst: buffers.dst,
      axis: execOpts.axis || 0
    };

    var width = state.src.width;
    var height = state.src.height;

    if (execOpts.verbose) log('input', state);

    setCommon(() => {
      for (state.shift = 1; state.shift < width; state.shift *= 2) {
        if (doScan) identity(state);

        if (execOpts.verbose) log('identity (shift: ' + state.shift + ')', state);

        reduce(state);

        if (execOpts.verbose) log('reduce   (shift: ' + state.shift + ')', state);

        swap(state);
      }
    })

    if (execOpts.verbose) log('output', state);

    buffers.dst = state.src
    buffers.src = state.dst

    return buffers
  }
}

