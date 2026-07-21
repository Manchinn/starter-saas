const mockUse = jest.fn()
const mockOn = jest.fn()
const mockDisconnectSockets = jest.fn()
const mockIn = jest.fn(() => ({ disconnectSockets: mockDisconnectSockets }))

jest.mock('socket.io', () => ({ Server: jest.fn() }))

jest.mock('../../config/config', () => ({
  clientUrl: 'http://localhost:5173',
  jwt: { secret: 'test-secret' },
}))

jest.mock('../logger', () => ({
  forLabel: () => ({ info: jest.fn(), error: jest.fn() }),
}))

jest.mock('../../../shared/erp/alert/services/alert.service', () => ({
  getUserDepartmentIds: jest.fn(),
  getUserModuleSlugs: jest.fn(),
}))

const { Server } = require('socket.io')
const alertService = require('../../../shared/erp/alert/services/alert.service')

const realtime = require('../realtime')

describe('realtime user sessions', () => {
  beforeEach(() => {
    Server.mockImplementation(function MockServer() {
      this.use = mockUse
      this.on = mockOn
      this.in = mockIn
    })
    mockIn.mockImplementation(() => ({ disconnectSockets: mockDisconnectSockets }))
    alertService.getUserDepartmentIds.mockResolvedValue([])
    alertService.getUserModuleSlugs.mockResolvedValue([])
  })

  test('joins a per-user room and can disconnect every socket for that user', async () => {
    realtime.init({})
    const connectionHandler = mockOn.mock.calls.find(([event]) => event === 'connection')[1]
    const socket = {
      user: { id: 'u1', organizationId: 'o1', role: 'user' },
      join: jest.fn(),
    }

    await connectionHandler(socket)
    realtime.disconnectUser('u1')

    expect(socket.join).toHaveBeenCalledWith('user:u1')
    expect(mockIn).toHaveBeenCalledWith('user:u1')
    expect(mockDisconnectSockets).toHaveBeenCalledWith(true)
  })
})
