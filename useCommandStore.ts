import { create } from 'zustand'

export type CyberMode = 'neon' | 'rain' | 'matrix'

interface CommandState {
  mode: CyberMode
  glitchIntensity: number
  emissiveColor: string
  setMode: (mode: CyberMode) => void
}

const modeConfig: Record<CyberMode, { glitchIntensity: number; emissiveColor: string }> = {
  neon: { glitchIntensity: 0.0, emissiveColor: '#00ffff' },
  rain: { glitchIntensity: 0.1, emissiveColor: '#e1306c' },
  matrix: { glitchIntensity: 0.6, emissiveColor: '#39ff14' },
}

export const useCommandStore = create<CommandState>((set) => ({
  mode: 'neon',
  glitchIntensity: 0.0,
  emissiveColor: '#00ffff',
  setMode: (mode) =>
    set({
      mode,
      glitchIntensity: modeConfig[mode].glitchIntensity,
      emissiveColor: modeConfig[mode].emissiveColor,
    }),
}))
