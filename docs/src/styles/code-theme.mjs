// Cel & Retino — the docs code register, expressed as an Expressive Code theme.
//
// Two themes, one per site theme: `cel-retino-dark` is the cel register (void
// ground, ink-white notation) and `cel-retino-light` is the print register
// (vellum ground, graphite notation). Every value is a DESIGN.md token:
//
//   role                 dark (cel)           light (print)
//   keywords/operators   cel-cream #ffe9b0    blueprint #17606d
//   strings              cel-amber-deep #ffd08a  safety-orange #c93c1b
//   numbers/constants    cel-amber #ffb347    hud-accent-print #a05a12
//   functions/methods    cel-green #8fd14f   hud-ready-print #1f7a4d
//   comments             ink-faint #7c7a70    ink-faint #767a8c
//   variables/params     ink-body #d9d3c4    ink-body #262b3d
//   punctuation          ink-soft #a8a394     ink-soft #4b5064
//
// The two print-register substitutions (amber, green) keep the same hue role
// as the cel values; the cel accents sit at ~1.3:1 on the vellum code ground
// and would ship as unreadable text. Expressive Code's automatic contrast
// fixer is switched off in astro.config.mjs so these exact values ship.

const tokenColors = (palette) => [
  {
    name: 'Comments',
    scope: ['comment', 'punctuation.definition.comment'],
    settings: { foreground: palette.comment, fontStyle: 'italic' },
  },
  {
    name: 'Keywords and operators',
    scope: [
      'keyword',
      'keyword.control',
      'keyword.operator',
      'storage',
      'storage.type',
      'storage.modifier',
      'punctuation.definition.keyword',
      'punctuation.definition.template-expression',
    ],
    settings: { foreground: palette.keyword },
  },
  {
    name: 'Strings',
    scope: [
      'string',
      'string.quoted',
      'string.template',
      'string.regexp',
      'string.interpolated',
      'constant.other.symbol',
      'punctuation.definition.string',
    ],
    settings: { foreground: palette.string },
  },
  {
    name: 'Numbers and constants',
    scope: [
      'constant',
      'constant.numeric',
      'constant.language',
      'constant.character',
      'constant.character.escape',
      'support.constant',
      'variable.language',
      'support.type.primitive',
    ],
    settings: { foreground: palette.constant },
  },
  {
    name: 'Functions and methods',
    scope: [
      'entity.name.function',
      'support.function',
      'meta.function-call',
      'meta.function',
      'meta.method',
      'entity.name.tag',
      'entity.other.attribute-name',
    ],
    settings: { foreground: palette.function },
  },
  {
    name: 'Variables, params and types',
    scope: [
      'variable',
      'variable.parameter',
      'variable.other',
      'variable.other.readwrite',
      'variable.other.property',
      'variable.other.object.property',
      'meta.definition.variable',
      'meta.object-literal.key',
      'support.type.property-name',
      'entity.name.type',
      'entity.name.class',
      'entity.name.namespace',
      'support.class',
      'support.type',
    ],
    settings: { foreground: palette.variable },
  },
  {
    name: 'Punctuation',
    scope: [
      'punctuation',
      'punctuation.separator',
      'punctuation.terminator',
      'punctuation.accessor',
      'punctuation.definition.block',
      'punctuation.definition.parameters',
      'meta.brace',
    ],
    settings: { foreground: palette.punctuation },
  },
  {
    name: 'Invalid',
    scope: ['invalid', 'invalid.illegal'],
    settings: { foreground: palette.invalid },
  },
];

const darkPalette = {
  keyword: '#ffe9b0',
  string: '#ffd08a',
  constant: '#ffb347',
  function: '#8fd14f',
  comment: '#7c7a70',
  variable: '#d9d3c4',
  punctuation: '#a8a394',
  invalid: '#ff5a36',
};

const lightPalette = {
  keyword: '#17606d',
  string: '#c93c1b',
  constant: '#a05a12',
  function: '#1f7a4d',
  comment: '#767a8c',
  variable: '#262b3d',
  punctuation: '#4b5064',
  invalid: '#b83a2e',
};

export const celRetinoDark = {
  name: 'cel-retino-dark',
  type: 'dark',
  colors: {
    'editor.background': '#0b0c16',
    'editor.foreground': '#d9d3c4',
    'editor.selectionBackground': '#3a2412',
    'editorLineNumber.foreground': '#7c7a70',
    'editorLineNumber.activeForeground': '#a8a394',
    'titleBar.activeBackground': '#1a1d38',
    'titleBar.activeForeground': '#f4efe2',
    'titleBar.border': '#262a48',
    'editorGroupHeader.tabsBackground': '#1a1d38',
    'editorGroupHeader.tabsBorder': '#262a48',
    'tab.activeBackground': '#1a1d38',
    'tab.activeForeground': '#f4efe2',
    'tab.activeBorderTop': '#ffb347',
    'menu.selectionBackground': '#3a2412',
    'menu.selectionForeground': '#f4efe2',
    'scrollbarSlider.background': '#262a48',
    'scrollbarSlider.hoverBackground': '#3a3f66',
    focusBorder: '#ffb347',
  },
  tokenColors: tokenColors(darkPalette),
};

export const celRetinoLight = {
  name: 'cel-retino-light',
  type: 'light',
  colors: {
    'editor.background': '#e6dccb',
    'editor.foreground': '#262b3d',
    'editor.selectionBackground': '#d9e7e8',
    'editorLineNumber.foreground': '#767a8c',
    'editorLineNumber.activeForeground': '#4b5064',
    'titleBar.activeBackground': '#faf6ec',
    'titleBar.activeForeground': '#171a26',
    'titleBar.border': '#c9bfa8',
    'editorGroupHeader.tabsBackground': '#faf6ec',
    'editorGroupHeader.tabsBorder': '#c9bfa8',
    'tab.activeBackground': '#faf6ec',
    'tab.activeForeground': '#171a26',
    'tab.activeBorderTop': '#17606d',
    'menu.selectionBackground': '#d9e7e8',
    'menu.selectionForeground': '#171a26',
    'scrollbarSlider.background': '#c9bfa8',
    'scrollbarSlider.hoverBackground': '#1c2033',
    focusBorder: '#17606d',
  },
  tokenColors: tokenColors(lightPalette),
};
