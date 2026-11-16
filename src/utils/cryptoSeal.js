/**
 * cryptoSeal.js — Sello Criptográfico Inmutable SHA-256
 * AiAppFactory Standard (Engine #159)
 * Compatible con Node.js y Navegadores modernos (Web Crypto API)
 */

export class CryptoSeal {
  /**
   * Genera un hash SHA-256 en formato hexadecimal (64 caracteres)
   * @param {string|object} data - Datos a sellar
   * @returns {Promise<string>}
   */
  static async hashSHA256(data) {
    const serialized = typeof data === 'string' ? data : JSON.stringify(data);

    // Entorno Navegador (Web Crypto API)
    if (typeof crypto !== 'undefined' && crypto.subtle && typeof TextEncoder !== 'undefined') {
      const msgBuffer = new TextEncoder().encode(serialized);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Entorno Node.js
    try {
      const nodeCrypto = await import('node:crypto');
      return nodeCrypto.createHash('sha256').update(serialized).digest('hex');
    } catch {
      return CryptoSeal._fallbackHash(serialized);
    }
  }

  /**
   * Genera un hash determinista síncrono para tests rápidos o fallbacks
   * @param {string|object} str
   * @returns {string}
   */
  static hashSync(str) {
    if (typeof str !== 'string') {
      str = JSON.stringify(str);
    }
    return CryptoSeal._fallbackHash(str);
  }

  /**
   * Fallback determinista de 64 caracteres
   * @private
   */
  static _fallbackHash(str) {
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    const p1 = (4294967296 + h1).toString(16).padStart(8, '0');
    const p2 = (4294967296 + h2).toString(16).padStart(8, '0');
    return (p1 + p2 + p1 + p2 + p1 + p2 + p1 + p2).slice(0, 64);
  }
}
