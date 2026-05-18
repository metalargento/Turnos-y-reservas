# Design System - Turnos & Reservas

## Colores

### Primario (Indigo)
Usado para acciones principales, links, estados activos.
```
primary-50:  #f0f4ff
primary-100: #e5ebff
primary-200: #d1ddff
primary-300: #a8c5ff
primary-400: #7ba3ff
primary-500: #5a7cff  ← Default
primary-600: #4557e8
primary-700: #3b46d4
primary-800: #2d36ad
primary-900: #252d8a
```

### Acentos (Emerald)
Éxito, crecimiento, positivo.
```
accent-50:  #f0fdf4
accent-100: #dcfce7
accent-200: #bbf7d0
accent-300: #86efac
accent-400: #4ade80
accent-500: #22c55e  ← Default
accent-600: #16a34a
accent-700: #15803d
```

### Semánticos
```
success:  #22c55e (accent-500)
warning:  #f59e0b (amber)
error:    #ef4444 (red)
info:     #3b82f6 (blue)
```

### Neutrales
```
neutral-50:  #fafafa   (backgrounds)
neutral-100: #f4f4f5
neutral-200: #e4e4e7   (borders)
neutral-300: #d4d4d8
neutral-400: #a1a1aa   (disabled)
neutral-500: #71717a   (secondary text)
neutral-600: #52525b   (secondary text darker)
neutral-700: #3f3f46   (text)
neutral-800: #27272a   (text darker)
neutral-900: #18181b   (dark bg)
```

## Tipografía

### Familias
- **Display (Headers):** Poppins - para h1-h6, títulos, botones
- **Body (Texto):** Lora - para párrafos, descripciones
- **Mono (Código):** Fira Code - para códigos, ids

### Sizes
```
xs:   0.75rem   (12px)
sm:   0.875rem  (14px)
base: 1rem      (16px)  ← Default body
lg:   1.125rem  (18px)
xl:   1.25rem   (20px)
2xl:  1.5rem    (24px)
3xl:  1.875rem  (30px)
4xl:  2.25rem   (36px)
```

### Usage
- **h1:** 4xl, bold, display font
- **h2:** 3xl, bold, display font
- **h3:** 2xl, bold, display font
- **Button text:** display font, semibold
- **Input labels:** display font, medium
- **Body text:** base, body font, regular

## Componentes Reutilizables

### Botones
```jsx
// Primary
<button className="btn-primary">Guardar</button>

// Secondary
<button className="btn-secondary">Cancelar</button>

// Outline
<button className="btn-outline">Editar</button>

// Ghost (sin fondo)
<button className="btn-ghost">Más opciones</button>

// Peligro
<button className="btn-danger">Eliminar</button>

// Éxito
<button className="btn-success">Confirmar</button>
```

### Cards
```jsx
// Regular card
<div className="card p-4">Contenido</div>

// Elevated (sombra más pronunciada)
<div className="card-elevated p-4">Contenido importante</div>
```

### Inputs
```jsx
// Input normal
<input className="input" placeholder="Escribe algo..." />

// Input con error
<input className="input input-error" />
```

### Badges
```jsx
// Primary
<span className="badge-primary">Activo</span>

// Success
<span className="badge-success">Confirmado</span>

// Warning
<span className="badge-warning">Pendiente</span>

// Error
<span className="badge-error">Cancelado</span>
```

### Navegación
```jsx
// Active link
<Link className="nav-link nav-link-active">Actual</Link>

// Inactive link
<Link className="nav-link nav-link-inactive">Otra</Link>
```

## Spacing
```
gutter:   1.5rem  (24px)  - Para secciones internas
section:  3rem    (48px)  - Entre secciones
```

## Border Radius
```
xs:  0.25rem
sm:  0.5rem
base: 0.75rem  ← Default
md:  1rem
lg:  1.5rem
```

## Sombras
```
sm:        0 1px 2px (subtle)
base:      0 1px 3px (default)
md:        0 4px 6px
lg:        0 10px 15px
xl:        0 20px 25px
elevation: 0 20px 40px rgba(59,70,212,0.15) (primary with color)
```

## Animaciones
```css
.animate-fade-in       /* Fade in 0.3s */
.animate-slide-in      /* Slide from left 0.3s */
.animate-fade-slide-in /* Fade + slide from top 0.4s */
```

## Ejemplos de Uso

### Página con Header
```jsx
export function MyPage() {
  return (
    <div className="animate-fade-in">
      <h1>Título Principal</h1>
      <p className="text-neutral-600">Descripción</p>
      
      <div className="mt-8 grid grid-cols-2 gap-6">
        <div className="card p-6">
          <h3>Card Title</h3>
          <p className="text-secondary">Description</p>
        </div>
      </div>
    </div>
  );
}
```

### Formulario
```jsx
<form className="space-y-4">
  <div>
    <label className="font-display font-medium text-sm">Email</label>
    <input className="input mt-1" type="email" />
  </div>
  
  <div className="flex gap-2">
    <button className="btn-primary">Enviar</button>
    <button className="btn-secondary">Cancelar</button>
  </div>
</form>
```

## Notas
- Los colores están disponibles en `bg-`, `text-`, `border-` prefixes
- Usar `hover:`, `focus:`, `active:` para estados
- Las animaciones se aplican con `animate-*` classes
- Los componentes `.btn*` incluyen transiciones automáticas
