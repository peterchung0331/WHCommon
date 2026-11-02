export interface TestUser {
  email: string;
  password?: string;
  role?: 'master' | 'admin' | 'user' | 'viewer';
  status?: 'active' | 'pending' | 'inactive';
  name?: string;
}

export const TEST_USERS = {
  master: {
    email: 'peter.chung@wavebridge.com',
    password: 'wave1234!!',
    role: 'master' as const,
    status: 'active' as const,
    name: 'Peter Chung',
  },
  admin: {
    email: 'test.admin@test.com',
    role: 'admin' as const,
    status: 'active' as const,
    name: 'Test Admin',
  },
  regular: {
    email: 'test.user1@test.com',
    role: 'user' as const,
    status: 'active' as const,
    name: 'Test User 1',
  },
  regular2: {
    email: 'test.user2@test.com',
    role: 'user' as const,
    status: 'active' as const,
    name: 'Test User 2',
  },
  pending: {
    email: 'test.pending@test.com',
    role: 'user' as const,
    status: 'inactive' as const,
    name: 'Pending User',
  },
} as const satisfies Record<string, TestUser>;
