const OSS = require('ali-oss');
const chalk = require('chalk');
const fs = require('fs');

const log = console.log;

const validateOpts = (opts) => {
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

  return {
    isForce,
    ossConfig
  }
}

const uploadToOSS = (ossConfig, isForce) => {
  const client = new OSS(ossConfig);
}

const upload = (opts) => {
  const { isForce, ossConfig } = validateOpts(opts);
}

module.exports = upload;
