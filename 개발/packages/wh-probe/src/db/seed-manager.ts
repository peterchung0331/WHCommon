import pg from 'pg';
import { TEST_USERS } from '../fixtures/test-users.js';

const { Pool } = pg;

/**
 * DB 시드 매니저 — 테스트 데이터 생성/정리
 * HubManager database.helper.ts 패턴 기반
 */
export class SeedManager {
  private pool: pg.Pool;

  constructor(connectionString?: string) {
    this.pool = new Pool({
      connectionString: connectionString || process.env.DATABASE_URL || 'postgresql://workhub:workhub@localhost:5433/wbhubmanager',
    });
  }

  async seedTestData(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // 테스트 사용자 생성 (존재하지 않는 경우만)
      for (const [key, user] of Object.entries(TEST_USERS)) {
        if (key === 'master') continue; // master는 실제 계정
        await client.query(
          `INSERT INTO users (email, username, full_name, status, role)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (email) DO NOTHING`,
          [user.email, user.name, user.name, user.status || 'active', user.role || 'user']
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async cleanupTestData(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const testEmails = Object.values(TEST_USERS)
        .filter((_, i) => i > 0) // master 제외
        .map(u => u.email);

      // 의존성 순서대로 삭제
      await client.query(
        `DELETE FROM hub_memberships WHERE user_id IN (SELECT id FROM users WHERE email = ANY($1))`,
        [testEmails]
      );
      await client.query(
        `DELETE FROM users WHERE email = ANY($1)`,
        [testEmails]
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getUserIdByEmail(email: string): Promise<number | null> {
    const result = await this.pool.query('SELECT id FROM users WHERE email = $1', [email]);
    return result.rows[0]?.id ?? null;
  }

  async getHubIdBySlug(slug: string): Promise<number | null> {
    const result = await this.pool.query('SELECT id FROM hubs WHERE slug = $1', [slug]);
    return result.rows[0]?.id ?? null;
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
