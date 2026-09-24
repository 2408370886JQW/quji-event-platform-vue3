/// <reference types="cypress" />

const session = {
  token: 'cypress-organizer-token',
  user: {
    id: 'cypress-organizer',
    name: '流程测试员',
    role: 'organizer',
    roleName: '主办方活动运营人员',
    organization: '测试主办方',
  },
}

function onboardingState(agentIdentity: 'legal_representative' | 'authorized_agent') {
  return {
    organizerId: 'cypress-organizer',
    identity: {
      phone: '13800138000',
      name: '流程测试员',
      idNumber: '110101199001011234',
      organizationName: '测试文化活动有限公司',
      agentIdentity,
      authorizationConfirmed: true,
    },
    status: 'identity_completed',
    materials: [
      { key: 'business_license', name: '营业执照或主体登记证明', required: true, status: 'not_uploaded' },
      {
        key: 'legal_representative_id_front',
        name: '法定代表人身份证正面',
        required: true,
        status: 'not_uploaded',
      },
      {
        key: 'legal_representative_id_back',
        name: '法定代表人身份证反面',
        required: true,
        status: 'not_uploaded',
      },
      {
        key: 'agent_authorization',
        name: '经办授权书',
        required: agentIdentity === 'authorized_agent',
        conditional: true,
        status: 'not_uploaded',
      },
      { key: 'safety_manager', name: '主体安全责任人', required: true, status: 'not_uploaded' },
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

function visitOnboarding(agentIdentity: 'legal_representative' | 'authorized_agent') {
  cy.visit('/onboarding', {
    onBeforeLoad(win) {
      win.localStorage.setItem('quji_session', JSON.stringify(session))
      win.localStorage.setItem('quji_token', session.token)
      win.localStorage.setItem('quji_onboarding_state', JSON.stringify(onboardingState(agentIdentity)))
    },
  })
}

describe('首次入驻身份选择', () => {
  it('不预设经办人并在保存后直接进入对应材料清单', () => {
    cy.visit('/register', {
      onBeforeLoad(win) {
        win.localStorage.clear()
      },
    })

    cy.get('input[placeholder="请输入常用手机号"]').type('13800138000')
    cy.get('input[placeholder="请输入验证码"]').type('246810')
    cy.contains('button', '验证并选择办理身份').click()

    cy.contains('先确认您的办理身份')
    cy.get('input[type="radio"]:checked').should('have.length', 0)
    cy.get('input[placeholder="请输入本人真实姓名"]').should('not.exist')

    cy.contains('.identity-choice', '我是法定代表人').click()
    cy.contains('button', '确认身份并继续').click()
    cy.contains('法定代表人姓名')
    cy.get('input[placeholder="请输入本人真实姓名"]').type('张明')
    cy.get('input[placeholder="用于本人实名核验 默认脱敏展示"]').type('650102199001011234')
    cy.contains('上传营业执照后将自动读取并关联')
    cy.get('.confirmation input[type="checkbox"]').check()
    cy.contains('button', '保存并上传材料').click()

    cy.url().should('include', '/onboarding?focus=materials')
    cy.get('[data-cy="materials-panel"]').should('be.visible')
    cy.contains('.completion-count', '必填完成 0 / 4')
    cy.get('[data-cy="identity-upload-agent_authorization"]').should('not.exist')
  })
})

describe('主办方身份材料', () => {
  it('在同一张身份证材料卡内分别上传正反面并补充授权书', () => {
    visitOnboarding('authorized_agent')

    cy.contains('.completion-count', '必填完成 0 / 5')
    cy.get('[data-cy="identity-material-group"] .identity-document-card').should('have.length', 1)
    cy.get('[data-cy="identity-upload-legal_representative_id_front"]').should('be.visible')
    cy.get('[data-cy="identity-upload-legal_representative_id_back"]').should('be.visible')
    cy.get('[data-cy="identity-upload-agent_authorization"] button[type="button"]')
      .contains('上传授权书')
      .should('be.disabled')

    cy.get('[data-cy="file-legal_representative_id_front"]').selectFile(
      'public/materials/quji-public-identity-sample.webp',
      { force: true },
    )
    cy.contains('.completion-count', '必填完成 1 / 5')
    cy.contains('.identity-document-card__count', '已完成 1 / 2')
    cy.contains(
      '[data-cy="identity-upload-legal_representative_id_front"]',
      'quji-public-identity-sample.webp',
    )
    cy.reload()
    cy.contains(
      '[data-cy="identity-upload-legal_representative_id_front"]',
      'quji-public-identity-sample.webp',
    )

    cy.get('[data-cy="file-legal_representative_id_back"]').selectFile(
      'public/materials/quji-public-identity-back-sample.webp',
      { force: true },
    )
    cy.contains('.completion-count', '必填完成 2 / 5')
    cy.contains('.identity-document-card__count', '已完成 2 / 2')
    cy.get('[data-cy="identity-upload-agent_authorization"] button[type="button"]')
      .contains('上传授权书')
      .should('not.be.disabled')

    cy.get('[data-cy="file-agent_authorization"]').selectFile(
      'public/materials/quji-public-authorization-sample.webp',
      { force: true },
    )
    cy.contains('.completion-count', '必填完成 3 / 5')
    cy.contains('[data-cy="identity-upload-agent_authorization"]', 'quji-public-authorization-sample.webp')
  })

  it('法定代表人本人办理时不要求经办授权书', () => {
    visitOnboarding('legal_representative')

    cy.contains('.completion-count', '必填完成 0 / 4')
    cy.contains('法定代表人本人办理 无需上传经办授权书')
    cy.get('[data-cy="identity-upload-agent_authorization"]').should('not.exist')

    cy.get('[data-cy="file-legal_representative_id_front"]').selectFile(
      'public/materials/quji-public-identity-sample.webp',
      { force: true },
    )
    cy.get('[data-cy="file-legal_representative_id_back"]').selectFile(
      'public/materials/quji-public-identity-back-sample.webp',
      { force: true },
    )
    cy.contains('.completion-count', '必填完成 2 / 4')
  })

  it('营业执照只上传一次并自动关联完整主体信息', () => {
    visitOnboarding('legal_representative')

    cy.get('[data-cy="file-business_license"]').selectFile(
      'public/materials/quji-public-license-sample.webp',
      { force: true },
    )
    cy.get('[data-cy="subject-profile"]').within(() => {
      cy.contains('营业执照信息已自动关联')
      cy.get('input').should('have.length', 6)
      cy.get('input').eq(0).should('have.value', '测试文化活动有限公司')
      cy.get('input').eq(1).should('have.value', '91650100MA7QJ2026X')
      cy.get('input').eq(2).should('have.value', '穆合塔尔·阿不都热依木')
      cy.contains('系统已自动关联到主办方主体档案')
    })
  })
})
