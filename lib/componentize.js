/**
 * Module dependencies.
 */

var debug = require('debug')('componentify');
var mkdir = require('mkdirp');
var utils = require('./utils');
var fs = require('fs');
var path = require('path');
var join = path.join;
var resolve = path.resolve;
var exists = fs.existsSync;
var request = require('superagent');


/**
 * Expose utils.
 */

exports.utils = utils;

/**
 * Lookup `pkg` within `paths`.
 *
 * @param {String} pkg
 * @param {String} paths
 * @return {String} path
 * @api private
 */

exports.lookup = function(pkg, paths){
  debug('lookup %s', pkg);
  for (var i = 0; i < paths.length; ++i) {
    var path = join(paths[i], pkg);
    debug('check %s', join(path, 'component.json'));
    if (exists(join(path, 'component.json'))) {
      debug('found %s', path);
      return path;
    }
  }
};

/**
 * Return the dependencies of local `pkg`,
 * as one or more objects in an array,
 * since `pkg` may reference other local
 * packages as dependencies.
 *
 * @param {String} pkg
 * @param {Array} [paths]
 * @return {Array}
 * @api private
 */

exports.dependenciesOf = function(pkg, paths, parent){
  paths = paths || [];
  var path = exports.lookup(pkg, paths);
  if (!path && parent) throw new Error('failed to lookup "' + parent + '"\'s dep "' + pkg + '"');
  if (!path) throw new Error('failed to lookup "' + pkg + '"');
  var conf = require(resolve(path, 'component.json'));
  var deps = [conf.dependencies || {}];

  if (conf.local) {
    var localPaths = (conf.paths || []).map(function(depPath){
      return resolve(path, depPath);
    });

    conf.local.forEach(function(dep){
      deps = deps.concat(exports.dependenciesOf(dep, paths.concat(localPaths), pkg));
    });
  }

  return deps;
};


/**
 * Check if component `name` exists in ./components.
 *
 * @param {String} name
 * @return {Boolean}
 * @api public
 */

exports.exists = function(name){
  name = name.replace('/', '-');
  var file = path.join('components', name);
  return exists(file);
};


/**
 * Fetch `pkg` changelog.
 *
 * @param {String} pkg
 * @param {Function} fn
 * @api public
 */

exports.changes = function(pkg, fn){
  // TODO: check changelog etc...
  exports.file(pkg, 'History.md', fn);
};
