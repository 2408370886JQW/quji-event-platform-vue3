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

| 方法 | 路径                                                    | 请求 / 用途                                                               | 响应 data                    |
| ---- | ------------------------------------------------------- | ------------------------------------------------------------------------- | ---------------------------- |
| POST | `/auth/organizer-register`                              | `phone`, `verificationCode`；首次手机号注册                               | `organizerId`、可选临时会话  |
| PUT  | `/organizers/:id/onboarding/identity`                   | 办理身份、本人姓名与身份证号、可选主体名称、信息真实性确认                | 最新 `OnboardingState`       |
| GET  | `/organizers/:id/onboarding`                            | 获取主办方入驻进度与材料元数据                                            | `OnboardingState`            |
| PUT  | `/organizers/:id/onboarding/materials/:key`             | 文件完成后的 `fileId`、文件名、类型、版本信息                             | 最新 `OnboardingState`       |
| POST | `/organizers/:id/onboarding/business-license/recognize` | 营业执照 `fileId`；OCR 识别主体名称、信用代码、法定代表人、日期与登记住所 | `BusinessLicenseRecognition` |
| POST | `/organizers/:id/onboarding/submit`                     | 提交全部必填材料审核                                                      | 最新 `OnboardingState`       |
| GET  | `/platform/onboarding`                                  | 平台按状态、时间分页查询待审核申请                                        | 申请列表及摘要               |
| POST | `/platform/onboarding/:id/materials/:key/review`        | 单项 `action: approve / request_changes`、`comment`                       | 最新 `OnboardingState`       |
| POST | `/platform/onboarding/:id/finalize`                     | 所有必填材料逐项通过后完成主体总审；服务端必须再次校验，不接受前端绕过    | 最新 `OnboardingState`       |

建议服务端枚举：`not_started`、`identity_completed`、`materials_draft`、`submitted`、`changes_required`、`approved`。首次使用人须在手机号验证后主动选择 `agentIdentity`，客户端和服务端均不得默认设为经办人；身份保存后再进入材料上传。身份证正反面在界面中归入同一张“法定代表人身份证”材料卡，但后端仍应以两个独立文件键保存。材料键至少包含 `business_license`、`legal_representative_id_front`、`legal_representative_id_back`、`agent_authorization`、`safety_manager`、`business_permit`。其中身份证正面和反面始终分别必传；`agentIdentity=authorized_agent` 时 `agent_authorization` 必传，`agentIdentity=legal_representative` 时不要求。

营业执照上传完成后，OCR 服务返回 `organizationName`、`unifiedSocialCreditCode`、`legalRepresentativeName`、`establishedAt`、`businessTerm`、`registeredAddress`、`confidence` 与 `recognizedAt`，前端将结果写入可核对表单并关联主体档案。真实后端应保留原始识别结果、人工修改值和操作审计，低置信度字段不得静默覆盖。平台审核采用“材料逐项审核 + 主体总审”两层控制：必填材料未全部为 `approved` 时，服务端必须拒绝主体总审；退回单项材料时，不应清除其他已通过材料的审核结论。

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

| 方法       | 路径                                                   | 用途                                                       |
| ---------- | ------------------------------------------------------ | ---------------------------------------------------------- |
| GET / POST | `/activities/:id/ticket-types`                         | 票种、票价、库存与上下架                                   |
| GET        | `/activities/:id/orders`                               | 订单、实名、退款与电子票列表                               |
| POST       | `/activities/:id/check-in`                             | 二维码核验，返回核验结果与异常码                           |
| GET        | `/activities/:id/onsite-metrics`                       | 实时已入场、场内人数、进场速度、异常数据                   |
| GET        | `/activities/:id/participant-submissions`              | 角色、服装、道具、实名、人脸和两级审核记录                 |
| POST       | `/activities/:id/participant-submissions/:sid/reviews` | 主办方初审或平台复核；`stage`、`action`、`comment`         |
| POST       | `/activities/:id/participant-submissions/batch-review` | 按明确 `submissionIds` 与 `ruleVersion` 批量审核低风险资料 |

参与者申报建议状态为 `organizer_pending`、`platform_pending`、`changes_required`、`security_review`、`approved`。服务端应强制执行“用户端提交 → 主办方初审 → 平台复核”的顺序，并保存每一步审核人、角色、时间、意见与材料版本。相似资料一键审核只能处理资料完整、实名和人脸均通过、低风险且命中当前规则版本的记录；高关注、现场协同核验和资料不完整记录必须自动排除。身份证号默认脱敏，身份证原件和人脸资料的访问应单独鉴权并完整审计。

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
