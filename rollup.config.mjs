import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import dts from 'rollup-plugin-dts';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve as pathResolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const packagesDir = pathResolve(__dirname, 'packages');
const packageFiles = ['types', 'core']; // 指定包的构建顺序

function createConfig(packageName) {
  const packageJson = JSON.parse(
    readFileSync(`${packagesDir}/${packageName}/package.json`, 'utf-8')
  );

  return [
    {
      input: `packages/${packageName}/src/index.ts`,
      output: [
        {
          file: `packages/${packageName}/dist/index.js`,
          format: 'esm',
          sourcemap: true,
        },
        {
          file: `packages/${packageName}/dist/index.cjs.js`,
          format: 'cjs',
          sourcemap: true,
        },
      ],
      plugins: [
        resolve(),
        commonjs(),
        typescript({
          tsconfig: `packages/${packageName}/tsconfig.json`,
          declarationDir: `packages/${packageName}/dist/types`,
        }),
      ],
      external: [...Object.keys(packageJson.dependencies || {})],
    },
    {
      input: `packages/${packageName}/src/index.ts`,
      output: {
        file: `packages/${packageName}/dist/index.d.ts`,
        format: 'es',
      },
      plugins: [dts()],
    },
  ];
}

export default [...packageFiles.map(pkg => createConfig(pkg)).flat()];
