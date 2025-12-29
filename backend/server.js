// ===== SERVIDOR BACKEND - ÚLTIMA MILLA =====
// Servidor Express con MongoDB para gestión de despachos

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");

// Importar modelos desde backend.js
const { EmpresaReparto, Despacho, Ruta } = require("./backend");

// Importar fetch para Node.js
const fetch = require("node-fetch");

// ===== CONFIGURACIÓN =====
const app = express();
const PORT = process.env.PORT || 4000; // Puerto 4000 para no interferir con frontend (3000)

// IMPORTANTE: Cambiar esta URL cuando se despliegue en producción
// Desarrollo: mongodb://localhost:27017/ultimamillav2
// Producción: mongodb://192.168.200.80:27017/ultimamillav2
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/ultimamillav2";

// ===== MIDDLEWARES GLOBALES =====
app.use(cors()); // Permite peticiones desde el frontend
app.use(express.json()); // Parse de JSON en el body
app.use(express.urlencoded({ extended: true })); // Parse de form data

// ===== MIDDLEWARE DE AUTENTICACIÓN =====
const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("❌ Token no proporcionado o formato incorrecto");
      return res.status(401).json({
        status: "error",
        message: "Token no proporcionado",
      });
    }

    const token = authHeader.split(" ")[1];
    console.log("🔑 Token recibido:", token.substring(0, 50) + "...");

    // Decodificar sin verificar ya que el servidor remoto ya verificó el token
    const decoded = jwt.decode(token, { complete: false });

    console.log("✅ Token decodificado:", decoded ? "Éxito" : "Falló");
    if (decoded) {
      console.log("👤 Usuario:", decoded.usuario, "Rol:", decoded.rol);
    }

    if (!decoded) {
      return res.status(401).json({
        status: "error",
        message: "Token inválido",
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error("❌ Error al procesar token:", error);
    return res.status(500).json({
      status: "error",
      message: "Error al procesar token",
      error: error.message,
    });
  }
};

// ===== MIDDLEWARE DE AUTORIZACIÓN POR ROLES =====
const requireRoles = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: "error",
        message: "Usuario no autenticado",
      });
    }

    const userRoles = Array.isArray(req.user.rol)
      ? req.user.rol
      : [req.user.rol];

    const hasPermission = userRoles.some((role) => allowedRoles.includes(role));

    if (!hasPermission) {
      return res.status(403).json({
        status: "error",
        message: "No tienes permisos para acceder a este recurso",
        requiredRoles: allowedRoles,
        userRoles: userRoles,
      });
    }

    next();
  };
};

// ===== SERVICIO DE SINCRONIZACIÓN DE DESPACHOS =====
const EXTERNAL_API_URL = "http://192.168.200.80:3000/data/FactDespacho";
const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutos en milisegundos

function isDespachoTerminal(estado) {
  return estado === "entregado" || estado === "no_entregado" || estado === "cancelado";
}

function userHasRole(user, role) {
  if (!user) return false;
  const roles = Array.isArray(user.rol) ? user.rol : [user.rol];
  return roles.includes(role);
}

function normalizeRut(rut) {
  return String(rut).replace(/[.\-\s]/g, "").toUpperCase();
}

function isEmpresaPropia(empresa) {
  if (!empresa) return false;

  const slugPropio = process.env.EMPRESA_PROPIA_SLUG;
  if (slugPropio && empresa.slug && String(empresa.slug).toLowerCase() === String(slugPropio).toLowerCase()) {
    return true;
  }

  const rutPropio = process.env.EMPRESA_PROPIA_RUT;
  if (rutPropio && normalizeRut(empresa.rut) === normalizeRut(rutPropio)) {
    return true;
  }

  const nombrePropio = process.env.EMPRESA_PROPIA_NOMBRE;
  if (
    nombrePropio &&
    String(empresa.razonSocial || "")
      .toLowerCase()
      .includes(String(nombrePropio).toLowerCase())
  ) {
    return true;
  }

  if (empresa.slug && String(empresa.slug).toLowerCase() === "vivipra") return true;
  return String(empresa.razonSocial || "").toLowerCase().includes("vivipra");
}

function getUserKey(req) {
  return req.user && (req.user.usuario || req.user.id || req.user._id)
    ? String(req.user.usuario || req.user.id || req.user._id).toLowerCase()
    : null;
}

// Función para sincronizar despachos desde el endpoint externo
async function sincronizarDespachos() {
  try {
    console.log("🔄 Sincronizando despachos desde API externa...");

    const response = await fetch(EXTERNAL_API_URL);
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const despachos = await response.json();
    let nuevos = 0;
    let actualizados = 0;

    for (const despachoDatos of despachos) {
      try {
        // Buscar si ya existe por FolioNum
        const existente = await Despacho.findOne({ FolioNum: despachoDatos.FolioNum });

        if (existente) {
          // Actualizar solo si hay cambios
          await Despacho.findByIdAndUpdate(existente._id, despachoDatos);
          actualizados++;
        } else {
          // Crear nuevo despacho con estado pendiente por defecto
          const nuevoDespacho = new Despacho({
            ...despachoDatos,
            estado: "pendiente",
          });
          await nuevoDespacho.save();
          nuevos++;
        }
      } catch (error) {
        console.error(`Error al procesar despacho ${despachoDatos.FolioNum}:`, error.message);
      }
    }

    console.log(`✅ Sincronización completada: ${nuevos} nuevos, ${actualizados} actualizados`);
  } catch (error) {
    console.error("❌ Error al sincronizar despachos:", error.message);
  }
}

// Iniciar sincronización automática después de conectar a MongoDB
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ Conectado a MongoDB:", MONGO_URI);

    // Sincronizar inmediatamente al iniciar
    sincronizarDespachos();

    // Sincronizar cada 5 minutos
    setInterval(sincronizarDespachos, SYNC_INTERVAL);
    console.log(`🔁 Sincronización automática activada (cada ${SYNC_INTERVAL / 1000 / 60} minutos)`);
  })
  .catch((error) => {
    console.error("❌ Error al conectar a MongoDB:", error);
    process.exit(1);
  });

// ===== RUTA DE PRUEBA =====
app.get("/", (req, res) => {
  res.json({
    status: "success",
    message: "API Última Milla funcionando correctamente",
    version: "1.0.0",
  });
});

// ================================================================
// ===== ENDPOINTS: EMPRESAS DE REPARTO =====
// ================================================================
// Solo adminBodega y subBodega pueden gestionar empresas

// GET /api/empresas - Obtener todas las empresas
app.get(
  "/api/empresas",
  authMiddleware,
  requireRoles(["admin", "adminBodega", "subBodega"]),
  async (req, res) => {
    try {
      const empresas = await EmpresaReparto.find().sort({ createdAt: -1 });
      res.json({
        status: "success",
        data: empresas,
        count: empresas.length,
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: "Error al obtener empresas",
        error: error.message,
      });
    }
  }
);

// GET /api/empresas/:id - Obtener una empresa específica
app.get(
  "/api/empresas/:id",
  authMiddleware,
  requireRoles(["admin", "adminBodega", "subBodega"]),
  async (req, res) => {
    try {
      const empresa = await EmpresaReparto.findById(req.params.id);

      if (!empresa) {
        return res.status(404).json({
          status: "error",
          message: "Empresa no encontrada",
        });
      }

      res.json({
        status: "success",
        data: empresa,
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: "Error al obtener empresa",
        error: error.message,
      });
    }
  }
);

// POST /api/empresas - Crear nueva empresa
app.post(
  "/api/empresas",
  authMiddleware,
  requireRoles(["admin", "adminBodega", "subBodega"]),
  async (req, res) => {
    try {
      const empresa = new EmpresaReparto(req.body);
      await empresa.save();

      res.status(201).json({
        status: "success",
        message: "Empresa creada exitosamente",
        data: empresa,
      });
    } catch (error) {
      // Error de duplicado (RUT ya existe)
      if (error.code === 11000) {
        return res.status(400).json({
          status: "error",
          message: "El RUT ya está registrado",
        });
      }

      res.status(400).json({
        status: "error",
        message: "Error al crear empresa",
        error: error.message,
      });
    }
  }
);

// PUT /api/empresas/:id - Actualizar empresa
app.put(
  "/api/empresas/:id",
  authMiddleware,
  requireRoles(["admin", "adminBodega", "subBodega"]),
  async (req, res) => {
    try {
      if (req.body && req.body.razonSocial && !req.body.slug) {
        const text = String(req.body.razonSocial || "")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, " ");

        const stopwords = new Set([
          "sa",
          "s",
          "a",
          "ltda",
          "spa",
          "limitada",
          "ltd",
          "srl",
          "eirl",
          "inc",
          "corp",
          "cia",
          "compania",
          "y",
          "de",
          "del",
          "la",
          "el",
          "los",
          "las",
        ]);

        req.body.slug = text
          .split(/\s+/)
          .map((w) => w.trim())
          .filter(Boolean)
          .filter((w) => !stopwords.has(w))
          .join("");
      }

      const empresa = await EmpresaReparto.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );

      if (!empresa) {
        return res.status(404).json({
          status: "error",
          message: "Empresa no encontrada",
        });
      }

      res.json({
        status: "success",
        message: "Empresa actualizada exitosamente",
        data: empresa,
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({
          status: "error",
          message: "El RUT o slug ya est  registrado",
        });
      }

      res.status(400).json({
        status: "error",
        message: "Error al actualizar empresa",
        error: error.message,
      });
    }
  }
);

// DELETE /api/empresas/:id - Eliminar empresa
app.delete(
  "/api/empresas/:id",
  authMiddleware,
  requireRoles(["admin", "adminBodega", "subBodega"]),
  async (req, res) => {
    try {
      const empresa = await EmpresaReparto.findByIdAndDelete(req.params.id);

      if (!empresa) {
        return res.status(404).json({
          status: "error",
          message: "Empresa no encontrada",
        });
      }

      res.json({
        status: "success",
        message: "Empresa eliminada exitosamente",
        data: empresa,
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: "Error al eliminar empresa",
        error: error.message,
      });
    }
  }
);

// ================================================================
// ===== ENDPOINTS: DESPACHOS =====
// ================================================================
// chofer, subBodega, adminBodega pueden gestionar despachos

// GET /api/despachos - Obtener todos los despachos
app.get(
  "/api/despachos",
  authMiddleware,
  requireRoles(["admin", "chofer", "subBodega", "adminBodega"]),
  async (req, res) => {
    try {
      const despachos = await Despacho.find()
        .populate("empresaReparto")
        .populate("rutaAsignada")
        .sort({ createdAt: -1 });

      res.json({
        status: "success",
        data: despachos,
        count: despachos.length,
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: "Error al obtener despachos",
        error: error.message,
      });
    }
  }
);

// GET /api/despachos/:id - Obtener un despacho específico
app.get(
  "/api/despachos/:id",
  authMiddleware,
  requireRoles(["admin", "chofer", "subBodega", "adminBodega"]),
  async (req, res) => {
    try {
      const despacho = await Despacho.findById(req.params.id)
        .populate("empresaReparto")
        .populate("rutaAsignada");

      if (!despacho) {
        return res.status(404).json({
          status: "error",
          message: "Despacho no encontrado",
        });
      }

      res.json({
        status: "success",
        data: despacho,
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: "Error al obtener despacho",
        error: error.message,
      });
    }
  }
);

// POST /api/despachos - Crear nuevo despacho
app.post(
  "/api/despachos",
  authMiddleware,
  requireRoles(["admin", "chofer", "subBodega", "adminBodega"]),
  async (req, res) => {
    try {
      const despacho = new Despacho(req.body);
      await despacho.save();

      res.status(201).json({
        status: "success",
        message: "Despacho creado exitosamente",
        data: despacho,
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({
          status: "error",
          message: "El número de despacho ya existe",
        });
      }

      res.status(400).json({
        status: "error",
        message: "Error al crear despacho",
        error: error.message,
      });
    }
  }
);

// PUT /api/despachos/:id - Actualizar despacho
app.put(
  "/api/despachos/:id",
  authMiddleware,
  requireRoles(["admin", "chofer", "subBodega", "adminBodega"]),
  async (req, res) => {
    try {
      const wantsToMarkDelivered =
        req.body &&
        (req.body.estado === "entregado" ||
          req.body.estado === "no_entregado" ||
          Object.prototype.hasOwnProperty.call(req.body, "entrega") ||
          Object.prototype.hasOwnProperty.call(req.body, "noEntrega"));

      if (wantsToMarkDelivered && !userHasRole(req.user, "chofer")) {
        return res.status(403).json({
          status: "error",
          message: "Solo un chofer puede marcar entregas/no entregas",
        });
      }

      const despacho = await Despacho.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      )
        .populate("empresaReparto")
        .populate("rutaAsignada");

      if (!despacho) {
        return res.status(404).json({
          status: "error",
          message: "Despacho no encontrado",
        });
      }

      res.json({
        status: "success",
        message: "Despacho actualizado exitosamente",
        data: despacho,
      });
    } catch (error) {
      res.status(400).json({
        status: "error",
        message: "Error al actualizar despacho",
        error: error.message,
      });
    }
  }
);

// POST /api/despachos/:id/entregar - Marcar despacho como entregado
app.post(
  "/api/despachos/:id/entregar",
  authMiddleware,
  requireRoles(["chofer"]),
  async (req, res) => {
    try {
      const despacho = await Despacho.findById(req.params.id);

      if (!despacho) {
        return res.status(404).json({
          status: "error",
          message: "Despacho no encontrado",
        });
      }

      // Evitar re-marcar si ya está finalizado
      if (despacho.estado === "entregado" || despacho.estado === "no_entregado") {
        return res.status(400).json({
          status: "error",
          message: "El despacho ya fue marcado como entregado/no entregado",
        });
      }

      // Marcar como entregado
      despacho.estado = "entregado";
      await despacho.save();

      // Verificar si este despacho pertenece a una ruta
      if (despacho.rutaAsignada) {
        const ruta = await Ruta.findById(despacho.rutaAsignada).populate("despachos");

        if (ruta) {
          // Obtener todos los IDs de despachos de la ruta
          const despachosIds = ruta.despachos.map(d => d._id || d);

          // Verificar si todos los despachos están entregados
          const todosEntregados = await Despacho.find({
            _id: { $in: despachosIds }
          });

          const todosEstanEntregados = todosEntregados.every(d => isDespachoTerminal(d.estado));

          // Si todos están entregados, marcar la ruta como finalizada
          if (todosEstanEntregados) {
            ruta.estado = "finalizada";
            ruta.fechaFinalizacion = new Date();
            await ruta.save();
            console.log(`✅ Ruta ${ruta.numeroRuta} marcada como finalizada - Todos los despachos entregados`);
          }
        }
      }

      res.json({
        status: "success",
        message: "Despacho marcado como entregado",
        data: despacho,
      });
    } catch (error) {
      console.error("❌ Error al marcar despacho como entregado:", error);
      res.status(500).json({
        status: "error",
        message: "Error al marcar despacho como entregado",
        error: error.message,
      });
    }
  }
);

// DELETE /api/despachos/:id - Eliminar despacho
app.delete(
  "/api/despachos/:id",
  authMiddleware,
  requireRoles(["admin", "chofer", "subBodega", "adminBodega"]),
  async (req, res) => {
    try {
      const despacho = await Despacho.findByIdAndDelete(req.params.id);

      if (!despacho) {
        return res.status(404).json({
          status: "error",
          message: "Despacho no encontrado",
        });
      }

      res.json({
        status: "success",
        message: "Despacho eliminado exitosamente",
        data: despacho,
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: "Error al eliminar despacho",
        error: error.message,
      });
    }
  }
);

// ================================================================
// ===== ENDPOINTS: RUTAS =====
// ================================================================
// chofer, subBodega, adminBodega pueden gestionar rutas

// GET /api/rutas - Obtener todas las rutas
app.get(
  "/api/rutas",
  authMiddleware,
  requireRoles(["admin", "subBodega", "adminBodega"]),
  async (req, res) => {
    try {
      const rutas = await Ruta.find()
        .populate("empresaReparto")
        .populate("despachos")
        .sort({ createdAt: -1 });

      res.json({
        status: "success",
        data: rutas,
        count: rutas.length,
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: "Error al obtener rutas",
        error: error.message,
      });
    }
  }
);

// GET /api/rutas/mis-rutas - Obtener rutas para el chofer/empresa logueada
app.get(
  "/api/rutas/mis-rutas",
  authMiddleware,
  requireRoles(["chofer"]),
  async (req, res) => {
    try {
      const userKey = getUserKey(req);
      if (!userKey) {
        return res.status(401).json({
          status: "error",
          message: "Usuario no autenticado",
        });
      }

      // Caso 1: chofer interno (ruta.conductor = usuario)
      const rutasConductor = await Ruta.find({ conductor: userKey })
        .populate("empresaReparto")
        .populate("despachos")
        .sort({ createdAt: -1 });

      // Caso 2: cuenta de empresa externa (usuario == EmpresaReparto.slug)
      const empresa = await EmpresaReparto.findOne({
        $or: [{ slug: userKey }, { usuarioCuenta: userKey }],
      })
        .select({ _id: 1 })
        .lean();

      let rutasEmpresa = [];
      if (empresa) {
        rutasEmpresa = await Ruta.find({ empresaReparto: empresa._id })
          .populate("empresaReparto")
          .populate("despachos")
          .sort({ createdAt: -1 });
      }

      const map = new Map();
      for (const r of [...rutasConductor, ...rutasEmpresa]) {
        map.set(String(r._id), r);
      }

      const rutas = Array.from(map.values());

      res.json({
        status: "success",
        data: rutas,
        count: rutas.length,
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: "Error al obtener rutas",
        error: error.message,
      });
    }
  }
);

// GET /api/rutas/:id - Obtener una ruta específica
app.get(
  "/api/rutas/:id",
  authMiddleware,
  requireRoles(["admin", "chofer", "subBodega", "adminBodega"]),
  async (req, res) => {
    try {
      const ruta = await Ruta.findById(req.params.id)
        .populate("empresaReparto")
        .populate("despachos");

      if (!ruta) {
        return res.status(404).json({
          status: "error",
          message: "Ruta no encontrada",
        });
      }

      // Restringir acceso a choferes: solo su propia ruta o rutas de su empresa externa
      const isPrivileged = userHasRole(req.user, "admin") || userHasRole(req.user, "adminBodega") || userHasRole(req.user, "subBodega");
      if (!isPrivileged && userHasRole(req.user, "chofer")) {
        const userKey = getUserKey(req);
        if (!userKey) {
          return res.status(401).json({
            status: "error",
            message: "Usuario no autenticado",
          });
        }

        let allowed = String(ruta.conductor || "").toLowerCase() === userKey;
        if (!allowed && ruta.empresaReparto && ruta.empresaReparto.slug) {
          allowed = String(ruta.empresaReparto.slug).toLowerCase() === userKey;
        }

        if (!allowed) {
          return res.status(403).json({
            status: "error",
            message: "No tienes permisos para ver esta ruta",
          });
        }
      }

      res.json({
        status: "success",
        data: ruta,
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: "Error al obtener ruta",
        error: error.message,
      });
    }
  }
);

// POST /api/rutas - Crear nueva ruta
app.post(
  "/api/rutas",
  authMiddleware,
  requireRoles(["admin", "chofer", "subBodega", "adminBodega"]),
  async (req, res) => {
    try {
      console.log("📝 Datos recibidos para crear ruta:", JSON.stringify(req.body, null, 2));

      const asignadoPor =
        req.user && (req.user.usuario || req.user.id || req.user._id)
          ? String(req.user.usuario || req.user.id || req.user._id)
          : null;

      if (!asignadoPor) {
        return res.status(400).json({
          status: "error",
          message:
            "No se pudo determinar el usuario que asigna (asignadoPor) desde el token",
        });
      }

      const empresa = await EmpresaReparto.findById(req.body.empresaReparto);
      if (!empresa) {
        return res.status(400).json({
          status: "error",
          message: "Empresa de reparto no encontrada",
        });
      }

      const empresaEsPropia = isEmpresaPropia(empresa);

      if (empresaEsPropia) {
        if (!req.body.conductor || String(req.body.conductor).trim() === "") {
          return res.status(400).json({
            status: "error",
            message: "Debes seleccionar un conductor para la empresa propia",
          });
        }
      }

      const conductor = empresaEsPropia
        ? String(req.body.conductor).trim()
        : "Pendiente";

      const ruta = new Ruta({
        ...req.body,
        asignadoPor,
        conductor,
        esChoferExterno: empresaEsPropia ? Boolean(req.body.esChoferExterno) : true,
      });
      await ruta.save();

      console.log("✅ Ruta creada exitosamente:", ruta._id);

      // Actualizar los despachos asignados a esta ruta
      if (ruta.despachos && ruta.despachos.length > 0) {
        await Despacho.updateMany(
          { _id: { $in: ruta.despachos } },
          {
            $set: {
              estado: "asignado",
              rutaAsignada: ruta._id,
              empresaReparto: ruta.empresaReparto
            }
          }
        );
        console.log(`✅ ${ruta.despachos.length} despachos actualizados a estado 'asignado'`);
      }

      res.status(201).json({
        status: "success",
        message: "Ruta creada exitosamente",
        data: ruta,
      });
    } catch (error) {
      console.error("❌ Error al crear ruta:", error.message);
      console.error("❌ Detalles del error:", error);

      if (error.code === 11000) {
        return res.status(400).json({
          status: "error",
          message: "El número de ruta ya existe",
        });
      }

      res.status(400).json({
        status: "error",
        message: "Error al crear ruta",
        error: error.message,
        details: error.errors ? Object.keys(error.errors).map(key => ({
          field: key,
          message: error.errors[key].message
        })) : []
      });
    }
  }
);

// PUT /api/rutas/:id - Actualizar ruta
app.put(
  "/api/rutas/:id",
  authMiddleware,
  requireRoles(["admin", "chofer", "subBodega", "adminBodega"]),
  async (req, res) => {
    try {
      const ruta = await Ruta.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      })
        .populate("empresaReparto")
        .populate("despachos");

      if (!ruta) {
        return res.status(404).json({
          status: "error",
          message: "Ruta no encontrada",
        });
      }

      res.json({
        status: "success",
        message: "Ruta actualizada exitosamente",
        data: ruta,
      });
    } catch (error) {
      res.status(400).json({
        status: "error",
        message: "Error al actualizar ruta",
        error: error.message,
      });
    }
  }
);


// POST /api/rutas/:id/iniciar - Iniciar ruta (chofer ingresa patente y datos si es externo)
app.post(
  "/api/rutas/:id/iniciar",
  authMiddleware,
  requireRoles(["chofer"]),
  async (req, res) => {
    try {
      const { patente, nombreConductor } = req.body;

      if (!patente) {
        return res.status(400).json({
          status: "error",
          message: "La patente es obligatoria para iniciar la ruta",
        });
      }

      const ruta = await Ruta.findById(req.params.id);

      if (!ruta) {
        return res.status(404).json({
          status: "error",
          message: "Ruta no encontrada",
        });
      }

      // Si la ruta ya está iniciada o finalizada
      if (ruta.estado !== "pendiente") {
        return res.status(400).json({
          status: "error",
          message: `La ruta ya está en estado: ${ruta.estado}`,
        });
      }

      // Si es chofer externo, registrar el nombre real y asociar la ruta a la cuenta que inicia
      if (ruta.esChoferExterno) {
        if (!nombreConductor) {
          return res.status(400).json({
            status: "error",
            message: "El nombre del conductor es obligatorio para chofer externo",
          });
        }

        const usuarioChofer =
          req.user && (req.user.usuario || req.user.id || req.user._id)
            ? String(req.user.usuario || req.user.id || req.user._id)
            : null;

        if (!usuarioChofer) {
          return res.status(400).json({
            status: "error",
            message: "No se pudo determinar el usuario chofer desde el token",
          });
        }

        ruta.conductor = usuarioChofer;
        ruta.nombreConductor = String(nombreConductor).trim();
      }

      // Registrar patente, fecha de inicio y cambiar estado a iniciada
      ruta.patente = patente.toUpperCase();
      ruta.fechaInicio = new Date();
      ruta.estado = "iniciada";
      await ruta.save();

      console.log(`🚚 Ruta ${ruta.numeroRuta} iniciada por ${ruta.conductor} con patente ${ruta.patente}`);

      res.json({
        status: "success",
        message: "Ruta iniciada exitosamente",
        data: ruta,
      });
    } catch (error) {
      console.error("❌ Error al iniciar ruta:", error);
      res.status(500).json({
        status: "error",
        message: "Error al iniciar ruta",
        error: error.message,
      });
    }
  }
);

// POST /api/despachos/:id/entregar-chofer - Marcar despacho como entregado con datos del receptor y foto
app.post(
  "/api/despachos/:id/entregar-chofer",
  authMiddleware,
  requireRoles(["chofer"]),
  async (req, res) => {
    try {
      const { receptorRut, receptorNombre, receptorApellido, fotoEntrega } = req.body;

      // Validaciones
      if (!receptorRut || !receptorNombre || !receptorApellido || !fotoEntrega) {
        return res.status(400).json({
          status: "error",
          message: "Todos los campos son obligatorios: RUT, nombre, apellido y foto",
        });
      }

      const despacho = await Despacho.findById(req.params.id);

      if (!despacho) {
        return res.status(404).json({
          status: "error",
          message: "Despacho no encontrado",
        });
      }

      // Verificar que el despacho esté asignado a una ruta
      if (!despacho.rutaAsignada) {
        return res.status(400).json({
          status: "error",
          message: "El despacho no está asignado a ninguna ruta",
        });
      }

      // Verificar que el despacho no esté ya entregado
      if (despacho.estado === "entregado" || despacho.estado === "no_entregado") {
        return res.status(400).json({
          status: "error",
          message: "El despacho ya fue marcado como entregado/no entregado",
        });
      }

      // Actualizar datos de entrega
      despacho.entrega = {
        receptorRut: receptorRut.trim(),
        receptorNombre: receptorNombre.trim(),
        receptorApellido: receptorApellido.trim(),
        fotoEntrega: fotoEntrega,
        fechaEntrega: new Date(),
      };
      despacho.estado = "entregado";

      await despacho.save();

      console.log(`📦 Despacho ${despacho.FolioNum} entregado a ${receptorNombre} ${receptorApellido}`);

      // Verificar si todos los despachos de la ruta están entregados
      const ruta = await Ruta.findById(despacho.rutaAsignada).populate("despachos");

      if (ruta) {
        const todosFinalizados = ruta.despachos.every((d) => {
          if (d._id.toString() === despacho._id.toString()) return true;
          return isDespachoTerminal(d.estado);
        });

        if (todosFinalizados && ruta.estado !== "finalizada") {
          ruta.estado = "finalizada";
          ruta.fechaFinalizacion = new Date();
          await ruta.save();
          console.log(`✅ Ruta ${ruta.numeroRuta} finalizada automáticamente`);
        }
      }

      res.json({
        status: "success",
        message: "Despacho entregado exitosamente",
        data: despacho,
      });
    } catch (error) {
      console.error("❌ Error al entregar despacho:", error);
      res.status(500).json({
        status: "error",
        message: "Error al entregar despacho",
        error: error.message,
      });
    }
  }
);

// POST /api/despachos/:id/no-entregado-chofer - Marcar despacho como no entregado con motivo y evidencia (chofer)
app.post(
  "/api/despachos/:id/no-entregado-chofer",
  authMiddleware,
  requireRoles(["chofer"]),
  async (req, res) => {
    try {
      const { motivo, observacion, fotoEvidencia } = req.body;

      if (!motivo || !fotoEvidencia) {
        return res.status(400).json({
          status: "error",
          message: "Los campos motivo y foto de evidencia son obligatorios",
        });
      }

      const despacho = await Despacho.findById(req.params.id);

      if (!despacho) {
        return res.status(404).json({
          status: "error",
          message: "Despacho no encontrado",
        });
      }

      if (!despacho.rutaAsignada) {
        return res.status(400).json({
          status: "error",
          message: "El despacho no est  asignado a ninguna ruta",
        });
      }

      if (despacho.estado === "entregado" || despacho.estado === "no_entregado") {
        return res.status(400).json({
          status: "error",
          message: "El despacho ya fue marcado como entregado/no entregado",
        });
      }

      despacho.noEntrega = {
        motivo: String(motivo).trim(),
        observacion: observacion ? String(observacion).trim() : "",
        fotoEvidencia,
        fechaNoEntrega: new Date(),
      };
      despacho.estado = "no_entregado";

      await despacho.save();

      console.log(
        `⚠️ Despacho ${despacho.FolioNum} marcado como no entregado. Motivo: ${motivo}`
      );

      const ruta = await Ruta.findById(despacho.rutaAsignada).populate("despachos");

      if (ruta) {
        const todosFinalizados = ruta.despachos.every((d) => isDespachoTerminal(d.estado));

        if (todosFinalizados && ruta.estado !== "finalizada") {
          ruta.estado = "finalizada";
          ruta.fechaFinalizacion = new Date();
          await ruta.save();
          console.log(`✅ Ruta ${ruta.numeroRuta} finalizada autom ticamente`);
        }
      }

      res.json({
        status: "success",
        message: "Despacho marcado como no entregado",
        data: despacho,
      });
    } catch (error) {
      console.error("❌ Error al marcar despacho como no entregado:", error);
      res.status(500).json({
        status: "error",
        message: "Error al marcar despacho como no entregado",
        error: error.message,
      });
    }
  }
);

// PUT /api/despachos/:id/datos-entrega - Actualizar datos de entrega (admin/bodega)
app.put(
  "/api/despachos/:id/datos-entrega",
  authMiddleware,
  requireRoles(["admin", "adminBodega", "subBodega"]),
  async (req, res) => {
    try {
      const { receptorRut, receptorNombre, receptorApellido, fotoEntrega } = req.body;

      const despacho = await Despacho.findById(req.params.id);

      if (!despacho) {
        return res.status(404).json({
          status: "error",
          message: "Despacho no encontrado",
        });
      }

      // Solo se pueden actualizar datos de despachos entregados
      if (despacho.estado !== "entregado") {
        return res.status(400).json({
          status: "error",
          message: "Solo se pueden actualizar datos de despachos entregados",
        });
      }

      // Actualizar solo los campos proporcionados
      if (!despacho.entrega) {
        despacho.entrega = {};
      }

      if (receptorRut) despacho.entrega.receptorRut = receptorRut.trim();
      if (receptorNombre) despacho.entrega.receptorNombre = receptorNombre.trim();
      if (receptorApellido) despacho.entrega.receptorApellido = receptorApellido.trim();
      if (fotoEntrega) despacho.entrega.fotoEntrega = fotoEntrega;
      if (!despacho.entrega.fechaEntrega) despacho.entrega.fechaEntrega = new Date();

      await despacho.save();

      console.log(`📝 Datos de entrega actualizados para despacho ${despacho.FolioNum}`);

      res.json({
        status: "success",
        message: "Datos de entrega actualizados exitosamente",
        data: despacho,
      });
    } catch (error) {
      console.error("❌ Error al actualizar datos de entrega:", error);
      res.status(500).json({
        status: "error",
        message: "Error al actualizar datos de entrega",
        error: error.message,
      });
    }
  }
);

// POST /api/rutas/:id/cancelar - Cancelar ruta y liberar despachos no entregados
app.post(
  "/api/rutas/:id/cancelar",
  authMiddleware,
  requireRoles(["admin", "adminBodega", "subBodega"]),
  async (req, res) => {
    try {
      const ruta = await Ruta.findById(req.params.id).populate("despachos");

      if (!ruta) {
        return res.status(404).json({
          status: "error",
          message: "Ruta no encontrada",
        });
      }

      // Obtener IDs de despachos de la ruta
      const despachosIds = ruta.despachos.map(d => d._id || d);

      // Obtener despachos que no están entregados
      const despachosNoEntregados = await Despacho.find({
        _id: { $in: despachosIds },
        estado: { $ne: "entregado" }
      });

      console.log(`📦 Liberando ${despachosNoEntregados.length} despachos no entregados de la ruta ${ruta.numeroRuta}`);

      // Liberar despachos no entregados (volver a estado pendiente)
      if (despachosNoEntregados.length > 0) {
        await Despacho.updateMany(
          {
            _id: { $in: despachosNoEntregados.map(d => d._id) }
          },
          {
            $set: {
              estado: "pendiente",
              rutaAsignada: null,
              empresaReparto: null
            },
            $unset: {
              entrega: "",
              noEntrega: ""
            },
          }
        );
      }

      // Cambiar estado de la ruta a cancelada
      ruta.estado = "cancelada";
      await ruta.save();

      res.json({
        status: "success",
        message: "Ruta cancelada exitosamente",
        data: {
          ruta,
          despachosLiberados: despachosNoEntregados.length
        }
      });
    } catch (error) {
      console.error("❌ Error al cancelar ruta:", error);
      res.status(500).json({
        status: "error",
        message: "Error al cancelar ruta",
        error: error.message,
      });
    }
  }
);

// DELETE /api/rutas/:id - Eliminar ruta
app.delete(
  "/api/rutas/:id",
  authMiddleware,
  requireRoles(["admin", "chofer", "subBodega", "adminBodega"]),
  async (req, res) => {
    try {
      const ruta = await Ruta.findByIdAndDelete(req.params.id);

      if (!ruta) {
        return res.status(404).json({
          status: "error",
          message: "Ruta no encontrada",
        });
      }

      res.json({
        status: "success",
        message: "Ruta eliminada exitosamente",
        data: ruta,
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: "Error al eliminar ruta",
        error: error.message,
      });
    }
  }
);

// ================================================================
// ===== ENDPOINT: SINCRONIZACIÓN MANUAL DE DESPACHOS =====
// ================================================================
// admin, adminBodega y subBodega pueden forzar sincronización

// POST /api/sync/despachos - Forzar sincronización manual
app.post(
  "/api/sync/despachos",
  authMiddleware,
  requireRoles(["admin", "adminBodega", "subBodega"]),
  async (req, res) => {
    try {
      await sincronizarDespachos();
      res.json({
        status: "success",
        message: "Sincronización de despachos completada",
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: "Error al sincronizar despachos",
        error: error.message,
      });
    }
  }
);

// ===== MANEJO DE RUTAS NO ENCONTRADAS =====
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: "Ruta no encontrada",
  });
});

// ===== INICIAR SERVIDOR =====
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📦 Base de datos: ${MONGO_URI}`);
  console.log("\n📋 Endpoints disponibles:");
  console.log("  GET    /api/empresas");
  console.log("  GET    /api/empresas/:id");
  console.log("  POST   /api/empresas");
  console.log("  PUT    /api/empresas/:id");
  console.log("  DELETE /api/empresas/:id");
  console.log("\n  GET    /api/despachos");
  console.log("  GET    /api/despachos/:id");
  console.log("  POST   /api/despachos");
  console.log("  PUT    /api/despachos/:id");
  console.log("  DELETE /api/despachos/:id");
  console.log("\n  GET    /api/rutas");
  console.log("  GET    /api/rutas/:id");
  console.log("  POST   /api/rutas");
  console.log("  PUT    /api/rutas/:id");
  console.log("  DELETE /api/rutas/:id");
});
