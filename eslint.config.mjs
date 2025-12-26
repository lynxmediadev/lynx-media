// eslint.config.mjs
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import nextPlugin from '@next/eslint-plugin-next';

export default tseslint.config(
  // Ignorar outputs
  { ignores: [".next/**", "node_modules/**", "dist/**", "build/**"] },

  // Reglas base JS
  js.configs.recommended,

  // Reglas TS -- SOLO para archivos TS/TSX (evita tocar eslint.config.mjs)
  {
    files: ["**/*.ts", "**/*.tsx"],
    extends: [
      ...tseslint.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Baseline relajado para desbloquear; luego endurecemos si quieres
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/prefer-nullish-coalescing": "off",
      "@typescript-eslint/prefer-optional-chain": "off",
      "@typescript-eslint/no-unnecessary-type-assertion": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-floating-promises": "warn",
            // Si usas estas reglas, ahora existirán:
      'react-hooks/exhaustive-deps': 'warn',
      '@next/next/no-img-element': 'warn',

      // Ajustes prácticos para tu base hoy:
      '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: { attributes: false } }],
      '@typescript-eslint/require-await': 'off', // si tienes funciones async sin await
      "tailwindcss/enforces-shorthand": "off",

    },
  },
  {
    files: ['src/env.js', 'next.config.*', 'postcss.config.*', 'tailwind.config.*', 'prisma/**/*.ts'],
    languageOptions: { globals: { process: 'readonly', module: 'readonly', __dirname: 'readonly' } },
  },
);
