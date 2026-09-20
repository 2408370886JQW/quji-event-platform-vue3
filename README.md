# 趣集文化活动协同管理平台（Vue 3）

这是一个基于 **Vue 3、TypeScript、Pinia、Element Plus 与 Vite** 的文化活动协同后台前端。项目保留预置账号登录，同时提供主办方首次入驻、主体材料审核和审核后活动创建的可操作前端状态机。

## 本地运行

```bash
pnpm install
pnpm dev
```

常用质量检查：

```bash
pnpm format
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## 验证入口与角色

登录页中的预置账号为 `linjie@quji.cn` / `123456`。选择“主办方活动运营人员”可体验已有账号流程，选择“平台运营人员”可进入入驻审核；“文旅业务指导人员”仅可只读查看主体档案。

没有主办方账号时，点击登录页的 **首次入驻注册**：当前验证码为 `246810`。完成手机号与实名信息后会建立 organizer 会话并进入 `/onboarding`。

## 入驻状态机与本地持久化

`src/stores/onboarding.ts` 是明确的**前端状态适配层**，并不表示后端接口已经存在。状态以 `quji_onboarding_state` 键保存到浏览器 `localStorage`，支持：

`not_started` → `identity_completed` → `materials_draft` → `submitted` → `changes_required` / `approved`

主办方可逐项上传营业执照、经办人身份证明或授权材料，直接填写安全责任人信息并生成信息表；经营性业务许可按活动性质选填。平台在 `/admissions` 查看同一份实名与材料记录，可退回补充或审核通过；审核通过后 `/activities/new` 才允许创建活动。创建向导将结果保存为 `quji_local_activity_draft`。

三类证照预览采用政府网站公开样例并加注“非真实证照”水印，来源和使用边界见 [`docs/PUBLIC_DOCUMENT_SOURCES.md`](docs/PUBLIC_DOCUMENT_SOURCES.md)。

未来后端替换点定义在 `src/api/onboarding.ts`，请求和响应的建议契约见 [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md)。生产环境应由后端负责身份核验、文件存储、权限校验、审核审计和敏感信息脱敏，前端不应以隐藏按钮代替授权控制。

## 路由

| 路径                 | 使用角色                       | 说明                     |
| -------------------- | ------------------------------ | ------------------------ |
| `/register`          | 公开                           | 主办方首次入驻注册       |
| `/onboarding`        | organizer                      | 入驻与认证、主体材料提交 |
| `/admissions`        | platform                       | 平台入驻审核             |
| `/activities/new`    | organizer（审核通过后）        | 活动创建向导             |
| `/organizer-profile` | organizer / platform / culture | 主体档案；culture 只读   |

## 测试

`src/stores/onboarding.test.ts` 覆盖必填材料不齐不能提交、提交进入审核、审核通过才允许创建活动，以及退回补充意见写入状态等状态机行为。
