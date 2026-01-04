# Rule: Generating a Product Requirements Document (PRD)

## Goal

To guide an AI assistant in creating a detailed Product Requirements Document (PRD) in Markdown format, based on an initial user prompt. The PRD should be clear, actionable, and suitable for a junior developer to understand and implement the feature.

## Process

1.  **Receive Initial Prompt:** The user provides a brief description or request for a new feature or functionality.
2.  **Ask Clarifying Questions:** Before writing the PRD, the AI *must* ask clarifying questions needed to write a clear PRD. Aim for 8-12 questions covering critical gaps in understanding. The goal is to understand the "what" and "why" of the feature, not necessarily the "how" (which the developer will figure out). Use the AskUserQuestion tool to present questions in an interactive format (split into multiple rounds of 4 questions each if needed).
3.  **Generate PRD:** Based on the initial prompt and the user's answers to the clarifying questions, generate a PRD using the structure outlined below.
4.  **Save PRD:** Save the generated document as `prd-[feature-name].md` inside the `/기능 PRD/` directory.

## Clarifying Questions (Guidelines)

Ask only the most critical questions needed to write a clear PRD. Focus on areas where the initial prompt is ambiguous or missing essential context. Common areas that may need clarification:

*   **Problem/Goal:** If unclear - "What problem does this feature solve for the user?"
*   **Core Functionality:** If vague - "What are the key actions a user should be able to perform?"
*   **Scope/Boundaries:** If broad - "Are there any specific things this feature *should not* do?"
*   **Success Criteria:** If unstated - "How will we know when this feature is successfully implemented?"

**Important:** Only ask questions when the answer isn't reasonably inferable from the initial prompt. Prioritize questions that would significantly impact the PRD's clarity.

### Question Format Options

#### Option 1: AskUserQuestion Tool (Recommended for Claude Code)
Use the `AskUserQuestion` tool to present questions as interactive popups in the Claude Code interface:

**장점:**
- 사용자 친화적인 UI (버튼 클릭으로 응답)
- 명확한 선택지 제시
- 다중 선택 가능 (multiSelect 옵션)
- 응답 자동 수집

**사용 방법:**
```typescript
AskUserQuestion({
  questions: [
    {
      question: "What is the primary goal of this feature?",
      header: "Goal",  // 최대 12자
      multiSelect: false,
      options: [
        { label: "Onboarding", description: "Improve user onboarding experience" },
        { label: "Retention", description: "Increase user retention" },
        { label: "Support", description: "Reduce support burden" },
        { label: "Revenue", description: "Generate additional revenue" }
      ]
    }
  ]
})
```

**제약사항:**
- 한 번에 1-4개 질문까지
- 각 질문당 2-4개 옵션
- header는 최대 12자
- "Other" 옵션은 자동 추가됨 (명시하지 말 것)

#### Option 2: Text-Based Questions (Legacy)
텍스트로 질문을 나열하는 기존 방식:

**Formatting Requirements:**
- **Number all questions** (1, 2, 3, etc.)
- **List options for each question as A, B, C, D, etc.** for easy reference
- Make it simple for the user to respond with selections like "1A, 2C, 3B"

**Example Format:**
```
1. What is the primary goal of this feature?
   A. Improve user onboarding experience
   B. Increase user retention
   C. Reduce support burden
   D. Generate additional revenue

2. Who is the target user for this feature?
   A. New users only
   B. Existing users only
   C. All users
   D. Admin users only
```

### Recommendation
**Claude Code 환경에서는 Option 1 (AskUserQuestion 툴)을 우선 사용**하세요. 단, 5개 이상의 질문이 필요하거나 복잡한 설명이 필요한 경우 Option 2를 사용할 수 있습니다.

## PRD Structure

The generated PRD should include the following sections:

1.  **Introduction/Overview:** Briefly describe the feature and the problem it solves. State the goal.
2.  **Goals:** List the specific, measurable objectives for this feature.
3.  **User Stories:** Detail the user narratives describing feature usage and benefits.
4.  **Functional Requirements:** List the specific functionalities the feature must have. Use clear, concise language (e.g., "The system must allow users to upload a profile picture."). Number these requirements.
5.  **Non-Goals (Out of Scope):** Clearly state what this feature will *not* include to manage scope.
6.  **Design Considerations (Optional):** Link to mockups, describe UI/UX requirements, or mention relevant components/styles if applicable.
7.  **Technical Considerations (Optional):** Mention any known technical constraints, dependencies, or suggestions (e.g., "Should integrate with the existing Auth module").
8.  **Success Metrics:** How will the success of this feature be measured? (e.g., "Increase user engagement by 10%", "Reduce support tickets related to X").
9.  **Open Questions:** List any remaining questions or areas needing further clarification.

## Target Audience

Assume the primary reader of the PRD is a **junior developer**. Therefore, requirements should be explicit, unambiguous, and avoid jargon where possible. Provide enough detail for them to understand the feature's purpose and core logic.

## Output

*   **Format:** Markdown (`.md`)
*   **Location:** `/기능 PRD/`
*   **Filename:** `prd-[feature-name].md`

## Final instructions

1. Do NOT start implementing the PRD
2. Make sure to ask the user clarifying questions
3. Take the user's answers to the clarifying questions and improve the PRD
