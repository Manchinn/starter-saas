// Security + behaviour tests for core/env-file.
//
// This module rewrites server/.env for the operator-driven Settings → Email tab.
// The security-critical property is that a single key's value can NEVER inject an
// additional key=value line (env-var injection): the parser is line-based, so an
// embedded CR/LF in a value must be neutralised before serialisation. fs is fully
// mocked so nothing touches the real .env.

jest.mock('fs', () => ({
  existsSync:    jest.fn(),
  readFileSync:  jest.fn(),
  writeFileSync: jest.fn(),
}))

const fs = require('fs')
const { readEnv, writeEnv, updateEnv } = require('../env-file')

// The serialised string handed to fs.writeFileSync on the most recent call.
const written = () => fs.writeFileSync.mock.calls.at(-1)[1]
const writtenLines = () => written().split('\n').filter(Boolean)

beforeEach(() => jest.clearAllMocks())

describe('writeEnv — env-injection hardening', () => {
  test('strips a newline-injected value into a single quoted line', () => {
    // Classic injection: smuggle a second key through a value containing a newline.
    writeEnv({ SMTP_HOST: 'smtp.evil\nJWT_SECRET=leaked' })

    const lines = writtenLines()
    // Exactly one key line is produced — the injected JWT_SECRET never becomes its own line.
    expect(lines).toHaveLength(1)
    expect(lines[0]).toBe('SMTP_HOST="smtp.evil JWT_SECRET=leaked"')
    expect(lines.some((l) => l.startsWith('JWT_SECRET='))).toBe(false)
  })

  test('strips a carriage return (CRLF injection) too', () => {
    writeEnv({ SMTP_USER: 'u\r\nSMTP_PASS=pwned' })
    const lines = writtenLines()
    expect(lines).toHaveLength(1)
    expect(lines.some((l) => l.trim() === 'SMTP_PASS=pwned')).toBe(false)
  })

  test('neutralises a newline embedded in the KEY as well', () => {
    writeEnv({ 'A\nB': 'x' })
    const lines = writtenLines()
    expect(lines).toHaveLength(1)
    // The key collapses to a single token; no standalone "B=" line is emitted.
    expect(lines[0].split('=')[0]).not.toContain('\n')
  })
})

describe('writeEnv — quoting', () => {
  test('quotes values containing whitespace or special characters', () => {
    writeEnv({ A: 'has space', B: 'with#hash', C: 'plain' })
    const lines = writtenLines()
    expect(lines).toContain('A="has space"')
    expect(lines).toContain('B="with#hash"')
    expect(lines).toContain('C=plain') // no quoting when unnecessary
  })

  test('escapes embedded double quotes', () => {
    writeEnv({ A: 'say "hi"' })
    expect(written()).toContain('A="say \\"hi\\""')
  })
})

describe('readEnv', () => {
  test('returns an empty map when .env is absent', () => {
    fs.existsSync.mockReturnValue(false)
    expect(readEnv()).toEqual({})
  })

  test('parses keys, ignores comments/blanks, and unwraps surrounding quotes', () => {
    fs.existsSync.mockReturnValue(true)
    fs.readFileSync.mockReturnValue(
      '# a comment\n\nSMTP_HOST="smtp.x.io"\nSMTP_PORT=587\nSMTP_FROM=\'a@b.co\'\n'
    )
    expect(readEnv()).toEqual({
      SMTP_HOST: 'smtp.x.io',
      SMTP_PORT: '587',
      SMTP_FROM: 'a@b.co',
    })
  })
})

describe('updateEnv', () => {
  test('merges updates over the existing file and preserves untouched keys', () => {
    fs.existsSync.mockReturnValue(true)
    fs.readFileSync.mockReturnValue('JWT_SECRET=keep-me\nSMTP_HOST=old\n')
    const merged = updateEnv({ SMTP_HOST: 'new' })

    // Returned map reflects the merge.
    expect(merged).toMatchObject({ JWT_SECRET: 'keep-me', SMTP_HOST: 'new' })
    // The persisted file keeps the untouched secret and applies the update.
    const lines = writtenLines()
    expect(lines).toContain('JWT_SECRET=keep-me')
    expect(lines).toContain('SMTP_HOST=new')
  })
})
