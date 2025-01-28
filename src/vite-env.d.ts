/// <reference types="vite/client" />

import { CSSProperties } from "react";

declare global {
  type Song = {
    author: string;
    bpm: number;
    coverArt: string;
    name: string;
    file: string;
  };

  type System = {
    name: string;
    title: string;
    altTitle: string;
    core: string;
    styles: {
      swiperSlide?: CSSProperties;
      gameInfo?: CSSProperties;
      video?: CSSProperties;
      logo?: CSSProperties;
    };
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
    achievementOfTheWeek: boolean;
  };
}

export {};
