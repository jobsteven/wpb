#!/usr/bin/env node

/* eslint-disable */

var cli = require('promisify-cli');
var npm = require('promisify-npm');
var fs = require('promisify-fs');

/**
 * WBP Class
 */
var WBP = function () {}

/**
 * plugin name need to be normalized
 * {string}
 */
WBP.prototype.normalize = function (plugin_name) {
  var prefix = this.options.prefix === false ? '' : 'wbp-';
  if (!~plugin_name.indexOf(prefix)) return plugin_name = prefix + plugin_name;
  return plugin_name;
}

/**
 * call other plugins in wbp ecosystem, they may be downloaded on-demand.
 * promise
 */
WBP.prototype.call = function (plugin_name) {
  var self = this;
  var plugin_name = self.normalize(plugin_name);

  npm
    .hasInstalled(plugin_name)
    .then(function (installed) {
      if (!installed) {
        return npm.install(plugin_name)
      }
    })
    .then(function () {
      return self.wbp_home + '/node_modules/' + plugin_name;
    })
    .then(function (plugin_path) {
      //associated informations.
      options.__plugindir = plugin_path;
      //plugin is found.
      return require(plugin_path)(params, options, self);
    })
}

/**
 * wbp utils log
 */
WBP.prototype.log = function () {

};

/**
 * wbp utils error
 */
WBP.prototype.error = function () {};

/**
 * wbp configuration from package
 * @return {[type]} [description]
 */
WBP.prototype.loadConfig = function () {
  var self = this;
  return fs
    .readFile('./package.json')
    .then(JSON.parse)
    .get('wbp')
    .then(function (wbp_conf) {
      self.wbp_conf = wbp_conf;
    })
}

/**
 * init wbp constants and cli params and options
 * @return {[type]} [description]
 */
WBP.prototype.initwbp = function () {
  var self = this;
  //wbp_home library
  this.home_path = this.wbp_conf.home.replace('~', process.env['HOME']);

  return cli()
    .then(function (cli) {
      //at least on param. help and exit
      if (!cli.params.length) {
        cli.help();
      }
      self.options = cli.options;
      self.params = cli.params;
      return cli.params.shift();
    })
}

var wbp = new WBP();

wbp
  .loadConfig()
  .then(wbp.initwbp.bind(wbp))
  .then(wbp.call.bind(wbp))
  .catch(function (e) {
    console.error('catch->', e);
  })

