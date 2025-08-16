// BugBug API Types
// These interfaces define the structure of data returned by the BugBug API

// ============================================================================
// BASE TYPES AND ENUMS
// ============================================================================

export type BugBugRunStatus = 'running' | 'passed' | 'failed' | 'stopped' | 'queued' | 'initializing';
export const isFinishedRunStatus = (status: BugBugRunStatus) => status === 'passed' || status === 'failed' || status === 'stopped';
export type BugBugTriggerSource = 'user' | 'api' | 'scheduler' | 'github' | 'cli';

export interface BugBugScreenshot {
  id: string;
  url: string;
  timestamp: string;
  description?: string;
}

export interface BugBugVariable {
  key: string;
  value: string;
}

export interface BugBugVariableInput {
  key: string;
  value?: string;
}

// Base interface for entities with common properties
interface BugBugBaseEntity {
  id: string;
  name: string;
  description?: string;
  webappUrl?: string;
}

// Base interface for timestamped entities
interface BugBugTimestampedEntity extends BugBugBaseEntity {
  created: string;
  modified?: string;
}

// Base interface for run entities
interface BugBugBaseRun extends BugBugBaseEntity {
  status: BugBugRunStatus;
  started: string;
  finished?: string;
  result?: string;
  errorCode?: string;
  errorMessage?: string;
  duration?: string;
  queued?: string;
  sequence?: string;
  profileName?: string;
  triggeredBy?: string;
  variables?: BugBugVariable[];
  screenshots?: string[];
  modified?: string;
}

// ============================================================================
// CORE ENTITIES
// ============================================================================

export interface BugBugTest extends BugBugTimestampedEntity {
  isActive: boolean;
  isRecording?: boolean;
  lastResult?: string;
}

export interface BugBugSuite extends BugBugTimestampedEntity {
  tests?: BugBugTest[];
  testsCount?: number;
}

export interface BugBugProfile extends BugBugBaseEntity {
  settings?: Record<string, unknown>;
  isDefault?: boolean;
}

// ============================================================================
// STEP AND DETAIL TYPES
// ============================================================================

export interface BugBugStepDetail {
  stepId?: string;
  id: string;
  name: string;
  status: string;
  duration?: string;
  screenshots?: BugBugScreenshot[];
}

export interface BugBugTestDetail {
  id: string;
  name: string;
  status: string;
  duration?: string;
  errorCode?: string;
  screenshots?: BugBugScreenshot[];
}

// ============================================================================
// RUN ENTITIES
// ============================================================================

export interface BugBugTestRun extends BugBugBaseRun {
  testId: string;
  details?: BugBugTestDetail[];
  stepsRuns?: BugBugStepDetail[];
}

export interface BugBugSuiteRun extends BugBugBaseRun {
  suiteId: string;
  testRuns?: BugBugTestRun[];
  details?: BugBugTestDetail[];
  stepsRuns?: BugBugStepDetail[];
}

// ============================================================================
// STATUS AND RESPONSE TYPES
// ============================================================================

export interface BugBugRunStatusResponse {
  id: string;
  status: BugBugRunStatus;
  progress?: number;
  currentStep?: string;
  errorCode?: string;
  errorMessage?: string;
  modified?: string;
  webappUrl?: string;
}

export interface BugBugScreenshotResponse {
  id: string;
  stepsRuns?: Array<{
    id: string;
    name: string;
    status: string;
    screenshots?: BugBugScreenshot[];
  }>;
  testsRuns?: Array<{
    id: string;
    name: string;
    status: string;
    screenshots?: BugBugScreenshot[];
  }>;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface PaginatedResponse<T> {
  count: number;
  next?: string;
  previous?: string;
  results: T[];
  page?: number;
}

// ============================================================================
// REQUEST TYPES
// ============================================================================

export interface CreateTestRunRequest {
  testId: string;
  profileName?: string;
  triggeredBy?: BugBugTriggerSource;
  variables?: BugBugVariable[];
}

export interface CreateSuiteRunRequest {
  suiteId: string;
  profileName?: string;
  triggeredBy?: BugBugTriggerSource;
  variables?: BugBugVariable[];
}


