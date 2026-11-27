export type Animation =
  | "subir"
  | "palavras"
  | "zoom"
  | "surgir"
  | "deslizar-esq"
  | "deslizar-dir"
  | "expandir"
  | "quicar"
  | "espacar"
  | "cortina";
export type Position = "centro" | "baixo";
export type Resolution =
  | "1920x1080"
  | "1280x720"
  | "2560x720"
  | "1080x1920";
export type FontFamily =
  | "Alfa Slab One"
  | "Allura"
  | "Anton"
  | "Archivo Black"
  | "Black Ops One"
  | "Caveat"
  | "Chakra Petch"
  | "Cinzel Decorative"
  | "Cormorant Garamond"
  | "Dancing Script"
  | "Great Vibes"
  | "Julius Sans One"
  | "Josefin Sans"
  | "Kaushan Script"
  | "Outfit"
  | "Pacifico"
  | "Permanent Marker"
  | "Raleway"
  | "Righteous"
  | "Rubik Glitch"
  | "Russo One"
  | "Satisfy"
  | "Space Grotesk"
  | "Syne"
  | "Montserrat"
  | "Oswald"
  | "Poppins"
  | "Playfair Display"
  | "Lora"
  | "Bebas Neue";
export type FontCategory = "Manuscritas" | "Cheias" | "Underground" | "Finas";

export interface FontOption {
  name: FontFamily;
  weight: number;
  category: FontCategory;
  isCursive: boolean;
}
export type ThemeBackground =
  | "aurora"
  | "raios"
  | "bokeh"
  | "estrelas"
  | "ondas"
  | "suave"
  | "chapado"
  | "seda"
  | "diagonal"
  | "bordas"
  | "liquido"
  | "feixes"
  | "carmim";

export interface Scene {
  text: string;
  title?: boolean;
}

export interface Settings {
  themeId: string;
  font: FontFamily;
  highlightFont: FontFamily;
  fontSize: number;
  highlightFontSize: number;
  animation: Animation;
  highlightAnim: Animation;
  animDuration: number;
  highlightAnimDuration: number;
  position: Position;
  inkColor: string;
  highlightColor: string;
  uppercase: boolean;
  shadow: boolean;
  secondsPerScene: number;
  resolution: Resolution;
}

export interface Project {
  version: 1;
  title: string;
  lyrics: string;
  settings: Settings;
}

export interface Theme {
  id: string;
  name: string;
  bg: ThemeBackground;
  c: [string, string, string];
  font: FontFamily;
  highlightFont: FontFamily;
  ink: string;
  hl: string;
  anim: Animation;
  up: boolean;
  shadow: boolean;
}

export interface HighlightWord {
  text: string;
  highlighted: boolean;
}
