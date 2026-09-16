/**
 * Value object de tokens visuales para las tarjetas de promesa.
 *
 * Cada `PromiseTheme` es un conjunto de tokens de diseño puros (colores,
 * patrón ornamental y tipografía dominante) inspirado en tarjetas
 * devocionales femeninas retro-modernas: arcoíris pastel, margaritas de
 * los 70, olas, estrellas de 4 puntas, lunares, soles, etc.
 *
 * Este archivo NO contiene JSX ni CSS-in-JS: son solo datos. La capa de
 * presentación (componentes React) es responsable de traducir estos
 * tokens en estilos reales.
 */

/** Las 12 variantes visuales disponibles para una tarjeta de promesa. */
export type PromiseThemeKey =
  | 'arcoiris'
  | 'margaritas'
  | 'olas'
  | 'estrellas'
  | 'lunares'
  | 'sol'
  | 'jardin'
  | 'atardecer'
  | 'nube'
  | 'hojas'
  | 'confeti'
  | 'luna';

/** Patrón ornamental que decora la tarjeta (dibujado por la capa visual). */
export type PromisePattern =
  | 'arcs'
  | 'daisies'
  | 'waves'
  | 'sparkles'
  | 'dots'
  | 'rays'
  | 'flowers'
  | 'gradientBands'
  | 'clouds'
  | 'leaves'
  | 'confetti'
  | 'crescents';

/** Familia tipográfica dominante en la tarjeta. */
export type PromiseTypography = 'script' | 'display' | 'grotesk';

/**
 * Tokens de diseño de una variante visual de tarjeta.
 *
 * `ink` siempre debe cumplir un contraste WCAG AA (>= 4.5:1) contra
 * `background`. El ratio real de cada tema está documentado como
 * comentario junto a su definición y verificado en
 * `src/modules/promises/infrastructure/data/__tests__/promiseCatalog.test.ts`.
 */
export interface PromiseTheme {
  readonly key: PromiseThemeKey;
  /** Nombre en español para accesibilidad (ej. usado en aria-label). */
  readonly label: string;
  /** Color base de la tarjeta (hex). */
  readonly background: string;
  /** Color del texto principal (hex). Contraste AA garantizado contra `background`. */
  readonly ink: string;
  /** Color de acento (hex), usado en detalles y elementos interactivos. */
  readonly accent: string;
  /** 3 a 5 colores hex para los ornamentos decorativos del patrón. */
  readonly palette: readonly string[];
  /** Patrón ornamental que dibuja la capa visual. */
  readonly pattern: PromisePattern;
  /** Familia tipográfica dominante. */
  readonly typography: PromiseTypography;
  /** Alineación del texto principal de la tarjeta. */
  readonly textAlign: 'left' | 'center';
}

/**
 * Catálogo de las 12 variantes visuales, indexado por `PromiseThemeKey`.
 *
 * Los ratios de contraste fueron calculados con la fórmula de luminancia
 * relativa de WCAG 2.1 (ver `mem_save` de esta tarea para el script usado).
 */
export const PROMISE_THEMES: Record<PromiseThemeKey, PromiseTheme> = {
  arcoiris: {
    key: 'arcoiris',
    label: 'Arcoíris',
    background: '#FFF8EC',
    ink: '#4A2545', // contraste 12.12:1
    accent: '#FF8B7B',
    palette: ['#FFB5C0', '#C6B8F0', '#A8D8B9', '#FFDE7A', '#9ED4E8'],
    pattern: 'arcs',
    typography: 'display',
    textAlign: 'center',
  },
  margaritas: {
    key: 'margaritas',
    label: 'Margaritas',
    background: '#FFF3D6',
    ink: '#4A3B22', // contraste 9.82:1
    accent: '#F2A93B',
    palette: ['#FFFFFF', '#FFE9A8', '#8FBF7A', '#7A5A2E'],
    pattern: 'daisies',
    typography: 'script',
    textAlign: 'left',
  },
  olas: {
    key: 'olas',
    label: 'Olas',
    background: '#DCEEFB',
    ink: '#1F3A5F', // contraste 9.66:1
    accent: '#4FA8A0',
    palette: ['#2F6690', '#7FD1C4', '#F4FBFD', '#93A9E0'],
    pattern: 'waves',
    typography: 'grotesk',
    textAlign: 'center',
  },
  estrellas: {
    key: 'estrellas',
    label: 'Estrellas',
    background: '#EFE3F7',
    ink: '#3E2A5C', // contraste 10.06:1
    accent: '#E8B44A',
    palette: ['#8B6BC4', '#B7A6E8', '#FBEFDD', '#E88BC0'],
    pattern: 'sparkles',
    typography: 'display',
    textAlign: 'left',
  },
  lunares: {
    key: 'lunares',
    label: 'Lunares',
    background: '#FDE4EC',
    ink: '#6B2140', // contraste 9.12:1
    accent: '#E85A8A',
    palette: ['#F6B8CE', '#FFF3E9', '#8A3A55', '#F0876B'],
    pattern: 'dots',
    typography: 'script',
    textAlign: 'center',
  },
  sol: {
    key: 'sol',
    label: 'Sol',
    background: '#FFE8D1',
    ink: '#5C3410', // contraste 9.07:1
    accent: '#E8862B',
    palette: ['#F5C24D', '#FFF0D6', '#F0765A', '#8A4B1E'],
    pattern: 'rays',
    typography: 'display',
    textAlign: 'center',
  },
  jardin: {
    key: 'jardin',
    label: 'Jardín',
    background: '#E3F0E1',
    ink: '#2C4A2E', // contraste 8.38:1
    accent: '#5E9B5A',
    palette: ['#A9CBA0', '#F0A8C0', '#F5D66B', '#F4F8EE'],
    pattern: 'flowers',
    typography: 'script',
    textAlign: 'left',
  },
  atardecer: {
    key: 'atardecer',
    label: 'Atardecer',
    background: '#FDE0D3',
    ink: '#5C2536', // contraste 9.46:1
    accent: '#E8567A',
    palette: ['#F2985A', '#F5C065', '#B98BD0', '#D14F82'],
    pattern: 'gradientBands',
    typography: 'display',
    textAlign: 'center',
  },
  nube: {
    key: 'nube',
    label: 'Nube',
    background: '#E6EAFB',
    ink: '#2E3467', // contraste 9.72:1
    accent: '#6B7FD1',
    palette: ['#FFFFFF', '#A9C8F0', '#C9BEEC', '#D6DEF5'],
    pattern: 'clouds',
    typography: 'grotesk',
    textAlign: 'left',
  },
  hojas: {
    key: 'hojas',
    label: 'Hojas',
    background: '#DFF3E8',
    ink: '#204030', // contraste 9.86:1
    accent: '#3E7A50',
    palette: ['#9FC79A', '#C8E8CE', '#7A8A4A', '#F2F5E8'],
    pattern: 'leaves',
    typography: 'script',
    textAlign: 'center',
  },
  confeti: {
    key: 'confeti',
    label: 'Confeti',
    background: '#FFF6F0',
    ink: '#3A2E3D', // contraste 12.02:1
    accent: '#E0538A',
    palette: ['#F5D64B', '#5AB8B0', '#8B9EE8', '#F08066', '#7ECBA0'],
    pattern: 'confetti',
    typography: 'grotesk',
    textAlign: 'left',
  },
  luna: {
    key: 'luna',
    label: 'Luna',
    background: '#D8E0F5',
    ink: '#223159', // contraste 9.63:1
    accent: '#8B98D6',
    palette: ['#5A6BB0', '#F0DE8B', '#EDEFFB', '#A9B8E0'],
    pattern: 'crescents',
    typography: 'display',
    textAlign: 'center',
  },
};

/** Obtiene los tokens visuales de una variante a partir de su clave. */
export const getPromiseTheme = (key: PromiseThemeKey): PromiseTheme => PROMISE_THEMES[key];
