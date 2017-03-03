var map = require('./map')
var particles = require('./particles')
var particleLookup = require('./particle-lookup')

module.exports = function (regl) {
  return {
    swap: require('./swap'),
    map: function (opts) {
      return regl(map(opts))
    },
    particles: function (opts, reglParams) {
      return regl(particles(opts, reglParams))
    },
    particleLookup: particleLookup
  }
}
