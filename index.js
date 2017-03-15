var map = require('./src/map')
var particles = require('./src/particles')
var particleLookup = require('./src/particle-lookup')
var scan = require('./src/scan')
var reduce = require('./src/reduce')

module.exports = function (regl) {
  return {
    swap: require('./src/swap'),
    map: function (opts) {
      return regl(map(opts))
    },
    scan: function (opts) {
      opts = opts || {};
      opts.scan = true;
      return reduce(regl, opts)
    },
    reduce: function (opts) {
      return reduce(regl, opts)
    },
    particles: function (opts, reglParams) {
      return regl(particles(opts, reglParams))
    },
    particleLookup: particleLookup
  }
}
