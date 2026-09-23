# API 对接契约（建议版本 v1）

所有接口建议返回：

```json
{ "code": 0, "message": "ok", "data": {} }
```

## 认证与会话

| 方法 | 路径           | 请求                          | 响应 data                      |
| ---- | -------------- | ----------------------------- | ------------------------------ |
| POST | `/auth/login`  | `account`, `password`, `role` | `token`, `user`                |
| GET  | `/auth/me`     | Bearer Token                  | 当前用户、角色、权限、活动范围 |
| POST | `/auth/logout` | Bearer Token                  | 空对象                         |

## 主办方首次入驻与审核

> 当前 Vue 原型以 `src/stores/onboarding.ts` 作为 localStorage 前端状态适配层；以下是接入后端时应替换的建议契约，而非已存在的服务端能力。涉及身份证、手机号和材料原件时，响应应做最小字段投影、脱敏及审计。

| 方法 | 路径                                        | 请求 / 用途                                    | 响应 data                   |
| ---- | ------------------------------------------- | ---------------------------------------------- | --------------------------- |
| POST | `/auth/organizer-register`                  | `phone`, `verificationCode`；首次手机号注册    | `organizerId`、可选临时会话 |
| PUT  | `/organizers/:id/onboarding/identity`       | 姓名、身份证号、办理身份、信息真实性确认       | 最新 `OnboardingState`      |
| GET  | `/organizers/:id/onboarding`                | 获取主办方入驻进度与材料元数据                 | `OnboardingState`           |
| PUT  | `/organizers/:id/onboarding/materials/:key` | 文件完成后的 `fileId`、文件名、类型、版本信息  | 最新 `OnboardingState`      |
| POST | `/organizers/:id/onboarding/submit`         | 提交全部必填材料审核                           | 最新 `OnboardingState`      |
| GET  | `/platform/onboarding`                      | 平台按状态、时间分页查询待审核申请             | 申请列表及摘要              |
| POST | `/platform/onboarding/:id/review`           | `action: approve / request_changes`、`comment` | 最新 `OnboardingState`      |

建议服务端枚举：`not_started`、`identity_completed`、`materials_draft`、`submitted`、`changes_required`、`approved`。材料键至少包含 `business_license`、`legal_representative_id_front`、`legal_representative_id_back`、`agent_authorization`、`safety_manager`、`business_permit`。其中身份证正面和反面始终分别必传；`agentIdentity=authorized_agent` 时 `agent_authorization` 必传，`agentIdentity=legal_representative` 时不要求。材料应包含 `key`、`required`、`status`、`fileId`、`fileName`、可控时效的预览 URL、审核意见、版本与更新时间；原件下载必须独立授权。

## 工作台与活动

| 方法  | 路径                         | 用途                                   |
| ----- | ---------------------------- | -------------------------------------- |
| GET   | `/dashboard`                 | 近期活动、待办、异常、指标             |
| GET   | `/activities`                | 分页活动列表，支持阶段/主办方/时间筛选 |
| POST  | `/activities`                | 创建活动                               |
| GET   | `/activities/:id`            | 活动概况、生命周期、汇总数据           |
| PATCH | `/activities/:id`            | 更新活动基础信息                       |
| GET   | `/activities/:id/audit-logs` | 活动操作记录                           |

## 材料与主体档案

| 方法       | 路径                        | 用途                                |
| ---------- | --------------------------- | ----------------------------------- |
| GET / POST | `/organizers/:id/materials` | 主办方主体材料列表 / 新版本上传记录 |
| GET / POST | `/activities/:id/materials` | 单场活动材料列表 / 新版本上传记录   |
| POST       | `/files/presign`            | 申请直传文件的签名 URL              |
| POST       | `/files/complete`           | 确认上传并取得 fileId               |
| GET        | `/activities/:id/filing`    | 活动备案基础信息                    |
| PATCH      | `/activities/:id/filing`    | 保存备案基础信息                    |

## 票务、人员与现场

| 方法        | 路径                              | 用途                                     |
| ----------- | --------------------------------- | ---------------------------------------- |
| GET / POST  | `/activities/:id/ticket-types`    | 票种、票价、库存与上下架                 |
| GET         | `/activities/:id/orders`          | 订单、实名、退款与电子票列表             |
| POST        | `/activities/:id/check-in`        | 二维码核验，返回核验结果与异常码         |
| GET         | `/activities/:id/onsite-metrics`  | 实时已入场、场内人数、进场速度、异常数据 |
| GET / PATCH | `/activities/:id/cos-submissions` | 角色服装道具提报与处理结果               |

## 错误码建议

| code | 含义         | 前端处理                         |
| ---- | ------------ | -------------------------------- |
| 0    | 成功         | 更新当前数据                     |
| 401  | 会话失效     | 清空会话并跳转登录页             |
| 403  | 无权限       | 展示无权访问状态，不泄露对象详情 |
| 409  | 版本冲突     | 提示刷新后重新编辑               |
| 422  | 字段校验失败 | 在表单对应字段展示后端信息       |
| 429  | 操作频率过高 | 提示稍后重试                     |

> 敏感数据接口应在后端应用最小字段投影、脱敏策略与操作审计；前端不应依赖“隐藏按钮”实现权限控制。
