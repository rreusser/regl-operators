# regl-operator

> Easy setup for a fullscreen operator in [regl](https://github.com/regl-project/regl)

## Introduction

This module provides a template for fullscreen operators in regl. It does this by defining a single fullscreen triangle which covers the screen. It returns the definition of the operator (by default, a simply copy) which you may then turn into a regl command. Any or all of the default setup may be overridden.

## Example

The default behavior is a copy operator that writes the result to `props.dest` (which is implicitly the screen if that's null/undefined). To copy from a `src` texture to the screen:

```javascript
var regl = require('regl')
var reglOp = require('regl-operator')

// A shortcut to instantiate the command:
var op = params => regl(reglOp(params))

var copy = op()

// Copy mySrcTexture to the screen:
copy({src: mySrcTexture})
```

This behavior can be easily overridden by specifying a fragment shader:

```javascript
var makeItRed = op({
  frag: `
    precision mediump float;
    void main () {
      gl_FragColor = vec4(1, 0, 0, 1);
    }
  `
})

makeItRed()
```

A brightness filter is easy. Well, hardly much easier than with plain regl, but once you write enough of these, it starts to seem pretty attractive to cut out the geometry and vertex shader boilerplate.

```javascript
var adjust = op({
  frag: `
    precision mediump float;
    varying vec2 uv;
    uniform sampler2D src;
    uniform float brightness;
    void main () {
      vec3 color = texture2D(src, uv).rgb;
      gl_FragColor = vec4(color * brightness, 1);
    }
  `,
  uniforms: {
    brightness: regl.prop('brightness')
  },
})

adjust({
  src: myInputFBO,
  dest: myOutputFBO,
  brightness: 0.5,
})
```

The example below creates a convolution operator that averages the surrounding points. To facilitate this, the module provides by default a uniform vec2 `dxy` containing the grid resolution.

```javascript
var blur = op({
  frag: `
    precision mediump float;
    varying vec2 uv;
    uniform vec2 dxy;
    uniform sampler2D src;
    void main () {
      vec4 n = texture2D(src, vec2(uv.x, uv.y + dx.y));
      vec4 s = texture2D(src, vec2(uv.x, uv.y - dx.y));
      vec4 e = texture2D(src, vec2(uv.x + dx.x, uv.y));
      vec4 w = texture2D(src, vec2(uv.x - dx.x, uv.y));
      gl_FragColor = 0.25 * (n + s + e + w);
    }
  `
})
```

## API

### `require('regl-operator')(parameters)`

Injects parameters into the default operator template and returns an object which can then be passed to regl. Default parameters are:

|parameter|default|
|----|----|
| `vert` | Pass-thru with `varying vec2 uv` which goes from 0 to 1 in both dimensions |
| `frag` | Copy from `src` texture to `gl_FragColor` |
| `attributes` | `{xy: <a big triangle>}` |
| `uniforms` | `src: regl.prop('src')` <br> `dxy: [1 / context.framebufferWidth, 1 / context.framebufferHeight]` |
| `framebuffer` | `regl.prop('dest')` |
| `depth` | `{enable: false}` |
| `count` | `3` |
| `primitive` | `'triangles'` |

Returns an object containing the command definition. (To prevent a dependency on regl itself, does *not* return an instantiated regl command.)

## License

&copy 2017 Ricky Reusser. MIT License.
