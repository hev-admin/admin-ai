# 路线图

以下是 Admin AI 框架未来计划开发的功能项。

## 前端表单验证

集成 zod + vee-validate，为所有管理页面提供统一的表单校验能力，支持实时校验和提交校验。

## Dashboard 数据可视化

在仪表盘页面集成图表库，展示系统关键指标（用户增长、操作日志统计、系统负载等）。

## 多数据库方言支持

完善 Prisma 多数据库适配，确保 MySQL、PostgreSQL、SQLite、MongoDB 均可正常运行，并提供切换文档。

## 邮件服务

实现密码重置邮件和系统通知邮件功能，支持 SMTP 配置。

## Swagger/OpenAPI 自动文档

为 Hono 后端集成 OpenAPI 规范，自动生成可交互的 API 文档。

## WebSocket 实时通知

通过 WebSocket 实现系统消息推送和在线用户状态管理。

## 通用文件管理

提供文件上传、存储、预览和管理功能，支持本地存储和对象存储。

## CI/CD 流水线

配置 GitHub Actions 流水线，实现自动化测试、构建和部署。
