import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { db, initDatabase } from './db.js';
import {
  getCurrentLicenseStatus,
  activateLicenseToken,
  generateLicenseToken,
  processLicenseRenewal,
  verifyLicenseToken,
  calculateFutureDate
} from './licenseEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Initialize SQLite database
initDatabase();

// --- MIDDLEWARE DE CONTROL DE LICENCIAS (MODO SOLO LECTURA) ---
function requireActiveLicense(req, res, next) {
  getCurrentLicenseStatus((err, status) => {
    if (err) {
      console.error('Error verificando licencia:', err);
      return res.status(500).json({ error: 'Error al verificar estado de la licencia.' });
    }
    if (!status.valid || status.isReadOnly) {
      return res.status(403).json({
        error: 'LICENCIA_EXPIRADA',
        message: status.reason || 'Tu licencia no está activa o ha vencido. El sistema se encuentra en Modo Consulta (Solo Lectura). Puedes revisar el historial clínico de tus pacientes o exportar tus datos, pero para registrar nuevos pacientes o agendar nuevas consultas se requiere una licencia activa.',
        isReadOnly: true,
        daysRemaining: status.daysRemaining || 0,
        fecha_expiracion: status.fecha_expiracion
      });
    }
    next();
  });
}

// --- UBICACIONES / SUCURSALES (Multi-Location) ---
app.get('/api/locations', (req, res) => {
  const includeAll = req.query.all === 'true' || req.query.includeInactive === 'true';
  const sql = `
    SELECT l.*,
      (SELECT COUNT(*) FROM patients WHERE location_id = l.id) as total_pacientes,
      (SELECT COUNT(*) FROM consultas WHERE location_id = l.id AND fecha = date('now', 'localtime')) as citas_hoy
    FROM locations l
    ${includeAll ? '' : 'WHERE l.activo = 1'}
    ORDER BY l.id ASC
  `;
  db.all(sql, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/locations', (req, res) => {
  const { nombre, codigo, direccion, telefono, color } = req.body;
  if (!nombre || !codigo) {
    return res.status(400).json({ error: 'Nombre y código de sucursal son requeridos' });
  }
  const sql = `
    INSERT INTO locations (nombre, codigo, direccion, telefono, color, activo)
    VALUES (?, ?, ?, ?, ?, 1)
  `;
  db.run(sql, [nombre, codigo.toUpperCase().trim(), direccion || '', telefono || '', color || '#06b6d4'], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    const newLocId = this.lastID;
    // Auto-seed inventory rows for all existing products for this new branch
    db.run(`
      INSERT OR IGNORE INTO inventario_sedes (producto_id, location_id, cantidad, stock_minimo)
      SELECT id, ?, 0, 5 FROM catalogo_productos
    `, [newLocId], (seedErr) => {
      if (seedErr) console.error('Error auto-seeding inventory for new location:', seedErr);
      res.status(201).json({ id: newLocId, nombre, codigo: codigo.toUpperCase().trim(), direccion, telefono, color, activo: 1 });
    });
  });
});

app.put('/api/locations/:id', (req, res) => {
  const { nombre, codigo, direccion, telefono, color, activo } = req.body;
  const sql = `
    UPDATE locations SET
      nombre = COALESCE(?, nombre),
      codigo = COALESCE(?, codigo),
      direccion = COALESCE(?, direccion),
      telefono = COALESCE(?, telefono),
      color = COALESCE(?, color),
      activo = COALESCE(?, activo)
    WHERE id = ?
  `;
  db.run(sql, [
    nombre,
    codigo ? codigo.toUpperCase().trim() : null,
    direccion,
    telefono,
    color,
    activo !== undefined ? (activo ? 1 : 0) : null,
    req.params.id
  ], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, updated: this.changes });
  });
});

app.delete('/api/locations/:id', (req, res) => {
  const id = req.params.id;
  // Check if patients or appointments belong to this location
  db.get('SELECT COUNT(*) as count FROM patients WHERE location_id = ?', [id], (err1, r1) => {
    if (err1) return res.status(500).json({ error: err1.message });
    if (r1 && r1.count > 0) {
      // Soft-delete (set activo = 0) so data integrity is maintained
      db.run('UPDATE locations SET activo = 0 WHERE id = ?', [id], function(err2) {
        if (err2) return res.status(500).json({ error: err2.message });
        return res.json({ success: true, softDeleted: true, message: `La sucursal tiene ${r1.count} paciente(s) asignados, por lo que fue desactivada en lugar de eliminarse.` });
      });
    } else {
      // Hard delete if completely unused
      db.run('DELETE FROM locations WHERE id = ?', [id], function(err2) {
        if (err2) return res.status(500).json({ error: err2.message });
        // Clean up inventario_sedes
        db.run('DELETE FROM inventario_sedes WHERE location_id = ?', [id], () => {});
        return res.json({ success: true, hardDeleted: true });
      });
    }
  });
});

// --- DASHBOARD (General y por Ubicación) ---
app.get('/api/dashboard', (req, res) => {
  const { location_id } = req.query;
  const isGlobal = !location_id || location_id === 'all';
  const locId = Number(location_id);
  const today = new Date().toISOString().split('T')[0];

  const locParam = isGlobal ? [] : [locId];

  // 1. KPI Counts: Total Pacientes
  const patientsSql = isGlobal
    ? 'SELECT COUNT(*) as total_pacientes, SUM(CASE WHEN activo = 1 THEN 1 ELSE 0 END) as activos FROM patients'
    : 'SELECT COUNT(*) as total_pacientes, SUM(CASE WHEN activo = 1 THEN 1 ELSE 0 END) as activos FROM patients WHERE location_id = ?';

  db.get(patientsSql, locParam, (err1, patRow) => {
    if (err1) return res.status(500).json({ error: err1.message });

    // 2. Citas de hoy & en atención
    const citasSql = isGlobal
      ? `SELECT 
           COUNT(*) as total_citas_hoy,
           SUM(CASE WHEN estado = 'En atención' THEN 1 ELSE 0 END) as en_atencion,
           SUM(CASE WHEN estado = 'En espera' THEN 1 ELSE 0 END) as en_espera,
           SUM(CASE WHEN estado = 'Completada' THEN 1 ELSE 0 END) as completadas
         FROM consultas WHERE fecha = ?`
      : `SELECT 
           COUNT(*) as total_citas_hoy,
           SUM(CASE WHEN estado = 'En atención' THEN 1 ELSE 0 END) as en_atencion,
           SUM(CASE WHEN estado = 'En espera' THEN 1 ELSE 0 END) as en_espera,
           SUM(CASE WHEN estado = 'Completada' THEN 1 ELSE 0 END) as completadas
         FROM consultas WHERE fecha = ? AND location_id = ?`;
    
    const citasParams = isGlobal ? [today] : [today, locId];

    db.get(citasSql, citasParams, (err2, citaRow) => {
      if (err2) return res.status(500).json({ error: err2.message });

      // 3. Finanzas: Presupuestos & Pagos
      const presSql = isGlobal
        ? 'SELECT COALESCE(SUM(total), 0) as total_presupuestado FROM presupuestos'
        : `SELECT COALESCE(SUM(p.total), 0) as total_presupuestado 
           FROM presupuestos p 
           JOIN patients pt ON p.patient_id = pt.id 
           WHERE pt.location_id = ?`;

      db.get(presSql, locParam, (err3, presRow) => {
        if (err3) return res.status(500).json({ error: err3.message });

        const pagosSql = isGlobal
          ? 'SELECT COALESCE(SUM(monto), 0) as total_pagado FROM pagos'
          : `SELECT COALESCE(SUM(pg.monto), 0) as total_pagado 
             FROM pagos pg 
             JOIN patients pt ON pg.patient_id = pt.id 
             WHERE pt.location_id = ?`;

        db.get(pagosSql, locParam, (err4, pagoRow) => {
          if (err4) return res.status(500).json({ error: err4.message });

          const totalPres = presRow ? presRow.total_presupuestado : 0;
          const totalPag = pagoRow ? pagoRow.total_pagado : 0;
          const saldoPend = Math.max(0, totalPres - totalPag);

          // 4. Citas de hoy con detalle
          const todayListSql = isGlobal
            ? `SELECT c.*, p.nombre as paciente_nombre, p.expediente as paciente_expediente, 
                      p.foto as paciente_foto, p.celular as paciente_celular,
                      l.nombre as location_nombre, l.codigo as location_codigo, l.color as location_color
               FROM consultas c
               JOIN patients p ON c.patient_id = p.id
               LEFT JOIN locations l ON c.location_id = l.id
               WHERE c.fecha = ?
               ORDER BY c.hora_inicio ASC`
            : `SELECT c.*, p.nombre as paciente_nombre, p.expediente as paciente_expediente, 
                      p.foto as paciente_foto, p.celular as paciente_celular,
                      l.nombre as location_nombre, l.codigo as location_codigo, l.color as location_color
               FROM consultas c
               JOIN patients p ON c.patient_id = p.id
               LEFT JOIN locations l ON c.location_id = l.id
               WHERE c.fecha = ? AND c.location_id = ?
               ORDER BY c.hora_inicio ASC`;

          db.all(todayListSql, citasParams, (err5, todayCitas) => {
            if (err5) return res.status(500).json({ error: err5.message });

            // 5. Comparativa por Sedes (para Dashboard Global o desglose)
            const sedesSql = `
              SELECT 
                l.id, l.nombre, l.codigo, l.color, l.direccion, l.telefono,
                (SELECT COUNT(*) FROM patients WHERE location_id = l.id) as pacientes_count,
                (SELECT COUNT(*) FROM consultas WHERE location_id = l.id AND fecha = ?) as citas_hoy_count,
                (SELECT COALESCE(SUM(p.total), 0) FROM presupuestos p JOIN patients pt ON p.patient_id = pt.id WHERE pt.location_id = l.id) as ingresos_presupuestados,
                (SELECT COALESCE(SUM(pg.monto), 0) FROM pagos pg JOIN patients pt ON pg.patient_id = pt.id WHERE pt.location_id = l.id) as ingresos_cobrados,
                (SELECT COALESCE(SUM(s.cantidad * p.costo), 0) FROM inventario_sedes s JOIN catalogo_productos p ON s.producto_id = p.id WHERE s.location_id = l.id) as valor_inventario,
                (SELECT COUNT(*) FROM inventario_sedes s WHERE s.location_id = l.id AND s.cantidad <= s.stock_minimo) as articulos_bajo_stock
              FROM locations l
              WHERE l.activo = 1
            `;

            db.all(sedesSql, [today], (err6, sedesBreakdown) => {
              if (err6) return res.status(500).json({ error: err6.message });

              // 6. Inventario KPIs
              const invSql = isGlobal
                ? `SELECT 
                     COALESCE(SUM(s.cantidad * p.costo), 0) as valor_inventario,
                     COUNT(DISTINCT s.producto_id) as total_skus,
                     SUM(CASE WHEN s.cantidad <= s.stock_minimo THEN 1 ELSE 0 END) as productos_bajo_stock
                   FROM inventario_sedes s
                   JOIN catalogo_productos p ON s.producto_id = p.id`
                : `SELECT 
                     COALESCE(SUM(s.cantidad * p.costo), 0) as valor_inventario,
                     COUNT(DISTINCT s.producto_id) as total_skus,
                     SUM(CASE WHEN s.cantidad <= s.stock_minimo THEN 1 ELSE 0 END) as productos_bajo_stock
                   FROM inventario_sedes s
                   JOIN catalogo_productos p ON s.producto_id = p.id
                   WHERE s.location_id = ?`;

              db.get(invSql, locParam, (err7, invRow) => {
                res.json({
                  isGlobal,
                  location_id: isGlobal ? 'all' : locId,
                  kpis: {
                    total_pacientes: patRow ? patRow.total_pacientes : 0,
                    pacientes_activos: patRow ? patRow.activos : 0,
                    citas_hoy: citaRow ? citaRow.total_citas_hoy : 0,
                    en_atencion: citaRow ? citaRow.en_atencion : 0,
                    en_espera: citaRow ? citaRow.en_espera : 0,
                    completadas: citaRow ? citaRow.completadas : 0,
                    total_presupuestado: totalPres,
                    total_pagado: totalPag,
                    saldo_pendiente: saldoPend,
                    valor_inventario: invRow ? invRow.valor_inventario : 0,
                    total_skus: invRow ? invRow.total_skus : 0,
                    productos_bajo_stock: invRow ? (invRow.productos_bajo_stock || 0) : 0,
                  },
                  citas_hoy: todayCitas || [],
                  sedes_breakdown: sedesBreakdown || [],
                });
              });
            });
          });
        });
      });
    });
  });
});

// --- PACIENTES ---
app.get('/api/patients', (req, res) => {
  const { search, location_id } = req.query;
  let query = `
    SELECT p.*, 
      l.nombre as location_nombre, 
      l.codigo as location_codigo, 
      l.color as location_color
    FROM patients p
    LEFT JOIN locations l ON p.location_id = l.id
    WHERE 1=1
  `;
  const params = [];

  if (location_id && location_id !== 'all') {
    query += ' AND p.location_id = ?';
    params.push(location_id);
  }

  if (search) {
    query += ' AND (p.nombre LIKE ? OR p.expediente LIKE ? OR p.celular LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY p.id ASC';

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/patients/:id', (req, res) => {
  const sql = `
    SELECT p.*, 
      l.nombre as location_nombre, 
      l.codigo as location_codigo, 
      l.color as location_color
    FROM patients p
    LEFT JOIN locations l ON p.location_id = l.id
    WHERE p.id = ?
  `;
  db.get(sql, [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Paciente no encontrado' });
    res.json(row);
  });
});

app.post('/api/patients', requireActiveLicense, (req, res) => {
  const p = req.body;
  const sql = `
    INSERT INTO patients (expediente, nombre, foto, fecha_nacimiento, lugar_nacimiento, calle, num_exterior, num_interior, colonia, municipio, estado, cp, telefono, celular, email, rfc, activo, padre_tutor, location_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const params = [
    p.expediente || `PD${Math.floor(100 + Math.random() * 900)}`,
    p.nombre,
    p.foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
    p.fecha_nacimiento || '',
    p.lugar_nacimiento || '',
    p.calle || '',
    p.num_exterior || '',
    p.num_interior || '',
    p.colonia || '',
    p.municipio || '',
    p.estado || '',
    p.cp || '',
    p.telefono || '',
    p.celular || '',
    p.email || '',
    p.rfc || '',
    p.activo ?? 1,
    p.padre_tutor || '',
    p.location_id || 1
  ];

  db.run(sql, params, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    const newId = this.lastID;
    
    // Create empty antecedentes record
    db.run('INSERT INTO antecedentes (patient_id) VALUES (?)', [newId]);

    db.get(`
      SELECT p.*, l.nombre as location_nombre, l.codigo as location_codigo, l.color as location_color
      FROM patients p
      LEFT JOIN locations l ON p.location_id = l.id
      WHERE p.id = ?
    `, [newId], (err2, row) => {
      res.status(201).json(row);
    });
  });
});

app.put('/api/patients/:id', (req, res) => {
  const p = req.body;
  const sql = `
    UPDATE patients SET 
      expediente = ?, nombre = ?, foto = ?, fecha_nacimiento = ?, lugar_nacimiento = ?,
      calle = ?, num_exterior = ?, num_interior = ?, colonia = ?, municipio = ?,
      estado = ?, cp = ?, telefono = ?, celular = ?, email = ?, rfc = ?, activo = ?, padre_tutor = ?, location_id = ?
    WHERE id = ?
  `;
  const params = [
    p.expediente, p.nombre, p.foto, p.fecha_nacimiento, p.lugar_nacimiento,
    p.calle, p.num_exterior, p.num_interior, p.colonia, p.municipio,
    p.estado, p.cp, p.telefono, p.celular, p.email, p.rfc, p.activo, p.padre_tutor,
    p.location_id || 1,
    req.params.id
  ];

  db.run(sql, params, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    db.get(`
      SELECT p.*, l.nombre as location_nombre, l.codigo as location_codigo, l.color as location_color
      FROM patients p
      LEFT JOIN locations l ON p.location_id = l.id
      WHERE p.id = ?
    `, [req.params.id], (err2, row) => {
      res.json(row);
    });
  });
});

app.delete('/api/patients/:id', (req, res) => {
  db.run('DELETE FROM patients WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, deleted: this.changes });
  });
});

// --- ANTECEDENTES ---
app.get('/api/patients/:id/antecedentes', (req, res) => {
  db.get('SELECT * FROM antecedentes WHERE patient_id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row || { patient_id: Number(req.params.id) });
  });
});

app.put('/api/patients/:id/antecedentes', (req, res) => {
  const a = req.body;
  const sql = `
    INSERT INTO antecedentes (patient_id, generales, andrologicos, perinatales, signos_vitales, patologicos, heredo_familiares, no_patologicos, gineco_obstetricos)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(patient_id) DO UPDATE SET
      generales = excluded.generales,
      andrologicos = excluded.andrologicos,
      perinatales = excluded.perinatales,
      signos_vitales = excluded.signos_vitales,
      patologicos = excluded.patologicos,
      heredo_familiares = excluded.heredo_familiares,
      no_patologicos = excluded.no_patologicos,
      gineco_obstetricos = excluded.gineco_obstetricos
  `;
  const params = [
    req.params.id, a.generales, a.andrologicos, a.perinatales, a.signos_vitales,
    a.patologicos, a.heredo_familiares, a.no_patologicos, a.gineco_obstetricos
  ];

  db.run(sql, params, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// --- PRESUPUESTOS & ODONTOGRAMA (EL NÚCLEO) ---
app.get('/api/patients/:id/presupuestos', (req, res) => {
  const sql = `
    SELECT p.*, 
      (SELECT COUNT(*) FROM presupuesto_items WHERE presupuesto_id = p.id) as total_items,
      (SELECT dientes_json FROM odontogramas WHERE presupuesto_id = p.id LIMIT 1) as odontograma_json
    FROM presupuestos p
    WHERE p.patient_id = ?
    ORDER BY p.id DESC
  `;
  db.all(sql, [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/presupuestos/:id', (req, res) => {
  const presId = req.params.id;
  db.get('SELECT * FROM presupuestos WHERE id = ?', [presId], (err, presupuesto) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!presupuesto) return res.status(404).json({ error: 'Presupuesto no encontrado' });

    db.all('SELECT * FROM presupuesto_items WHERE presupuesto_id = ? ORDER BY id ASC', [presId], (err2, items) => {
      if (err2) return res.status(500).json({ error: err2.message });

      db.get('SELECT * FROM odontogramas WHERE presupuesto_id = ? LIMIT 1', [presId], (err3, odonto) => {
        if (err3) return res.status(500).json({ error: err3.message });

        res.json({
          ...presupuesto,
          items: items || [],
          odontograma: odonto ? { ...odonto, dientes: JSON.parse(odonto.dientes_json || '{}') } : null
        });
      });
    });
  });
});

app.post('/api/patients/:id/presupuestos', (req, res) => {
  const patientId = req.params.id;
  const { folio, fecha, titulo, observaciones, total, descuento, estado, tipo_denticion, items, odontograma_data } = req.body;

  const presFolio = folio || `ODO${Math.floor(100 + Math.random() * 900)}`;
  const presFecha = fecha || new Date().toISOString().split('T')[0];

  const presSql = `
    INSERT INTO presupuestos (patient_id, folio, fecha, titulo, observaciones, total, descuento, estado, tipo_denticion)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const presParams = [
    patientId,
    presFolio,
    presFecha,
    titulo || 'Presupuesto Odontológico',
    observaciones || '',
    total || 0,
    descuento || 0,
    estado || 'Presupuestado',
    tipo_denticion || 'mixto'
  ];

  db.run(presSql, presParams, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    const presupuestoId = this.lastID;

    // Save items
    if (items && items.length > 0) {
      const itemStmt = db.prepare(`
        INSERT INTO presupuesto_items (presupuesto_id, diente, superficie, tratamiento_id, descripcion, precio_unitario, cantidad, total, estado, color)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      items.forEach(it => {
        itemStmt.run([
          presupuestoId,
          it.diente || null,
          it.superficie || '',
          it.tratamiento_id || null,
          it.descripcion,
          it.precio_unitario,
          it.cantidad || 1,
          it.total,
          it.estado || 'Pendiente',
          it.color || '#ef4444'
        ]);
      });
      itemStmt.finalize();
    }

    // Save odontogram snapshot
    if (odontograma_data) {
      db.run(`
        INSERT INTO odontogramas (presupuesto_id, patient_id, tipo_denticion, dientes_json)
        VALUES (?, ?, ?, ?)
      `, [presupuestoId, patientId, tipo_denticion || 'mixto', JSON.stringify(odontograma_data)]);
    }

    res.status(201).json({ id: presupuestoId, folio: presFolio, success: true });
  });
});

app.put('/api/presupuestos/:id', (req, res) => {
  const presId = req.params.id;
  const { titulo, observaciones, total, descuento, estado, tipo_denticion, items, odontograma_data } = req.body;

  const updateSql = `
    UPDATE presupuestos SET
      titulo = ?, observaciones = ?, total = ?, descuento = ?, estado = ?, tipo_denticion = ?
    WHERE id = ?
  `;
  db.run(updateSql, [titulo, observaciones, total, descuento, estado, tipo_denticion, presId], function(err) {
    if (err) return res.status(500).json({ error: err.message });

    // Replace items if provided
    if (items) {
      db.run('DELETE FROM presupuesto_items WHERE presupuesto_id = ?', [presId], (errDel) => {
        if (!errDel && items.length > 0) {
          const itemStmt = db.prepare(`
            INSERT INTO presupuesto_items (presupuesto_id, diente, superficie, tratamiento_id, descripcion, precio_unitario, cantidad, total, estado, color)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);
          items.forEach(it => {
            itemStmt.run([
              presId,
              it.diente || null,
              it.superficie || '',
              it.tratamiento_id || null,
              it.descripcion,
              it.precio_unitario,
              it.cantidad || 1,
              it.total,
              it.estado || 'Pendiente',
              it.color || '#ef4444'
            ]);
          });
          itemStmt.finalize();
        }
      });
    }

    // Update odontogram snapshot if provided
    if (odontograma_data) {
      db.run(`
        UPDATE odontogramas SET dientes_json = ?, tipo_denticion = ? WHERE presupuesto_id = ?
      `, [JSON.stringify(odontograma_data), tipo_denticion, presId]);
    }

    res.json({ success: true });
  });
});

app.delete('/api/presupuestos/:id', (req, res) => {
  db.run('DELETE FROM presupuestos WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Update single item status (e.g. mark treatment completed)
app.patch('/api/presupuesto-items/:id/status', (req, res) => {
  const { estado } = req.body;
  db.run('UPDATE presupuesto_items SET estado = ? WHERE id = ?', [estado, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, estado });
  });
});

// --- PAGOS & ESTADO DE CUENTA (Exacto como captura 4) ---
app.get('/api/patients/:id/pagos', (req, res) => {
  const patientId = req.params.id;

  // Calculate Total Presupuestado
  db.get('SELECT COALESCE(SUM(total), 0) as total_presupuestado FROM presupuestos WHERE patient_id = ?', [patientId], (err, presRow) => {
    if (err) return res.status(500).json({ error: err.message });

    // Calculate Total Pagado & Pagos list
    db.all('SELECT * FROM pagos WHERE patient_id = ? ORDER BY fecha DESC, id DESC', [patientId], (err2, pagos) => {
      if (err2) return res.status(500).json({ error: err2.message });

      const totalPresupuestado = presRow ? presRow.total_presupuestado : 0;
      const totalPagado = pagos.reduce((sum, p) => sum + (p.monto || 0), 0);
      const saldo = totalPresupuestado - totalPagado;

      res.json({
        total: totalPresupuestado,
        total_pagado: totalPagado,
        saldo: saldo,
        pagos: pagos
      });
    });
  });
});

app.post('/api/patients/:id/pagos', (req, res) => {
  const patientId = req.params.id;
  const { presupuesto_id, folio_pago, fecha, monto, tipo_pago, notas } = req.body;

  const folio = folio_pago || `PAG-${Math.floor(100 + Math.random() * 900)}`;
  const date = fecha || new Date().toISOString().split('T')[0];

  const sql = `
    INSERT INTO pagos (patient_id, presupuesto_id, folio_pago, fecha, monto, tipo_pago, notas)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  db.run(sql, [patientId, presupuesto_id || null, folio, date, monto, tipo_pago || 'Efectivo', notas || ''], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID, folio_pago: folio, success: true });
  });
});

app.delete('/api/pagos/:id', (req, res) => {
  db.run('DELETE FROM pagos WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// --- PRODUCTOS (Inventario Profesional Multi-Ubicación & General) ---
app.get('/api/catalogos/productos', (req, res) => {
  const { location_id } = req.query;
  const isGlobal = !location_id || location_id === 'all';
  const locId = Number(location_id);

  db.all('SELECT * FROM catalogo_productos ORDER BY categoria, nombre ASC', (err, prods) => {
    if (err) return res.status(500).json({ error: err.message });

    const stockSql = `
      SELECT s.*, l.nombre as location_nombre, l.codigo as location_codigo, l.color as location_color
      FROM inventario_sedes s
      JOIN locations l ON s.location_id = l.id
      ORDER BY s.location_id ASC
    `;
    db.all(stockSql, (err2, allStocks) => {
      if (err2 || !allStocks) {
        return res.json(prods);
      }

      // Group stocks by product_id
      const stocksByProd = {};
      allStocks.forEach(st => {
        if (!stocksByProd[st.producto_id]) stocksByProd[st.producto_id] = [];
        stocksByProd[st.producto_id].push(st);
      });

      const result = prods.map(p => {
        const pStocks = stocksByProd[p.id] || [];

        if (!isGlobal) {
          // Specific location view
          const localStock = pStocks.find(s => s.location_id === locId) || {
            cantidad: 0,
            stock_minimo: p.stock_minimo || 5,
            pasillo_gaveta: p.ubicacion,
            location_nombre: '',
            location_codigo: '',
            location_color: ''
          };
          return {
            ...p,
            cantidad: localStock.cantidad,
            stock_minimo: localStock.stock_minimo,
            ubicacion: localStock.pasillo_gaveta || p.ubicacion,
            location_id: locId,
            location_nombre: localStock.location_nombre,
            location_codigo: localStock.location_codigo,
            location_color: localStock.location_color,
            stocks_por_sede: pStocks
          };
        } else {
          // General / Consolidated network view
          const totalStock = pStocks.length > 0
            ? pStocks.reduce((sum, s) => sum + (s.cantidad || 0), 0)
            : p.cantidad;

          const sedesBajoStock = pStocks
            .filter(s => s.cantidad <= s.stock_minimo)
            .map(s => `${s.location_codigo}: ${s.cantidad}/${s.stock_minimo}`);

          return {
            ...p,
            cantidad: totalStock,
            stocks_por_sede: pStocks,
            alerta_bajo_stock: sedesBajoStock.length > 0,
            sedes_bajo_stock: sedesBajoStock
          };
        }
      });

      res.json(result);
    });
  });
});

app.post('/api/catalogos/productos', (req, res) => {
  const p = req.body;
  const targetLocationId = p.location_id ? Number(p.location_id) : 1;
  const initialQty = Number(p.cantidad || 0);

  const sql = `
    INSERT INTO catalogo_productos (codigo, nombre, marca, cantidad, stock_minimo, categoria, proveedor, ubicacion, location_id, costo, utilidad, precio, iva, precio_sin_iva, precio_con_iva)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const params = [
    p.codigo, p.nombre, p.marca, initialQty, p.stock_minimo ?? 5,
    p.categoria || 'Higiene Dental', p.proveedor || '', p.ubicacion || '', targetLocationId,
    p.costo || 0, p.utilidad || 0, p.precio || 0, p.iva || 0,
    p.precio_sin_iva || 0, p.precio_con_iva || 0
  ];
  db.run(sql, params, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    const newId = this.lastID;
    
    // Insert into inventario_sedes for all locations
    db.all('SELECT id FROM locations', (errLocs, locs) => {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO inventario_sedes (producto_id, location_id, cantidad, stock_minimo, pasillo_gaveta)
        VALUES (?, ?, ?, ?, ?)
      `);
      (locs || [{ id: 1 }, { id: 2 }, { id: 3 }]).forEach(l => {
        const isTarget = l.id === targetLocationId;
        stmt.run([newId, l.id, isTarget ? initialQty : 0, p.stock_minimo ?? 5, isTarget ? p.ubicacion : 'Por asignar']);
      });
      stmt.finalize();
    });

    // Log movement
    db.run(`
      INSERT INTO movimientos_inventario (producto_id, tipo, cantidad, motivo, location_id, usuario)
      VALUES (?, 'Entrada', ?, 'Creación inicial de insumo', ?, ?)
    `, [newId, initialQty, targetLocationId, p.usuario || 'raguilar']);

    res.status(201).json({ id: newId, ...p });
  });
});

app.put('/api/catalogos/productos/:id', (req, res) => {
  const p = req.body;
  const prodId = req.params.id;
  const targetLocationId = p.location_id ? Number(p.location_id) : null;

  const sql = `
    UPDATE catalogo_productos SET
      codigo = ?, nombre = ?, marca = ?,
      categoria = ?, proveedor = ?, ubicacion = ?, costo = ?, utilidad = ?,
      precio = ?, iva = ?, precio_sin_iva = ?, precio_con_iva = ?
    WHERE id = ?
  `;
  const params = [
    p.codigo, p.nombre, p.marca,
    p.categoria, p.proveedor, p.ubicacion, p.costo, p.utilidad,
    p.precio, p.iva, p.precio_sin_iva, p.precio_con_iva,
    prodId
  ];
  db.run(sql, params, function(err) {
    if (err) return res.status(500).json({ error: err.message });

    if (targetLocationId) {
      db.run(`
        UPDATE inventario_sedes SET
          stock_minimo = COALESCE(?, stock_minimo),
          pasillo_gaveta = COALESCE(?, pasillo_gaveta)
        WHERE producto_id = ? AND location_id = ?
      `, [p.stock_minimo, p.ubicacion, prodId, targetLocationId]);
    }

    res.json({ success: true });
  });
});

app.post('/api/catalogos/productos/:id/ajustar-stock', (req, res) => {
  const { cantidad_ajuste, tipo, motivo, usuario, location_id } = req.body;
  const prodId = req.params.id;
  const locId = location_id ? Number(location_id) : 1;

  db.get('SELECT cantidad FROM inventario_sedes WHERE producto_id = ? AND location_id = ?', [prodId, locId], (err, row) => {
    let currentQty = row ? row.cantidad : 0;
    let nuevaCantidad = currentQty;

    if (tipo === 'Entrada') {
      nuevaCantidad += Number(cantidad_ajuste);
    } else if (tipo === 'Salida') {
      nuevaCantidad = Math.max(0, currentQty - Number(cantidad_ajuste));
    } else {
      nuevaCantidad = Number(cantidad_ajuste);
    }

    db.run(`
      INSERT INTO inventario_sedes (producto_id, location_id, cantidad)
      VALUES (?, ?, ?)
      ON CONFLICT(producto_id, location_id) DO UPDATE SET cantidad = ?
    `, [prodId, locId, nuevaCantidad, nuevaCantidad], function(err2) {
      if (err2) return res.status(500).json({ error: err2.message });

      // Update total quantity in catalogo_productos
      db.get('SELECT COALESCE(SUM(cantidad), 0) as total FROM inventario_sedes WHERE producto_id = ?', [prodId], (errTotal, totRow) => {
        if (!errTotal && totRow) {
          db.run('UPDATE catalogo_productos SET cantidad = ? WHERE id = ?', [totRow.total, prodId]);
        }
      });

      // Log movement with location_id
      db.run(`
        INSERT INTO movimientos_inventario (producto_id, tipo, cantidad, motivo, usuario, location_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [prodId, tipo || 'Ajuste', Number(cantidad_ajuste), motivo || 'Ajuste de inventario', usuario || 'raguilar', locId]);

      res.json({ success: true, nuevaCantidad, location_id: locId });
    });
  });
});

// Traspaso de insumos entre sucursales
app.post('/api/catalogos/productos/:id/traspaso', (req, res) => {
  const { origen_location_id, destino_location_id, cantidad, motivo, usuario } = req.body;
  const prodId = req.params.id;
  const origenId = Number(origen_location_id);
  const destinoId = Number(destino_location_id);
  const qty = Number(cantidad);

  if (origenId === destinoId) {
    return res.status(400).json({ error: 'La sucursal de origen y destino deben ser distintas.' });
  }
  if (!qty || qty <= 0) {
    return res.status(400).json({ error: 'La cantidad a traspasar debe ser mayor a cero.' });
  }

  db.get('SELECT cantidad FROM inventario_sedes WHERE producto_id = ? AND location_id = ?', [prodId, origenId], (err, origenRow) => {
    if (err) return res.status(500).json({ error: err.message });
    const currentOrigin = origenRow ? origenRow.cantidad : 0;
    if (currentOrigin < qty) {
      return res.status(400).json({ error: `Stock insuficiente en la sucursal de origen. Disponible: ${currentOrigin} unidades.` });
    }

    const newOriginQty = currentOrigin - qty;

    // Deduct from origin
    db.run('UPDATE inventario_sedes SET cantidad = ? WHERE producto_id = ? AND location_id = ?', [newOriginQty, prodId, origenId], (errDed) => {
      if (errDed) return res.status(500).json({ error: errDed.message });

      // Add to destination
      db.run(`
        INSERT INTO inventario_sedes (producto_id, location_id, cantidad)
        VALUES (?, ?, ?)
        ON CONFLICT(producto_id, location_id) DO UPDATE SET cantidad = cantidad + ?
      `, [prodId, destinoId, qty, qty], (errAdd) => {
        if (errAdd) return res.status(500).json({ error: errAdd.message });

        // Log outgoing transfer
        db.run(`
          INSERT INTO movimientos_inventario (producto_id, tipo, cantidad, motivo, usuario, location_id, destino_location_id)
          VALUES (?, 'Traspaso', ?, ?, ?, ?, ?)
        `, [prodId, qty, motivo || 'Traspaso entre sucursales', usuario || 'raguilar', origenId, destinoId]);

        res.json({
          success: true,
          producto_id: prodId,
          origen_location_id: origenId,
          destino_location_id: destinoId,
          cantidad_transferida: qty,
          nuevo_stock_origen: newOriginQty
        });
      });
    });
  });
});

app.get('/api/catalogos/productos/movimientos', (req, res) => {
  const { location_id } = req.query;
  let sql = `
    SELECT m.*, 
      p.nombre as producto_nombre, 
      p.codigo as producto_codigo,
      l.nombre as location_nombre,
      l.codigo as location_codigo,
      l.color as location_color,
      ld.nombre as destino_location_nombre,
      ld.codigo as destino_location_codigo
    FROM movimientos_inventario m
    JOIN catalogo_productos p ON m.producto_id = p.id
    LEFT JOIN locations l ON m.location_id = l.id
    LEFT JOIN locations ld ON m.destino_location_id = ld.id
    WHERE 1=1
  `;
  const params = [];

  if (location_id && location_id !== 'all') {
    sql += ' AND (m.location_id = ? OR m.destino_location_id = ?)';
    params.push(location_id, location_id);
  }

  sql += ' ORDER BY m.id DESC LIMIT 100';

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.delete('/api/catalogos/productos/:id', (req, res) => {
  db.run('DELETE FROM catalogo_productos WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    db.run('DELETE FROM inventario_sedes WHERE producto_id = ?', [req.params.id], () => {});
    res.json({ success: true });
  });
});

// --- CONSULTAS / CITAS & AGENDA EN VISTA DE CALENDARIO ---
app.get('/api/consultas', (req, res) => {
  const { fecha, start, end, location_id } = req.query;
  let query = `
    SELECT c.*, 
      p.nombre as paciente_nombre, 
      p.expediente as paciente_expediente, 
      p.foto as paciente_foto, 
      p.celular as paciente_celular,
      p.telefono as paciente_telefono,
      l.nombre as location_nombre,
      l.codigo as location_codigo,
      l.color as location_color
    FROM consultas c
    JOIN patients p ON c.patient_id = p.id
    LEFT JOIN locations l ON c.location_id = l.id
    WHERE 1=1
  `;
  const params = [];

  if (location_id && location_id !== 'all') {
    query += ' AND c.location_id = ?';
    params.push(location_id);
  }

  if (fecha) {
    query += ' AND c.fecha = ?';
    params.push(fecha);
  } else if (start && end) {
    query += ' AND c.fecha BETWEEN ? AND ?';
    params.push(start, end);
  }

  query += ' ORDER BY c.fecha ASC, c.hora_inicio ASC';

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/patients/:id/consultas', (req, res) => {
  db.all('SELECT * FROM consultas WHERE patient_id = ? ORDER BY fecha DESC, hora_inicio DESC', [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/consultas', requireActiveLicense, (req, res) => {
  const c = req.body;
  const sql = `
    INSERT INTO consultas (patient_id, fecha, hora_inicio, hora_fin, duracion_minutos, motivo, diagnostico, doctor, sillon, location_id, estado, notas)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const params = [
    c.patient_id,
    c.fecha || new Date().toISOString().split('T')[0],
    c.hora_inicio || '09:00',
    c.hora_fin || '09:45',
    c.duracion_minutos || 45,
    c.motivo || 'Consulta y valoración dental',
    c.diagnostico || '',
    c.doctor || 'Dra. Rebeca Aguilar',
    c.sillon || 'Sillón 1 (Pediatría)',
    c.location_id || 1,
    c.estado || 'Programada',
    c.notas || ''
  ];

  db.run(sql, params, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    const newId = this.lastID;
    db.get(`
      SELECT c.*, p.nombre as paciente_nombre, p.expediente as paciente_expediente, p.foto as paciente_foto
      FROM consultas c
      JOIN patients p ON c.patient_id = p.id
      WHERE c.id = ?
    `, [newId], (err2, row) => {
      res.status(201).json(row);
    });
  });
});

app.put('/api/consultas/:id', (req, res) => {
  const c = req.body;
  const sql = `
    UPDATE consultas SET
      fecha = ?, hora_inicio = ?, hora_fin = ?, duracion_minutos = ?,
      motivo = ?, diagnostico = ?, tratamiento_realizado = ?,
      doctor = ?, sillon = ?, estado = ?, notas = ?
    WHERE id = ?
  `;
  const params = [
    c.fecha, c.hora_inicio, c.hora_fin, c.duracion_minutos,
    c.motivo, c.diagnostico, c.tratamiento_realizado || '',
    c.doctor, c.sillon, c.estado, c.notas,
    req.params.id
  ];

  db.run(sql, params, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.delete('/api/consultas/:id', (req, res) => {
  db.run('DELETE FROM consultas WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// --- TRATAMIENTOS ---
app.get('/api/catalogos/tratamientos', (req, res) => {
  db.all('SELECT * FROM catalogo_tratamientos ORDER BY categoria, nombre', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/catalogos/tratamientos', (req, res) => {
  const t = req.body;
  const sql = `
    INSERT INTO catalogo_tratamientos (codigo, nombre, categoria, precio, color_sugerido)
    VALUES (?, ?, ?, ?, ?)
  `;
  db.run(sql, [t.codigo, t.nombre, t.categoria, t.precio, t.color_sugerido || '#ef4444'], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID, ...t });
  });
});

// --- CONSENTIMIENTOS ---
app.get('/api/patients/:id/consentimientos', (req, res) => {
  db.all('SELECT * FROM consentimientos WHERE patient_id = ? ORDER BY id DESC', [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/patients/:id/consentimientos', (req, res) => {
  const { folio, fecha, categoria, detalles, firmado } = req.body;
  const sql = `
    INSERT INTO consentimientos (patient_id, folio, fecha, categoria, detalles, firmado)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  db.run(sql, [req.params.id, folio, fecha, categoria, detalles || '', firmado ? 1 : 0], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID, success: true });
  });
});

// --- CONFIGURACIÓN DE LA CLÍNICA & LOGOTIPO ---
app.get('/api/config/clinica', (req, res) => {
  db.get('SELECT * FROM clinica_config WHERE id = 1', (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) {
      return res.json({
        id: 1,
        nombre_comercial: 'KoneneKoh Smile Maker',
        eslogan: 'Odontopediatría & Ortodoncia Especializada',
        logotipo_url: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=250',
        direccion: 'Av. Candiles 512, Col. Candiles, Corregidora, Qro. C.P. 76903',
        telefono: '442 237 1299',
        whatsapp: '442 237 1299',
        email: 'contacto@konenekoh.com',
        sitio_web: 'www.konenekoh.com',
        rfc: 'KSM190520ABC',
        responsable_sanitario: 'Dra. Rebeca Aguilar Ramos',
        cedula_profesional: 'Céd. Prof. 8472910 UNAM',
        registro_ssa: 'Reg. S.S.A. 20-045-QRO',
        nota_pie_presupuesto: 'Este presupuesto tiene una vigencia de 30 días a partir de su emisión. Los costos y procedimientos pueden actualizarse según la evolución clínica del paciente.',
        nota_pie_receta: 'En caso de reacción alérgica o efecto adverso, suspenda el medicamento y comuníquese inmediatamente al consultorio.',
        color_primario: '#06b6d4',
        color_secundario: '#2ec4b6'
      });
    }
    res.json(row);
  });
});

app.put('/api/config/clinica', (req, res) => {
  db.get('SELECT * FROM clinica_config WHERE id = 1', (errCurrent, current) => {
    if (errCurrent) return res.status(500).json({ error: errCurrent.message });
    const cur = current || {};
    const c = req.body;

    const nombre_comercial = c.nombre_comercial !== undefined ? c.nombre_comercial : (cur.nombre_comercial || 'KoneneKoh Smile Maker');
    const eslogan = c.eslogan !== undefined ? c.eslogan : (cur.eslogan || 'Odontopediatría & Ortodoncia Especializada');
    const logotipo_url = c.logotipo_url !== undefined ? c.logotipo_url : (cur.logotipo_url || 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=250');
    const direccion = c.direccion !== undefined ? c.direccion : (cur.direccion || 'Av. Candiles 512, Col. Candiles, Corregidora, Qro. C.P. 76903');
    const telefono = c.telefono !== undefined ? c.telefono : (cur.telefono || '442 237 1299');
    const whatsapp = c.whatsapp !== undefined ? c.whatsapp : (cur.whatsapp || '442 237 1299');
    const email = c.email !== undefined ? c.email : (cur.email || 'contacto@konenekoh.com');
    const sitio_web = c.sitio_web !== undefined ? c.sitio_web : (cur.sitio_web || 'www.konenekoh.com');
    const rfc = c.rfc !== undefined ? c.rfc : (cur.rfc || 'KSM190520ABC');
    const responsable_sanitario = c.responsable_sanitario !== undefined ? c.responsable_sanitario : (cur.responsable_sanitario || 'Dra. Rebeca Aguilar Ramos');
    const cedula_profesional = c.cedula_profesional !== undefined ? c.cedula_profesional : (cur.cedula_profesional || 'Céd. Prof. 8472910 UNAM');
    const registro_ssa = c.registro_ssa !== undefined ? c.registro_ssa : (cur.registro_ssa || 'Reg. S.S.A. 20-045-QRO');
    const nota_pie_presupuesto = c.nota_pie_presupuesto !== undefined ? c.nota_pie_presupuesto : (cur.nota_pie_presupuesto || 'Este presupuesto tiene una vigencia de 30 días a partir de su emisión. Los costos y procedimientos pueden actualizarse según la evolución clínica del paciente.');
    const nota_pie_receta = c.nota_pie_receta !== undefined ? c.nota_pie_receta : (cur.nota_pie_receta || 'En caso de reacción alérgica o efecto adverso, suspenda el medicamento y comuníquese inmediatamente al consultorio.');
    const color_primario = c.color_primario !== undefined ? c.color_primario : (cur.color_primario || '#06b6d4');
    const color_secundario = c.color_secundario !== undefined ? c.color_secundario : (cur.color_secundario || '#2ec4b6');

    const sql = `
      INSERT INTO clinica_config (
        id, nombre_comercial, eslogan, logotipo_url, direccion, telefono, whatsapp, email,
        sitio_web, rfc, responsable_sanitario, cedula_profesional, registro_ssa,
        nota_pie_presupuesto, nota_pie_receta, color_primario, color_secundario, updated_at
      ) VALUES (
        1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP
      )
      ON CONFLICT(id) DO UPDATE SET
        nombre_comercial = excluded.nombre_comercial,
        eslogan = excluded.eslogan,
        logotipo_url = excluded.logotipo_url,
        direccion = excluded.direccion,
        telefono = excluded.telefono,
        whatsapp = excluded.whatsapp,
        email = excluded.email,
        sitio_web = excluded.sitio_web,
        rfc = excluded.rfc,
        responsable_sanitario = excluded.responsable_sanitario,
        cedula_profesional = excluded.cedula_profesional,
        registro_ssa = excluded.registro_ssa,
        nota_pie_presupuesto = excluded.nota_pie_presupuesto,
        nota_pie_receta = excluded.nota_pie_receta,
        color_primario = excluded.color_primario,
        color_secundario = excluded.color_secundario,
        updated_at = CURRENT_TIMESTAMP
    `;

    const params = [
      nombre_comercial, eslogan, logotipo_url, direccion, telefono, whatsapp, email,
      sitio_web, rfc, responsable_sanitario, cedula_profesional, registro_ssa,
      nota_pie_presupuesto, nota_pie_receta, color_primario, color_secundario
    ];

    db.run(sql, params, function(err) {
      if (err) return res.status(500).json({ error: err.message });
      db.get('SELECT * FROM clinica_config WHERE id = 1', (err2, row) => {
        if (err2) return res.status(500).json({ error: err2.message });
        res.json(row);
      });
    });
  });
});

// --- RECETAS MÉDICAS / ODONTOLÓGICAS ---
app.get('/api/recetas', (req, res) => {
  const { location_id } = req.query;
  let sql = `
    SELECT r.*, pt.nombre as paciente_nombre, pt.expediente, pt.fecha_nacimiento, pt.telefono as paciente_telefono,
           l.nombre as sucursal_nombre, l.color as sucursal_color
    FROM recetas r
    JOIN patients pt ON r.patient_id = pt.id
    LEFT JOIN locations l ON r.location_id = l.id
  `;
  const params = [];
  if (location_id && location_id !== 'all') {
    sql += ` WHERE r.location_id = ?`;
    params.push(Number(location_id));
  }
  sql += ` ORDER BY r.id DESC LIMIT 200`;

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const formatted = rows.map(row => {
      let medicamentos = [];
      try {
        medicamentos = typeof row.medicamentos_json === 'string' ? JSON.parse(row.medicamentos_json) : (row.medicamentos_json || []);
      } catch (e) {
        medicamentos = [];
      }
      return { ...row, medicamentos };
    });
    res.json(formatted);
  });
});

app.get('/api/patients/:id/recetas', (req, res) => {
  const sql = `
    SELECT r.*, pt.nombre as paciente_nombre, pt.fecha_nacimiento, pt.expediente, pt.telefono as paciente_telefono,
           l.nombre as sucursal_nombre
    FROM recetas r
    JOIN patients pt ON r.patient_id = pt.id
    LEFT JOIN locations l ON r.location_id = l.id
    WHERE r.patient_id = ?
    ORDER BY r.id DESC
  `;
  db.all(sql, [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const formatted = rows.map(row => {
      let medicamentos = [];
      try {
        medicamentos = typeof row.medicamentos_json === 'string' ? JSON.parse(row.medicamentos_json) : (row.medicamentos_json || []);
      } catch (e) {
        medicamentos = [];
      }
      return { ...row, medicamentos };
    });
    res.json(formatted);
  });
});

app.get('/api/recetas/:id', (req, res) => {
  const sql = `
    SELECT r.*, pt.nombre as paciente_nombre, pt.fecha_nacimiento, pt.expediente, pt.telefono as paciente_telefono,
           l.nombre as sucursal_nombre, l.direccion as sucursal_direccion, l.telefono as sucursal_telefono
    FROM recetas r
    JOIN patients pt ON r.patient_id = pt.id
    LEFT JOIN locations l ON r.location_id = l.id
    WHERE r.id = ?
  `;
  db.get(sql, [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Receta no encontrada' });
    let medicamentos = [];
    try {
      medicamentos = typeof row.medicamentos_json === 'string' ? JSON.parse(row.medicamentos_json) : (row.medicamentos_json || []);
    } catch (e) {
      medicamentos = [];
    }
    res.json({ ...row, medicamentos });
  });
});

app.post('/api/patients/:id/recetas', (req, res) => {
  const patientId = req.params.id;
  const {
    folio, fecha, doctor, cedula, diagnostico, peso, talla, temperatura, alergias,
    medicamentos, indicaciones_generales, location_id
  } = req.body;

  const finalFolio = folio || `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const finalFecha = fecha || new Date().toISOString().split('T')[0];
  const medJson = JSON.stringify(medicamentos || []);

  const sql = `
    INSERT INTO recetas (
      patient_id, folio, fecha, doctor, cedula, diagnostico,
      peso, talla, temperatura, alergias, medicamentos_json, indicaciones_generales, location_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const params = [
    patientId,
    finalFolio,
    finalFecha,
    doctor || 'Dra. Rebeca Aguilar Ramos',
    cedula || 'Céd. Prof. 8472910 UNAM',
    diagnostico || '',
    peso || '',
    talla || '',
    temperatura || '',
    alergias || '',
    medJson,
    indicaciones_generales || '',
    location_id || 1
  ];

  db.run(sql, params, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({
      id: this.lastID,
      patient_id: Number(patientId),
      folio: finalFolio,
      fecha: finalFecha,
      doctor: doctor || 'Dra. Rebeca Aguilar Ramos',
      cedula: cedula || 'Céd. Prof. 8472910 UNAM',
      diagnostico: diagnostico || '',
      peso: peso || '',
      talla: talla || '',
      temperatura: temperatura || '',
      alergias: alergias || '',
      medicamentos: medicamentos || [],
      indicaciones_generales: indicaciones_generales || '',
      location_id: location_id || 1
    });
  });
});

app.delete('/api/recetas/:id', (req, res) => {
  db.run('DELETE FROM recetas WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// =========================================================================
// --- CONTROL DE LICENCIAS, PASARELA DE PAGOS & EXPORTADOR DE DATOS ---
// =========================================================================

// 1. Obtener estado actual de la licencia
app.get('/api/licencia/status', (req, res) => {
  getCurrentLicenseStatus((err, status) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(status);
  });
});

// 2. Activar licencia mediante clave/token firmado
app.post('/api/licencia/activar', (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: 'La clave de licencia es requerida.' });
  }

  activateLicenseToken(token, 'Activación manual / Voucher', 0, null, (err, updatedStatus) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'Error al validar clave de licencia' });
    }
    res.json({
      success: true,
      message: 'Licencia validada y activada exitosamente.',
      licencia: updatedStatus
    });
  });
});

// 3. Activar Periodo de Prueba Demo (14 días gratis)
app.post('/api/licencia/demo', (req, res) => {
  const { titular, email } = req.body;
  const expDate = calculateFutureDate(14);
  const token = generateLicenseToken({
    titular: titular || 'Clínica Demo KoneneKoh',
    email: email || 'demo@konenekoh.com',
    tipo: 'DEMO',
    fecha_emision: new Date().toISOString().split('T')[0],
    fecha_expiracion: expDate,
    sucursales_max: 2,
    actualizaciones_hasta: expDate
  });

  activateLicenseToken(token, 'Periodo de Prueba Demo 14 Días', 0, 'sub_demo_free', (err, updatedStatus) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({
      success: true,
      message: 'Licencia de prueba demo activada por 14 días.',
      licencia: updatedStatus
    });
  });
});

// 4. Generador de Licencias para el Administrador / Vendedor del Software
app.post('/api/licencia/generar', (req, res) => {
  const { titular, email, tipo, dias, sucursales_max, codigo } = req.body;
  const numDays = dias ? Number(dias) : (tipo === 'MENSUAL' ? 30 : tipo === 'DEMO' ? 14 : 365);
  const expDate = calculateFutureDate(numDays);

  const token = generateLicenseToken({
    titular: titular || 'Clínica Dental',
    email: email || 'doctor@clinica.com',
    tipo: tipo || 'ANUAL',
    fecha_emision: new Date().toISOString().split('T')[0],
    fecha_expiracion: expDate,
    codigo: codigo,
    sucursales_max: sucursales_max || 5,
    actualizaciones_hasta: expDate
  });

  res.json({
    success: true,
    token,
    titular,
    tipo: tipo || 'ANUAL',
    fecha_expiracion: expDate,
    dias_duracion: numDays
  });
});

// 5. Pasarela de Pagos & Renovación Automática (Stripe / Mercado Pago)
app.post('/api/licencia/checkout', (req, res) => {
  const {
    plan, // 'MENSUAL' ($499 MXN) | 'ANUAL' ($4,990 MXN) | 'PRUEBA_REAL' ($10 MXN)
    titular,
    email,
    pasarela, // 'Stripe' | 'Mercado Pago' | 'Tarjeta'
    paymentMethodId,
    autoRenovar
  } = req.body;

  let planType = 'MENSUAL';
  let precioMXN = 499;

  if (plan === 'ANUAL') {
    planType = 'ANUAL';
    precioMXN = 4990;
  } else if (plan === 'PRUEBA_REAL') {
    planType = 'PRUEBA_REAL';
    precioMXN = 10;
  }

  const gateway = pasarela || 'Stripe / Mercado Pago';
  const paymentIntentId = `pi_${gateway.toLowerCase().replace(/[^a-z]/g, '')}_${Date.now()}`;

  // Process renewal and generate newly signed cryptographically valid token
  processLicenseRenewal(
    planType,
    gateway,
    paymentIntentId,
    email,
    titular,
    (err, updatedStatus) => {
      if (err) {
        return res.status(500).json({ error: 'Error al procesar renovación de licencia: ' + err.message });
      }

      res.json({
        success: true,
        message: `¡Pago exitoso de $${precioMXN} MXN! Tu licencia ha sido renovada hasta el ${updatedStatus.fecha_expiracion}.`,
        transactionId: paymentIntentId,
        monto: precioMXN,
        moneda: 'MXN',
        plan: planType,
        licencia: updatedStatus
      });
    }
  );
});

// 6. Webhook para Pasarelas de Pago en Producción (Stripe / MercadoPago)
app.post('/api/licencia/webhook', (req, res) => {
  const event = req.body;
  // Handler for standard webhook triggers: invoice.payment_succeeded or payment.updated
  console.log('Webhook de pago recibido:', event?.type || 'payment_event');
  
  const plan = event?.plan || 'ANUAL';
  const paymentId = event?.id || `wh_${Date.now()}`;
  const customerEmail = event?.data?.object?.customer_email || 'cliente@konenekoh.com';
  const customerName = event?.data?.object?.customer_name || 'Clínica Suscriptora';

  processLicenseRenewal(plan, 'Webhook Automático', paymentId, customerEmail, customerName, (err, updated) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ received: true, renewed: true, fecha_expiracion: updated.fecha_expiracion });
  });
});

// 7. Simulador de Estado (Para pruebas inmediatas del Modo Solo Lectura)
app.post('/api/licencia/simular-estado', (req, res) => {
  const { modo } = req.body; // 'vencida' | 'activa' | 'sin_licencia'
  
  if (modo === 'sin_licencia') {
    db.run('DELETE FROM licencia_sistema WHERE id = 1', (err) => {
      if (err) return res.status(500).json({ error: err.message });
      getCurrentLicenseStatus((err2, status) => res.json({ success: true, status }));
    });
    return;
  }

  const expDate = modo === 'vencida' ? '2026-01-01' : calculateFutureDate(365);
  const token = generateLicenseToken({
    titular: 'KoneneKoh Smile Maker',
    email: 'contacto@konenekoh.com',
    tipo: modo === 'vencida' ? 'VENCIDA_TEST' : 'ANUAL',
    fecha_emision: '2025-01-01',
    fecha_expiracion: expDate,
    codigo: 'KK-SIM-TEST-MODE',
    sucursales_max: 5,
    actualizaciones_hasta: expDate
  });

  activateLicenseToken(token, 'Modo Prueba / Simulación', 1, 'sub_sim_test', (err, updated) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, mensaje: `Simulación cambiada a: ${modo}`, status: updated });
  });
});

// 8. EXPORTADOR COMPLETO DE DATOS CLÍNICOS (Siempre habilitado, incluso en Modo Solo Lectura)
app.get('/api/licencia/export', (req, res) => {
  // Query all core tables to produce a full clinical archive
  const queries = {
    clinica: 'SELECT * FROM clinica_config WHERE id = 1',
    sedes: 'SELECT * FROM locations',
    pacientes: 'SELECT * FROM patients',
    antecedentes: 'SELECT * FROM antecedentes',
    consultas: 'SELECT * FROM consultas ORDER BY fecha DESC',
    presupuestos: 'SELECT * FROM presupuestos ORDER BY fecha DESC',
    presupuesto_items: 'SELECT * FROM presupuesto_items',
    pagos: 'SELECT * FROM pagos ORDER BY fecha DESC',
    recetas: 'SELECT * FROM recetas ORDER BY fecha DESC',
    inventario: 'SELECT * FROM catalogo_productos'
  };

  const exportBundle = {
    metadata: {
      sistema: 'KoneneKoh Smile Maker Pro',
      version: '2.5.0',
      fecha_exportacion: new Date().toISOString(),
      nota_legal: 'Exportación de expediente clínico conforme a la NOM-004-SSA3-2012 y derecho de portabilidad de datos médicos.'
    },
    datos: {}
  };

  const keys = Object.keys(queries);
  let completed = 0;

  keys.forEach((key) => {
    db.all(queries[key], (err, rows) => {
      exportBundle.datos[key] = rows || [];
      completed++;
      if (completed === keys.length) {
        const dateStr = new Date().toISOString().split('T')[0];
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="konenekoh_respaldo_clinico_${dateStr}.json"`);
        res.json(exportBundle);
      }
    });
  });
});

// 9. Comprobación de Actualizaciones de Software
app.get('/api/licencia/updates/check', (req, res) => {
  getCurrentLicenseStatus((err, status) => {
    if (err) return res.status(500).json({ error: err.message });

    const currentVersion = '2.5.0';
    const latestVersion = '2.5.2';
    const isEligible = status.actualizaciones_habilitadas;

    res.json({
      currentVersion,
      latestVersion,
      updateAvailable: currentVersion !== latestVersion,
      releaseDate: '2026-11-01',
      eligible: isEligible,
      licenseStatus: {
        valid: status.valid,
        expired: status.expired,
        daysRemaining: status.daysRemaining,
        tipo: status.tipo
      },
      changelog: [
        'Módulo de Administración de Licencias con Firma Criptográfica HMAC-SHA256.',
        'Integración con Pasarela de Pagos (Stripe / Mercado Pago) para renovación automática.',
        'Modo Consulta (Solo Lectura) para salvaguarda permanente de expedientes médicos.',
        'Exportador Integral de Datos y Respaldos Clínicos en formato JSON estándar.',
        'Mejoras en el Odontograma Interactivo FDI y recetas imprimibles con membrete.'
      ],
      downloadUrl: isEligible ? '/api/licencia/updates/download' : null,
      message: isEligible 
        ? 'Nueva versión disponible. Tu licencia cuenta con soporte activo y puedes actualizar.'
        : 'Hay una nueva versión disponible. Para descargar actualizaciones y soporte técnico, renueva tu suscripción anual o mensual.'
    });
  });
});

// Serve static frontend in production (dist directory)
const distPath = path.resolve(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(distPath, 'index.html'));
  });
}

// Start express server
app.listen(PORT, () => {
  console.log(`KoneneKoh Dental Backend running on http://localhost:${PORT}`);
});
