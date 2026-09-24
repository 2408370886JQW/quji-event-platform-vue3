# 趣集文化活动协同管理平台（Vue 3）

这是一个基于 **Vue 3、TypeScript、Pinia、Element Plus 与 Vite** 的文化活动协同后台前端。项目保留预置账号登录，同时提供主办方首次入驻、主体材料审核和审核后活动创建的可操作前端状态机。

**当前正式版本：v1.3.3**

## 从 GitHub 使用

私有仓库的 `main` 分支就是当前可用的完整源码。开发团队获得 GitHub 仓库权限后可直接克隆：

```bash
git clone https://github.com/2408370886JQW/quji-event-platform-vue3.git
cd quji-event-platform-vue3
pnpm install
pnpm dev
```

需要生产部署时执行 `pnpm build`，生成的 `dist/` 可部署到 Nginx、对象存储或其他静态服务器。仓库已经包含全部本地图片、Lucide 图标依赖、文档、测试和 API 契约，不依赖 Manus 临时资源。

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

启动开发服务后可另开终端执行身份材料端到端回归：

```bash
pnpm test:e2e
```

## 验证入口与角色

登录页中的预置账号为 `linjie@quji.cn` / `123456`。选择“主办方活动运营人员”可体验已有账号流程，选择“平台运营人员”可进入入驻审核；“文旅业务指导人员”仅可只读查看主体档案。

没有主办方账号时，点击登录页的 **首次入驻注册**：当前验证码为 `246810`。流程依次为手机号验证、办理身份选择、本人实名信息。系统不预设办理身份；主办方主体名称可暂不填写，保存后会建立 organizer 会话并直接定位到 `/onboarding?focus=materials` 的身份证与主体材料上传区域。

## 入驻状态机与本地持久化

`src/stores/onboarding.ts` 是明确的**前端状态适配层**，并不表示后端接口已经存在。状态以 `quji_onboarding_state` 键保存到浏览器 `localStorage`，支持：

`not_started` → `identity_completed` → `materials_draft` → `submitted` → `changes_required` / `approved`

主办方只需上传一次营业执照，前端适配层会自动读取并关联主体名称、统一社会信用代码、法定代表人、成立日期、营业期限和登记住所；接入真实后端时替换为 `src/api/onboarding.ts` 中的 OCR 接口。法定代表人身份证正反面在界面中合并为同一张材料卡的两个上传位。选择“被授权经办人办理”时，系统会额外显示经办授权书并纳入必填校验；选择“法定代表人本人办理”时不要求授权书。经营性业务许可按活动性质选填。

平台在 `/admissions` 查看同一份实名、自动关联主体信息与材料记录，并对每项材料分别执行查看、通过或退回；全部必填材料逐项通过后，主体总审按钮才会解锁。退回单项材料不会清除其他已通过结论。审核通过后 `/activities/new` 才允许创建活动，创建向导将结果保存为 `quji_local_activity_draft`。

`/costumes` 使用 `src/stores/submissions.ts` 维护同一份用户端参与者提报状态，完整展示角色、服装、道具、实名、身份证、人脸比对与审核日志。状态按“用户端提交 → 主办方初审 → 平台复核 → 双层审核通过”推进；相似低风险资料可按当前审核层级一键处理，高关注、资料不完整和协同核验记录会自动排除。

证照和授权材料预览采用政府网站或 Wikimedia Commons 的公开样例，并加注“非真实证照”水印，来源和使用边界见 [`docs/PUBLIC_DOCUMENT_SOURCES.md`](docs/PUBLIC_DOCUMENT_SOURCES.md)。

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

`src/views/RegisterView.test.ts` 验证首次用户完成手机号验证后必须先主动选择办理身份，且未选择时不显示实名表单、不默认勾选经办人。`src/stores/onboarding.test.ts` 覆盖身份证正反面必须同时上传、经办授权书按办理身份条件必填、营业执照自动回填、材料逐项审核、总审门槛和单项退回。`src/stores/submissions.test.ts` 覆盖主办方初审、平台复核、实名人脸校验和相似低风险一键审核的排除规则。Cypress 用例覆盖身份前置、合并身份证卡、营业执照一次上传、主体逐项审核和参与者双层审核路径。
