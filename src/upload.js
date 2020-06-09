const OSS = require('ali-oss');
const chalk = require('chalk');
const ignore = require('ignore');
const fs = require('fs');
const md5File = require('md5-file');
const path = require('path');
const Stream = require('stream');

const log = console.log;
const cwd = process.cwd();

const validateOpts = (opts, ig) => {
  // default values
  let forceUploadAll = false;
  let dirPath = cwd;
  if (opts.path !== '.') {
    dirPath = path.resolve(cwd, opts.path);
  }

  if (!fs.existsSync(opts.config)) throw `Configuration file ${opts.config} NOT FOUND`;
  const ossConfig = JSON.parse(fs.readFileSync(opts.config).toString());

  // TODO: add ignore config
  if (fs.existsSync(opts.ignore)) {
    log(chalk.yellowBright(`🙈  Using custom ignore file.\n`));
  }

  if (opts.force) {
    forceUploadAll = true;
    log(chalk.yellow('🚨  You are force uploading.'));
  }

  const ignoreArr = fs.readFileSync(opts.ignore).toString().split('\n');
  ig.add(ignoreArr);

  return {
    forceUploadAll,
    ossConfig,
    dirPath
  }
}


const uploadToOSS = async (client, localFiles) => {
  try {
    for (let file of localFiles) {
      await client.put(file, file);
    }
    // await client.put('.ossHash', hashJSON)
  } catch (e) {
    throw new Error(e);
  }
}

const pathEnd = path => path.split('/').slice(-1)[0]

function readDirRecursively (dirPath, ig) {
  let files = [];

  if (!fs.existsSync(dirPath)) throw `No such directory ${dirPath}.`

  fs.readdirSync(dirPath).forEach(file => {

    let fullPath = path.join(dirPath, file);
    let filename = pathEnd(fullPath);

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


async function createHashJSON(files) {
  const tmp = {};
  for (let file of files) {
    tmp[file] = md5File.sync(file);
  }
  return tmp;
}

function genFileMap(localFiles, dirPath) {
  const map = {}
  localFiles.forEach(item => {
    map[item] = item.slice(dirPath.length + 1);
  })
  return map;
}

function getFileChanges(newHashJSON, lastHashJSON) {
  if (!lastHashJSON) {
    console.log(chalk.yellow(`🔍  No hash record found, seems like your first oss-incre upload.`))
  }
  const modifyList = [];
  const createList = [];
  const current = JSON.parse(newHashJSON);
  const last = JSON.parse(lastHashJSON);
  Object.keys(current).forEach(path => {
    if (!(path in last)) {
      createList.push(path);
      delete current[path];
    } else {
      if (!(current[path] === last[path])) {
        log(`${path}, changed`);
        modifyList.push(path);
      }
      delete last[path];
      delete current[path];
    }
  })
  const deleteList = Object.keys(last);
  return {createList, modifyList, deleteList}
}

const upload = async opts => {
  const ig = ignore();
  const { forceUploadAll, ossConfig, dirPath } = validateOpts(opts, ig);
  const client = new OSS(ossConfig);

  console.log(chalk.green(`💡  ${dirPath} ---> oss://${ossConfig.bucket}`));
  console.log(chalk.green(`🤔  Analysing changes ...\n`));

  let localFiles =  readDirRecursively(dirPath, ig);
  const hashJSON = JSON.stringify(await createHashJSON(localFiles));
  let lastHashJSON;
  lastHashJSON = await client.get('.filesHash.json').catch(e => lastHashJSON = '{}');
  getFileChanges(hashJSON, lastHashJSON);
  if (forceUploadAll) {
    uploadToOSS(client, genFileMap(localFiles, dirPath));
  } else {

  }
}



module.exports = upload;
