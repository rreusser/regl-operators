var map = require('./src/map')
var particles = require('./src/particles')
var particleLookup = require('./src/particle-lookup')

module.exports = function (regl) {
  return {
    swap: require('./src/swap'),
    map: function (opts) {
      return regl(map(opts))
    },
    particles: function (opts, reglParams) {
      return regl(particles(opts, reglParams))
    },
    particleLookup: particleLookup
  }
}
