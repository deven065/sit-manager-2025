import { healthCheckEndpoint, defaultHealthChecks } from '@/lib/backend';

const healthCheck = healthCheckEndpoint({
  ...defaultHealthChecks,
  
  api: async () => {
    return { responsive: true };
  },
  
  cache: async () => {
    return { operational: true };
  },
});

export async function GET() {
  return healthCheck();
}
