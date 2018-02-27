/* eslint-disable */

/* file taken from https://raw.githubusercontent.com/pedronauck/micro-router/master/utils/index.js */
const { parse } = require('url')
const UrlPattern = require('url-pattern')

const patternOpts = {
  segmentNameCharset: 'a-zA-Z0-9_-'
}

const getParamsAndQuery = (pattern, url) => {
  const { query, pathname } = parse(url, true)
  const route = pattern instanceof UrlPattern ? pattern : new UrlPattern(pattern, patternOpts)
  const params = route.match(pathname)

  return { query, params }
}

module.exports = {
  getParamsAndQuery,
  patternOpts
}

