// rollup.config.js — Production bundle configuration
import resolve    from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import commonjs   from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import copy       from 'rollup-plugin-copy';
import { rollupPluginHTML as html } from '@web/rollup-plugin-html';

const production = process.env.NODE_ENV === 'production';

export default {
  input: 'index.html',            // ← point at HTML, not main.ts
  output: {
    dir:            'dist',
    format:         'es',
    sourcemap:      !production,
    chunkFileNames: 'chunks/[name]-[hash].js',
    manualChunks: (id) => {
      if (id.includes('@imgly/background-removal')) return 'bg-removal';
      if (id.includes('node_modules/lit'))          return 'lit';
    }
  },
  plugins: [
    // Processes index.html → rewrites script tags to point at bundled output
    html({
      minify: production,
    }),

    resolve({
      browser:          true,
      preferBuiltins:   false,
      exportConditions: ['browser', 'import', 'module', 'default']
    }),
    commonjs(),
    typescript({
      tsconfig:       './tsconfig.json',
      declaration:    false,
      declarationMap: false,
      sourceMap:      !production
    }),

    // Copy static assets into dist/
    copy({
      targets: [{ src: 'assets', dest: 'dist' }],
      hook: 'writeBundle'          // run after files are written
    }),

    production && terser({
      format:   { comments: false },
      compress: { passes: 2 }
    })
  ].filter(Boolean),

  onwarn(warning, warn) {
    if (warning.code === 'CIRCULAR_DEPENDENCY') return;
    warn(warning);
  }
};