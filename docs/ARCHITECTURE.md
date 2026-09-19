# 前端架构说明

## 分层原则

前端按 **视图层 → 状态层 → 服务层 → 契约层** 组织。页面只负责展示和用户交互；Pinia 只管理会话与共享状态；`src/api` 是唯一网络访问入口；`src/types` 固化接口模型。该分层可避免将后端地址、字段转换、权限判断散落在组件中。

```text
Vue View
  └── Pinia Store / Composable
        └── platformApi
              └── Axios HTTP Client
                    └── Backend API
```

## 路由与权限

| 路由                 | 用途             | 典型可见角色       |
| -------------------- | ---------------- | ------------------ |
| `/workspace`         | 工作台           | 全部角色           |
| `/activities`        | 活动列表         | 平台、主办方、文旅 |
| `/activities/:id`    | 单场活动数字档案 | 按活动数据权限     |
| `/organizer-profile` | 主办方主体材料   | 主办方、平台       |
| `/tickets`           | 票务管理         | 主办方、平台、现场 |
| `/costumes`          | 角色服装道具     | 主办方、平台、文旅 |
| `/onsite`            | 现场管理         | 现场、主办方、平台 |

当前前端仅完成体验层路由守卫。生产环境应由后端返回 `permissions`、`activityScopes`、`dataMaskingPolicy`，并由接口服务执行最终授权。

## Mock 与真实 API 切换

- `VITE_DATA_SOURCE=mock`：使用 `src/mock/platform.ts`，适合演示、前端自测和页面开发。
- `VITE_DATA_SOURCE=api`：通过 `src/api/platform.ts` 请求后端。
- 后端返回需保持 `{ code, message, data }` 契约，或在 `src/api/http.ts` 统一转换。

## 数据安全边界

本工程只存放脱敏展示示例。实名身份、人脸比对、联系方式、支付流水等敏感数据不得写入浏览器持久化存储；访问、导出、下载、脱敏与审计必须在后端完成。前端仅接收显示所必需的最小字段。
