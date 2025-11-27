# Plan de Refactorización a Microcomponentes

## Estado Actual

### Archivos Grandes (Necesitan Refactorización)
- `frontend/app/rutas/page.tsx` - **875 líneas** ⚠️
- `frontend/app/despachos/page.tsx` - **715 líneas** ⚠️
- `frontend/app/dashboard/page.tsx` - **~260 líneas** ✅ (Tamaño aceptable)

### Componentes Existentes
- ✅ `components/ui/` - Componentes base (Button, Card, Modal, Input, PageNavigation)
- ✅ `components/rutas/` - InfoRuta, BarraProgreso, DespachoCard, MetricasTiempo
- ✅ `components/auth/` - ProtectedRoute

---

## Estrategia de Refactorización

### Principios
1. **Single Responsibility**: Cada componente debe tener una única responsabilidad
2. **Composición**: Componentes pequeños y reutilizables
3. **Separación de Concerns**: Lógica de negocio separada de la presentación
4. **DRY**: No repetir código entre páginas similares

---

## FASE 1: Refactorización de `/rutas/page.tsx` (Prioridad Alta)

### Problema Actual
- 875 líneas en un solo archivo
- Mezcla de lógica de estado, handlers, y rendering
- Componentes inline repetitivos
- Difícil mantenimiento y testing

### Componentes a Extraer

#### 1. **Filtros y Acciones** → `components/rutas/`

**`FiltroChofer.tsx`** (40-50 líneas)
- Select de conductores
- Lógica de filtrado
```tsx
interface FiltroChoferProps {
  choferes: string[];
  filtroActual: string;
  onFiltroChange: (chofer: string) => void;
}
```

**`FiltroEstado.tsx`** (60-70 líneas)
- Pestañas de estado (todas, pendientes, iniciadas, etc.)
- Contadores por estado
```tsx
interface FiltroEstadoProps {
  estados: EstadoContador;
  estadoActual: string;
  onEstadoChange: (estado: string) => void;
}
```

**`AccionesRuta.tsx`** (30-40 líneas)
- Botones de exportar, volver, cerrar sesión
- Reutilizable en otras páginas
```tsx
interface AccionesRutaProps {
  rutas: Ruta[];
  onExportar: () => void;
  onVolver: () => void;
  onLogout: () => void;
}
```

#### 2. **Tarjeta de Ruta** → `components/rutas/`

**`RutaCard.tsx`** (150-200 líneas)
- Card completa de una ruta
- Estado expandido/colapsado
- Acciones (ver despachos, cancelar)
```tsx
interface RutaCardProps {
  ruta: Ruta;
  expandida: boolean;
  onToggleExpandir: () => void;
  onCancelar: (rutaId: string, numeroRuta?: string) => void;
  onMarcarEntregado: (despachoId: string, folioNum: string) => Promise<void>;
  onAgregarDatos: (despacho: any) => void;
  cancelando: boolean;
  entregando: string | null;
}
```

**`RutaHeader.tsx`** (40-50 líneas)
- Número de ruta y badge de estado
- Información básica (conductor, patente, despachos)
```tsx
interface RutaHeaderProps {
  numeroRuta: string;
  estado: string;
  conductor: string;
  patente?: string;
  totalDespachos: number;
}
```

**`RutaInfoGrid.tsx`** (80-100 líneas)
- Grid con información de la ruta
- Campos: conductor, patente, despachos, asignado por, fechas
- Tiempo transcurrido (si aplica)
```tsx
interface RutaInfoGridProps {
  ruta: Ruta;
}
```

**`RutaAcciones.tsx`** (30-40 líneas)
- Botones: Ver Despachos, Cancelar
```tsx
interface RutaAccionesProps {
  rutaId: string;
  numeroRuta?: string;
  estado: string;
  expandida: boolean;
  cancelando: boolean;
  onToggleExpandir: () => void;
  onCancelar: () => void;
}
```

#### 3. **Lista de Despachos** → `components/rutas/despachos/`

**`DespachosList.tsx`** (60-80 líneas)
- Lista de despachos de una ruta
- Integra MetricasTiempo y DespachoItem
```tsx
interface DespachosListProps {
  ruta: Ruta;
  onMarcarEntregado: (despachoId: string, folioNum: string) => Promise<void>;
  onAgregarDatos: (despacho: any) => void;
  entregando: string | null;
}
```

**`DespachoItem.tsx`** (80-100 líneas) - **Mejorar el existente `DespachoCard.tsx`**
- Item individual de despacho
- Info: folio, cliente, dirección, estado
- Datos de entrega (si existen)
- Acciones: Marcar entregado, Agregar/Editar datos
```tsx
interface DespachoItemProps {
  despacho: any;
  numeroRuta: string;
  conductor: string;
  onMarcarEntregado: (despachoId: string, folioNum: string) => Promise<void>;
  onAgregarDatos: () => void;
  entregando: boolean;
}
```

**`DatosEntrega.tsx`** (40-50 líneas)
- Muestra datos del receptor
- Nombre, apellido, RUT, fecha
```tsx
interface DatosEntregaProps {
  entrega: {
    receptorNombre?: string;
    receptorApellido?: string;
    receptorRut?: string;
    fechaEntrega?: string;
  };
}
```

#### 4. **Modal de Datos** → `components/rutas/modals/`

**`DatosEntregaModal.tsx`** (120-150 líneas)
- Modal para agregar/editar datos de entrega
- Formulario: RUT, nombre, apellido, foto
- Vista previa de imagen
- Validación de RUT
```tsx
interface DatosEntregaModalProps {
  show: boolean;
  despacho: any | null;
  onClose: () => void;
  onGuardar: (datos: DatosEntrega) => Promise<void>;
}
```

#### 5. **Custom Hooks** → `hooks/`

**`useRutas.ts`** (80-100 líneas)
- Hook para manejo de estado de rutas
- loadRutas, handleCancelar, handleMarcarEntregado
- Estados: loading, error, rutas
```tsx
export function useRutas() {
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelando, setCancelando] = useState<string | null>(null);
  const [entregando, setEntregando] = useState<string | null>(null);

  // ... métodos

  return { rutas, loading, error, cancelando, entregando, loadRutas, handleCancelar, handleMarcarEntregado };
}
```

**`useFiltrosRuta.ts`** (40-50 líneas)
- Hook para lógica de filtrado
- filtroEstado, filtroChofer
- rutasFiltradas, choferesUnicos, contadores
```tsx
export function useFiltrosRuta(rutas: Ruta[]) {
  const [filtroEstado, setFiltroEstado] = useState<string>("todas");
  const [filtroChofer, setFiltroChofer] = useState<string>("todos");

  // ... lógica de filtrado

  return { filtroEstado, filtroChofer, rutasFiltradas, choferesUnicos, contadores, setFiltroEstado, setFiltroChofer };
}
```

**`useDatosEntregaModal.ts`** (60-80 líneas)
- Hook para el modal de datos de entrega
- Estados: show, despachoSeleccionado, campos del formulario
- Handlers: handleOpen, handleClose, handleGuardar, handleImageUpload
```tsx
export function useDatosEntregaModal(onSuccess: () => void) {
  const [showDatosModal, setShowDatosModal] = useState(false);
  const [despachoSeleccionado, setDespachoSeleccionado] = useState<any>(null);
  // ... más estados y lógica

  return { /* ... */ };
}
```

#### 6. **Utilidades** → `utils/`

**`rutaUtils.ts`**
- `getEstadoBadgeColor(estado: string): string` - Colores de badges
- `formatRut(rut: string): string` - Formatear RUT
- `calcularTiempoTranscurrido(fechaInicio: Date): string` - Cálculo de tiempo

---

### Estructura de Archivos Propuesta

```
frontend/
├── app/
│   └── rutas/
│       └── page.tsx (150-200 líneas) ✅ Reducido
│
├── components/
│   ├── rutas/
│   │   ├── filtros/
│   │   │   ├── FiltroChofer.tsx
│   │   │   ├── FiltroEstado.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── ruta-card/
│   │   │   ├── RutaCard.tsx
│   │   │   ├── RutaHeader.tsx
│   │   │   ├── RutaInfoGrid.tsx
│   │   │   ├── RutaAcciones.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── despachos/
│   │   │   ├── DespachosList.tsx
│   │   │   ├── DespachoItem.tsx (mejorar DespachoCard.tsx)
│   │   │   ├── DatosEntrega.tsx
│   │   │   ├── MetricasTiempo.tsx (ya existe)
│   │   │   └── index.ts
│   │   │
│   │   ├── modals/
│   │   │   ├── DatosEntregaModal.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── AccionesRuta.tsx
│   │   └── index.ts
│   │
│   └── ui/
│       └── ... (componentes existentes)
│
├── hooks/
│   ├── useRutas.ts
│   ├── useFiltrosRuta.ts
│   ├── useDatosEntregaModal.ts
│   └── index.ts
│
└── utils/
    ├── rutaUtils.ts
    ├── exportToExcel.ts (ya existe)
    └── index.ts
```

---

## FASE 2: Refactorización de `/despachos/page.tsx` (Prioridad Media)

### Componentes a Extraer

#### 1. **Filtros** → `components/despachos/filtros/`
- `FiltroEstado.tsx` - Pestañas de estado
- `FiltroEmpresa.tsx` - Select de empresa de reparto
- Similar a filtros de rutas

#### 2. **Cards** → `components/despachos/cards/`
- `DespachoCard.tsx` - Card de despacho individual
- `DespachoHeader.tsx` - Header con folio y estado
- `DespachoInfo.tsx` - Información del despacho

#### 3. **Modals** → `components/despachos/modals/`
- `CrearRutaModal.tsx` - Modal para crear ruta
- `AsignarDespachoModal.tsx` - Modal para asignar a ruta

#### 4. **Custom Hooks** → `hooks/`
- `useDespachos.ts` - Gestión de despachos
- `useFiltrosDespacho.ts` - Lógica de filtrado
- `useCrearRuta.ts` - Lógica de creación de ruta

---

## FASE 3: Componentes Compartidos (Prioridad Media)

### Componentes Reutilizables

#### 1. **Estados y Badges** → `components/common/`
- `EstadoBadge.tsx` - Badge de estado (reutilizable)
- `EmptyState.tsx` - Mensaje de "sin resultados"
- `LoadingState.tsx` - Estado de carga

#### 2. **Formularios** → `components/forms/`
- `RutFormInput.tsx` - Input con validación de RUT
- `ImageUpload.tsx` - Upload de imagen con preview
- `SelectField.tsx` - Select mejorado

#### 3. **Layout** → `components/layout/`
- `PageHeader.tsx` - Header reutilizable
- `ActionsBar.tsx` - Barra de acciones
- `FilterBar.tsx` - Barra de filtros

---

## FASE 4: Optimizaciones (Prioridad Baja)

### Performance
1. **React.memo** en componentes que no cambian frecuentemente
2. **useMemo** para cálculos costosos (filtrado, contadores)
3. **useCallback** para handlers pasados como props
4. **Lazy Loading** para modales y componentes pesados

### TypeScript
1. Crear tipos compartidos en `types/`
2. Interfaces claras para props
3. Eliminar `any` types

### Testing
1. Tests unitarios para hooks
2. Tests de componentes con React Testing Library
3. Tests de integración para flujos completos

---

## Ventajas de la Refactorización

### Mantenibilidad
- ✅ Archivos más pequeños y enfocados
- ✅ Más fácil encontrar y modificar código
- ✅ Cambios localizados no afectan todo el sistema

### Reutilización
- ✅ Componentes compartidos entre rutas y despachos
- ✅ Hooks personalizados para lógica común
- ✅ Utilidades compartidas

### Testing
- ✅ Tests unitarios más simples
- ✅ Mejor cobertura de código
- ✅ Detección temprana de bugs

### Colaboración
- ✅ Múltiples desarrolladores pueden trabajar en paralelo
- ✅ Conflictos de merge reducidos
- ✅ Code reviews más simples

### Performance
- ✅ Re-renders optimizados
- ✅ Lazy loading de componentes
- ✅ Menor consumo de memoria

---

## Orden de Implementación Sugerido

### Sprint 1 (Rutas - Componentes Base)
1. Crear estructura de carpetas
2. Extraer utilidades (`rutaUtils.ts`)
3. Crear hooks (`useRutas`, `useFiltrosRuta`)
4. Crear componentes de filtros

### Sprint 2 (Rutas - Cards y Listas)
1. Crear `RutaCard` y subcomponentes
2. Crear `DespachosList` y `DespachoItem`
3. Refactorizar `page.tsx` para usar nuevos componentes

### Sprint 3 (Rutas - Modals)
1. Crear `DatosEntregaModal`
2. Crear hook `useDatosEntregaModal`
3. Integrar y probar

### Sprint 4 (Despachos)
1. Aplicar misma estrategia a despachos
2. Reutilizar componentes comunes
3. Crear hooks específicos

### Sprint 5 (Componentes Compartidos)
1. Identificar código duplicado
2. Crear componentes comunes
3. Refactorizar para usar componentes comunes

### Sprint 6 (Optimización y Testing)
1. Agregar React.memo, useMemo, useCallback
2. Implementar lazy loading
3. Escribir tests

---

## Métricas de Éxito

### Antes de Refactorización
- 📊 `rutas/page.tsx`: 875 líneas
- 📊 `despachos/page.tsx`: 715 líneas
- 📊 Componentes reutilizables: ~10
- 📊 Custom hooks: 0

### Después de Refactorización (Objetivo)
- 📊 `rutas/page.tsx`: ~150-200 líneas ⬇️ 77% reducción
- 📊 `despachos/page.tsx`: ~150-200 líneas ⬇️ 72% reducción
- 📊 Componentes reutilizables: ~40 ⬆️ 300% aumento
- 📊 Custom hooks: ~8 ⬆️ ∞
- 📊 Componentes promedio: <100 líneas
- 📊 Duplicación de código: <5%

---

## Notas Finales

- ⚠️ No hacer todo de una vez, ir por fases
- ⚠️ Probar cada cambio antes de continuar
- ⚠️ Mantener funcionalidad existente
- ⚠️ Documentar componentes con JSDoc
- ⚠️ Usar TypeScript estricto
- ⚠️ Commit frecuente con mensajes descriptivos

---

**Última actualización**: $(date)
**Autor**: Claude Code
**Estado**: Propuesta inicial
