关于 M1 里程碑的分歧点（2026-07-10 评审，以下为结论与处理记录）：

1. server 端开发为什么不用 vite？
   - **结论：维持 `node --watch`，不引入 Vite，无改动。**
   - Vite 的核心价值在浏览器侧（模块图 + HMR + 转译）；server 为纯 JS ESM（全仓库不引 TS 是既有约定），Node ≥ 22 原生直跑、无转译需求。引入构建管线反而要为 better-sqlite3（原生二进制）与 Prisma 生成产物做 external 特判，且导致 dev 与 prod（`node` 直跑）行为分叉；现状 `dev` 与 `start` 运行同一份源码，一致性最高。
   - 选型理由已沉淀至 REQUIREMENTS.md §2.3「开发启动选型说明」。

2. unocss base 样式覆盖 Naive UI 默认样式的问题？
   - **结论：确认为真实问题，已修复。**
   - 根因：`@unocss/reset/tailwind.css` 中 `button, [type='button'], ... { background-color: transparent }` 与 `.n-button` 特异性相同（0,1,0），生效与否取决于样式表顺序，而 Naive UI 样式为运行时注入、顺序在 dev/HMR 下不稳定，NButton 背景会被重置（UnoCSS 官方已知问题 unocss#2127）。
   - 修复：`apps/web/src/main.js` 改用官方兼容版 `@unocss/reset/tailwind-compat.css`（与完整版唯一实质差异即注释掉该条 button 背景重置）。副作用可控：src 内无裸 `<button>`，按钮统一走 NButton；nprogress 样式为 `#nprogress` 前缀高特异性选择器，不受影响。
   - 已验证：dev server 下服务出的 reset 中该规则为注释态，页面正常加载，eslint 通过。

3. prisma 下的 migrations 是否需要排除在 git 之外？
   - **结论：不排除，migrations 目录（含 migration_lock.toml）必须提交，无改动。**
   - 迁移文件是 schema 的唯一历史真相：部署/CI 依赖 `prisma migrate deploy` 重放已提交的迁移；数据库 `_prisma_migrations` 表按「文件名 + checksum」对账，团队迁移历史必须一致；migration_lock.toml 锁定 provider。
   - 当前 .gitignore 该排除的已排除对：SQLite 数据文件（apps/server/data/）与生成的 client（apps/server/generated/）。
   - 注意点（既有约定）：将来切换 provider（SQLite → PG/MySQL）时按文档化流程重建 migrations 目录，迁移 SQL 绑定方言、不可跨库复用。

最新评审疑问（2026-07-13 评审，以下为结论与处理记录）：

1. 请对整个项目进行评估：口径为是否易于在此基座上进行扩展开发，形成评估报告，记录到二次开发报告文档中。
   - **结论：具备良好的二次开发基座条件，总评 4/5，建议作为基座采用；报告已落库 [reports/2026-07-13-secondary-development-assessment.md](./reports/2026-07-13-secondary-development-assessment.md)。**
   - 优势：后端 routes→services→repositories 硬边界分层；六条高频扩展路径（新增实体/接口、新增页面/菜单、新增语言、关系库切换、启用 Mongo、切换 UI 库）全程文档化且有仓库内范例；三个可切换耦合面均有诚实的成本模型；REQUIREMENTS/TASKS/REVIEW 决策可追溯。
   - 短板：零测试设施（最大结构性风险，双驱动契约一致性与 RBAC 回归无自动化兜底）与生产化能力缺口（结构化日志、登录防护、部署形态等），均为 §14 明示的范围裁剪。报告给出 P0–P3 分级改进建议，其中 P0（vitest + Hono `app.request()` 集成测试，先覆盖 repository 双驱动契约与三账号 RBAC 矩阵）应在业务代码大量进入前完成。
   - **整改落地（2026-07-13，同日）**：P0/P2/P3 建议已按 TASKS.md **M6 里程碑**（#36–#41）实现——node:test 测试设施（契约双实现 + RBAC 矩阵 + 键集，33 用例）、结构化日志（请求 id）、登录限流、safelist 单一来源、最小 CI；API 文档自动化（P1）经评估暂缓、Docker 与 TS 按指示排除。逐项对账与偏差说明见评估报告「六、整改落地记录」。

2. 该系统是否能作为一个整体打包成 docker 镜像？以利于更快速部署。将改进方案形成报告记录到文档中。
   - **结论：可行，推荐「单镜像 = server 同时托管 API 与 web 静态产物」形态，`docker run` 单容器即得完整系统（默认 SQLite 零外部依赖）；改进方案报告已落库 [reports/2026-07-13-docker-packaging.md](./reports/2026-07-13-docker-packaging.md)。**
   - 无架构性障碍：server 免构建直跑源码、web 纯静态产物、`/api/health` 现成健康检查、`DATABASE_URL` 已支持绝对路径（数据卷零改动）。唯一业务代码补齐是 server 静态托管 + SPA fallback（经 `WEB_DIST` 环境变量启用，约 20 行，dev 行为零变化）。
   - 关键决策：基础镜像 `node:22-bookworm-slim`（glibc 直用 better-sqlite3 预编译产物，不选 alpine）；依赖装配采用 workspace-in-image 路线（不用 `pnpm deploy`，规避 pnpm 10+ deploy 语义变更风险）；`prisma` 移入 dependencies 支持启动时 `migrate deploy`；entrypoint 仅在数据文件不存在的首次启动播种（`db:seed` 为清空重播语义，严禁每次启动执行）。报告含 Dockerfile / entrypoint / compose / .dockerignore 完整草案与落地验证清单（DoD），标注了需 Linux 实测确认点。
   - **整改落地（2026-07-13，同日）**：改进方案已按 TASKS.md **M7 里程碑**（#42–#47）实现——server 静态托管 + SPA fallback（`WEB_DIST`，7 用例）、多阶段 Dockerfile / entrypoint / .dockerignore、compose.yaml（mongo profile）、容器端到端验证（报告 §7 DoD 全项，WSL2 Ubuntu 实测通过）、部署指南（docs 新页 + README）、CI 镜像构建校验。实测偏差与修正（pnpm 11 `CI=true`、`pnpm fetch` 虚拟店清理、runtime openssl、镜像实测 1.31GB）见 TASKS.md M7 完成记录。
