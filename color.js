module.exports = function (color) {
  let ret
  if (color) {
    if (Array.isArray(color)) {
      ret = color.slice()

      if (ret.length > 4) {
        ret = ret.slice(0, 4)
      } else if (ret.length !== 4) {
        while (ret.length < 4) {
          ret.push(1)
        }
      }
    }
  } else {
    ret = [1, 1, 1, 1]
  }
  return ret
}
