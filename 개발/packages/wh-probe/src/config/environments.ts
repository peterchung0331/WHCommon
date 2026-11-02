import type { Environment } from './hub-registry.js';

interface EnvironmentConfig {
  timeout: number;
  navigationTimeout: number;
  actionTimeout: number;
  workers: number;
  retries: number;
  screenshot: 'off' | 'on' | 'only-on-failure';
  video: 'off' | 'on' | 'retain-on-failure';
  trace: 'off' | 'on' | 'on-first-retry' | 'retain-on-failure';
}

const ENVIRONMENT_CONFIGS: Record<Environment, EnvironmentConfig> = {
  local: {
    timeout: 30_000,
    navigationTimeout: 15_000,
    actionTimeout: 10_000,
    workers: 1,
    retries: 1,
    screenshot: 'only-on-failure',
    video: 'off',
    trace: 'on-first-retry',
  },
  staging: {
    timeout: 60_000,
    navigationTimeout: 30_000,
    actionTimeout: 15_000,
    workers: 1,
    retries: 2,
    screenshot: 'on',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },
  production: {
    timeout: 90_000,
    navigationTimeout: 60_000,
    actionTimeout: 15_000,
    workers: 1,
    retries: 3,
    screenshot: 'on',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },
};

export const ENVIRONMENTS = ENVIRONMENT_CONFIGS;

export function getEnvironmentConfig(env: Environment): EnvironmentConfig {
  return ENVIRONMENT_CONFIGS[env];
}
