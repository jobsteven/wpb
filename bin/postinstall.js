#!/usr/bin/env node
/*eslint-disable*/
var npm = require('promisify-npm');
var fs = require('promisify-fs');
var path = require('path');

fs
  .getModulePackInfo()
  .get('wbp')
  .then(function(wbp_conf) {
    var home_path = path.join(process.env['HOME'] || (
      process.env['HOMEDRIVE'] + process.env['HOMEPATH']
    ), wbp_conf.home);

    return npm
      .initDefaultPkg(home_path, {
        author: process.env['USER'] || '',
        dependencies: {},
        version: '0.0.0',
        description: 'This is the wbp plugins repository.',
        license: "MIT",
        main: 'index.js'
      })
      .then(function() {
        return fs.writeFile(home_path + '/index.js', '//wbp home Library');
      })
  })
  .then(function(result) {
    console.log('wbp has been installed, successfully.');
  })
  .catch(function(e) {
    console.log('wbp got errors.', e);
  })
