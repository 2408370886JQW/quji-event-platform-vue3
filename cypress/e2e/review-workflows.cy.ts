/// <reference types="cypress" />

const organizerSession = {
  token: 'cypress-organizer-token',
  user: {
    id: 'org-xinghe-001',
    name: '林洁',
    role: 'organizer',
    roleName: '主办方活动运营人员',
    organization: '新疆星河文化传媒有限公司',
  },
}

const platformSession = {
  token: 'cypress-platform-token',
  user: {
    id: 'platform-reviewer',
    name: '周可',
    role: 'platform',
    roleName: '平台运营人员',
    organization: '趣集平台运营中心',
  },
}

function useSession(win: Window, session: typeof organizerSession | typeof platformSession) {
  win.localStorage.setItem('quji_session', JSON.stringify(session))
  win.localStorage.setItem('quji_token', session.token)
}

function submittedOnboardingState() {
  const requiredKeys = [
    'business_license',
    'legal_representative_id_front',
    'legal_representative_id_back',
    'agent_authorization',
    'safety_manager',
  ]
  const names: Record<string, string> = {
    business_license: '营业执照或主体登记证明',
    legal_representative_id_front: '法定代表人身份证正面',
    legal_representative_id_back: '法定代表人身份证反面',
    agent_authorization: '经办授权书',
    safety_manager: '主体安全责任人',
  }
  return {
    organizerId: 'org-xinghe-001',
    identity: {
      phone: '13800138000',
      name: '测试经办人',
      idNumber: '110101199001011234',
      organizationName: '测试文化活动有限公司',
      agentIdentity: 'authorized_agent',
      authorizationConfirmed: true,
    },
    subjectProfile: {
      organizationName: '测试文化活动有限公司',
      unifiedSocialCreditCode: '91650100MA7QJ2026X',
      legalRepresentativeName: '张明',
      establishedAt: '2023-06-18',
      businessTerm: '2023-06-18 至长期',
      registeredAddress: '新疆乌鲁木齐市水磨沟区会展大道 88 号',
      confidence: 0.98,
      recognizedAt: '2026-09-24 10:38',
      source: 'license_recognition',
      confirmed: true,
    },
    status: 'submitted',
    submittedAt: '2026-09-24T02:38:00.000Z',
    materials: [
      ...requiredKeys.map((key) => ({
        key,
        name: names[key],
        required: true,
        conditional: key === 'agent_authorization',
        status: 'under_review',
        fileName: `${key}.webp`,
        fileType: 'image/webp',
        previewUrl:
          key === 'legal_representative_id_back'
            ? '/materials/quji-public-identity-back-sample.webp'
            : '/materials/quji-public-identity-sample.webp',
        isImage: true,
        source: 'upload',
      })),
      {
        key: 'business_permit',
        name: '经营性业务相关许可',
        required: false,
        conditional: true,
        status: 'not_uploaded',
      },
    ],
  }
}

describe('平台主体材料逐项审核', () => {
  it('逐项通过全部必填材料后才能完成主体总审', () => {
    cy.visit('/admissions', {
      onBeforeLoad(win) {
        win.localStorage.clear()
        useSession(win, platformSession)
        win.localStorage.setItem('quji_onboarding_state', JSON.stringify(submittedOnboardingState()))
      },
    })

    cy.get('[data-cy="finalize-onboarding-review"]').should('be.disabled')
    for (const name of [
      '营业执照或主体登记证明',
      '法定代表人身份证正面',
      '法定代表人身份证反面',
      '经办授权书',
      '主体安全责任人',
    ]) {
      cy.contains('tr', name).contains('button', '通过').click()
      cy.contains('.el-dialog', '确认该项材料通过').contains('button', '确认通过').click()
    }
    cy.contains('逐项已通过').parent().contains('5')
    cy.get('[data-cy="finalize-onboarding-review"]').should('not.be.disabled').click()
    cy.contains('审核通过')
  })
})

describe('角色实名服装道具双层审核', () => {
  it('主办方初审后平台继续复核同一条用户端记录', () => {
    cy.visit('/costumes', {
      onBeforeLoad(win) {
        win.localStorage.clear()
        useSession(win, organizerSession)
      },
    })

    cy.contains('tr', '何晓晨').contains('button', '查看详情').click()
    cy.contains('button', '主办方初审通过').click()
    cy.contains('tr', '何晓晨').contains('待平台复核')

    cy.window().then((win) => useSession(win, platformSession))
    cy.reload()
    cy.contains('当前审核层级：平台复核')
    cy.contains('tr', '何晓晨').contains('button', '查看详情').click()
    cy.contains('button', '平台复核通过').click()
    cy.contains('tr', '何晓晨').contains('双层审核通过')
  })

  it('相似一键审核只处理低风险完整记录', () => {
    cy.visit('/costumes', {
      onBeforeLoad(win) {
        win.localStorage.clear()
        useSession(win, organizerSession)
      },
    })

    cy.get('[data-cy="batch-similar-review"]').should('contain', '2').click()
    cy.contains('高关注与协同核验记录已自动排除')
    cy.contains('button', '确认审核 2 条').click()
    cy.contains('一键审核已完成')
    cy.contains('tr', '李思远').contains('协同核验')
    cy.contains('tr', '何晓晨').contains('待平台复核')
    cy.contains('tr', '王雨桐').contains('待平台复核')
  })
})
