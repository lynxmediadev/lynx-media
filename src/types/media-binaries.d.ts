/**
 * Declaraciones de tipos para módulos con exports no-ESM
 * Útil para evitar warnings de TS al importar rutas de binarios.
 */
declare module "ffmpeg-static" {
  const pathToFfmpeg: string;
  export default pathToFfmpeg;
}

declare module "ffprobe-static" {
  const mod: { path: string };
  export = mod;
}
