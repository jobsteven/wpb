#!/usr/bin/env node

/* eslint-disable */

var cli = require('promisify-cli');
var npm = require('promisify-npm');
var fs = require('promisify-fs');
var path = require('path');
var npmlog = require('npmlog');
/*npm log configuration*/
npmlog.heading = 'wbp';

/**log utils**/
function getModuleLog(module_name) {
  return {
    info: function (message, prefix) {
      npmlog.info(module_name + (prefix || ''), message);
    },
    warn: function (message, prefix) {
      npmlog.warn(module_name + (prefix || ''), message);
    },
    error: function (message, prefix) {
      npmlog.error(module_name + (prefix || ''), message);
    },
  }
}

/**
 * WBP Class
 */
var WBP = function () {
  this.log = getModuleLog('wbp');
}

/**
 * plugin name need to be normalized
 * {string}
 */
WBP.prototype.normalize = function (plugin_name) {
  var prefix = this.options.hasOwnProperty('prefix') && this.options.prefix === false ? '' : 'wbp-';
  if (!~plugin_name.indexOf(prefix)) return plugin_name = prefix + plugin_name;
  return plugin_name;
}

/**
 * call other plugins in wbp ecosystem, they may be downloaded on-demand.
 * promise
 */
WBP.prototype.call = function (plugin_name, params, options) {
  var self = this;
  var plugin_name = self.normalize(plugin_name);
  npm
    .hasInstalled(plugin_name, self.wbp_home)
    .then(function (installed) {
      if (!installed) {
        self.log.info('wbp is going to install plugin [' + plugin_name + ']');
        return npm.install(plugin_name, self.wbp_home);
      }
    })
    .then(function () {
      return self.wbp_home + '/node_modules/' + plugin_name;
    })
    .then(function (plugin_path) {
      //associated informations.
      var pluginContext = Object.assign({
          //constants
          __plugindir: plugin_path,
          __cwd: process.cwd(),
          __name: plugin_name
        },
        //utils log
        getModuleLog(plugin_name),
        //wbp utils
        {
          call: self.call.bind(self),
          getCwdPath: function (cwdPath) {
            return path.resolve(process.cwd(), cwdPath);
          }
        });

      //plugin is found.
      var pluginExports = require(plugin_path);
      if (pluginExports && pluginExports instanceof Function) {
        self.log.info(plugin_name + ' is loaded and invoked.');
        return pluginExports.call(pluginContext, self.params, self.options);
      } else {
        throw 'the plugin named ' + plugin_name + 'should export a function';
      }
    })
}

/**
 * wbp configuration from package
 * @return {[type]} [description]
 */
WBP.prototype.loadConfig = function () {
  this.log.info('loading wbp configuration.');

  var self = this;
  return fs
    .readFile(__dirname + '/../package.json')
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
  this.log.info('parsing command line interface.');

  var self = this;
  //wbp_home library
  self.wbp_home = self.wbp_conf.home.replace('~', process.env['HOME']);

  return cli()
    .then(function (cli) {
      //at least on param. help and exit
      if (!cli.params.length) {
        cli.help();
      }

      self.options = cli.options;
      self.params = cli.params;
    })
}

/**
 * call Plugin based on first param
 * @return {[type]} [description]
 */
WBP.prototype.callPlugin = function () {
  return this.call(this.params.shift());
}

//wbp is just a task collabrator.
var wbp = new WBP();
wbp
  .loadConfig()
  .then(wbp.initwbp.bind(wbp))
  .then(wbp.callPlugin.bind(wbp))
  .catch(function (e) {
    console.error('catch->', e);
  })

