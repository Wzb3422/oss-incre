const sade = require('sade');
const upload = require('./upload');

const prog = sade('oss-incre');
const version = '0.0.1';


prog.version(`v${version}. CopyRight © 2020-present Zachary Wu.`)
    .describe(`oss-incre v${version}. CopyRight © 2020-present Zachary Wu.`);

prog.command('upload')
    .describe('Upload files. Incrementally by default.')
    .option('-c, --config', 'Specify configuration file.', '.ossconfig')
    .option('-i, --ignore', 'Specify ignore file.', '.ossignore')
    .option('-f, --force', 'Force upload all files.', false)
    .action(opts => {
        upload(opts);
    });

prog.parse(process.argv);
