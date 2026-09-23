# 身份与经办授权材料公开样例记录

## 结论

身份材料应拆分为“法定代表人身份证正面”和“法定代表人身份证反面”两个独立必传项。只有首次入驻实名身份为“被授权经办人”时，才额外要求上传“经办授权书”；法定代表人本人办理时不要求授权书。

## 公开样例

| 材料                 | 来源                                                           | 本地资源                                           | 使用边界                                                         |
| -------------------- | -------------------------------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------- |
| 法定代表人身份证正面 | Wikimedia Commons 中华人民共和国居民身份证 SAMPLE，CC0         | `/materials/quji-public-identity-sample.webp`      | 无真实姓名、身份证号和人像，仅用于说明版式                       |
| 法定代表人身份证反面 | Wikimedia Commons 同一正反面 SAMPLE 文件，确定性裁剪其背面区域 | `/materials/quji-public-identity-back-sample.webp` | 保留 SAMPLE 标记，仅用于说明国徽面和有效期版式                   |
| 经办授权书           | 湖北鹤峰县人民政府公开 PDF《法人授权委托书》附件 2             | `/materials/quji-public-authorization-sample.webp` | 空白模板，仅用于说明经办授权材料应包含的字段，不作为法律文书模板 |

## UI 约束

身份证正反面须在同一“法定代表人身份证明”材料组中以 01 / 02 两个上传位呈现。经办授权书作为 03 条件上传位，仅在“被授权经办人办理”时显示并计入必填完成数。移动端三个上传位均改为单列，不允许横向挤压或逐字断行。

## 原始来源 URL

- Wikimedia Commons 正反面组合 SAMPLE：`https://commons.wikimedia.org/wiki/File:The_People%27s_Republic_of_China_resident_identity_card_(SAMPLE).png`
- Wikimedia Commons 正面 SAMPLE：`https://commons.wikimedia.org/wiki/File:The_People%27s_Republic_of_China_resident_identity_card_(SAMPLE)_front.png`
- 湖北鹤峰县人民政府《附件2. 法人授权委托书》PDF：`https://www.hbhr.gov.cn/ztzl/yhyshj/202310/P020231024318362822412.pdf`
- 武汉市司法局《授权委托书》公开模板说明：`https://sfj.wuhan.gov.cn/ggfv/lsls/flwsfb/xzflwsl/202102/t20210203_2536209.shtml`
