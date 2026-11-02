import type {
  Reporter,
  FullConfig,
  Suite,
  TestCase,
  TestResult,
  FullResult,
} from '@playwright/test/reporter';

interface ProbeTestStep {
  name: string;
  status: 'passed' | 'failed' | 'skipped' | 'timedOut' | 'interrupted';
  duration_ms: number;
  error_message?: string;
  error_category?: string;
}

interface ProbeTestRun {
  project_name: string;
  scenario_name: string;
  environment: string;
  status: 'passed' | 'failed' | 'mixed';
  total_steps: number;
  passed_steps: number;
  failed_steps: number;
  skipped_steps: number;
  duration_ms: number;
  steps: ProbeTestStep[];
}

/**
 * WorkHub Probe Playwright Reporter
 *
 * 테스트 결과를 Probe API로 전송하여
 * 중앙 대시보드에서 전 허브 결과를 통합 관리
 *
 * playwright.config.ts에서 사용:
 * ```
 * reporter: [
 *   ['html'],
 *   ['@workhub/probe/reporters/probe-reporter', { apiUrl: 'http://localhost:4100' }]
 * ]
 * ```
 */
class ProbeReporter implements Reporter {
  private apiUrl: string;
  private projectName: string;
  private environment: string;
  private steps: ProbeTestStep[] = [];
  private startTime: number = 0;

  constructor(options: { apiUrl?: string; projectName?: string; environment?: string } = {}) {
    this.apiUrl = options.apiUrl || process.env.PROBE_API_URL || 'http://localhost:4100';
    this.projectName = options.projectName || process.env.PROBE_PROJECT || 'unknown';
    this.environment = options.environment || process.env.NODE_ENV || 'development';
  }

  onBegin(_config: FullConfig, _suite: Suite): void {
    this.startTime = Date.now();
    this.steps = [];
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    const step: ProbeTestStep = {
      name: `${test.parent.title} > ${test.title}`,
      status: result.status,
      duration_ms: result.duration,
    };

    if (result.status === 'failed' || result.status === 'timedOut') {
      const error = result.errors[0];
      step.error_message = error?.message?.substring(0, 500) || 'Unknown error';
      step.error_category = this.categorizeError(error?.message || '');
    }

    this.steps.push(step);
  }

  async onEnd(result: FullResult): Promise<void> {
    const duration = Date.now() - this.startTime;
    const passed = this.steps.filter(s => s.status === 'passed').length;
    const failed = this.steps.filter(s => s.status === 'failed' || s.status === 'timedOut').length;
    const skipped = this.steps.filter(s => s.status === 'skipped').length;

    const testRun: ProbeTestRun = {
      project_name: this.projectName,
      scenario_name: `playwright-${new Date().toISOString().split('T')[0]}`,
      environment: this.environment,
      status: failed > 0 ? (passed > 0 ? 'mixed' : 'failed') : 'passed',
      total_steps: this.steps.length,
      passed_steps: passed,
      failed_steps: failed,
      skipped_steps: skipped,
      duration_ms: duration,
      steps: this.steps,
    };

    await this.sendToProbeApi(testRun);
  }

  private async sendToProbeApi(testRun: ProbeTestRun): Promise<void> {
    try {
      const response = await fetch(`${this.apiUrl}/api/results/playwright`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testRun),
      });

      if (response.ok) {
        console.log(`\n📊 Probe: 결과 전송 완료 → ${this.apiUrl} (${testRun.status})`);
      } else {
        console.warn(`\n⚠️ Probe: 결과 전송 실패 (${response.status})`);
      }
    } catch {
      // Probe API 미실행 시 조용히 실패
      console.warn(`\n⚠️ Probe: API 서버 연결 불가 (${this.apiUrl})`);
    }
  }

  private categorizeError(message: string): string {
    if (message.includes('timeout') || message.includes('Timeout')) return 'TIMEOUT';
    if (message.includes('401') || message.includes('403') || message.includes('Unauthorized')) return 'AUTH';
    if (message.includes('404') || message.includes('Not Found')) return 'NOT_FOUND';
    if (message.includes('500') || message.includes('Internal Server')) return 'SERVER_ERROR';
    if (message.includes('selector') || message.includes('locator')) return 'SELECTOR';
    if (message.includes('navigation') || message.includes('Navigation')) return 'NAVIGATION';
    return 'UNKNOWN';
  }
}

export default ProbeReporter;
