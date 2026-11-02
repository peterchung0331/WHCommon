# PRD: CRM 미팅노트 화자 분리 품질 개선

> **Product**: Wavebridge CRM — Meeting Notes Module (WBSalesHub)
> **Version**: v2.0
> **Author**: Wavebridge Product Team
> **Last Updated**: 2026-03-16
> **Status**: Draft
> **대상 레포**: WBSalesHub (`/mnt/c/GitHub/WBSalesHub`)

---

## Executive Summary

현재 Wavebridge CRM의 미팅노트 기능은 리턴제로(VITO) STT API를 활용하여 회의 녹음을 텍스트로 변환하고 있으나, 화자 분리(Speaker Diarization) 정확도가 낮아 "누가 무슨 말을 했는지" 파악이 어려운 상황이다. 이는 CRM의 핵심 가치인 고객 맥락 파악과 후속 액션 도출을 저해하고 있다.

본 PRD는 리턴제로 STT를 유지하면서, **오디오 전처리(Pre-processing)**, **pyannote 기반 독립 화자 분리**, **LLM 기반 후처리(Post-processing)** 파이프라인을 단계적으로 추가하여 화자 분리 품질을 개선하는 방안을 정의한다.

### v2.0 주요 변경사항 (v1.0 대비)

| 변경 항목 | v1.0 | v2.0 |
|-----------|------|------|
| Phase 구성 | Phase 1-3 (바로 개발) | **Phase 0(측정 인프라) 추가** — 골든 테스트 셋 구축 선행 |
| Python 통합 | 미정 | **child_process 서브프로세스** 방식 확정 |
| 기존 코드 연동 | 미기술 | rtzrService.ts, voiceUploadProcessor.ts 등 **구체적 수정 위치 명시** |
| RTZR 파라미터 | num_speakers 제안 | **API 지원 여부 검증 태스크** 추가 |
| Fallback 전략 | 없음 | **단계별 Fallback 체인** 설계 |
| 한국어 리스크 | 미언급 | **pyannote 한국어 성능 검증** 계획 포함 |
| 프론트엔드 녹음 | 미언급 | **64kbps → 128kbps** 비트레이트 개선 |
| 처리 UX | 미언급 | **세분화된 진행 상태** (5단계 프로그레스) |
| 비용 분석 | LLM만 | **전체 파이프라인 월간 비용** 통합 추정 |

### 핵심 수치 목표

| 지표 | 현재 (추정) | 목표 (Phase 2 완료) | 목표 (Phase 3 완료) |
|------|-----------|-------------------|-------------------|
| 화자 분리 정확도 (WDER) | ~35-40% | ~20-25% | ~10-15% |
| 화자-발언 매칭 체감 정확도 | ~60% | ~80% | ~90%+ |
| 미팅노트 처리 시간 (1시간 회의) | ~3분 | ~5분 | ~6분 |
| 사용자 수동 교정 비율 | ~40% | ~15% | ~5% |

---

## 1. Problem Statement

### 1.1 현재 문제

CRM 미팅노트의 화자 분리가 부정확하여 다음과 같은 비즈니스 임팩트가 발생하고 있다:

- **고객 발언 오귀속**: 고객이 한 말이 우리 측 담당자 발언으로 기록되어, 고객 니즈 파악 오류 발생
- **후속 액션 추출 실패**: "저희가 검토하겠습니다"의 화자를 잘못 식별하면 액션 아이템의 담당자가 뒤바뀜
- **수동 교정 비용**: 미팅노트를 매번 수동으로 교정해야 하므로 CRM 활용도 저하
- **AI 요약 품질 저하**: 잘못된 화자 정보가 LLM 요약에 전파되어 미팅 인사이트 신뢰도 하락

### 1.2 근본 원인 분석

| 원인 | 설명 | 영향도 |
|------|------|--------|
| 단일 채널 녹음 | 대부분의 화상회의 녹음이 모노 채널로 저장되어 음향 기반 화자 구분이 어려움 | 높음 |
| 낮은 녹음 비트레이트 | 현재 WebM/Opus **64kbps**로 녹음 — 화자 음색 구분에 불리 | **높음 (신규 발견)** |
| 배경 소음 | 회의실 반향, 키보드 소리, 에어컨 등이 화자 임베딩 품질을 저하 | 중간 |
| 짧은 발화 | "네", "알겠습니다" 등 한국어 상호작용 특성상 짧은 발화가 빈번하여 화자 식별 어려움 | 높음 |
| 화자 수 미제공 | API 호출 시 예상 화자 수 힌트를 제공하지 않아 불필요한 화자 분할 발생 | 중간 |
| 후처리 부재 | STT 결과를 그대로 사용하여 문맥 기반 보정이 이루어지지 않음 | 높음 |

### 1.3 현재 구현 상태 (코드 기준)

현재 미팅노트 음성 업로드 파이프라인은 다음과 같이 구현되어 있다:

```
[프론트엔드 녹음]                    [RTZR STT]                    [Claude 요약]
useAudioRecorder.ts          →    rtzrService.ts            →    claude.service.ts
WebM/Opus 64kbps                  use_diarization: true          summary + detailed_notes
                                  domain: 'GENERAL'
                                  (num_speakers 미설정)
        ↓                                ↓                              ↓
voiceUploadRoutes.ts              voiceUploadProcessor.ts        VoiceNoteConfirmModal.tsx
POST /voice/upload                5초 간격 폴링 (최대 1시간)       사용자 확인 후 저장
Multer 500MB 제한                 formatTranscript()
                                  "화자N: text" 포맷
```

**핵심 파일 경로**:

| 파일 | 역할 | 수정 필요 |
|------|------|----------|
| `server/services/rtzrService.ts` | RTZR API 호출, 인증, 결과 포맷팅 | ✅ Phase 0, 1, 2 |
| `server/services/voiceUploadProcessor.ts` | 파이프라인 오케스트레이션 | ✅ 모든 Phase |
| `server/routes/voiceUploadRoutes.ts` | 업로드 API, 상태 조회 | ✅ Phase 0, 3 |
| `server/modules/integrations/claude/claude.service.ts` | Claude AI 요약 | ✅ Phase 3 |
| `frontend/hooks/useAudioRecorder.ts` | 브라우저 녹음 (비트레이트 설정) | ✅ Phase 0 |
| `frontend/hooks/useVoiceUpload.ts` | 업로드/상태 조회 hooks | ✅ Phase 0 |
| `frontend/components/meeting-notes/MeetingNoteDetail.tsx` | 미팅노트 상세 표시 | ✅ Phase 2, 3 |
| `frontend/components/meeting-notes/VoiceNoteConfirmModal.tsx` | 확인 모달 | ✅ Phase 3 |
| `server/database/schema/meeting_notes.sql` | DB 스키마 | ✅ Phase 0, 2 |

### 1.4 스코프 정의

**In Scope**:
- 프론트엔드 녹음 비트레이트 개선 (64kbps → 128kbps)
- 오디오 전처리 파이프라인 (노이즈 제거, VAD, 리샘플링)
- 리턴제로 API 파라미터 최적화 (화자 수 힌트, 최소 발화 길이)
- pyannote.audio 기반 독립 화자 분리 모듈 (선택적 대체)
- LLM 기반 화자 레이블 후처리
- CRM 미팅 참석자 정보를 활용한 화자 이름 매핑
- 골든 테스트 셋 구축 및 측정 인프라

**Out of Scope**:
- STT 엔진 자체 구축 또는 교체 (리턴제로 유지)
- 실시간 화자 분리 (비동기 처리만 대상)
- Voice ID 기반 화자 식별 (Phase 4 이후 별도 검토)
- 모바일 앱 네이티브 녹음 기능

---

## 2. Solution Architecture

### 2.1 전체 파이프라인

```
[오디오 입력]
     │
     ▼
┌─────────────────────────────────────────┐
│  Phase 0: Quick Wins                     │
│                                         │
│  • 프론트엔드 비트레이트 128kbps 적용     │
│  • RTZR num_speakers 파라미터 검증/적용   │
│  • attendees.length → 화자 수 힌트        │
│  • 골든 테스트 셋 + 베이스라인 측정        │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Phase 1: 전처리 (Pre-processing)        │
│  [Python 서브프로세스]                    │
│                                         │
│  1. 포맷 정규화 (16kHz, mono, WAV)       │
│  2. 노이즈 제거 (noisereduce)            │
│  3. VAD 적용 (Silero VAD)                │
│  4. 오디오 품질 메타데이터 추출            │
│                                         │
│  ⚠️ Fallback: 실패 시 원본 오디오로 진행  │
└──────────────┬──────────────────────────┘
               │
     ┌─────────┴─────────┐
     ▼                   ▼
┌──────────┐    ┌──────────────────┐
│ 리턴제로  │    │ pyannote.audio   │
│ VITO API │    │ [Python 서브프로세스]│
│          │    │ (선택적 활성화)    │
│ • STT    │    │                  │
│ • 화자분리│    │ • 화자 분리 전용  │
│ • 타임스탬│    │ • num_speakers   │
│          │    │   힌트 제공       │
│          │    │                  │
│          │    │ ⚠️ Fallback:     │
│          │    │ 실패 시 RTZR     │
│          │    │ 화자분리 사용     │
└────┬─────┘    └───────┬──────────┘
     │                  │
     ▼                  ▼
┌─────────────────────────────────────────┐
│  Phase 2: 정렬 및 병합 (Alignment)       │
│                                         │
│  • 리턴제로 워드 타임스탬프 기준          │
│  • pyannote 화자 타임스탬프 오버레이      │
│  • 시간축 교차(intersection) 매칭         │
│  • Confidence score 산출                 │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Phase 3: LLM 후처리                     │
│  (Post-processing)                      │
│                                         │
│  1. 화자 레이블 보정 (맥락 기반)          │
│  2. 화자 이름 매핑 (CRM 참석자 정보)      │
│  3. TPST 원문 보존 검증                  │
│  4. Confidence Score 기반 선별 적용       │
│                                         │
│  ⚠️ Fallback: 실패 시 보정 전 결과 사용   │
└──────────────┬──────────────────────────┘
               │
               ▼
[CRM 미팅노트 저장]
  • 화자별 발언 세그먼트
  • 타임스탬프
  • 신뢰도 점수
  • AI 요약
```

### 2.2 Python 서브프로세스 통합 아키텍처

현재 SalesHub 백엔드는 Express.js + TypeScript이다. Python 기반 오디오 처리 모듈(noisereduce, pyannote, Silero VAD)은 **Node.js child_process**를 통해 Python 스크립트를 호출하는 방식으로 통합한다.

```
WBSalesHub/
├── server/
│   ├── services/
│   │   ├── rtzrService.ts              # 기존 RTZR API
│   │   ├── voiceUploadProcessor.ts     # 파이프라인 오케스트레이션 (수정)
│   │   └── audioPipelineService.ts     # 🆕 Python 서브프로세스 브릿지
│   └── ...
├── python/                             # 🆕 Python 오디오 처리 모듈
│   ├── requirements.txt                # noisereduce, silero-vad, pyannote, torch
│   ├── preprocess.py                   # 전처리 엔트리포인트
│   ├── diarize.py                      # pyannote 화자 분리 엔트리포인트
│   ├── lib/
│   │   ├── audio_normalizer.py         # 포맷 정규화
│   │   ├── noise_reducer.py            # 노이즈 제거
│   │   ├── vad.py                      # Voice Activity Detection
│   │   └── quality_analyzer.py         # 품질 점수 산출
│   └── tests/
│       ├── test_preprocess.py
│       └── test_diarize.py
└── ...
```

**서브프로세스 호출 패턴**:

```typescript
// server/services/audioPipelineService.ts

import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

interface PreprocessResult {
  cleaned_audio_path: string;
  quality_score: number;
  vad_segments: Array<{ start: number; end: number }>;
  snr: number;
  duration: number;
}

interface DiarizationResult {
  segments: Array<{
    speaker: string;
    start: number;
    end: number;
    confidence: number;
  }>;
}

class AudioPipelineService {
  private pythonPath: string;
  private scriptDir: string;
  private timeout: number;

  constructor() {
    this.pythonPath = process.env.PYTHON_PATH || 'python3';
    this.scriptDir = path.join(__dirname, '../../python');
    this.timeout = 5 * 60 * 1000; // 5분 타임아웃
  }

  /**
   * 오디오 전처리 (노이즈 제거 + VAD + 포맷 정규화)
   * Fallback: 실패 시 원본 오디오 경로 반환
   */
  async preprocess(audioPath: string): Promise<PreprocessResult> {
    try {
      const { stdout } = await execFileAsync(
        this.pythonPath,
        [path.join(this.scriptDir, 'preprocess.py'), '--input', audioPath],
        { timeout: this.timeout, maxBuffer: 10 * 1024 * 1024 }
      );
      return JSON.parse(stdout);
    } catch (error) {
      logger.warn('Preprocessing failed, using original audio', { error });
      return {
        cleaned_audio_path: audioPath,  // Fallback: 원본 사용
        quality_score: 0.5,
        vad_segments: [],
        snr: -1,
        duration: -1,
      };
    }
  }

  /**
   * pyannote 화자 분리
   * Fallback: 실패 시 null 반환 → RTZR 화자 분리 사용
   */
  async diarize(
    audioPath: string,
    numSpeakers?: number
  ): Promise<DiarizationResult | null> {
    try {
      const args = [path.join(this.scriptDir, 'diarize.py'), '--input', audioPath];
      if (numSpeakers) args.push('--num-speakers', String(numSpeakers));

      const { stdout } = await execFileAsync(
        this.pythonPath, args,
        { timeout: this.timeout, maxBuffer: 10 * 1024 * 1024 }
      );
      return JSON.parse(stdout);
    } catch (error) {
      logger.warn('Diarization failed, falling back to RTZR', { error });
      return null;  // Fallback: RTZR 결과 사용
    }
  }
}
```

**Python 환경 관리**:

| 항목 | 전략 |
|------|------|
| Python 버전 | 3.10+ (로컬 venv 또는 Docker 내장) |
| 의존성 관리 | `python/requirements.txt` + venv |
| 로컬 개발 | 수동 `pip install` 또는 setup 스크립트 |
| 프로덕션 (Docker) | Dockerfile에 Python 런타임 추가 (multi-stage) |
| 에러 핸들링 | stdout으로 JSON 결과, stderr로 에러 로그, exit code로 성공/실패 |
| 타임아웃 | 5분 (1시간 오디오 기준 충분) |

**Docker 멀티스테이지 빌드 변경**:

```dockerfile
# Python 의존성 설치 스테이지
FROM python:3.10-slim AS python-deps
WORKDIR /app/python
COPY python/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 기존 Node.js 빌드 스테이지
FROM node:20-alpine AS builder
# ... (기존 빌드 로직)

# 런타임 스테이지
FROM node:20-alpine AS runner
# Python 런타임 추가
RUN apk add --no-cache python3 py3-pip
COPY --from=python-deps /usr/local/lib/python3.10/site-packages /usr/local/lib/python3.10/site-packages
COPY python/ ./python/
# ... (기존 런타임 설정)
```

### 2.3 Fallback 체인 설계

각 파이프라인 단계에서 실패 시 이전 단계의 결과로 안전하게 폴백한다:

```
[전처리 실패?]
     │
     ├─ Yes → 원본 오디오로 RTZR 호출 (현재와 동일)
     │
     └─ No → 전처리된 오디오로 RTZR 호출
              │
              ▼
         [pyannote 실패?]
              │
              ├─ Yes → RTZR 내장 화자 분리 결과 사용 (현재와 동일)
              │
              └─ No → pyannote 결과 + RTZR STT 정렬
                       │
                       ▼
                  [LLM 후처리 실패?]
                       │
                       ├─ Yes → 정렬 결과 그대로 사용
                       │
                       └─ No → LLM 보정 결과 사용
                                │
                                ▼
                           [TPST 검증 실패?]
                                │
                                ├─ Yes → LLM 보정 전 결과 사용
                                │
                                └─ No → 최종 결과 사용
```

**원칙**: 어떤 단계가 실패하더라도 최소한 현재 수준(RTZR-only)의 결과는 보장한다.

### 2.4 데이터 흐름 상세

```
Input:  audio_file (any format) + meeting_metadata (participants, context)
                │
                ▼
         ┌─────────────┐
         │ Preprocessor │  [Python subprocess]
         └──────┬──────┘
                │  output: cleaned_audio (16kHz mono WAV)
                │          quality_score (0-1)
                │          vad_segments [{start, end}]
                │
         ┌──────┴──────┐
         ▼             ▼
   ┌──────────┐  ┌───────────┐
   │ VITO API │  │ pyannote  │  (parallel execution)
   └────┬─────┘  └─────┬─────┘  [Python subprocess]
        │              │
        │  stt_result: │  diarization_result:
        │  [{word,      │  [{speaker, start, end}]
        │    start,     │
        │    end,       │
        │    speaker}]  │
        │              │
        └──────┬───────┘
               ▼
        ┌─────────────┐
        │  Aligner    │  [TypeScript]
        └──────┬──────┘
               │  aligned_result:
               │  [{word, start, end, speaker, confidence}]
               │
               ▼
        ┌─────────────┐
        │ LLM Refiner │  [TypeScript + Claude API]
        └──────┬──────┘
               │  refined_result:
               │  [{segment_text, speaker_name, start, end, confidence}]
               │
               ▼
        ┌─────────────┐
        │  CRM Store  │  [PostgreSQL]
        └─────────────┘
```

### 2.5 처리 상태 세분화

현재 `status` 필드(`transcribing` | `summarizing` | `pending_confirm` | `confirmed` | `failed`)를 확장하여, 사용자에게 세분화된 진행 상태를 표시한다.

**DB 변경 (meeting_notes 테이블)**:

```sql
-- 새 컬럼 추가
ALTER TABLE meeting_notes ADD COLUMN processing_step VARCHAR(30);
-- 'preprocessing' | 'transcribing' | 'diarizing' | 'refining' | 'summarizing'

ALTER TABLE meeting_notes ADD COLUMN processing_progress JSONB;
-- { "current_step": 2, "total_steps": 5, "step_name": "transcribing", "started_at": "..." }
```

**프론트엔드 프로그레스 표시**:

```
[전처리] → [음성인식] → [화자분리] → [AI보정] → [요약생성]
  ✅          🔄          ⬜          ⬜         ⬜
```

**수정 파일**:
- `server/services/voiceUploadProcessor.ts`: 각 단계 진입 시 `processing_step` 업데이트
- `server/routes/voiceUploadRoutes.ts`: `GET /voice/status/:noteId`에 `processing_step` 포함
- `frontend/hooks/useVoiceUpload.ts`: `useVoiceStatus` 응답에 step 정보 추가
- `frontend/components/meeting-notes/VoiceNoteConfirmModal.tsx`: 프로그레스 스테퍼 UI 추가

---

## 3. Phase별 상세 스펙

### Phase 0: 측정 인프라 + Quick Wins

**목표**: 개선 효과 측정 기반 구축 + 인프라 변경 없는 즉시 개선
**기간**: 1.5주
**담당**: Backend Engineer 1명

> ⚠️ **Phase 0은 모든 후속 Phase의 전제조건이다.** 골든 테스트 셋 없이는 개선 여부를 객관적으로 판단할 수 없다.

#### 3.0.1 골든 테스트 셋 구축

| 항목 | 규격 |
|------|------|
| 샘플 수 | 최소 20개 미팅 녹음 |
| 화자 수 분포 | 2인(10개), 3-4인(7개), 5인+(3개) |
| 오디오 환경 | 화상회의(15개), 대면회의(5개) |
| 라벨링 | 화자별 발언 구간 수동 표기 (RTTM 포맷) |
| 언어 | 한국어(18개), 한영 혼용(2개) |
| 도메인 | 금융/크립토 미팅 위주 |
| 녹음 소스 | CRM 기존 업로드 파일 중 선별 + 신규 녹음 |

**측정 도구 구현**:

```python
# python/evaluate.py
# WDER (Word Diarization Error Rate) 계산기

def calculate_wder(
    reference_rttm: str,   # 골든 레이블 (RTTM 포맷)
    hypothesis_rttm: str,  # 시스템 출력 (RTTM 포맷)
) -> dict:
    """
    Returns:
        {
            "wder": float,           # 0.0 ~ 1.0
            "der": float,            # Diarization Error Rate
            "confusion": float,      # 화자 혼동 비율
            "missed_speech": float,  # 누락된 발화 비율
            "false_alarm": float,    # 오탐 비율
        }
    """
```

#### 3.0.2 RTZR API 파라미터 검증 및 최적화

**검증 필요 항목** (RTZR VITO API 문서 확인):

| 파라미터 | 현재 설정 | 검증 필요 | 기대 효과 |
|---------|----------|----------|----------|
| `use_diarization` | `true` | ✅ 설정 확인됨 | - |
| `num_speakers` 또는 유사 파라미터 | 미설정 | ❓ **API 지원 여부 확인 필요** | 불필요한 화자 분할 방지 |
| `min_speech_duration` 또는 유사 | 기본값 | ❓ **API 지원 여부 확인 필요** | 짧은 소음 오탐 감소 |
| `domain` | `'GENERAL'` | `'FINANCE'` 등 도메인 특화 옵션 확인 | 금융 용어 인식률 향상 |

**CRM attendees → 화자 수 힌트**:

```typescript
// server/services/voiceUploadProcessor.ts 수정

// 현재: rtzrService.transcribe(filePath)
// 변경:
const numSpeakers = meetingNote.attendees?.length || undefined;
const result = await rtzrService.transcribe(filePath, { numSpeakers });
```

```typescript
// server/services/rtzrService.ts 수정

async transcribe(filePath: string, options?: { numSpeakers?: number }) {
  const config: any = {
    use_diarization: true,
    domain: 'GENERAL',
  };

  // RTZR API가 지원하는 경우에만 추가
  if (options?.numSpeakers && RTZR_SUPPORTS_NUM_SPEAKERS) {
    config.diarization = {
      spk_count: options.numSpeakers,  // 실제 파라미터명은 API 문서 확인 필요
    };
  }

  // ... 기존 로직
}
```

#### 3.0.3 프론트엔드 녹음 비트레이트 개선

현재 `useAudioRecorder.ts`에서 WebM/Opus **64kbps**로 녹음 중이다. 화자 음색 구분을 위해 **128kbps**로 상향한다.

```typescript
// frontend/hooks/useAudioRecorder.ts 수정

// 현재:
// new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 64000 })

// 변경:
new MediaRecorder(stream, {
  mimeType: 'audio/webm;codecs=opus',
  audioBitsPerSecond: 128000  // 64kbps → 128kbps
})
```

**영향 분석**:

| 항목 | 64kbps (현재) | 128kbps (변경) |
|------|-------------|--------------|
| 30분 녹음 파일 크기 | ~14.4MB | ~28.8MB |
| 1시간 녹음 파일 크기 | ~28.8MB | ~57.6MB |
| 500MB 제한 대비 | 충분 | 충분 |
| 음질 | 전화 통화 수준 | FM 라디오 수준 |
| 화자 구분 | 어려움 | 양호 |

#### 3.0.4 베이스라인 측정

골든 테스트 셋 구축 후, 현재 파이프라인(RTZR-only)의 WDER를 측정하여 베이스라인으로 설정한다.

**Phase 0 완료 기준**:
- [ ] 골든 테스트 셋 20개 구축 완료 (RTTM 포맷)
- [ ] WDER 계산 도구 동작 확인
- [ ] 현재 RTZR-only 파이프라인 WDER 베이스라인 측정 완료
- [ ] RTZR API 파라미터 검증 완료 (num_speakers 지원 여부 확인)
- [ ] 비트레이트 개선 전/후 RTZR 화자 분리 품질 비교 완료
- [ ] `attendees.length` → `num_speakers` 힌트 적용 및 효과 측정 완료

---

### Phase 1: 오디오 전처리 파이프라인

**목표**: STT 및 화자 분리 모델에 최적화된 오디오 입력 생성
**기간**: 1주
**담당**: Backend Engineer 1명

#### 3.1.1 기능 요구사항

| ID | 기능 | 설명 | 우선순위 |
|----|------|------|---------|
| PRE-01 | 포맷 정규화 | 입력 오디오를 16kHz, mono, PCM WAV로 변환 | P0 |
| PRE-02 | 노이즈 제거 | 배경 소음 제거 (SNR 기반 적응형) | P0 |
| PRE-03 | VAD 적용 | 비음성 구간 감지 및 태깅 | P1 |
| PRE-04 | 품질 점수 산출 | 오디오 품질 메트릭 추출 (SNR, 클리핑, 리버브) | P1 |
| PRE-05 | 채널 감지 | 스테레오/멀티채널 감지 시 채널별 분리 처리 | P2 |

#### 3.1.2 기술 스펙

```python
# python/preprocess.py — 전처리 엔트리포인트
# Node.js에서 child_process로 호출됨
# 입력: --input <audio_path>
# 출력: stdout에 JSON 결과

import argparse
import json
import sys

from lib.audio_normalizer import AudioNormalizer
from lib.noise_reducer import NoiseReducer
from lib.vad import VoiceActivityDetector
from lib.quality_analyzer import QualityAnalyzer

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--input', required=True, help='Input audio file path')
    parser.add_argument('--output-dir', default=None, help='Output directory (default: same as input)')
    args = parser.parse_args()

    try:
        # 1. 포맷 정규화 (16kHz, mono, WAV)
        normalizer = AudioNormalizer()
        normalized_path = normalizer.normalize(args.input, args.output_dir)

        # 2. 품질 분석
        analyzer = QualityAnalyzer()
        quality = analyzer.analyze(normalized_path)

        # 3. 노이즈 제거 (SNR이 낮은 경우에만)
        reducer = NoiseReducer()
        cleaned_path = reducer.reduce(normalized_path, snr=quality['snr'])

        # 4. VAD
        vad = VoiceActivityDetector()
        vad_segments = vad.detect(cleaned_path)

        result = {
            'cleaned_audio_path': cleaned_path,
            'quality_score': quality['overall_score'],
            'snr': quality['snr'],
            'duration': quality['duration'],
            'vad_segments': vad_segments,
        }

        print(json.dumps(result))
        sys.exit(0)

    except Exception as e:
        print(json.dumps({'error': str(e)}), file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
```

**노이즈 제거 라이브러리 선택 기준**:

| 라이브러리 | 장점 | 단점 | 채택 |
|-----------|------|------|------|
| `noisereduce` (Python) | 설치 간단, stationary/non-stationary 지원 | 공격적 처리 시 음성 왜곡 | ✅ 1차 |
| RNNoise | 실시간 처리 가능, 가벼움 | C 라이브러리, Python 바인딩 필요 | 대안 |
| DeepFilterNet | 딥러닝 기반, 품질 우수 | GPU 필요, 무거움 | Phase 후속 검토 |

**VAD 모델 선택**:

| 모델 | 정확도 | 속도 | 크기 | 채택 |
|------|--------|------|------|------|
| Silero VAD | 높음 | 매우 빠름 | ~2MB | ✅ |
| WebRTC VAD | 중간 | 매우 빠름 | <1MB | 대안 |
| NeMo MarbleNet | 매우 높음 | 보통 | ~30MB | 후속 검토 |

#### 3.1.3 성능 요구사항

- 1시간 오디오 전처리 시간: **30초 이내** (CPU 기준)
- 메모리 사용량: **2GB 이내**
- 지원 입력 포맷: mp3, wav, m4a, webm, ogg, flac
- 출력: 16kHz, 16bit, mono PCM WAV

#### 3.1.4 voiceUploadProcessor.ts 연동

```typescript
// server/services/voiceUploadProcessor.ts 수정 포인트

async startProcessing(noteId: number, filePath: string) {
  try {
    // 🆕 Step 1: 전처리 (Python subprocess)
    await this.updateProcessingStep(noteId, 'preprocessing');
    const preprocessResult = await this.audioPipeline.preprocess(filePath);

    // Step 2: RTZR STT (전처리된 오디오 사용)
    await this.updateProcessingStep(noteId, 'transcribing');
    const audioForStt = preprocessResult.cleaned_audio_path;
    const transcribeId = await this.rtzrService.transcribe(audioForStt, {
      numSpeakers: meetingNote.attendees?.length,
    });

    // ... 기존 폴링 로직
  } catch (error) {
    // Fallback: 전처리 실패 시 원본으로 진행
    // ...
  }
}
```

**Phase 1 완료 기준**:
- [ ] Python 전처리 스크립트 동작 확인
- [ ] child_process 호출 및 JSON 파싱 정상 동작
- [ ] 전처리 적용 전/후 RTZR 화자 분리 WDER 비교 (골든 테스트 셋 기준)
- [ ] Fallback 동작 확인 (Python 실패 시 원본 사용)
- [ ] 전처리 시간 1시간 오디오 기준 30초 이내

---

### Phase 2: pyannote 화자 분리 + 정렬

**목표**: 화자 분리 정확도 1차 개선 (WDER 35% → 20%)
**기간**: 2주
**담당**: Backend Engineer 1명

#### 3.2.1 한국어 성능 리스크 및 검증 계획

> ⚠️ **중요 리스크**: pyannote.audio는 주로 영어 데이터셋(AMI, VoxConverse, DIHARD)으로 학습되었다. 한국어 음성에서의 화자 분리 성능은 보장되지 않으며, RTZR(한국어 특화 STT 회사)의 내장 화자 분리보다 오히려 낮을 수 있다.

**검증 계획**:

| 단계 | 내용 | 판단 기준 |
|------|------|----------|
| 1단계 | 골든 테스트 셋 5개로 pyannote 화자 분리 품질 측정 | WDER 산출 |
| 2단계 | RTZR 화자 분리 WDER와 비교 | pyannote WDER < RTZR WDER × 0.8 (20% 이상 개선) |
| 3단계 | Go/No-Go 결정 | 개선 미달 시 → pyannote 제외, Phase 3(LLM) 집중 |

**만약 pyannote가 한국어에서 RTZR보다 낮은 성능을 보인다면**:
- pyannote 도입을 건너뛰고 Phase 3(LLM 후처리)에 집중
- RTZR 화자 분리 결과에 직접 LLM 보정 적용
- 향후 한국어 화자 분리 특화 모델이 등장하면 재검토

#### 3.2.2 pyannote.audio 화자 분리 모듈

**모델 선택**:

| 모델 | DER (AMI IHM) | 속도 | 라이선스 | 비용 | 한국어 성능 |
|------|--------------|------|---------|------|-----------|
| `speaker-diarization-3.1` (legacy) | 18.8% | 31s/hr | MIT | 무료 | ❓ 미검증 |
| `speaker-diarization-community-1` | 17.0% | 31s/hr | CC-BY-4.0 | 무료 | ❓ 미검증 |
| `speaker-diarization-precision-2` | 12.9% | 14s/hr | 상용 | 유료 (API) | ❓ 미검증 |

**추천**: `community-1`로 시작, **Phase 2 1단계에서 한국어 성능 검증** 후 결정

**CPU vs GPU 성능 비교** (1시간 오디오 기준):

| 환경 | 추정 처리 시간 | 비용 |
|------|-------------|------|
| CPU (Oracle Cloud, 4 vCPU) | ~10-15분 | 기존 인프라 |
| GPU (g5.xlarge, A10G) | ~30초 | ~$1.00/hr 추가 |
| pyannote precision-2 API | ~15초 | 건당 과금 (미정) |

> Phase 2 초기에는 CPU로 진행하고, 처리 시간이 문제될 경우 GPU 또는 API 전환을 검토한다.

```python
# python/diarize.py — pyannote 화자 분리 엔트리포인트

import argparse
import json
import sys

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--input', required=True)
    parser.add_argument('--num-speakers', type=int, default=None)
    parser.add_argument('--min-speakers', type=int, default=None)
    parser.add_argument('--max-speakers', type=int, default=None)
    args = parser.parse_args()

    try:
        from pyannote.audio import Pipeline
        import torch
        import os

        pipeline = Pipeline.from_pretrained(
            "pyannote/speaker-diarization-community-1",
            use_auth_token=os.environ.get("HF_TOKEN")
        )

        # GPU 가용 시 사용
        if torch.cuda.is_available():
            pipeline.to(torch.device("cuda"))

        # 화자 수 힌트 설정
        params = {}
        if args.num_speakers:
            params["num_speakers"] = args.num_speakers
        elif args.min_speakers and args.max_speakers:
            params["min_speakers"] = args.min_speakers
            params["max_speakers"] = args.max_speakers

        diarization = pipeline(args.input, **params)

        segments = []
        for turn, _, speaker in diarization.itertracks(yield_label=True):
            segments.append({
                "speaker": speaker,
                "start": round(turn.start, 3),
                "end": round(turn.end, 3),
            })

        print(json.dumps({"segments": segments}))
        sys.exit(0)

    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
```

#### 3.2.3 시간축 정렬 (Alignment) 로직

리턴제로 STT 결과(워드 타임스탬프)와 pyannote 화자 분리 결과(화자 타임스탬프)를 병합한다. 이 로직은 TypeScript로 구현한다.

```typescript
// server/services/transcriptAligner.ts (신규)

interface RtzrUtterance {
  msg: string;
  spk: number;
  start_at: number;  // 밀리초
  duration: number;
}

interface DiarizationSegment {
  speaker: string;
  start: number;  // 초
  end: number;
}

interface AlignedSegment {
  text: string;
  speaker: string;
  start: number;
  end: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  source: 'pyannote' | 'rtzr' | 'aligned';
}

function alignTranscript(
  sttResult: RtzrUtterance[],
  diarization: DiarizationSegment[] | null
): AlignedSegment[] {
  // pyannote 결과가 없으면 RTZR 결과 그대로 사용
  if (!diarization || diarization.length === 0) {
    return sttResult.map(u => ({
      text: u.msg,
      speaker: `SPEAKER_${u.spk}`,
      start: u.start_at / 1000,
      end: (u.start_at + u.duration) / 1000,
      confidence: 'MEDIUM' as const,
      source: 'rtzr' as const,
    }));
  }

  // 시간축 정렬
  return sttResult.map(utterance => {
    const uttStart = utterance.start_at / 1000;
    const uttEnd = (utterance.start_at + utterance.duration) / 1000;
    const uttMid = (uttStart + uttEnd) / 2;

    const overlapping = diarization.filter(
      seg => seg.start <= uttMid && uttMid <= seg.end
    );

    if (overlapping.length === 1) {
      return {
        text: utterance.msg,
        speaker: overlapping[0].speaker,
        start: uttStart,
        end: uttEnd,
        confidence: 'HIGH' as const,
        source: 'aligned' as const,
      };
    } else if (overlapping.length > 1) {
      // 가장 긴 오버랩 화자 선택
      const best = overlapping.reduce((a, b) => {
        const overlapA = Math.min(a.end, uttEnd) - Math.max(a.start, uttStart);
        const overlapB = Math.min(b.end, uttEnd) - Math.max(b.start, uttStart);
        return overlapA > overlapB ? a : b;
      });
      return {
        text: utterance.msg,
        speaker: best.speaker,
        start: uttStart,
        end: uttEnd,
        confidence: 'MEDIUM' as const,
        source: 'aligned' as const,
      };
    } else {
      // 가장 가까운 화자 세그먼트
      const nearest = diarization.reduce((a, b) => {
        const distA = Math.min(Math.abs(a.start - uttMid), Math.abs(a.end - uttMid));
        const distB = Math.min(Math.abs(b.start - uttMid), Math.abs(b.end - uttMid));
        return distA < distB ? a : b;
      });
      return {
        text: utterance.msg,
        speaker: nearest.speaker,
        start: uttStart,
        end: uttEnd,
        confidence: 'LOW' as const,
        source: 'aligned' as const,
      };
    }
  });
}
```

#### 3.2.4 활성화 전략 (Feature Flag)

pyannote 모듈은 Feature Flag을 통해 점진적으로 활성화한다.

```typescript
// server/services/voiceUploadProcessor.ts

// Feature Flag (환경변수 또는 DB 설정)
const USE_PYANNOTE = process.env.USE_PYANNOTE === 'true';

async onTranscriptionComplete(noteId: number, sttResult: RtzrUtterance[]) {
  let alignedResult: AlignedSegment[];

  if (USE_PYANNOTE) {
    await this.updateProcessingStep(noteId, 'diarizing');
    const diarization = await this.audioPipeline.diarize(
      cleanedAudioPath,
      meetingNote.attendees?.length
    );
    alignedResult = alignTranscript(sttResult, diarization);
  } else {
    alignedResult = alignTranscript(sttResult, null); // RTZR 결과만 사용
  }

  // ... 후속 처리
}
```

**Phase 2 완료 기준**:
- [ ] pyannote 한국어 화자 분리 Go/No-Go 결정 완료
- [ ] (Go인 경우) 정렬 알고리즘 동작 확인
- [ ] WDER 골든 테스트 셋 기준 Phase 0 대비 10%p 이상 개선
- [ ] Feature Flag 기반 A/B 테스트 가능
- [ ] Fallback (pyannote 실패 → RTZR) 동작 확인
- [ ] CPU 환경에서 1시간 오디오 처리 시간 15분 이내

---

### Phase 3: LLM 기반 후처리

**목표**: 대화 문맥 기반 화자 레이블 보정 (WDER → 10-15%)
**기간**: 2주
**담당**: Backend Engineer 1명

#### 3.3.1 DiarizationLM 방식 적용

Google의 DiarizationLM 프레임워크를 참조하여, STT + 화자 분리 결과를 LLM에 입력하고 화자 레이블을 보정한다.

**입력 포맷 (Compact Text Representation)**:

```
<spk:1> 안녕하세요 오늘 미팅 시작하겠습니다 <spk:2> 네 안녕하세요
<spk:1> 지난번 논의했던 커스터디 서비스 건인데요 <spk:2> 아 네 저희 쪽에서
검토를 진행했습니다 <spk:1> 결과가 어떻게 되었나요 <spk:2> 기술적으로는
가능한데 규제 이슈가 좀 있어서 <spk:1> 알겠습니다 저희가 법률 검토를
추가로 진행하겠습니다
```

**LLM 프롬프트 설계**:

```
System Prompt:
당신은 회의 녹취록의 화자 분리를 교정하는 전문가입니다.

규칙:
1. 텍스트 내용은 절대 변경하지 마세요. 화자 레이블(<spk:N>)만 수정하세요.
2. 대화의 문맥을 분석하여 잘못된 화자 할당을 교정하세요.
3. "저희가", "우리 쪽에서" 등의 표현으로 소속을 추론하세요.
4. 질문-답변 쌍의 화자가 교차하는지 확인하세요.
5. 같은 화자의 발언이 부자연스럽게 끊어진 경우 병합을 고려하세요.
6. 화자 수는 {num_speakers}명입니다. 이 수를 초과하지 마세요.

Context:
- 미팅 참석자: {participants}
- 미팅 주제: {meeting_topic}
- 우리 측 참석자: {our_team}
- 상대 측 참석자: {their_team}

아래 녹취록의 화자 레이블을 교정하세요.
교정된 녹취록만 출력하세요. 설명은 불필요합니다.
```

**구현 위치**: `server/modules/integrations/claude/claude.service.ts`에 `refineSpeakerLabels()` 메서드 추가

#### 3.3.2 TPST (Transcript Preserving Speaker Transfer) 검증

LLM이 화자 레이블 외에 텍스트 내용을 변경하는 할루시네이션을 방지하기 위해, TPST 알고리즘을 적용한다.

```typescript
// server/services/speakerTransfer.ts (신규)

/**
 * LLM이 반환한 화자 레이블을 원본 텍스트에 안전하게 전사.
 *
 * 원리:
 * - 원본 단어 시퀀스와 LLM 단어 시퀀스를 정렬 (edit distance 기반)
 * - 정렬된 쌍에서 LLM의 화자 레이블만 추출
 * - 정렬되지 않는 단어는 원본 화자 레이블 유지
 *
 * @param originalWords 원본 단어 배열
 * @param originalSpeakers 원본 화자 레이블 배열
 * @param llmWords LLM 출력 단어 배열
 * @param llmSpeakers LLM 출력 화자 레이블 배열
 * @returns 원본 단어 수와 동일한 길이의 교정된 화자 레이블 배열
 */
function transcriptPreservingSpeakerTransfer(
  originalWords: string[],
  originalSpeakers: string[],
  llmWords: string[],
  llmSpeakers: string[],
): string[] {
  // Levenshtein 정렬 기반 구현
  // ...
}
```

**검증 로직**:

```typescript
// LLM 후처리 후 원문 보존 검증
const originalText = alignedSegments.map(s => s.text).join(' ');
const refinedText = refinedSegments.map(s => s.text).join(' ');

if (originalText !== refinedText) {
  logger.warn('TPST validation failed: text content changed', {
    noteId,
    originalLength: originalText.length,
    refinedLength: refinedText.length,
  });
  // Fallback: LLM 보정 전 결과 사용
  return alignedSegments;
}
```

#### 3.3.3 선별적 LLM 적용 (비용 최적화)

모든 미팅에 LLM 후처리를 적용하면 API 비용이 과다해지므로, 다음 조건에 해당하는 경우에만 적용한다:

| 조건 | 기준 | 근거 |
|------|------|------|
| 화자 수 | ≥ 3명 | 2인 미팅은 화자 분리 정확도가 상대적으로 높음 |
| 저신뢰도 세그먼트 비율 | > 20% | Confidence score가 LOW인 세그먼트가 전체의 20% 초과 |
| 미팅 유형 | 외부 미팅 (고객/파트너) | 내부 미팅보다 정확한 귀속이 중요 |
| 오디오 품질 점수 | < 0.7 | 전처리 후에도 품질이 낮은 경우 |

```typescript
// server/services/refinementGate.ts (신규)

interface RefinementDecision {
  shouldRefine: boolean;
  reason: string;
}

function shouldApplyLlmRefinement(
  alignedSegments: AlignedSegment[],
  meetingNote: MeetingNote,
  qualityScore: number,
): RefinementDecision {
  const numSpeakers = new Set(alignedSegments.map(s => s.speaker)).size;
  const lowConfidenceRatio = alignedSegments.filter(s => s.confidence === 'LOW').length
    / alignedSegments.length;

  if (numSpeakers >= 3) return { shouldRefine: true, reason: '3+ speakers' };
  if (lowConfidenceRatio > 0.2) return { shouldRefine: true, reason: 'low confidence > 20%' };
  if (qualityScore < 0.7) return { shouldRefine: true, reason: 'low audio quality' };

  return { shouldRefine: false, reason: 'conditions not met' };
}
```

#### 3.3.4 화자 이름 매핑

CRM의 미팅 메타데이터를 활용하여 익명 화자 레이블(SPEAKER_00)을 실제 이름으로 매핑한다.

```
매핑 전략 (우선순위 순):
1. 채널 분리: 스테레오 녹음 시 채널별 화자 자동 매핑
2. LLM 추론: "저는 Wavebridge의 김OO입니다" 등 자기소개 감지
3. 발화량 기반: CRM의 미팅 호스트 = 발화량 최대 화자 (휴리스틱)
4. 수동 매핑: UI에서 사용자가 직접 화자-이름 매칭
```

**수동 매핑 UI** (VoiceNoteConfirmModal.tsx 확장):

```
┌─────────────────────────────────────┐
│  화자 이름 매핑                       │
│                                     │
│  화자 1 (발화 45%) → [김철수 ▼]      │
│  화자 2 (발화 35%) → [이영희 ▼]      │
│  화자 3 (발화 20%) → [박지민 ▼]      │
│                                     │
│  드롭다운: 미팅 참석자 목록 (attendees) │
│  + "기타 (직접 입력)" 옵션            │
└─────────────────────────────────────┘
```

#### 3.3.5 LLM 선택 및 비용 추정

| 모델 | 입력 비용 (1M 토큰) | 출력 비용 (1M 토큰) | 1시간 미팅 예상 비용 | 채택 |
|------|------|------|------|------|
| Claude Sonnet 4 | $3.00 | $15.00 | ~$0.08 | ✅ 1차 |
| GPT-4o-mini | $0.15 | $0.60 | ~$0.01 | 대안 (경량) |
| 자체 파인튜닝 (Qwen 7B) | GPU 비용 | GPU 비용 | ~$0.005 | Phase 4 검토 |

> **비용 산정 근거**: 1시간 미팅 ≈ 10,000 단어 ≈ 15,000 토큰 (한국어). Compact text representation 적용 시 입력 토큰 ~5,000으로 압축.

**Phase 3 완료 기준**:
- [ ] LLM 화자 보정 프롬프트 품질 검증 (골든 테스트 셋 기준)
- [ ] TPST 검증 로직 동작 확인 (원문 변경 시 Fallback)
- [ ] 선별적 적용 조건 동작 확인
- [ ] 화자 이름 매핑 UI 동작 확인
- [ ] 전체 파이프라인 WDER < 15% 달성 (골든 테스트 셋 기준)
- [ ] 월 LLM 비용 예산 내 (아래 비용 분석 참조)

---

## 4. 비기능 요구사항

### 4.1 성능

| 항목 | 요구사항 |
|------|---------|
| 전처리 처리 시간 | 오디오 길이의 5% 이내 (1시간 → 3분) |
| 화자 분리 처리 시간 (CPU) | 오디오 길이의 15% 이내 (1시간 → 9분) |
| 화자 분리 처리 시간 (GPU) | 오디오 길이의 1% 이내 (1시간 → 36초) |
| LLM 후처리 시간 | 30초 이내 (1시간 미팅 기준) |
| 전체 파이프라인 (CPU) | 오디오 길이의 20% 이내 (1시간 → 12분) |
| 동시 처리 | 최소 3개 미팅 병렬 처리 (CPU 리소스 고려) |

### 4.2 인프라

| 컴포넌트 | 요구사항 | 변경사항 |
|---------|---------|---------|
| Python 런타임 | Python 3.10+ | 🆕 Docker 이미지에 추가 |
| 전처리 | CPU only (기존 서버) | 🆕 Python 의존성 설치 |
| pyannote | CPU (초기), GPU 선택적 | 🆕 HuggingFace 토큰 필요 |
| LLM 후처리 | API 호출 (인프라 불필요) | 기존 Claude API 활용 |
| 스토리지 | 오디오 파일 임시 저장 (처리 후 삭제 가능) | 기존 uploads/voice/ 활용 |

**Docker 이미지 크기 영향**:

| 항목 | 현재 | Phase 1 추가 | Phase 2 추가 |
|------|------|-----------|-----------|
| Node.js 런타임 | ~150MB | - | - |
| Python 런타임 | - | +50MB | - |
| noisereduce + Silero VAD | - | +100MB | - |
| pyannote + PyTorch (CPU) | - | - | +2GB |
| **총 이미지 크기** | **~250MB** | **~400MB** | **~2.4GB** |

> ⚠️ Phase 2에서 pyannote + PyTorch 추가 시 이미지 크기가 크게 증가한다. 이를 경감하기 위해 PyTorch CPU-only 버전(`torch-cpu`)을 사용하거나, pyannote를 별도 컨테이너로 분리하는 것을 검토한다.

### 4.3 보안 및 컴플라이언스

| 항목 | 요구사항 |
|------|---------|
| 오디오 파일 | 처리 완료 후 24시간 이내 삭제 (옵션) |
| LLM API 전송 | 개인정보 마스킹 후 전송 (이름, 전화번호 등) |
| pyannote 모델 | 자체 서버에서 실행 (외부 전송 없음) |
| 데이터 저장 | 처리 결과만 CRM DB에 저장, 원본 오디오는 사용자 선택 |
| Python 서브프로세스 | 입력 파라미터 sanitization (path traversal 방지) |

### 4.4 모니터링

| 메트릭 | 수집 방법 | 알림 기준 |
|--------|----------|----------|
| 화자 분리 confidence 분포 | 처리 결과 로깅 | LOW 비율 > 30% |
| Python 서브프로세스 성공/실패율 | 프로세스 exit code 로깅 | 실패율 > 10% |
| LLM 후처리 적용률 | 조건부 적용 로깅 | 적용률 급증 시 |
| TPST 검증 실패율 | 원문 변경 감지 로깅 | 실패율 > 5% |
| 사용자 수동 교정 횟수 | UI 이벤트 로깅 | 주간 추이 모니터링 |
| 전체 파이프라인 처리 시간 | 각 단계별 타이머 | p95 > 15분 |
| LLM API 비용 | 월별 집계 | 예산 80% 초과 시 |
| Fallback 발동 횟수 | 단계별 Fallback 로깅 | 급증 시 |

---

## 5. 비용 분석

### 5.1 월간 비용 추정 (미팅 50건/월 기준, 평균 30분)

| 항목 | Phase 0 | Phase 1 | Phase 2 | Phase 3 | 비고 |
|------|---------|---------|---------|---------|------|
| RTZR STT | 25,000원 | 25,000원 | 25,000원 | 25,000원 | 50건 × 0.5시간 × 1,000원 |
| Claude 요약 (기존) | 16,600원 | 16,600원 | 16,600원 | 16,600원 | 기존 비용 유지 |
| Claude 화자 보정 | - | - | - | ~8,000원 | 50건 × ~$0.04 × 50% 적용률 |
| Python 전처리 | - | 0원 | 0원 | 0원 | CPU 기존 인프라 |
| pyannote (CPU) | - | - | 0원 | 0원 | CPU 기존 인프라 |
| pyannote (GPU, 선택) | - | - | ~50,000원 | ~50,000원 | g5.xlarge 시간당 ~$1 |
| **월 합계** | **41,600원** | **41,600원** | **41,600원~91,600원** | **49,600원~99,600원** |

### 5.2 추가 초기 비용

| 항목 | 비용 | 비고 |
|------|------|------|
| 골든 테스트 셋 수동 라벨링 | 인건비 (1-2일) | 내부 인력 |
| pyannote precision-2 라이선스 | 미정 | Go/No-Go 후 결정 |
| Docker 이미지 크기 증가 | 스토리지 미미 | ~2GB 추가 |

---

## 6. 실행 로드맵

### Phase 0: 측정 인프라 + Quick Wins (Week 1-1.5)

| 태스크 | 담당 | 산출물 |
|--------|------|--------|
| 골든 테스트 셋 구축 (20개 미팅) | QA + Product | RTTM 파일 20개 |
| WDER 계산 도구 구현 | BE | `python/evaluate.py` |
| 현재 RTZR-only WDER 베이스라인 측정 | BE | 베이스라인 수치 |
| RTZR API `num_speakers` 파라미터 검증 | BE | API 호환성 확인 |
| `attendees.length` → `num_speakers` 연동 | BE | `rtzrService.ts` 수정 |
| 프론트엔드 비트레이트 64→128kbps | FE | `useAudioRecorder.ts` 수정 |
| 비트레이트 개선 전/후 비교 측정 | BE | 측정 결과 |
| `processing_step` DB 컬럼 추가 | BE | 마이그레이션 SQL |

### Phase 1: 오디오 전처리 파이프라인 (Week 2-2.5)

| 태스크 | 담당 | 산출물 |
|--------|------|--------|
| Python 프로젝트 구조 셋업 | BE | `python/` 디렉토리 |
| 오디오 포맷 정규화 모듈 | BE | `audio_normalizer.py` |
| noisereduce 기반 노이즈 제거 | BE | `noise_reducer.py` |
| Silero VAD 통합 | BE | `vad.py` |
| 오디오 품질 점수 산출 | BE | `quality_analyzer.py` |
| `audioPipelineService.ts` 구현 | BE | child_process 브릿지 |
| `voiceUploadProcessor.ts` 연동 | BE | 파이프라인 수정 |
| 전처리 적용 전/후 WDER 비교 | BE | 벤치마크 결과 |
| Docker 이미지에 Python 추가 | BE | Dockerfile 수정 |

### Phase 2: pyannote 화자 분리 + 정렬 (Week 3-4.5)

| 태스크 | 담당 | 산출물 |
|--------|------|--------|
| pyannote community-1 로컬 셋업 | BE | Python 환경 + HF 토큰 |
| **한국어 화자 분리 Go/No-Go 검증** | BE | 벤치마크 보고서 |
| (Go) `diarize.py` 구현 | BE | pyannote 서브프로세스 |
| (Go) `transcriptAligner.ts` 구현 | BE | 시간축 정렬 모듈 |
| (Go) Feature Flag 기반 A/B 테스트 | BE | `USE_PYANNOTE` 환경변수 |
| Confidence score 산출 로직 | BE | 신뢰도 메트릭 |
| WDER 비교 (RTZR-only vs pyannote) | BE | 벤치마크 결과 |
| Docker 이미지에 PyTorch 추가 | BE | Dockerfile 수정 |

### Phase 3: LLM 후처리 (Week 4.5-6.5)

| 태스크 | 담당 | 산출물 |
|--------|------|--------|
| Compact text representation 변환기 | BE | 텍스트 포맷터 |
| LLM 프롬프트 설계 및 테스트 | BE | 프롬프트 템플릿 |
| `claude.service.ts`에 `refineSpeakerLabels()` 추가 | BE | LLM 보정 메서드 |
| TPST 알고리즘 구현 | BE | `speakerTransfer.ts` |
| 선별적 적용 조건 로직 | BE | `refinementGate.ts` |
| 화자 이름 매핑 UI | FE | `VoiceNoteConfirmModal.tsx` 확장 |
| End-to-end 통합 테스트 | BE + QA | 통합 테스트 결과 |
| 비용 모니터링 로깅 | BE | 로깅 설정 |

---

## 7. 리스크 및 대응 방안

| 리스크 | 확률 | 영향도 | 대응 방안 |
|--------|------|--------|----------|
| **pyannote 한국어 성능이 RTZR보다 낮음** | **높음** | 높음 | Phase 2에서 Go/No-Go 검증. No-Go 시 pyannote 제외하고 LLM 후처리에 집중. RTZR 화자 분리 + LLM 보정만으로도 유의미한 개선 가능 |
| LLM 할루시네이션으로 원문 변경 | 높음 | 높음 | TPST 알고리즘으로 원문 보존 강제. 단어 시퀀스 diff 검증. 실패 시 Fallback |
| **Python 서브프로세스 안정성** | **중간** | 중간 | 타임아웃 설정(5분), exit code 기반 에러 감지, stderr 로깅, Fallback 체인 |
| Docker 이미지 크기 폭증 (pyannote) | 중간 | 중간 | torch-cpu 사용, 필요 시 pyannote 별도 컨테이너 분리 |
| LLM API 비용 초과 | 중간 | 중간 | 선별적 적용 조건 엄격화, GPT-4o-mini 전환, 장기적으로 자체 모델 파인튜닝 |
| **CPU에서 pyannote 처리 시간 과다** | **높음** | 중간 | 처리 시간 15분 초과 시 GPU 또는 pyannote precision-2 API 전환 검토 |
| 리턴제로 API 변경/중단 | 낮음 | 매우 높음 | 파이프라인 모듈화로 STT 엔진 교체 용이하도록 설계 |
| 처리 시간 증가로 사용자 경험 저하 | 중간 | 중간 | 비동기 처리 + 5단계 프로그레스 표시. 단계별 타임아웃 |
| RTZR `num_speakers` 미지원 | 중간 | 낮음 | 미지원 시 해당 최적화 건너뜀. 다른 개선으로 보완 |

---

## 8. 성공 지표 (KPI)

### 정량 지표

| 지표 | 측정 방법 | 목표 |
|------|----------|------|
| WDER (Word Diarization Error Rate) | 골든 테스트 셋 대비 측정 | < 15% |
| 사용자 수동 교정률 | UI 교정 이벤트 / 전체 미팅노트 | < 10% |
| 미팅노트 활용률 | 미팅 후 미팅노트 열람 비율 | > 70% |
| AI 요약 정확도 | 사용자 피드백 (5점 척도) | > 4.0 |
| 처리 완료 시간 | p95 기준 | < 12분 (1시간 미팅) |
| Fallback 발동률 | 단계별 Fallback 로깅 | < 5% |
| Python 서브프로세스 성공률 | exit code 로깅 | > 95% |

### 정성 지표

- "미팅노트가 실제 대화를 잘 반영하고 있다"는 사용자 피드백
- 수동 교정 없이 미팅노트를 공유하는 사용자 비율 증가
- AI 요약에서 도출된 액션 아이템의 담당자 정확도

---

## 9. 의존성 및 전제조건

| 항목 | 상태 | 담당 | 비고 |
|------|------|------|------|
| 리턴제로 VITO API 계약 유지 | ✅ 확인 | Ops | - |
| RTZR `num_speakers` 파라미터 지원 여부 | ❓ 확인 필요 | BE | Phase 0에서 검증 |
| HuggingFace 토큰 (pyannote 모델 접근) | 필요 | BE | Phase 2 |
| Claude API 키 | ✅ 기존 보유 | - | `ANTHROPIC_API_KEY` |
| Python 3.10+ 런타임 | 필요 | BE | Docker 이미지 수정 |
| CRM 미팅 메타데이터 API | ✅ 기존 존재 | - | `attendees` 필드 |
| 골든 테스트 셋 구축 | 필요 | QA + Product | Phase 0 |
| Oracle Cloud 서버 리소스 | ✅ 기존 | - | CPU 충분 여부 확인 |

---

## 10. 참고자료

1. **DiarizationLM** — Google, Interspeech 2024. LLM 기반 화자 분리 후처리 프레임워크. WDER 최대 55.5% 개선. [arxiv.org/abs/2401.03506](https://arxiv.org/abs/2401.03506)
2. **pyannote.audio** — 오픈소스 화자 분리 toolkit. community-1 모델 기준 AMI IHM DER 17.0%. [github.com/pyannote/pyannote-audio](https://github.com/pyannote/pyannote-audio)
3. **NVIDIA NeMo MSDD** — Multi-Scale Diarization Decoder. [docs.nvidia.com/nemo-framework](https://docs.nvidia.com/nemo-framework/user-guide/latest/nemotoolkit/asr/speaker_diarization/models.html)
4. **Whisper + Pyannote 통합 가이드** — STT와 화자 분리 시간축 정렬 방법론. [scalastic.io](https://scalastic.io/en/whisper-pyannote-ultimate-speech-transcription/)
5. **SpeakerLM** — End-to-End 멀티모달 LLM 기반 화자 분리. [arxiv.org/abs/2508.06372](https://arxiv.org/abs/2508.06372)
6. **ENERZAi Korean Whisper** — 한국어 Whisper 파인튜닝 사례 (CER 11% → 6%). [enerzai.com](https://enerzai.com/resources/blog/small-models-big-heat-conquering-korean-asr-with-low-bit-whisper)
7. **KsponSpeech** — 한국어 자발적 대화 코퍼스 (969시간). [Bang et al., 2020](https://www.mdpi.com/2076-3417/10/19/6936)
8. **STT 솔루션 비교검토 보고서** — 내부 문서. 리턴제로 선정 근거. `/mnt/c/GitHub/WHCommon/별도 기획/STT-솔루션-비교검토-보고서.md`

---

## Appendix A: 용어 정의

| 용어 | 정의 |
|------|------|
| **DER** (Diarization Error Rate) | 화자 분리 오류율. 잘못된 화자 할당, 누락, 오탐의 합계를 전체 발화 시간으로 나눈 비율 |
| **WDER** (Word Diarization Error Rate) | 단어 단위 화자 분리 오류율. DER보다 세밀한 측정 |
| **CER** (Character Error Rate) | 음절 오류율. 한국어 STT 정확도 측정의 표준 지표 |
| **VAD** (Voice Activity Detection) | 음성 활동 감지. 오디오에서 사람이 말하는 구간을 식별 |
| **TPST** (Transcript Preserving Speaker Transfer) | LLM 출력의 화자 레이블만 원본 텍스트에 안전하게 전사하는 알고리즘 |
| **RTTM** (Rich Transcription Time Marked) | 화자 분리 결과를 저장하는 표준 포맷 |
| **SNR** (Signal-to-Noise Ratio) | 신호 대 잡음비. 오디오 품질의 핵심 지표 |
| **Feature Flag** | 기능 활성화 제어. 환경변수 또는 DB 설정으로 ON/OFF |

## Appendix B: 향후 검토 사항 (Phase 4+)

- **Voice ID 등록**: 반복 미팅 고객의 음성 프로필을 사전 등록하여 화자 자동 식별 (개인정보 동의 필요)
- **실시간 화자 분리**: 미팅 중 실시간으로 화자 분리 결과를 표시하는 기능
- **자체 LLM 파인튜닝**: DiarizationLM 방식으로 Qwen/Llama 모델을 화자 보정 태스크에 특화 학습
- **pyannote precision-2 업그레이드**: 상용 모델 도입 시 DER 추가 개선 기대
- **Sortformer Diarizer**: NVIDIA의 Transformer 기반 End-to-End 화자 분리 모델 평가
- **Fireflies 화자 분리 비교**: 기존 Fireflies 연동 결과와 자체 파이프라인 품질 비교
