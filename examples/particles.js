require('regl')({
  extensions: ['OES_texture_float'],
  pixelRatio: 1,
  attributes: {
    antialias: false,
  },
  onDone: require('fail-nicely')(run)
})

function run (regl) {
  const ops = require('../')(regl)
  const camera = require('@rreusser/regl-camera')(regl, {
    theta: 1.5,
    phi: 0.2,
    distance: 100,
    center: [0, 28, 0]
  })

  const radius = 100
  const pos = new Array(2).fill(0).map(() => regl.framebuffer({
    radius: radius,
    colorType: 'float',
    depthStencil: false
  }))

  const initialize = ops.map({
    frag: `
      precision mediump float;
      varying vec2 uv;
      void main () {
        gl_FragColor = vec4(vec2(0, 28) + uv - 0.5, 0, 1);
      }
    `
  })

  const iterate = ops.map({
    frag: `
      precision mediump float;
      uniform sampler2D src;
      varying vec2 uv;
      const float dt = 0.01;

      vec3 lorenz (vec3 p) {
        return vec3(
          p.z * (28.0 - p.y) - p.x,
          p.z * p.x - 8.0 / 3.0 * p.y,
          10.0 * (p.x - p.z)
        );
      }

      void main () {
        vec3 p = texture2D(src, uv).xyz;
        // A half step then a full step for midpoint (RK2) integration:
        vec3 pm = p + lorenz(p) * 0.5 * dt;
        gl_FragColor = vec4(p + lorenz(pm) * dt, 1);
      }
    `
  })

  const splat = ops.particles({
    radius: radius,
    color: [0.1, 0.3, 0.2, 0.1],
    pointSize: 4
  })

  pos[0].use(() => initialize())

  regl.frame(() => {
    regl.clear({color: [0.2, 0.25, 0.3, 1]})
    pos[1].use(() => iterate({src: pos[0]}))
    camera(() => splat({src: pos[1]}))
    ops.swap(pos)
  })
}
