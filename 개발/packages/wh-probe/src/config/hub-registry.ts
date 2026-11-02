export type HubName = 'hubmanager' | 'saleshub' | 'finhub' | 'onboardinghub';
export type Environment = 'local' | 'staging' | 'production';

interface HubEndpoints {
  frontend: string;
  backend: string;
  apiPrefix: string;
}

const HUB_CONFIG: Record<Environment, Record<HubName, HubEndpoints>> = {
  local: {
    hubmanager:    { frontend: 'http://localhost:3090', backend: 'http://localhost:4090', apiPrefix: '/api' },
    saleshub:      { frontend: 'http://localhost:3010', backend: 'http://localhost:4010', apiPrefix: '/api' },
    finhub:        { frontend: 'http://localhost:3020', backend: 'http://localhost:4020', apiPrefix: '/api' },
    onboardinghub: { frontend: 'http://localhost:3030', backend: 'http://localhost:4030', apiPrefix: '/api' },
  },
  staging: {
    hubmanager:    { frontend: 'https://staging.workhub.biz:4400', backend: 'https://staging.workhub.biz:4400', apiPrefix: '/api' },
    saleshub:      { frontend: 'https://staging.workhub.biz:4400', backend: 'https://staging.workhub.biz:4400', apiPrefix: '/saleshub/api' },
    finhub:        { frontend: 'https://staging.workhub.biz:4400', backend: 'https://staging.workhub.biz:4400', apiPrefix: '/finhub/api' },
    onboardinghub: { frontend: 'https://staging.workhub.biz:4400', backend: 'https://staging.workhub.biz:4400', apiPrefix: '/api' },
  },
  production: {
    hubmanager:    { frontend: 'https://workhub.biz', backend: 'https://workhub.biz', apiPrefix: '/api' },
    saleshub:      { frontend: 'https://workhub.biz', backend: 'https://workhub.biz', apiPrefix: '/saleshub/api' },
    finhub:        { frontend: 'https://workhub.biz', backend: 'https://workhub.biz', apiPrefix: '/finhub/api' },
    onboardinghub: { frontend: 'https://workhub.biz', backend: 'https://workhub.biz', apiPrefix: '/api' },
  },
};

export const HUB_URLS = HUB_CONFIG;

export function getHubUrl(
  hub: HubName,
  env: Environment = 'local',
  type: 'frontend' | 'backend' = 'frontend'
): string {
  return HUB_CONFIG[env][hub][type];
}

export function getApiPrefix(hub: HubName, env: Environment = 'local'): string {
  return HUB_CONFIG[env][hub].apiPrefix;
}
