import { describe, expect, it } from 'vitest';
import { PROMISE_CATALOG } from '../promiseCatalog';
import { PROMISE_THEMES, type PromiseThemeKey } from '../../../domain/value-objects/PromiseTheme';

/**
 * Convierte un color sRGB de 8 bits (0-255) a su valor linealizado,
 * según la fórmula de luminancia relativa de WCAG 2.1.
 */
const linearizeChannel = (channel8bit: number): number => {
  const channel = channel8bit / 255;
  return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
};

/** Parsea un color hex (#RRGGBB) a su tupla [r, g, b] en 0-255. */
const hexToRgb = (hex: string): readonly [number, number, number] => {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return [r, g, b];
};

/** Luminancia relativa de un color hex, según WCAG 2.1. */
const relativeLuminance = (hex: string): number => {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * linearizeChannel(r) + 0.7152 * linearizeChannel(g) + 0.0722 * linearizeChannel(b);
};

/** Ratio de contraste WCAG entre dos colores hex. */
const contrastRatio = (hexA: string, hexB: string): number => {
  const luminanceA = relativeLuminance(hexA);
  const luminanceB = relativeLuminance(hexB);
  const lighter = Math.max(luminanceA, luminanceB);
  const darker = Math.min(luminanceA, luminanceB);
  return (lighter + 0.05) / (darker + 0.05);
};

const WCAG_AA_MIN_CONTRAST = 4.5;
const MIN_TEXT_LENGTH = 40;
const MAX_TEXT_LENGTH = 260;
const MIN_CATALOG_SIZE = 60;
const ALL_THEME_KEYS: readonly PromiseThemeKey[] = [
  'arcoiris',
  'margaritas',
  'olas',
  'estrellas',
  'lunares',
  'sol',
  'jardin',
  'atardecer',
  'nube',
  'hojas',
  'confeti',
  'luna',
];

describe('PROMISE_CATALOG', () => {
  it('tiene al menos 60 entradas', () => {
    expect(PROMISE_CATALOG.length).toBeGreaterThanOrEqual(MIN_CATALOG_SIZE);
  });

  it('todos los id son únicos', () => {
    const ids = PROMISE_CATALOG.map((card) => card.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('todos los themeKey existen en PROMISE_THEMES', () => {
    for (const card of PROMISE_CATALOG) {
      expect(PROMISE_THEMES[card.themeKey]).toBeDefined();
    }
  });

  it('todos los textos miden entre 40 y 260 caracteres', () => {
    for (const card of PROMISE_CATALOG) {
      expect(card.text.length).toBeGreaterThanOrEqual(MIN_TEXT_LENGTH);
      expect(card.text.length).toBeLessThanOrEqual(MAX_TEXT_LENGTH);
    }
  });

  it('cada highlight aparece literalmente dentro del texto de su tarjeta', () => {
    for (const card of PROMISE_CATALOG) {
      expect(card.highlight.length).toBeGreaterThanOrEqual(1);
      expect(card.highlight.length).toBeLessThanOrEqual(3);
      for (const phrase of card.highlight) {
        expect(card.text).toContain(phrase);
      }
    }
  });

  it('usa las 12 variantes de tema al menos una vez cada una', () => {
    const usedThemeKeys = new Set(PROMISE_CATALOG.map((card) => card.themeKey));
    for (const themeKey of ALL_THEME_KEYS) {
      expect(usedThemeKeys.has(themeKey)).toBe(true);
    }
  });

  it('incluye Santiago 1:17, el versículo raíz de la marca', () => {
    const rootVerse = PROMISE_CATALOG.find((card) => card.id === 'santiago-1-17');
    expect(rootVerse).toBeDefined();
    expect(rootVerse?.reference).toBe('Santiago 1:17');
  });
});

describe('PROMISE_THEMES — contraste WCAG AA', () => {
  for (const themeKey of ALL_THEME_KEYS) {
    it(`el tema "${themeKey}" cumple contraste AA (>= ${WCAG_AA_MIN_CONTRAST}:1) entre ink y background`, () => {
      const theme = PROMISE_THEMES[themeKey];
      const ratio = contrastRatio(theme.background, theme.ink);
      expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_MIN_CONTRAST);
    });
  }
});
