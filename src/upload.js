const OSS = require('ali-oss');
const chalk = require('chalk');
const ignore = require('ignore');
const fs = require('fs');

const log = console.log;
const cwd = process.cwd();

const validateOpts = (opts, ig) => {
  // default values
  let isForce = false;

  if (!fs.existsSync(opts.config)) throw `Configuration file ${opts.config} NOT FOUND`;
  const ossConfig = JSON.parse(fs.readFileSync(opts.config).toString());

  // TODO: add ignore config
  if (fs.existsSync(opts.ignore)) {
    log(chalk.green(`🙈  Using custom ignore file.`));
  }

  if (opts.force) {
    isForce = true;
    log(chalk.yellow('🚨  You are force uploading.'));
  }

  const ignoreArr = fs.readFileSync(opts.ignore).toString().split('\n');
  ig.add(ignoreArr);

  return {
    isForce,
    ossConfig
  }
}

const uploadToOSS = (ossConfig, files) => {
  const client = new OSS(ossConfig);
  client.push()
}

const readDirRecursively = (dirPath, ig) => {
  let files = [];
  // console.log(chalk.yellow(`Reading ${dirPath}`));
  fs.readdirSync(dirPath).forEach(file => {
    let fullPath = `${dirPath}/${file}`;
    let filename = fullPath.split('/').slice(-1)[0];
    // console.log(`fullpath: ${fullPath}`);
    if (!ig.ignores(filename)) {
      // console.log(`filename: ${filename}`);
      if (fs.lstatSync(fullPath).isDirectory()) {
        files = files.concat(readDirRecursively(fullPath, ig));
      } else if (fs.lstatSync(fullPath).isFile()) {
        files.push(fullPath);
      }
    } else {
      console.log(`Ignores ${filename}`);
    }
  });

  return files;
}

const upload = (opts) => {
  const ig = ignore();
  const { isForce, ossConfig } = validateOpts(opts, ig);
  const files =  readDirRecursively(cwd, ig);

}



module.exports = upload;
