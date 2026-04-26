const KEY_HEX = process.env.SECRETS_ENCRYPTION_KEY
if (!KEY_HEX || KEY_HEX.length !== 64) {
  throw new Error('SECRETS_ENCRYPTION_KEY must be a 32-byte hex string (64 hex chars)')
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

async function getKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    hexToBytes(KEY_HEX!),
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt'],
  )
}

export async function encrypt(plaintext: string): Promise<string> {
  const key = await getKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(plaintext)
  const cipherBuffer = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded)
  const combined = new Uint8Array(iv.byteLength + cipherBuffer.byteLength)
  combined.set(iv, 0)
  combined.set(new Uint8Array(cipherBuffer), iv.byteLength)
  return Buffer.from(combined).toString('base64')
}

export async function decrypt(ciphertext: string): Promise<string> {
  const key = await getKey()
  const combined = new Uint8Array(Buffer.from(ciphertext, 'base64'))
  const iv = combined.slice(0, 12)
  const data = combined.slice(12)
  const plainBuffer = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data)
  return new TextDecoder().decode(plainBuffer)
}
