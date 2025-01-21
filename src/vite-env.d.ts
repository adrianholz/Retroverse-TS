/// <reference types="vite/client" />

declare global {
  type Song = {
    author: string;
    bpm: number;
    coverArt: string;
    name: string;
    file: string;
  };

  type ThemeTypes = {
    beat: boolean;
    shape: boolean;
    shapeType: string;
    pattern: boolean;
    patternType: string;
    orbit: boolean;
    wave: boolean;
    emulatorLogos: boolean;
    emulatorLogosStyle: string;
    background: boolean;
    visualizer: boolean;
    backgroundColors: {
      color: string;
      size: number;
    }[];
    musicPlayer: boolean;
    visualizerStyle: {
      type: string;
      opacity: number;
      saturate: number;
      brightness: number;
    };
  };
}

export {};
