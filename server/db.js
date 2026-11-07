import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, 'konenekoh.db');

export const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite database at', dbPath);
  }
});

export function initDatabase() {
  db.serialize(() => {
    // 0. Ubicaciones / Sedes Clínicas (Multi-Sucursal)
    db.run(`
      CREATE TABLE IF NOT EXISTS locations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        codigo TEXT UNIQUE NOT NULL,
        direccion TEXT,
        telefono TEXT,
        color TEXT DEFAULT '#06b6d4',
        activo INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 1. Pacientes
    db.run(`
      CREATE TABLE IF NOT EXISTS patients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        expediente TEXT UNIQUE NOT NULL,
        nombre TEXT NOT NULL,
        foto TEXT,
        fecha_nacimiento TEXT,
        lugar_nacimiento TEXT,
        calle TEXT,
        num_exterior TEXT,
        num_interior TEXT,
        colonia TEXT,
        municipio TEXT,
        estado TEXT,
        cp TEXT,
        telefono TEXT,
        celular TEXT,
        email TEXT,
        rfc TEXT,
        activo INTEGER DEFAULT 1,
        padre_tutor TEXT,
        location_id INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (location_id) REFERENCES locations(id)
      )
    `);

    // Safe column additions for patients
    db.run(`ALTER TABLE patients ADD COLUMN location_id INTEGER DEFAULT 1`, () => {});

    // 2. Antecedentes
    db.run(`
      CREATE TABLE IF NOT EXISTS antecedentes (
        patient_id INTEGER PRIMARY KEY,
        generales TEXT,
        andrologicos TEXT,
        perinatales TEXT,
        signos_vitales TEXT,
        patologicos TEXT,
        heredo_familiares TEXT,
        no_patologicos TEXT,
        gineco_obstetricos TEXT,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
      )
    `);

    // 3. Catálogo de Tratamientos
    db.run(`
      CREATE TABLE IF NOT EXISTS catalogo_tratamientos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        codigo TEXT UNIQUE,
        nombre TEXT NOT NULL,
        categoria TEXT,
        precio REAL NOT NULL,
        color_sugerido TEXT
      )
    `);

    // 4. Catálogo de Productos
    db.run(`
      CREATE TABLE IF NOT EXISTS catalogo_productos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        codigo TEXT UNIQUE,
        nombre TEXT NOT NULL,
        marca TEXT,
        cantidad INTEGER DEFAULT 0,
        stock_minimo INTEGER DEFAULT 5,
        categoria TEXT DEFAULT 'Higiene Dental',
        proveedor TEXT,
        ubicacion TEXT,
        location_id INTEGER DEFAULT 1,
        lote TEXT,
        caducidad TEXT,
        costo REAL DEFAULT 0,
        utilidad REAL DEFAULT 0,
        precio REAL DEFAULT 0,
        iva REAL DEFAULT 0,
        precio_sin_iva REAL DEFAULT 0,
        precio_con_iva REAL DEFAULT 0
      )
    `);

    // Safe column additions for catalogo_productos
    const prodCols = ['stock_minimo INTEGER DEFAULT 5', 'categoria TEXT DEFAULT "Higiene Dental"', 'proveedor TEXT', 'ubicacion TEXT', 'location_id INTEGER DEFAULT 1', 'lote TEXT', 'caducidad TEXT'];
    prodCols.forEach(col => {
      db.run(`ALTER TABLE catalogo_productos ADD COLUMN ${col}`, () => {});
    });

    // 5. Movimientos de Inventario
    db.run(`
      CREATE TABLE IF NOT EXISTS movimientos_inventario (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        producto_id INTEGER NOT NULL,
        tipo TEXT NOT NULL,
        cantidad INTEGER NOT NULL,
        motivo TEXT NOT NULL,
        usuario TEXT DEFAULT 'raguilar',
        location_id INTEGER DEFAULT 1,
        destino_location_id INTEGER,
        fecha TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (producto_id) REFERENCES catalogo_productos(id) ON DELETE CASCADE
      )
    `);

    // Safe column additions for movimientos_inventario
    db.run(`ALTER TABLE movimientos_inventario ADD COLUMN location_id INTEGER DEFAULT 1`, () => {});
    db.run(`ALTER TABLE movimientos_inventario ADD COLUMN destino_location_id INTEGER`, () => {});

    // 5b. Stock de Productos por Ubicación / Sede (Multi-Sucursal)
    db.run(`
      CREATE TABLE IF NOT EXISTS inventario_sedes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        producto_id INTEGER NOT NULL,
        location_id INTEGER NOT NULL,
        cantidad INTEGER DEFAULT 0,
        stock_minimo INTEGER DEFAULT 5,
        pasillo_gaveta TEXT,
        FOREIGN KEY (producto_id) REFERENCES catalogo_productos(id) ON DELETE CASCADE,
        FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
        UNIQUE(producto_id, location_id)
      )
    `);

    // 6. Presupuestos
    db.run(`
      CREATE TABLE IF NOT EXISTS presupuestos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL,
        folio TEXT UNIQUE NOT NULL,
        fecha TEXT NOT NULL,
        titulo TEXT,
        observaciones TEXT,
        total REAL DEFAULT 0,
        descuento REAL DEFAULT 0,
        estado TEXT DEFAULT 'Presupuestado',
        tipo_denticion TEXT DEFAULT 'mixto',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
      )
    `);

    // 7. Presupuesto Items (Tratamientos por diente/superficie)
    db.run(`
      CREATE TABLE IF NOT EXISTS presupuesto_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        presupuesto_id INTEGER NOT NULL,
        diente INTEGER,
        superficie TEXT,
        tratamiento_id INTEGER,
        descripcion TEXT NOT NULL,
        precio_unitario REAL NOT NULL,
        cantidad INTEGER DEFAULT 1,
        descuento REAL DEFAULT 0,
        total REAL NOT NULL,
        estado TEXT DEFAULT 'Pendiente',
        color TEXT,
        FOREIGN KEY (presupuesto_id) REFERENCES presupuestos(id) ON DELETE CASCADE
      )
    `);

    // 8. Odontograma Records
    db.run(`
      CREATE TABLE IF NOT EXISTS odontogramas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        presupuesto_id INTEGER NOT NULL,
        patient_id INTEGER NOT NULL,
        tipo_denticion TEXT DEFAULT 'mixto',
        dientes_json TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (presupuesto_id) REFERENCES presupuestos(id) ON DELETE CASCADE,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
      )
    `);

    // 9. Pagos
    db.run(`
      CREATE TABLE IF NOT EXISTS pagos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL,
        presupuesto_id INTEGER,
        folio_pago TEXT,
        fecha TEXT NOT NULL,
        monto REAL NOT NULL,
        tipo_pago TEXT NOT NULL,
        notas TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
      )
    `);

    // 10. Consultas / Citas & Agenda
    db.run(`
      CREATE TABLE IF NOT EXISTS consultas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL,
        fecha TEXT NOT NULL,
        hora_inicio TEXT DEFAULT '09:00',
        hora_fin TEXT DEFAULT '10:00',
        duracion_minutos INTEGER DEFAULT 45,
        motivo TEXT,
        diagnostico TEXT,
        tratamiento_realizado TEXT,
        doctor TEXT DEFAULT 'Dra. Rebeca Aguilar',
        sillon TEXT DEFAULT 'Sillón 1 (Pediatría)',
        estado TEXT DEFAULT 'Programada',
        location_id INTEGER DEFAULT 1,
        notas TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
        FOREIGN KEY (location_id) REFERENCES locations(id)
      )
    `);

    // Safe column additions for consultas
    const consultaCols = [
      'hora_inicio TEXT DEFAULT "09:00"',
      'hora_fin TEXT DEFAULT "10:00"',
      'duracion_minutos INTEGER DEFAULT 45',
      'doctor TEXT DEFAULT "Dra. Rebeca Aguilar"',
      'sillon TEXT DEFAULT "Sillón 1 (Pediatría)"',
      'estado TEXT DEFAULT "Programada"',
      'location_id INTEGER DEFAULT 1',
      'notas TEXT'
    ];
    consultaCols.forEach(col => {
      db.run(`ALTER TABLE consultas ADD COLUMN ${col}`, () => {});
    });

    // 11. Consentimientos Informados
    db.run(`
      CREATE TABLE IF NOT EXISTS consentimientos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL,
        folio TEXT NOT NULL,
        fecha TEXT NOT NULL,
        categoria TEXT NOT NULL,
        detalles TEXT,
        firmado INTEGER DEFAULT 0,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
      )
    `);

    // 12. Configuración y Personalización de la Clínica
    db.run(`
      CREATE TABLE IF NOT EXISTS clinica_config (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        nombre_comercial TEXT NOT NULL DEFAULT 'KoneneKoh Smile Maker',
        eslogan TEXT DEFAULT 'Odontopediatría & Ortodoncia Especializada',
        logotipo_url TEXT,
        direccion TEXT DEFAULT 'Av. Candiles 512, Col. Candiles, Corregidora, Qro. C.P. 76903',
        telefono TEXT DEFAULT '442 237 1299',
        whatsapp TEXT DEFAULT '442 237 1299',
        email TEXT DEFAULT 'contacto@konenekoh.com',
        sitio_web TEXT DEFAULT 'www.konenekoh.com',
        rfc TEXT DEFAULT 'KSM190520ABC',
        responsable_sanitario TEXT DEFAULT 'Dra. Rebeca Aguilar Ramos',
        cedula_profesional TEXT DEFAULT 'Céd. Prof. 8472910 UNAM',
        registro_ssa TEXT DEFAULT 'Reg. S.S.A. 20-045-QRO',
        nota_pie_presupuesto TEXT DEFAULT 'Este presupuesto tiene una vigencia de 30 días a partir de su emisión. Los costos y procedimientos pueden actualizarse según la evolución clínica del paciente.',
        nota_pie_receta TEXT DEFAULT 'En caso de reacción alérgica o efecto adverso, suspenda el medicamento y comuníquese inmediatamente al consultorio.',
        color_primario TEXT DEFAULT '#06b6d4',
        color_secundario TEXT DEFAULT '#2ec4b6',
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Seed default clinic config if empty
    db.get('SELECT COUNT(*) as count FROM clinica_config', (err, row) => {
      if (!err && row && row.count === 0) {
        db.run(`
          INSERT INTO clinica_config (id, nombre_comercial, eslogan, logotipo_url, direccion, telefono, whatsapp, email, sitio_web, rfc, responsable_sanitario, cedula_profesional, registro_ssa, nota_pie_presupuesto, nota_pie_receta)
          VALUES (
            1,
            'KoneneKoh Smile Maker',
            'Odontopediatría & Ortodoncia Especializada',
            'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=250',
            'Av. Candiles 512, Col. Candiles, Corregidora, Qro. C.P. 76903',
            '442 237 1299',
            '442 237 1299',
            'contacto@konenekoh.com',
            'www.konenekoh.com',
            'KSM190520ABC',
            'Dra. Rebeca Aguilar Ramos',
            'Céd. Prof. 8472910 UNAM',
            'Reg. S.S.A. 20-045-QRO',
            'Este presupuesto tiene una vigencia de 30 días a partir de su emisión. Los costos y procedimientos pueden actualizarse según la evolución clínica del paciente.',
            'En caso de reacción alérgica o efecto adverso, suspenda el medicamento y comuníquese inmediatamente al consultorio.'
          )
        `);
      }
    });

    // 13. Recetas Médicas / Odontológicas
    db.run(`
      CREATE TABLE IF NOT EXISTS recetas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL,
        folio TEXT UNIQUE NOT NULL,
        fecha TEXT NOT NULL,
        doctor TEXT DEFAULT 'Dra. Rebeca Aguilar Ramos',
        cedula TEXT DEFAULT 'Céd. Prof. 8472910 UNAM',
        diagnostico TEXT,
        peso TEXT,
        talla TEXT,
        temperatura TEXT,
        alergias TEXT,
        medicamentos_json TEXT NOT NULL DEFAULT '[]',
        indicaciones_generales TEXT,
        location_id INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
        FOREIGN KEY (location_id) REFERENCES locations(id)
      )
    `);

    // 14. Licencias del Sistema & Control de Suscripciones
    db.run(`
      CREATE TABLE IF NOT EXISTS licencia_sistema (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        token_activo TEXT NOT NULL,
        codigo_licencia TEXT NOT NULL,
        titular TEXT NOT NULL,
        email TEXT,
        tipo TEXT DEFAULT 'ANUAL',
        fecha_emision TEXT NOT NULL,
        fecha_expiracion TEXT NOT NULL,
        pasarela_pago TEXT DEFAULT 'Stripe / Mercado Pago',
        auto_renovacion INTEGER DEFAULT 1,
        subscription_id TEXT,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Seed sample prescription if empty
    db.get('SELECT COUNT(*) as count FROM recetas', (err, row) => {
      if (!err && row && row.count === 0) {
        const sampleMeds = JSON.stringify([
          {
            nombre: 'Amoxicilina suspensión 250mg/5ml',
            dosis: '5 ml cada 8 horas',
            duracion: '7 días',
            indicacion: 'Tomar después de los alimentos. Completar esquema de 7 días.'
          },
          {
            nombre: 'Ibuprofeno jarabe 100mg/5ml',
            dosis: '5 ml cada 8 horas por razón necesaria',
            duracion: '3 días',
            indicacion: 'En caso de dolor o molestia dental.'
          }
        ]);
        db.run(`
          INSERT INTO recetas (
            patient_id, folio, fecha, doctor, cedula, diagnostico, peso, talla, temperatura, alergias, medicamentos_json, indicaciones_generales, location_id
          ) VALUES (
            1, 'REC-2026-001', date('now', 'localtime'), 'Dra. Rebeca Aguilar Ramos', 'Céd. Prof. 8472910 UNAM',
            'Pulpitis reversible posterior a pulpotomía pieza 54', '19.5 kg', '112 cm', '36.6 °C', 'Negadas',
            ?, 'Mantener higiene bucal suave en la zona tratada. Dieta blanda las primeras 24 horas y evitar alimentos calientes.', 1
          )
        `, [sampleMeds], (errRec) => {
          if (errRec) console.error('Error seeding sample receta:', errRec);
          else console.log('Sample receta REC-2026-001 seeded successfully');
        });
      }
    });

    // Seed default license if empty
    db.get('SELECT COUNT(*) as count FROM licencia_sistema', (err, row) => {
      if (!err && row && row.count === 0) {
        const secret = process.env.KONENEKOH_LICENSE_SECRET || 'kk-secret-license-signature-master-key-2026-smile-maker';
        const expDate = new Date();
        expDate.setDate(expDate.getDate() + 365);
        const expStr = expDate.toISOString().split('T')[0];
        const emisionStr = new Date().toISOString().split('T')[0];

        const payload = {
          titular: 'KoneneKoh Smile Maker',
          email: 'contacto@konenekoh.com',
          tipo: 'ANUAL',
          fecha_emision: emisionStr,
          fecha_expiracion: expStr,
          codigo: 'KK-2026-PRO-9841',
          sucursales_max: 5,
          actualizaciones_hasta: expStr,
          createdAt: Date.now()
        };

        const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
        const signature = crypto.createHmac('sha256', secret).update(payloadB64).digest('hex');
        const token = `KK.${payloadB64}.${signature}`;

        db.run(`
          INSERT INTO licencia_sistema (
            id, token_activo, codigo_licencia, titular, email, tipo, fecha_emision, fecha_expiracion, pasarela_pago, auto_renovacion, subscription_id
          ) VALUES (
            1, ?, 'KK-2026-PRO-9841', 'KoneneKoh Smile Maker', 'contacto@konenekoh.com', 'ANUAL', ?, ?, 'Stripe / Mercado Pago', 1, 'sub_sim_initial_pro'
          )
        `, [token, emisionStr, expStr], (errLic) => {
          if (errLic) console.error('Error seeding initial license:', errLic);
          else console.log('Initial license KK-2026-PRO-9841 seeded successfully');
        });
      }
    });

    // Seed default locations if empty
    db.get('SELECT COUNT(*) as count FROM locations', (err, row) => {
      if (!err && row && row.count === 0) {
        seedLocations();
      } else {
        // Ensure patients and appointments have location_id assigned
        updateLocationsLinkage();
      }
      seedInventarioSedes();
    });

    // Seed initial data if empty
    db.get('SELECT COUNT(*) as count FROM patients', (err, row) => {
      if (!err && row && row.count === 0) {
        seedDatabase();
      }
    });
  });
}

function seedLocations() {
  const locs = [
    {
      nombre: 'KoneneKoh Corregidora (Matriz)',
      codigo: 'CORR',
      direccion: 'Av. Candiles 512, Col. Candiles, Corregidora, Qro.',
      telefono: '4422371299',
      color: '#06b6d4'
    },
    {
      nombre: 'KoneneKoh Juriquilla',
      codigo: 'JURI',
      direccion: 'Blvd. Juriquilla 310, Plaza Santa Fe, Juriquilla, Qro.',
      telefono: '4424567890',
      color: '#10b981'
    },
    {
      nombre: 'KoneneKoh Centro Histórico',
      codigo: 'CENT',
      direccion: 'Av. Zaragoza 105, Col. Prados de la Capilla, Querétaro, Qro.',
      telefono: '4427891234',
      color: '#8b5cf6'
    }
  ];

  const stmt = db.prepare(`
    INSERT INTO locations (nombre, codigo, direccion, telefono, color)
    VALUES (?, ?, ?, ?, ?)
  `);
  locs.forEach(l => {
    stmt.run([l.nombre, l.codigo, l.direccion, l.telefono, l.color]);
  });
  stmt.finalize(updateLocationsLinkage);
}

function updateLocationsLinkage() {
  // Distribute demo patients across locations:
  // Corregidora (Location 1): Paola Pineda (1), Luis Gerardo (4), Amy Citlalli (6)
  db.run(`UPDATE patients SET location_id = 1 WHERE id IN (1, 4, 6) OR location_id IS NULL`);
  // Juriquilla (Location 2): Danna Valentina (3)
  db.run(`UPDATE patients SET location_id = 2 WHERE id = 3`);
  // Centro (Location 3): Brenda Andrade (2), Ethan Evia (5)
  db.run(`UPDATE patients SET location_id = 3 WHERE id IN (2, 5)`);

  // Update consultations to match patient location
  db.run(`
    UPDATE consultas SET location_id = (
      SELECT location_id FROM patients WHERE patients.id = consultas.patient_id
    ) WHERE location_id IS NULL OR location_id = 1
  `);
}

function seedInventarioSedes() {
  db.get('SELECT COUNT(*) as count FROM inventario_sedes', (err, row) => {
    if (!err && row && row.count === 0) {
      console.log('Inicializando stock de inventario por sede...');
      db.all('SELECT id, codigo, nombre, cantidad, stock_minimo, ubicacion FROM catalogo_productos', (err2, prods) => {
        if (err2 || !prods || prods.length === 0) return;

        const insertStmt = db.prepare(`
          INSERT OR REPLACE INTO inventario_sedes (producto_id, location_id, cantidad, stock_minimo, pasillo_gaveta)
          VALUES (?, ?, ?, ?, ?)
        `);

        // Known realistic distribution for primary clinical supplies
        const specificDist = {
          'MAT001': { c1: 4, c2: 2, c3: 2, u1: 'Vitrina 2, Gaveta B', u2: 'Vitrina A, Gaveta 1', u3: 'Estante 3, Gaveta Resinas' },
          'MAT002': { c1: 3, c2: 2, c3: 1, u1: 'Vitrina 2, Gaveta B', u2: 'Vitrina A, Gaveta 1', u3: 'Vitrina Central' },
          'MAT003': { c1: 8, c2: 4, c3: 4, u1: 'Gaveta Sillón 1', u2: 'Gaveta Sillón Pediatría', u3: 'Gaveta Sillón 1' },
          'MAT004': { c1: 15, c2: 8, c3: 9, u1: 'Gaveta Sillón 1', u2: 'Gaveta Sillón Pediatría', u3: 'Gaveta Sillón 2' },
          'INS001': { c1: 5, c2: 4, c3: 3, u1: 'Almacén 1, Estante 2', u2: 'Almacén Juriquilla', u3: 'Almacén General Centro' },
          'FAR001': { c1: 50, c2: 25, c3: 25, u1: 'Refrigerador Clínico', u2: 'Refrigerador Sillón', u3: 'Refrigerador Clínico' },
          'AD001':  { c1: 30, c2: 15, c3: 20, u1: 'Vitrina Recepción', u2: 'Mostrador Recepción', u3: 'Vitrina Recepción' },
          'AD002':  { c1: 40, c2: 20, c3: 25, u1: 'Vitrina Recepción', u2: 'Mostrador Recepción', u3: 'Vitrina Recepción' },
          'AD003':  { c1: 14, c2: 6, c3: 8, u1: 'Vitrina Recepción', u2: 'Vitrina Juriquilla', u3: 'Vitrina Recepción' },
          'AD004':  { c1: 20, c2: 10, c3: 12, u1: 'Vitrina Recepción', u2: 'Mostrador', u3: 'Vitrina Recepción' },
          'AD005':  { c1: 18, c2: 8, c3: 10, u1: 'Vitrina Recepción', u2: 'Mostrador', u3: 'Vitrina Recepción' },
        };

        prods.forEach(p => {
          const dist = specificDist[p.codigo] || {
            c1: Math.max(1, Math.round((p.cantidad || 10) * 0.5)),
            c2: Math.max(1, Math.round((p.cantidad || 10) * 0.25)),
            c3: Math.max(1, Math.round((p.cantidad || 10) * 0.25)),
            u1: p.ubicacion || 'Vitrina 1',
            u2: 'Vitrina Juriquilla',
            u3: 'Almacén Centro'
          };
          const min = p.stock_minimo || 5;

          insertStmt.run([p.id, 1, dist.c1, min, dist.u1]);
          insertStmt.run([p.id, 2, dist.c2, Math.max(2, Math.round(min * 0.6)), dist.u2]);
          insertStmt.run([p.id, 3, dist.c3, Math.max(2, Math.round(min * 0.6)), dist.u3]);

          // Update total quantity in catalogo_productos
          const totalStock = dist.c1 + dist.c2 + dist.c3;
          db.run('UPDATE catalogo_productos SET cantidad = ? WHERE id = ?', [totalStock, p.id]);
        });

        insertStmt.finalize(() => {
          console.log('Stock por sede distribuido correctamente.');
          db.run(`UPDATE movimientos_inventario SET location_id = 1 WHERE location_id IS NULL`);
        });
      });
    }
  });
}

function seedConsultas() {
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const dayAfter = new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0];

  const citas = [
    {
      patient_id: 1, // Paola Pineda
      fecha: today,
      hora_inicio: '09:00',
      hora_fin: '09:45',
      duracion_minutos: 45,
      motivo: 'Revisión Odontopediátrica y Sellador de fosetas (Dientes 55 y 65)',
      diagnostico: 'Dientes temporales con fosetas profundas sin caries activas.',
      doctor: 'Dra. Rebeca Aguilar',
      sillon: 'Sillón 1 (Pediatría)',
      location_id: 1,
      estado: 'En atención',
      notas: 'Paciente tranquila. Acompañada por su mamá.'
    },
    {
      patient_id: 2, // Brenda Andrade
      fecha: today,
      hora_inicio: '10:30',
      hora_fin: '11:15',
      duracion_minutos: 45,
      motivo: 'Ajuste de Brackets & Control de Ortodoncia',
      diagnostico: 'Maloclusión Clase I, alineación en progreso.',
      doctor: 'Dr. Carlos Ramos (Ortodoncista)',
      sillon: 'Sillón 2 (Ortodoncia)',
      location_id: 3,
      estado: 'En espera',
      notas: 'Cambio de ligaduras y arco superior 0.016.'
    },
    {
      patient_id: 3, // Danna Valentina
      fecha: today,
      hora_inicio: '12:00',
      hora_fin: '13:00',
      duracion_minutos: 60,
      motivo: 'Restauración con Resina 2 Superficies (Diente 64)',
      diagnostico: 'Lesión cariosa mesio-oclusal.',
      doctor: 'Dra. Rebeca Aguilar',
      sillon: 'Sillón 1 (Pediatría)',
      location_id: 2,
      estado: 'Programada',
      notas: 'Requiere anestesia tópica e infiltrativa suave.'
    },
    {
      patient_id: 4, // Luis Gerardo
      fecha: today,
      hora_inicio: '16:00',
      hora_fin: '16:45',
      duracion_minutos: 45,
      motivo: 'Primera Consulta y Valoración General',
      diagnostico: 'Revisión preventiva inicial de tejidos blandos y arcadas.',
      doctor: 'Dra. Rebeca Aguilar',
      sillon: 'Sillón 1 (Pediatría)',
      location_id: 1,
      estado: 'Programada',
      notas: 'Paciente nuevo.'
    },
    {
      patient_id: 5, // Ethan Evia
      fecha: tomorrow,
      hora_inicio: '10:00',
      hora_fin: '11:00',
      duracion_minutos: 60,
      motivo: 'Profilaxis Dental & Aplicación de Barniz de Flúor',
      diagnostico: 'Gingivitis marginal leve.',
      doctor: 'Dra. Rebeca Aguilar',
      sillon: 'Sillón 1 (Pediatría)',
      location_id: 3,
      estado: 'Programada',
      notas: 'Cita de seguimiento semestral.'
    },
    {
      patient_id: 6, // Amy Citlalli
      fecha: dayAfter,
      hora_inicio: '11:30',
      hora_fin: '12:15',
      duracion_minutos: 45,
      motivo: 'Revisión de mantenedor de espacio',
      diagnostico: 'Control post-extracción prematura.',
      doctor: 'Dra. Rebeca Aguilar',
      sillon: 'Sillón 2 (Ortodoncia)',
      location_id: 1,
      estado: 'Programada',
      notas: 'Revisar estabilidad de banda y ansa.'
    }
  ];

  const stmt = db.prepare(`
    INSERT INTO consultas (patient_id, fecha, hora_inicio, hora_fin, duracion_minutos, motivo, diagnostico, doctor, sillon, location_id, estado, notas)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  citas.forEach(c => {
    stmt.run([c.patient_id, c.fecha, c.hora_inicio, c.hora_fin, c.duracion_minutos, c.motivo, c.diagnostico, c.doctor, c.sillon, c.location_id || 1, c.estado, c.notas]);
  });
  stmt.finalize();
}

function seedClinicalProducts() {
  const clinical = [
    { codigo: 'MAT001', nombre: 'Resina Filtek Z350 XT A2', marca: '3M ESPE', cantidad: 3, stock_minimo: 6, categoria: 'Material Restaurador', proveedor: 'Dental Querétaro Express', ubicacion: 'Vitrina 2, Gaveta B', costo: 850.00, utilidad: 40, precio: 1190.00, iva: 190.40, precio_sin_iva: 1190.00, precio_con_iva: 1380.40 },
    { codigo: 'MAT002', nombre: 'Adhesivo Single Bond Universal 5ml', marca: '3M ESPE', cantidad: 2, stock_minimo: 4, categoria: 'Material Restaurador', proveedor: 'Dental Querétaro Express', ubicacion: 'Vitrina 2, Gaveta B', costo: 1200.00, utilidad: 35, precio: 1620.00, iva: 259.20, precio_sin_iva: 1620.00, precio_con_iva: 1879.20 },
    { codigo: 'MAT003', nombre: 'Sellador Clinpro Sealant', marca: '3M', cantidad: 7, stock_minimo: 5, categoria: 'Preventivo', proveedor: 'Depósito Dental Bajío', ubicacion: 'Gaveta Sillón 1', costo: 520.00, utilidad: 50, precio: 780.00, iva: 124.80, precio_sin_iva: 780.00, precio_con_iva: 904.80 },
    { codigo: 'MAT004', nombre: 'Flúor Barniz Duraphat 50mg/ml', marca: 'Colgate Oral', cantidad: 14, stock_minimo: 8, categoria: 'Preventivo', proveedor: 'Colgate Professional', ubicacion: 'Gaveta Sillón 1', costo: 380.00, utilidad: 45, precio: 551.00, iva: 88.16, precio_sin_iva: 551.00, precio_con_iva: 639.16 },
    { codigo: 'INS001', nombre: 'Guantes Nitrilo Rosa Talla S (Caja 100)', marca: 'Aurelia', cantidad: 4, stock_minimo: 10, categoria: 'Insumos de Protección', proveedor: 'Médica Central', ubicacion: 'Almacén 1', costo: 160.00, utilidad: 25, precio: 200.00, iva: 32.00, precio_sin_iva: 200.00, precio_con_iva: 232.00 },
    { codigo: 'FAR001', nombre: 'Mepivacaína 3% sin vasoconstrictor', marca: 'Zeyco', cantidad: 45, stock_minimo: 20, categoria: 'Anestesia & Fármacos', proveedor: 'Depósito Dental Bajío', ubicacion: 'Refrigerador Clínico', costo: 450.00, utilidad: 30, precio: 585.00, iva: 93.60, precio_sin_iva: 585.00, precio_con_iva: 678.60 }
  ];

  const stmt = db.prepare(`
    INSERT INTO catalogo_productos (codigo, nombre, marca, cantidad, stock_minimo, categoria, proveedor, ubicacion, costo, utilidad, precio, iva, precio_sin_iva, precio_con_iva)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  clinical.forEach(p => {
    stmt.run([p.codigo, p.nombre, p.marca, p.cantidad, p.stock_minimo, p.categoria, p.proveedor, p.ubicacion, p.costo, p.utilidad, p.precio, p.iva, p.precio_sin_iva, p.precio_con_iva], function(err) {
      if (!err) {
        db.run(`
          INSERT INTO movimientos_inventario (producto_id, tipo, cantidad, motivo, usuario)
          VALUES (?, 'Entrada', ?, 'Carga inicial de inventario', 'raguilar')
        `, [this.lastID, p.cantidad]);
      }
    });
  });
  stmt.finalize();
}

function seedDatabase() {
  const patients = [
    {
      expediente: 'PD185',
      nombre: 'Paola Pineda Lopez',
      foto: 'https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&q=80&w=200',
      fecha_nacimiento: '2014-05-25',
      lugar_nacimiento: 'Queretaro',
      calle: 'Caoba',
      num_exterior: '19',
      num_interior: 'B',
      colonia: 'San jose',
      municipio: 'Corregidora',
      estado: 'Querétaro',
      cp: '76250',
      telefono: '4422371299',
      celular: '4422371299',
      email: 'paola.pineda@ejemplo.com',
      rfc: 'PILP140525XXX',
      location_id: 1,
      padre_tutor: 'Sra. Mariana Lopez'
    },
    {
      expediente: 'PD180',
      nombre: 'Brenda Andrade Velazquez',
      foto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      fecha_nacimiento: '2011-03-12',
      lugar_nacimiento: 'Queretaro',
      calle: 'Av. Constituyentes',
      num_exterior: '230',
      colonia: 'El Carrizal',
      municipio: 'Querétaro',
      estado: 'Querétaro',
      cp: '76030',
      telefono: '4421112233',
      celular: '4421112233',
      email: 'brenda.andrade@ejemplo.com',
      rfc: 'AAVB110312XXX',
      location_id: 3,
      padre_tutor: 'Roberto Andrade'
    },
    {
      expediente: 'PD181',
      nombre: 'Danna Valentina De la Paz Rosas',
      foto: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200',
      fecha_nacimiento: '2013-08-19',
      lugar_nacimiento: 'Queretaro',
      calle: 'Hacienda Grande',
      num_exterior: '45',
      colonia: 'El Jacal',
      municipio: 'Querétaro',
      estado: 'Querétaro',
      cp: '76180',
      telefono: '4423334455',
      celular: '4423334455',
      email: 'danna.paz@ejemplo.com',
      rfc: 'PARD130819XXX',
      location_id: 2,
      padre_tutor: 'Rosa Rosas'
    },
    {
      expediente: 'PD182',
      nombre: 'Luis Gerardo López Grappin',
      foto: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200',
      fecha_nacimiento: '2015-11-04',
      lugar_nacimiento: 'Queretaro',
      calle: 'Paseo de la Constitución',
      num_exterior: '802',
      colonia: 'Arboledas',
      municipio: 'Querétaro',
      estado: 'Querétaro',
      cp: '76140',
      telefono: '4425556677',
      celular: '4425556677',
      email: 'gerardo.lopez@ejemplo.com',
      rfc: 'LOGL151104XXX',
      location_id: 1,
      padre_tutor: 'Gerardo López'
    },
    {
      expediente: 'PD183',
      nombre: 'Ethan Evia Mejía',
      foto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
      fecha_nacimiento: '2016-02-14',
      lugar_nacimiento: 'Queretaro',
      calle: 'Prol. Zaragoza',
      num_exterior: '105',
      colonia: 'Prados de la Capilla',
      municipio: 'Querétaro',
      estado: 'Querétaro',
      cp: '76176',
      telefono: '4427778899',
      celular: '4427778899',
      email: 'ethan.evia@ejemplo.com',
      rfc: 'EIME160214XXX',
      location_id: 3,
      padre_tutor: 'Ana Mejía'
    },
    {
      expediente: 'PD184',
      nombre: 'Amy Citlalli Lopez Ledesma',
      foto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
      fecha_nacimiento: '2012-07-30',
      lugar_nacimiento: 'Queretaro',
      calle: 'Av. Candiles',
      num_exterior: '512',
      colonia: 'Candiles',
      municipio: 'Corregidora',
      estado: 'Querétaro',
      cp: '76903',
      telefono: '4429990011',
      celular: '4429990011',
      email: 'amy.lopez@ejemplo.com',
      rfc: 'LOLA120730XXX',
      location_id: 1,
      padre_tutor: 'Carlos López'
    }
  ];

  const stmt = db.prepare(`
    INSERT INTO patients (expediente, nombre, foto, fecha_nacimiento, lugar_nacimiento, calle, num_exterior, num_interior, colonia, municipio, estado, cp, telefono, celular, email, rfc, padre_tutor, location_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  patients.forEach((p, index) => {
    stmt.run([
      p.expediente, p.nombre, p.foto, p.fecha_nacimiento, p.lugar_nacimiento,
      p.calle, p.num_exterior, p.num_interior || '', p.colonia, p.municipio,
      p.estado, p.cp, p.telefono, p.celular, p.email, p.rfc, p.padre_tutor,
      p.location_id || 1
    ], function(err) {
      if (!err) {
        const patientId = this.lastID;
        db.run(`
          INSERT INTO antecedentes (patient_id, generales, andrologicos, perinatales, signos_vitales, patologicos, heredo_familiares, no_patologicos, gineco_obstetricos)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          patientId,
          'Paciente en buen estado general. Sin alergias medicamentosas conocidas.',
          'No aplica.',
          'Nacido a término (39 SDG), parto eutócico sin complicaciones.',
          'TA: 100/65, FC: 84 lpm, FR: 20 rpm, Temp: 36.5 °C, Peso: 21 kg.',
          'Enfermedades de la infancia habituales (varicela a los 3 años). Ninguna cirugía.',
          'Madre sana, padre con hipertensión controlada. Abuela materna con DM2.',
          'Vivienda con todos los servicios. Cepillado dental 2 veces al día supervisado.',
          'No aplica.'
        ]);

        if (index === 0) {
          db.run(`
            INSERT INTO presupuestos (patient_id, folio, fecha, titulo, observaciones, total, descuento, estado, tipo_denticion)
            VALUES (?, 'ODO327', '2020-01-11', 'Tratamiento Integral Inicial', 'Se detectan lesiones cariosas en molares temporales 54 y 64. Profilaxis general requerida.', 3450.00, 0, 'Aprobado', 'pediatrico')
          `, [patientId], function(err2) {
            if (!err2) {
              const presupuestoId = this.lastID;
              db.run(`
                INSERT INTO presupuesto_items (presupuesto_id, diente, superficie, tratamiento_id, descripcion, precio_unitario, cantidad, total, estado, color)
                VALUES 
                  (?, 54, 'O', 1, 'Resina Oclusal (Diente 54)', 650.00, 1, 650.00, 'Realizado', '#ef4444'),
                  (?, 64, 'MO', 2, 'Resina 2 Superficies Mesio-Oclusal (Diente 64)', 850.00, 1, 850.00, 'En proceso', '#ef4444'),
                  (?, 55, 'O', 5, 'Sellador de Fosetas y Fisuras (Diente 55)', 450.00, 1, 450.00, 'Pendiente', '#3b82f6'),
                  (?, 65, 'O', 5, 'Sellador de Fosetas y Fisuras (Diente 65)', 450.00, 1, 450.00, 'Pendiente', '#3b82f6'),
                  (?, NULL, 'General', 7, 'Profilaxis y Aplicación Tópica de Flúor', 1050.00, 1, 1050.00, 'Realizado', '#10b981')
              `, [presupuestoId, presupuestoId, presupuestoId, presupuestoId, presupuestoId]);

              const initialOdonto = {
                54: { surfaces: { o: { condition: 'caries', treatment: 'Resina Oclusal', price: 650 } } },
                64: { surfaces: { o: { condition: 'caries', treatment: 'Resina 2 Superficies', price: 850 }, m: { condition: 'caries', treatment: 'Resina 2 Superficies', price: 0 } } },
                55: { surfaces: { o: { condition: 'sellador', treatment: 'Sellador', price: 450 } } },
                65: { surfaces: { o: { condition: 'sellador', treatment: 'Sellador', price: 450 } } }
              };

              db.run(`
                INSERT INTO odontogramas (presupuesto_id, patient_id, tipo_denticion, dientes_json)
                VALUES (?, ?, 'pediatrico', ?)
              `, [presupuestoId, patientId, JSON.stringify(initialOdonto)]);

              db.run(`
                INSERT INTO pagos (patient_id, presupuesto_id, folio_pago, fecha, monto, tipo_pago, notas)
                VALUES 
                  (?, ?, 'PAG-001', '2020-01-11', 1500.00, 'Efectivo', 'Anticipo al iniciar plan de tratamiento'),
                  (?, ?, 'PAG-002', '2020-01-25', 1000.00, 'Transferencia', 'Abono tras realización de profilaxis y resina 54')
              `, [patientId, presupuestoId, patientId, presupuestoId]);
            }
          });

          db.run(`
            INSERT INTO consentimientos (patient_id, folio, fecha, categoria, firmado)
            VALUES 
              (?, 'CI058', '2020-01-11', 'Pediatría', 1),
              (?, 'CI059', '2020-01-13', 'Ortodoncia', 0)
          `, [patientId, patientId]);
        }
      }
    });
  });
  stmt.finalize();

  seedClinicalProducts();
  seedConsultas();
  seedRecetas();
}

function seedRecetas() {
  db.get('SELECT COUNT(*) as count FROM recetas', (err, row) => {
    if (!err && row && row.count === 0) {
      const sampleMeds = [
        {
          medicamento: 'Amoxicilina Suspensión 250mg/5ml',
          dosis: '5 ml',
          frecuencia: 'Cada 8 horas',
          duracion: '7 días',
          indicaciones: 'Tomar con los alimentos. Completar el ciclo indicado.'
        },
        {
          medicamento: 'Ibuprofeno Suspensión 100mg/5ml',
          dosis: '7.5 ml',
          frecuencia: 'Cada 8 horas por 3 días',
          duracion: '3 días',
          indicaciones: 'Únicamente en caso de dolor o inflamación post-operatoria.'
        }
      ];

      db.run(`
        INSERT INTO recetas (patient_id, folio, fecha, doctor, cedula, diagnostico, peso, talla, temperatura, alergias, medicamentos_json, indicaciones_generales, location_id)
        VALUES (?, 'REC-101', date('now', 'localtime'), 'Dra. Rebeca Aguilar Ramos', 'Céd. Prof. 8472910 UNAM', 'Post-operatorio restauración resinas y selladores', '28.5 kg', '1.25 m', '36.5 °C', 'Negadas', ?, 'Dieta blanda por 24 hrs. Evitar alimentos con colorantes intensos o azúcares pegajosos. Mantener cepillado dental suave con pasta fluorada.', 1)
      `, [1, JSON.stringify(sampleMeds)]);
    }
  });
}
