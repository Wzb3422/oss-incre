const OSS = require('ali-oss');
const chalk = require('chalk');
const ignore = require('ignore');
const fs = require('fs');
const xxhash = require('xxhash');

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

const uploadToOSS = async (ossConfig, files) => {
  const client = new OSS(ossConfig);
  try {
    for (let file of files) {
      await client.put(file, file);
    }
  } catch (e) {
    throw new Error(e);
  }
}

const readDirRecursively = (dirPath, ig) => {
  let files = [];
  const currentDir =cwd.split('/').slice(-1)[0]

  fs.readdirSync(dirPath).forEach(file => {

    let fullPath = `${dirPath}/${file}`;
    let filename = fullPath.split('/').slice(-1)[0];

    if (!ig.ignores(filename)) {
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

const fileHash = async (file) => {
  return new Promise((resolve, reject) => {
    let rs = fs.createReadStream(file);
    let hash = xxhash.h
  });
}

const generateFilesHashJSON = () => {

}

const getCreatedfiles = () => {

}

const upload = (opts) => {
  const ig = ignore();
  const { isForce, ossConfig } = validateOpts(opts, ig);
  let files =  readDirRecursively('.', ig);

  // convert to absolute oss path
  files = files.map(item => item.split('').slice(2).join(''));

  if (isForce) {

  } else {
    uploadToOSS(ossConfig, files);
  }
}



module.exports = upload;
