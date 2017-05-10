const fs          = require('fs');
const path        = require('path');
const packageInfo = require(path.join(__dirname, '..', 'package.json'));

console.log('Copying assets');

fs.createReadStream(path.join(__dirname, '..', 'bower_components', 'vue', 'dist', 'vue.min.js'))
  .pipe(fs.createWriteStream(path.join(__dirname, '..', 'app', 'js', 'vue.min.js')));
fs.createReadStream(path.join(__dirname, '..', 'bower_components', 'mousetrap', 'mousetrap.min.js'))
  .pipe(fs.createWriteStream(path.join(__dirname, '..', 'app', 'js', 'mousetrap.min.js')));
fs.createReadStream(path.join(__dirname, '..', 'assets', 'app_icon.png'))
  .pipe(fs.createWriteStream(path.join(__dirname, '..', 'app', 'img', 'app_icon.png')));

console.log('Updating package.json');

packageInfo.main = './main.js';
packageInfo.scripts.start = 'electron .';

delete packageInfo.scripts.build;
delete packageInfo.devDependencies;

fs.writeFile(path.join(__dirname, '..', 'app', 'package.json'), JSON.stringify(packageInfo));
