import { describe, it, expect } from 'bun:test'

process.env.SECRETS_ENCRYPTION_KEY = 'a'.repeat(64)

const { encrypt, decrypt } = await import('../lib/crypto.ts')

describe('crypto helpers', () => {
  it('round-trips a plaintext string', async () => {
    const original = 'super-secret-api-key-12345'
    const encrypted = await encrypt(original)
    const decrypted = await decrypt(encrypted)
    expect(decrypted).toBe(original)
  })

  it('produces different ciphertext each time (random IV)', async () => {
    const enc1 = await encrypt('same-input')
    const enc2 = await encrypt('same-input')
    expect(enc1).not.toBe(enc2)
  })

  it('fails to decrypt with wrong key', async () => {
    const encrypted = await encrypt('secret')
    const tampered = encrypted.slice(0, -4) + 'AAAA'
    await expect(decrypt(tampered)).rejects.toThrow()
  })
})
