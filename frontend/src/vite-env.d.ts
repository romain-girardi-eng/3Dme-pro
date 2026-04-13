/// <reference types="vite/client" />

// CSS module declarations
declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

// Image declarations
declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.jpeg' {
  const content: string;
  export default content;
}

declare module '*.gif' {
  const content: string;
  export default content;
}

declare module '*.webp' {
  const content: string;
  export default content;
}

// 3D model declarations
declare module '*.glb' {
  const content: string;
  export default content;
}

declare module '*.gltf' {
  const content: string;
  export default content;
}

// Environment variables
interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_SPAR3D_SPACE?: string;
  readonly VITE_TRELLIS_SPACE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
