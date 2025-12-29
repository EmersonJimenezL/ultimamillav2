// ===== MODELOS DE MONGOOSE PARA LA BASE DE DATOS =====
// Este archivo contiene todos los schemas y modelos de MongoDB

const mongoose = require("mongoose");

// ===== FUNCIONES DE VALIDACIÓN =====

// Validar formato RUT chileno (XX.XXX.XXX-X)
function validarRUT(rut) {
  // Eliminar puntos y guión
  const rutLimpio = rut.replace(/\./g, "").replace(/-/g, "");

  // Debe tener entre 8 y 9 caracteres
  if (rutLimpio.length < 8 || rutLimpio.length > 9) return false;

  const cuerpo = rutLimpio.slice(0, -1);
  const dv = rutLimpio.slice(-1).toUpperCase();

  // Calcular dígito verificador
  let suma = 0;
  let multiplicador = 2;

  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo.charAt(i)) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }

  const dvEsperado = 11 - (suma % 11);
  const dvCalculado =
    dvEsperado === 11 ? "0" : dvEsperado === 10 ? "K" : dvEsperado.toString();

  return dv === dvCalculado;
}

// Validar teléfono chileno (+56 9 XXXX XXXX o 9 XXXX XXXX)
function validarTelefono(telefono) {
  const telefonoLimpio = telefono.replace(/\s/g, "").replace(/\+/g, "");
  // Formato: 569XXXXXXXX o 9XXXXXXXX
  return /^(56)?9\d{8}$/.test(telefonoLimpio);
}

// Validar patente chilena (XXXX00 o XX0000 o XXXX-00)
function validarPatente(patente) {
  const patenteLimpia = patente
    .replace(/-/g, "")
    .replace(/\s/g, "")
    .toUpperCase();
  // Formato antiguo: AB1234 o formato nuevo: ABCD12
  return (
    /^[A-Z]{2}\d{4}$/.test(patenteLimpia) ||
    /^[A-Z]{4}\d{2}$/.test(patenteLimpia)
  );
}

// ===== SCHEMA: EMPRESA DE REPARTO =====
const empresaRepartoSchema = new mongoose.Schema(
  {
    rut: {
      type: String,
      required: [true, "El RUT es obligatorio"],
      unique: true,
      trim: true,
      validate: {
        validator: validarRUT,
        message: "RUT inválido. Formato: XX.XXX.XXX-X",
      },
    },
    razonSocial: {
      type: String,
      required: [true, "La razón social es obligatoria"],
      trim: true,
    },

    usuarioCuenta: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true,
      // Usuario que usa la empresa para iniciar sesión (ej: starken, pdqq)
    },
    contacto: {
      type: String,
      required: [true, "El contacto es obligatorio"],
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: "empresasReparto",
  }
);

// ===== SCHEMA: DESPACHO =====
const despachoSchema = new mongoose.Schema(
  {
    // Campos que vienen del endpoint externo (http://192.168.200.80:3000/data/FactDespacho)
    FolioNum: {
      type: Number,
      required: true,
      unique: true,
    },
    CardCode: {
      type: String,
      required: true,
      trim: true,
    },
    CardName: {
      type: String,
      required: true,
      trim: true,
    },
    DocDate: {
      type: String,
      required: true,
    },
    CreateTS: {
      type: Number,
      required: true,
    },
    Comments: {
      type: String,
      trim: true,
      default: "",
    },
    ShipToCode: {
      type: String, // destino
      required: true,
      trim: true,
    },
    Address2: {
      type: String, // direccion
      required: true,
      trim: true,
    },

    // Campos adicionales para gestión interna
    estado: {
      type: String,
      enum: ["pendiente", "asignado", "entregado", "no_entregado", "cancelado"],
      default: "pendiente",
    },
    empresaReparto: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EmpresaReparto",
    },
    rutaAsignada: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ruta",
    },
    // Datos de la entrega (se completan cuando el chofer entrega)
    entrega: {
      receptorRut: {
        type: String,
        trim: true,
      },
      receptorNombre: {
        type: String,
        trim: true,
      },
      receptorApellido: {
        type: String,
        trim: true,
      },
      fotoEntrega: {
        type: String, // Base64 de la imagen
      },
      fechaEntrega: {
        type: Date,
      },
    },
    // Datos de no entrega (se completan cuando el chofer no puede entregar)
    noEntrega: {
      motivo: {
        type: String,
        trim: true,
      },
      observacion: {
        type: String,
        trim: true,
        default: "",
      },
      fotoEvidencia: {
        type: String, // Base64 de la imagen
      },
      fechaNoEntrega: {
        type: Date,
      },
    },
  },
  {
    timestamps: true,
    collection: "despachos",
  }
);

// ===== SCHEMA: RUTA =====
const rutaSchema = new mongoose.Schema(
  {
    numeroRuta: {
      type: String,
      unique: true,
      // Se generará automáticamente en el pre-save hook
    },
    conductor: {
      type: String,
      required: false, // Opcional si es chofer externo
      trim: true,
      // Se mostrará como opciones los usuarios con rol chofer
    },
    nombreConductor: {
      type: String,
      required: false,
      trim: true,
      // Para chofer externo: nombre real del conductor
    },
    esChoferExterno: {
      type: Boolean,
      default: false,
      // Si es true, el conductor se debe completar cuando el chofer inicie sesión
    },
    patente: {
      type: String,
      required: false, // Opcional al crear, se completa cuando el chofer inicia la ruta
      trim: true,
      uppercase: true,
      validate: {
        validator: function (v) {
          // Si no hay valor, es válido (opcional)
          if (!v) return true;
          // Si hay valor, debe cumplir el formato
          return validarPatente(v);
        },
        message: "Patente inválida. Formato: AB1234 o ABCD12",
      },
    },
    despachos: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Despacho",
      },
    ],
    empresaReparto: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EmpresaReparto",
      required: [true, "La empresa de reparto es obligatoria"],
    },
    asignadoPor: {
      type: String,
      required: [true, "El usuario que asigna es obligatorio"],
      trim: true,
      // Persona logueada con rol de administración de rutas
    },
    asignadoEl: {
      type: Date,
      default: Date.now,
    },
    fechaInicio: {
      type: Date,
      // Se completará cuando el chofer inicie la ruta
    },
    estado: {
      type: String,
      enum: ["iniciada", "pausada", "pendiente", "finalizada", "cancelada"],
      default: "pendiente",
    },
    fechaFinalizacion: {
      type: Date,
      // Se completará de manera automática cuando la ruta cambie a estado finalizada
    },
    tiempoTranscurrido: {
      type: Number,
      // Cálculo del tiempo transcurrido entre la asignación y la entrega (en minutos)
    },
  },
  {
    timestamps: true,
    collection: "rutas",
  }
);

// Middleware para generar número de ruta y calcular tiempoTranscurrido
rutaSchema.pre("save", async function (next) {
  // Generar número de ruta único si no existe
  if (!this.numeroRuta) {
    const count = await mongoose.model("Ruta").countDocuments();
    const fecha = new Date();
    const year = fecha.getFullYear().toString().slice(-2);
    const month = String(fecha.getMonth() + 1).padStart(2, "0");
    const sequential = String(count + 1).padStart(4, "0");
    this.numeroRuta = `R${year}${month}${sequential}`;
  }

  // Calcular tiempo transcurrido si la ruta está finalizada
  if (
    this.estado === "finalizada" &&
    this.asignadoEl &&
    this.fechaFinalizacion
  ) {
    const diff = this.fechaFinalizacion - this.asignadoEl;
    this.tiempoTranscurrido = Math.floor(diff / 1000 / 60); // Convertir a minutos
  }
  next();
});

// ===== CREAR MODELOS =====
const EmpresaReparto = mongoose.model("EmpresaReparto", empresaRepartoSchema);
const Despacho = mongoose.model("Despacho", despachoSchema);
const Ruta = mongoose.model("Ruta", rutaSchema);

// ===== EXPORTAR MODELOS =====
module.exports = {
  EmpresaReparto,
  Despacho,
  Ruta,
};
