import { defineConfig, presetAttributify, presetIcons, presetUno } from 'unocss'

export default defineConfig({
  presets: [
    presetUno({
      dark: 'class',
    }),
    presetAttributify(),
    presetIcons({
      scale: 1.2,
    }),
  ],
  shortcuts: {
    'btn': 'px-4 py-2 rounded-md cursor-pointer transition-colors',
    'btn-primary': 'btn bg-primary text-white hover:bg-primary/90',
  },
  theme: {
    colors: {
      primary: '#2080f0',
    },
  },
})
