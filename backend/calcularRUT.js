// Script para calcular el dígito verificador de RUTs chilenos

function calcularDV(rut) {
  const rutLimpio = rut.toString().replace(/\./g, "").replace(/-/g, "");
  const cuerpo = rutLimpio;

  let suma = 0;
  let multiplicador = 2;

  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo.charAt(i)) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }

  const dvEsperado = 11 - (suma % 11);
  const dvCalculado =
    dvEsperado === 11 ? "0" : dvEsperado === 10 ? "K" : dvEsperado.toString();

  return dvCalculado;
}

// RUTs base de empresas reales chilenas (sin DV)
const empresasBase = [
  { rut: "96756430", nombre: "Chilexpress S.A." },
  { rut: "76049280", nombre: "PDQ Courrier Express Ltda." },
  { rut: "78281000", nombre: "Starken S.A." },
  { rut: "61979440", nombre: "Correos de Chile" },
  { rut: "76123456", nombre: "Blue Express S.A." },
  { rut: "77234567", nombre: "Urbano Express SpA" },
  { rut: "12345678", nombre: "Vivipra" },
];

console.log("RUTs con dígito verificador correcto:\n");
empresasBase.forEach((empresa) => {
  const dv = calcularDV(empresa.rut);
  const rutFormateado =
    empresa.rut.slice(0, 2) +
    "." +
    empresa.rut.slice(2, 5) +
    "." +
    empresa.rut.slice(5) +
    "-" +
    dv;
  console.log(`${empresa.nombre}: ${rutFormateado}`);
});
