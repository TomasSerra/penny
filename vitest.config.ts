import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['shared/**/*.test.ts', 'api/**/*.test.ts'],
    environment: 'node',
  },
})
