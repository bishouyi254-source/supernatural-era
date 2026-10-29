# 厉鬼制作：20分钟自动化（安全草稿）

## 状态（2026-10-29）
这是**待审核部署配置**，不是已运行的 Codex 定时实装。GitHub Actions 的 `schedule` 只在**默认分支**上的工作流生效；当前文件仅在 `automation/ghosts-20m-setup` 草稿分支，因此合并此配置之前不会定时执行。

流程：每20分钟检查 → 存在下一批人工授权且没有同批待审PR → 使用私有完整开发仓库中权威GDD和测试 → Codex按本文件夹的静态策划边界设计、实装 → 全量Node通过 → 仅创建 **私有开发仓库的草稿PR** → 等人工验收。一个批次执行一次；失败后默认不自动付费重试。**任何时候均不得自动改本公开正式 `main` 的游戏源码或发布GitHub Pages。**

## 当前队列
1. **G1-C**：009鬼火、010鬼风、011鬼压人（首次）。
2. 后续批次只能在上一批验收后，另行明确指定下一批的静态规则和 `GHOST_AUTODEV_STAGE`，不能凭空编写尚未确认的规则。

## 需要你在GitHub中手动完成的前置
1. 将本配置PR审核后合并到公开仓库默认分支，才会激活 `*/20 * * * *` 的GitHub时钟（GitHub可能延迟投递）。
2. 在 **Settings → Secrets and variables → Actions** 设置：
   - Variables: `GHOST_AUTODEV_ENABLED=true`、`GHOST_AUTODEV_STAGE=g1-c`、`GHOST_DEV_REPO=owner/private-dev-repo`。
   - Secrets: `OPENAI_API_KEY`（有计费的OpenAI API密钥，不是ChatGPT订阅）、`GHOST_DEV_REPO_TOKEN`（对专用私有开发仓库有读取源码、提交分支和创建PR权限的最小权限令牌）。
   - 不要把API密钥/GDD/老存档放进公开Issue、这个公开仓库或PR。
3. 私有开发仓库必须有完整的 `gdd-reference/`（访问受控）与 `tests/*.test.mjs`，并有实际可运行的Node工程；仅公开Pages源码不足以完成自动化实装与验收。
4. 确认私有开发仓库的 **main** 是可信开发基线，开好只允许审查合并的分支保护。自动 PR 不能直接推到正式线上。
5. 为本仓库 Issue #1 建立并添加 `ready-for-codex` 标签，作为**一次性手动授权**；执行前流程会先移除此标签，防止20分钟重复收费。未贴标签时只进行不付费的状态检查。
6. 对G1-C候选PR审核通过后，再定义下一批、调整静态规则并重新添加授权标签。

## 核验/约束
- 部署前检查 `.github/workflows/ghost-dev-20m.yml` 和 `CODEX_INSTRUCTIONS.md`；首次建议手工用 `workflow_dispatch` 验证门控及私有仓库权限。
- 如尚未满足前置条件，定时触发只显示跳过，不会调用Codex、不创建PR、不报告伪造验收。
- Codex 仅能读写私有开发工作区，不自动合并、不自动发布。GitHub Actions上限/费用与模型API费用需由你自行设置预算。
- GitHub Actions 每20分钟是**尝试调度**，不是保证精确执行间隔，更不保证20分钟内完成一只厉鬼。

## 对 ChatGPT 与 Codex 的准确描述
此配置由当前 ChatGPT 对话制定并供你审核，自动运行时实际执行的是**GitHub Actions里的Codex**，并不唤醒当前聊天作为持续在线策划代理。每批的策划规则由事先批准的静态指令提供；要让 ChatGPT 在每一批自动独立策划，需要另外接入受控的模型调用和审批工作流，不可假称已经实现。
