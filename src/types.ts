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
export type AnimationUnit = "letras" | "palavra" | "frase";
export type Position = "topo" | "centro" | "baixo";
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
  | "carmim"
  | "nuvens-azuis"
  | "fumaca-carmim"
  | "feixes-brasa"
  | "respingos-tinta"
  | "seda-fogo"
  | "fumaca-prata";

export interface Scene {
  text: string;
  title?: boolean;
}

export interface SceneStyle {
  themeId: string;
  font: FontFamily;
  highlightFont: FontFamily;
  fontSize: number;
  highlightFontSize: number;
  anim: Animation;
  highlightAnim: Animation;
  animUnit: AnimationUnit;
  highlightAnimUnit: AnimationUnit;
  animDuration: number;
  highlightAnimDuration: number;
  position: Position;
  inkColor: string;
  highlightColor: string;
  invertColors: boolean;
  uppercase: boolean;
  shadow: boolean;
}

export interface Settings extends Omit<SceneStyle, "anim"> {
  animation: Animation;
  secondsPerScene: number;
  resolution: Resolution;
}

export interface Project {
  version: 1;
  id: string;
  updatedAt: number;
  title: string;
  includeTitleScene: boolean;
  lyrics: string;
  settings: Settings;
  sceneStyles: Record<number, Partial<SceneStyle>>;
}

export interface LibraryData {
  userName: string;
  projects: Project[];
}

export interface UserAccount {
  id: string;
  name: string;
  church: string;
  email: string;
  password?: string;
  provider: "email" | "google";
}

export interface AuthState {
  currentUser: UserAccount | null;
  users: UserAccount[];
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
  highlightAnim?: Animation;
  up: boolean;
  shadow: boolean;
}

export interface HighlightWord {
  text: string;
  highlighted: boolean;
}
