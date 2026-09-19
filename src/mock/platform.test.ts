import { describe, expect, it } from 'vitest'
import { activityDetail, dashboardData, demoLogin } from './platform'

describe('platform mock contract', () => {
  it('returns a session for every supported role', async () => {
    const session = await demoLogin({ account: 'linjie@quji.cn', password: '123456', role: 'organizer' })
    expect(session.user.role).toBe('organizer')
    expect(session.token).toContain('organizer')
  })

  it('keeps activity ticket figures internally consistent', () => {
    const totalSold = activityDetail.ticketTypes.reduce((sum, ticket) => sum + ticket.sold, 0)
    expect(totalSold).toBe(4662)
    expect(dashboardData.activities[0].code).toBe(activityDetail.code)
  })
})
