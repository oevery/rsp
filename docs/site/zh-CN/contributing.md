# 维护指南

通过 `mise exec --` 运行仓库命令。[测试指南](https://github.com/oevery/rsp/blob/main/tests/README.md)负责工具准备、离线缓存，以及代码、安装包和 Skill 验证。安装与发布使用 `package.json` 中的身份；维护工具不会改变消费者的 Node.js 要求。

## 检查与工作流入口

`.github/xova.json` 统一声明命令、安装和 Cloudflare 设置。三个事件入口通过五处引用调用 Xova Actions，全部固定到远端 CI 已通过的同一个工具库完整 SHA。RSP 保留 CLI、安装包、Skill 资源、安全、文档和离线原生任务检查；工具库负责来源门禁、打包发布、文档产物与恢复编排。

| 入口 | 触发方式 | 行为 |
| --- | --- | --- |
| CI | main 推送、拉取请求或手动运行 | 在同一 SHA 上并行运行 code、docs。普通纯文档改动的代码路径执行 lint 与接线测试；docs 始终检查、构建网站并保存产物，不发布或部署。 |
| Publish | GitHub Release 发布事件，或在已有标签手动运行 | 对最终标签来源执行全部产品检查，再构建文档、验证并发布同一个 tarball。 |
| Recover documentation | 在已确认的稳定发布标签手动运行 | 从已确认发布的来源重新构建并恢复 Cloudflare 文档，不发布 npm。 |

`release:check` 构建 CLI，检查类型和 lint，运行代码与安装包测试，校验原生任务 schema，扫描 Skill 安全并检查文档。Schema 校验离线执行，不启动容器、智能体或评判模型。CI 通过 `RSP_INSTALL_ALLOW_NETWORK=1` 明确允许临时 npm 消费项目联网安装；本地检查默认使用离线缓存。这个开关不授予模型执行或发布权限。

setup.cache 选择以 pnpm-lock.yaml 区分的 pnpm/npm 下载缓存，以及以 tests/skills/uv.lock 区分的 uv 下载缓存；docs.cache 只选择 pnpm。命中与未命中均执行锁定安装及检查。安装包消费项目接受显式 npm_config_cache 或 NPM_CONFIG_CACHE，未指定时保留 .cache/rsp-package-install。指定 tarball 与缓存回归复用一份归档，通过一次成功验证预热默认缓存，再离线拒绝由两种变量分别选择的空缓存。每次安装尝试都使用全新的消费项目，成功验证和冷缓存反例结束后均核对归档字节不变。本次候选验收不复用已安装的消费项目、虚拟环境、测试结果或发布回执。

安装锁定依赖后，可运行以下本地检查：

```sh
mise exec -- pnpm release:check
mise exec -- pnpm docs:build
mise exec -- pnpm test:pack
```

`test:pack` 需要已构建的 CLI 产物。未提供 `TARBALL` 时用 npm 打包一次；提供绝对路径 `TARBALL` 时直接消费该归档，检查分发文件、安装后 CLI 行为、Skill 资源、定制内容保护和项目更新，不重新打包候选。修改锁文件后，还应在全新检出中验证冻结安装与检查；已有 `node_modules` 可能掩盖不完整的依赖图。

子进程超时或被信号终止时，安装包校验必须失败；即使命令本来应当拒绝无效输入，也不能将这种异常当作正常拒绝。

## 最终候选与发布

### 原生 release-it 入口

`.release-it.json` 是唯一的本地发布配置。锁定的 release-it 21.1.1 与官方
Conventional Changelog 插件 12.0.2 负责更新选定版本和 `CHANGELOG.md`。
维护工具需要 Node ^22.22.2、^24.15.0 或 >=26；已发布 CLI 的 Node 要求不变。

`CHANGELOG.md` 是唯一的版本记录来源，文档站的[变更日志页](./changelog.md)
直接引用这份文件。GitHub Release 使用插件生成的当前版本 changelog，
标题为与标签一致的 `v<version>`。升级步骤、兼容性和验证限制由迁移指南承载；
审阅自动生成的破坏性变更说明时，核对它们与迁移指南一致。

先提交已审阅的源码、发布工具和迁移指南，包版本与下一个 CHANGELOG 条目
留给 release-it 更新。然后从配置了 upstream 的干净 `main` 预览目标版本：

将 `<version>` 替换为明确选定的目标版本，例如 `4.0.0`。

```sh
RSP_RELEASE_VERSION='<version>'
mise exec -- pnpm release "$RSP_RELEASE_VERSION" --dry-run
```

仅在明确获得提交、标签、推送和发布授权后，才去掉 `--dry-run`。
显式版本参数选择发布目标。原生 release-it 更新包版本与 CHANGELOG，
提交这些改动后，再创建标签、推送及 GitHub Release。
本地关闭 npm 发布，继续由现有 Publish 工作流发布 npm 并部署稳定版文档。
自动创建 GitHub Release 需要具有适当仓库权限的 `GITHUB_TOKEN`；未提供时，
原生 release-it 会提供浏览器流程。

生成新条目时保留已有历史记录。dry-run 跳过写操作及普通 hooks，
只是预览，不是测试证据。

运行 release-it 前，先准备必要的迁移材料。在隔离候选中验证目标版本，不提前提交自动生成的发布改动。候选可以包含必要的代码和文档，不要求只改版本。普通 CI 优化、发布提交标题或父提交 CI 成功，都不能免除最终候选的产品检查。

在隔离 checkout 中，用已填充的 pnpm store 执行
`mise exec -- pnpm install --offline --frozen-lockfile`，建立该 checkout 自己的依赖目录。
复用下载缓存，不将 `node_modules` 软链接到其他 checkout。若 store 不完整，
报告缺失缓存，仅在获得网络安装授权后补齐。

Publish 将已检查的来源 SHA 交给共享发布工作流。来源门禁绑定原生事件、标签、包版本、仓库和已检查提交。同一 SHA 的产品检查通过后，发布器运行 `pnpm build`，关闭 npm 生命周期脚本后打包，将绝对归档路径交给 `test:pack`，再核对来源和 tarball 字节，最终通过锁定的 release-it 21.1.1 npm 发布器发布这些相同字节。共享发布配置关闭项目 hooks 和 Git/GitHub/GitLab 交付；`prepublishOnly` 继续为普通手动 npm 发布提供独立门禁。共享流程不会通过包生命周期脚本重复运行产品检查。

npm Trusted Publishing 需要配置仓库 `oevery/rsp`、工作流 `publish.yml` 和环境 `npm-publish`；`package.json.repository` 必须与该身份一致。为 `npm-publish` 和 `docs-production` 环境配置适当的审批及 `v*` 标签限制。Cloudflare 部署需要 `CLOUDFLARE_API_TOKEN` 和 `CLOUDFLARE_ACCOUNT_ID`，可由文档环境提供，或由薄入口转发仓库 Secrets。代码和文档检查均不接收部署凭据或写权限。

只有稳定 GitHub Release 事件会在 npm 成功后请求部署文档；手动发布不部署。发布与恢复共享 `docs-production` 环境、并发组和 `latest-stable` 策略，策略在部署门禁内判断。现有 `wrangler.jsonc` 决定 Worker 和资源目录。本地 `docs:deploy` 仍是维护者直接部署入口，需要单独授权。

## npm 成功后的恢复

共享发布器仅在 npm 确认成功后生成摘要和 `publication-result.json` 产物，记录来源 SHA、发布标签、版本和 tarball SHA-256。如果 npm 成功后产物记录失败，应先核对 npm job、注册表与 provenance；缺少产物不是重新发布的理由。

若仅文档失败，先确认 npm 版本与来源，再在同一个稳定发布标签手动运行 `docs-recover.yml`，填写 `release-tag` 和准确的 `published-sha`。该来源必须包含这些工作流和 `.github/xova.json`。恢复复用同一文档检查与构建路径，恢复已验证的产物，并执行相同的最新稳定版本部署策略；没有 npm 发布路径或 npm OIDC 权限。保留成功发布的证据和失败部署记录。

本地检查与工具库 CI 只证明各自实际覆盖的边界。消费者仓库的托管 CI、npm OIDC、发布以及 Cloudflare 恢复部署，都需要各自的证据和授权。
