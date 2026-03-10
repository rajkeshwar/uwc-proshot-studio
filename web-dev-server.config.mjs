// web-dev-server.config.mjs — Development server with esbuild TypeScript transform
import { esbuildPlugin } from '@web/dev-server-esbuild';

export default {
  rootDir:     '.',
  open:        true,
  watch:       true,
  nodeResolve: true,

  plugins: [
    // esbuild handles TypeScript and modern JS — much faster than tsc
    esbuildPlugin({
      ts:  true,
      tsx: false,
      // Target modern browsers — keeps output close to source for easy debugging
      target: 'es2020',
    }),
  ],
};
