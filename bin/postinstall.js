/*eslint-disable*/
var npm = require('promisify-npm');
var fs = require('promisify-fs');

fs
  .getModulePackInfo()
  .get('wbp')
  .then(function (wbp_conf) {
    var home_path = wbp_conf.home;
    if (home_path.substr(0, 1) == '~') {
      home_path = home_path.replace('~', process.env.HOME);
    }
    return npm
      .initDefaultPkg(home_path, {
        author: process.env['USER'] || '',
        dependencies: {},
        version: '0.0.0',
        description: 'This is the wbp plugins repository.',
        license: "MIT",
        main: 'index.js'
      })
      .then(function () {
        return fs.writeFile(home_path + '/index.js', '//wbp home Library');
      })
  })
  .then(function (result) {
    console.log('wbp has been installed, successfully.');
  })
  .catch(function (e) {
    console.log('wbp got errors.', e);
  })

