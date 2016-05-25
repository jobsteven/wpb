/* eslint-disable */

var wbp = require('commander');
var npm = require('promisify-npm');
var fs = require('promisify-fs');

//load config
fs
  .readFile('./package.json')
  .then(JSON.parse)
  .get('wbp')
  .then(function (wbpConf) {
    //wbp_home library
    var wbp_home = wbpConf.home.replace('~', process.env['HOME']);

    //open subcommand mode
    wbp.executables = true;

    //unknown options are acceptable
    wbp.allowUnknownOption();

    //unknown subcommand
    wbp.on('*', function (plugin_name, args) {
      console.log(plugin_name);
      if (!~plugin_name.indexOf('wbp-')) plugin_name = 'wbp-' + plugin_name;

      console.log(plugin_name, args, this.args, this.options);

      npm
        .hasInstalled(plugin_name)
        .then(function (installed) {
          if (!installed) {
            return npm.install(plugin_name)
          }
        })
        .then(function () {
          return require(wbp_home + '/node_modules/' + plugin_name)(args);
        })
        .catch(function (e) {
          console.error('wbp-error->', e);
        })
    })

    //parse cli
    wbp.parse(process.argv)
  })

