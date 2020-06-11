const OSS = require('ali-oss');
const chalk = require('chalk');
const ignore = require('ignore');
const fs = require('fs');
const md5File = require('md5-file');
const path = require('path');
const cliProgress = require('cli-progress');

const log = console.log;
const cwd = process.cwd();

const parseOpts = (opts, ig) => {
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
    log(chalk.yellowBright(`🙈  Using custom ignore file.`));
  }

  if (opts.force) {
    forceUploadAll = true;
    console.log(chalk.yellow('🚨  You are force uploading.'));
  }

  const ignoreArr = fs.readFileSync(opts.ignore).toString().split('\n');
  ig.add(ignoreArr);

  return {
    forceUploadAll,
    ossConfig,
    dirPath
  }
}


const uploadToOSS = async (client, fileMap) => {
  console.log(chalk.green(`Start uploading...`));
  let total = Object.keys(fileMap).length;
  let uploadedCount = 0;
  let bar = new cliProgress.Bar();
  bar.start(total, 0);
  try {
    for (let file in fileMap) {
      await client.put(fileMap[file], file);
      uploadedCount++;
      bar.update(uploadedCount);
    }
  } catch (e) {
    throw new Error(e);
  }
  bar.stop();
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
      console.log(`🙈  Ignores ${filename}`);
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
  if (lastHashJSON === '{}') {
    console.log(chalk.yellow(`🔍  No hash record found, seems like your first oss-incre upload.`))
  }
  const modified = [];
  const created = [];
  const current = JSON.parse(newHashJSON);
  const last = JSON.parse(lastHashJSON);
  Object.keys(current).forEach(path => {
    if (!(path in last)) {
      created.push(path);
      delete current[path];
    } else {
      if (!(current[path] === last[path])) {
        log(`${path}, changed`);
        modified.push(path);
      }
      delete last[path];
      delete current[path];
    }
  })
  const deleted = Object.keys(last);

  return { created, deleted, modified }
}

function showChanges(changeList) {
  let hasChange = false;
  for (let type in changeList) {
    if (changeList[type].length > 0) {
      hasChange = true;
      console.log(chalk.yellow(`${type} ${changeList[type].length} files.}`));
    }
  }
  !hasChange && console.log(chalk.yellow(`👀  No changes found. Nothing to upload.`))
}

const upload = async opts => {
  const ig = ignore();
  const { forceUploadAll, ossConfig, dirPath } = parseOpts(opts, ig);
  const client = new OSS(ossConfig);

  console.log(chalk.green(`💡  ${dirPath} ---> oss://${ossConfig.bucket}`));
  console.log(chalk.green(`🤔  Analysing changes ...\n`));

  let localFiles =  readDirRecursively(dirPath, ig);
  const hashJSON = JSON.stringify(await createHashJSON(localFiles));

  if (!forceUploadAll) {
    console.log(`🚚  Fetching last hash record...`);

    let lastHashJSON = (await client.get('.fileHash.json').catch(e => {throw chalk.red('Failed to fetch .fileHash.json')})).content.toString();

    const changeList = getFileChanges(hashJSON, lastHashJSON);

    showChanges(changeList);

    const uploadList = [...changeList.created, ...changeList.modified];
    const fileMap = genFileMap(uploadList, dirPath);
    if (Object.keys(fileMap).length > 0) {
      await uploadToOSS(client, fileMap);
    }
  } else {
    await uploadToOSS(client, genFileMap(localFiles, dirPath));
  }
  await client.put('.fileHash.json', Buffer.from(hashJSON)).catch(e => {throw chalk.red('Upload .fileHash.json failed')});
}

module.exports = upload;
