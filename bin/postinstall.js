var wbp_abs_path = process.env.HOME + '/.wbp/';
var npm = require('promisify-npm');
//create packages wbp folder
npm.initDefaultPkg(wbp_abs_path);

