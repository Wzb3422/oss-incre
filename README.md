# oss-incre

增量地上传文件到阿里oss。

## 环境

+ Node >= 8.0.0

## 使用


### .ossconfig

需要在你的目录下放置一个 `.ossconfig` 文件，格式如下：

```json
{
    "accessKeyId": "your-accessKeyId",
    "accessKeySecret": "your-accessKeySecret",
    "bucket": "your-bucket",
    "region": "oss-cn-shanghai"
}
```

### 开始使用

```bash
  Description
    oss-incre v0.0.1.
    CopyRight © 2020-present Zeb Wu.

  Usage
    $ oss-incre <command> [options]

  Available Commands
    upload    Upload files.

  For more info, run any command with the `--help` flag
    $ oss-incre upload --help

  Options
    -v, --version    Displays current version
    -h, --help       Displays this message
```

### License

Under MIT License @ZebWu
