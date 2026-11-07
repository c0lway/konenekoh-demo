import crypto from 'crypto';
import { db } from './db.js';

// Secret key used to sign and verify licenses.
// In a distributed production architecture, the private signing key stays on your licensing server,
// while the verification key (or HMAC secret) verifies validity offline in the client installation.
const MASTER_LICENSE_SECRET = process.env.KONENEKOH_LICENSE_SECRET || 'kk-secret-license-signature-master-key-2026-smile-maker';

/**
 * Creates a cryptographically signed license token
 * Format: KK.<base64url(payload)>.<hmacSha256(payload, secret)>
 */
export function generateLicenseToken(data) {
  const payload = {
    titular: data.titular || 'KoneneKoh Dental Clinic',
    email: data.email || 'doctor@konenekoh.com',
    tipo: data.tipo || 'ANUAL', // 'DEMO' | 'MENSUAL' | 'ANUAL' | 'VITALICIA'
    fecha_emision: data.fecha_emision || new Date().toISOString().split('T')[0],
    fecha_expiracion: data.fecha_expiracion || calculateFutureDate(data.tipo === 'MENSUAL' ? 30 : data.tipo === 'DEMO' ? 14 : 365),
    codigo: data.codigo || `KK-${new Date().getFullYear()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
    sucursales_max: data.sucursales_max || 5,
    actualizaciones_hasta: data.actualizaciones_hasta || data.fecha_expiracion || calculateFutureDate(data.tipo === 'MENSUAL' ? 30 : 365),
    createdAt: Date.now()
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', MASTER_LICENSE_SECRET).update(payloadB64).digest('hex');
  return `KK.${payloadB64}.${signature}`;
}

/**
 * Verifies a license token cryptographically and checks expiration
 */
export function verifyLicenseToken(token) {
  if (!token || typeof token !== 'string') {
    return { valid: false, expired: true, isReadOnly: true, reason: 'Token de licencia no proporcionado.' };
  }

  const parts = token.trim().split('.');
  if (parts.length !== 3 || parts[0] !== 'KK') {
    return { valid: false, expired: true, isReadOnly: true, reason: 'Formato de clave de licencia inválido.' };
  }

  const [, payloadB64, providedSig] = parts;

  // Verify HMAC signature
  const expectedSig = crypto.createHmac('sha256', MASTER_LICENSE_SECRET).update(payloadB64).digest('hex');
  if (expectedSig !== providedSig) {
    return { valid: false, expired: true, isReadOnly: true, reason: 'La firma criptográfica de la licencia es inválida o ha sido manipulada.' };
  }

  // Parse payload
  let payload;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
  } catch (err) {
    return { valid: false, expired: true, isReadOnly: true, reason: 'No se pudo decodificar el payload de la licencia.' };
  }

  // Check expiration date
  const now = new Date();
  const expDate = new Date(payload.fecha_expiracion + 'T23:59:59');
  const isLifetime = payload.tipo === 'VITALICIA';
  const isExpired = !isLifetime && (now > expDate);
  const diffTime = expDate.getTime() - now.getTime();
  const daysRemaining = isLifetime ? 9999 : Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  return {
    valid: true,
    expired: isExpired,
    isReadOnly: isExpired, // When expired, application enters Read-Only Mode
    daysRemaining,
    payload
  };
}

/**
 * Calculates a future date in YYYY-MM-DD
 */
export function calculateFutureDate(daysToAdd) {
  const d = new Date();
  d.setDate(d.getDate() + daysToAdd);
  return d.toISOString().split('T')[0];
}

/**
 * Retrieves the current system license status from SQLite
 */
export function getCurrentLicenseStatus(callback) {
  const sql = `SELECT * FROM licencia_sistema WHERE id = 1`;
  db.get(sql, (err, row) => {
    if (err) return callback(err);

    if (!row || !row.token_activo) {
      // No active license stored -> Read Only mode
      return callback(null, {
        hasLicense: false,
        valid: false,
        expired: true,
        isReadOnly: true,
        daysRemaining: 0,
        tipo: 'SIN_LICENCIA',
        titular: 'Sin registrar',
        fecha_expiracion: null,
        codigo: 'N/A',
        auto_renovacion: 0,
        pasarela: null,
        actualizaciones_habilitadas: false,
        reason: 'No hay ninguna licencia registrada en este sistema. El sistema se encuentra en Modo Consulta (Solo Lectura).'
      });
    }

    const verification = verifyLicenseToken(row.token_activo);

    if (!verification.valid) {
      return callback(null, {
        hasLicense: true,
        valid: false,
        expired: true,
        isReadOnly: true,
        daysRemaining: 0,
        tipo: row.tipo || 'DESCONOCIDO',
        titular: row.titular || 'Desconocido',
        fecha_expiracion: row.fecha_expiracion,
        codigo: row.codigo_licencia,
        auto_renovacion: row.auto_renovacion || 0,
        pasarela: row.pasarela_pago,
        actualizaciones_habilitadas: false,
        reason: verification.reason
      });
    }

    const payload = verification.payload;
    const isExpired = verification.expired;

    // Check updates eligibility
    const updatesUntil = new Date((payload.actualizaciones_hasta || payload.fecha_expiracion) + 'T23:59:59');
    const updatesEligible = !isExpired && (new Date() <= updatesUntil);

    callback(null, {
      hasLicense: true,
      valid: true,
      expired: isExpired,
      isReadOnly: isExpired,
      daysRemaining: verification.daysRemaining,
      tipo: payload.tipo,
      titular: payload.titular,
      email: payload.email,
      fecha_emision: payload.fecha_emision,
      fecha_expiracion: payload.fecha_expiracion,
      codigo: payload.codigo,
      sucursales_max: payload.sucursales_max,
      auto_renovacion: row.auto_renovacion || 0,
      pasarela: row.pasarela_pago || 'Stripe / Mercado Pago',
      subscription_id: row.subscription_id,
      actualizaciones_habilitadas: updatesEligible,
      version_instalada: '2.5.0',
      ultima_verificacion: row.updated_at
    });
  });
}

/**
 * Saves and activates a license token in SQLite
 */
export function activateLicenseToken(token, pasarela = null, autoRenovacion = 0, subscriptionId = null, callback) {
  const verification = verifyLicenseToken(token);
  if (!verification.valid) {
    return callback(new Error(verification.reason || 'Token de licencia inválido'));
  }

  const p = verification.payload;
  const sql = `
    INSERT INTO licencia_sistema (
      id, token_activo, codigo_licencia, titular, email, tipo,
      fecha_emision, fecha_expiracion, pasarela_pago, auto_renovacion, subscription_id, updated_at
    ) VALUES (
      1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP
    )
    ON CONFLICT(id) DO UPDATE SET
      token_activo = excluded.token_activo,
      codigo_licencia = excluded.codigo_licencia,
      titular = excluded.titular,
      email = excluded.email,
      tipo = excluded.tipo,
      fecha_emision = excluded.fecha_emision,
      fecha_expiracion = excluded.fecha_expiracion,
      pasarela_pago = excluded.pasarela_pago,
      auto_renovacion = excluded.auto_renovacion,
      subscription_id = excluded.subscription_id,
      updated_at = CURRENT_TIMESTAMP
  `;

  const params = [
    token,
    p.codigo,
    p.titular,
    p.email,
    p.tipo,
    p.fecha_emision,
    p.fecha_expiracion,
    pasarela,
    autoRenovacion ? 1 : 0,
    subscriptionId
  ];

  db.run(sql, params, function(err) {
    if (err) return callback(err);
    getCurrentLicenseStatus(callback);
  });
}

/**
 * Renews the license programmatically (e.g. after successful payment through Stripe/MercadoPago)
 */
export function processLicenseRenewal(planType, pasarela, paymentIntentId, customerEmail, titular, callback) {
  const days = planType === 'ANUAL' ? 365 : (planType === 'PRUEBA_REAL' ? 7 : 30);
  
  // Fetch current license to extend from current expiration or from today if already expired
  getCurrentLicenseStatus((err, current) => {
    let baseDate = new Date();
    if (current && current.valid && !current.expired && current.fecha_expiracion) {
      const curExp = new Date(current.fecha_expiracion + 'T23:59:59');
      if (curExp > baseDate) {
        baseDate = curExp;
      }
    }
    
    baseDate.setDate(baseDate.getDate() + days);
    const newExpDate = baseDate.toISOString().split('T')[0];

    const newToken = generateLicenseToken({
      titular: titular || current?.titular || 'KoneneKoh Smile Maker',
      email: customerEmail || current?.email || 'contacto@konenekoh.com',
      tipo: planType,
      fecha_emision: new Date().toISOString().split('T')[0],
      fecha_expiracion: newExpDate,
      sucursales_max: 5,
      actualizaciones_hasta: newExpDate
    });

    activateLicenseToken(newToken, pasarela, 1, paymentIntentId, callback);
  });
}
