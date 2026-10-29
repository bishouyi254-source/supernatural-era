# 复现工程验收

仅在 `feature/g1c-mechanics-candidate` 或其独立副本运行。不要把测试状态导入玩家正在使用的浏览器，不修改 main，不部署。

本 PR 恢复了原开发工程的 Node 回归集、其 helpers、测试脚本依赖与合成 JSON 输入。没有包含私有 GDD、真实玩家备份或普通获取剧情。

```powershell
node --version
npm run test:g1c
npm test
npm run audit:g1c
```

`audit:g1c` 从明确隔离的 typed holder 开始，执行 production `available/act/validate` 和原战斗主动条，生成 `scripts/g1c-states.json`，并在 `../../outputs/g1-c` 写出逐动作、逐场资源/复苏/负荷与停止原因。`--stress-only` 只重跑压力记录，保留已生成的浏览器输入文件。不要在浏览器验收途中重建输入文件。

另开一个终端启动开发服务器：

```powershell
$env:PORT='4353'
npm run dev
```

然后运行：

```powershell
$env:G1C_URL='http://127.0.0.1:4353'
node scripts/qa-g1c-chrome.mjs
```

浏览器脚本默认使用本次已安装的 Chrome 和 Codex bundled Playwright，可用 `CHROME_PATH`、`PLAYWRIGHT_MODULE` 改为自己的安装位置；不下载安装浏览器，不使用真实用户 profile。结果和截图保存在 `../../outputs/g1-c/browser-g1c`。三个视口是 1920×1080、1366×768、390×844；后者不是手机真机测试。

`scripts/qa-g1c.html` 是明确隔离的测试入口，复用现有战斗卡、开发档案、结算组件；专用 localStorage 键为 `G1C-PRODUCTION:state`。正常 `index.html` 不传隔离 context，必须拒绝这些持有状态。

本聊天额外执行了既有普通旧档/商场鬼血及鬼眼/双鬼浏览器回归。其原始脚本、失败日志和截图随本聊天证据包交付；其中实际旧备份只读副本不上传 GitHub，公开 checkout 无该个人备份时不能声称已复现那部分检查。重新测试前应使用自己的备份副本及独立 context。

验收结果见仓库根目录 `G1C-INTEGRATION-REPORT.md`；最终 full 日志和逐项结果在本目录。缺失 G1-C 完整权威 GDD 与正式参与者资格仍是正式验收阻断，不随测试通过自动解除。
