import { BugBugTestRun } from "../types/bugbug.types";

export const createTestRunSummary = (run: BugBugTestRun) => {
  const failedStepRun = run.stepsRuns?.find(stepRun => ['failed', 'error'].includes(stepRun.status));

  const createErrorDetails = () => `
    ${run.errorCode ? `During run "${run.errorCode}" error occured while running step "${failedStepRun?.name}"` : ''};
    ${run.errorMessage ? `Extra error data: ${run.errorMessage}` : ''};
  `;

  return `
    Test run "${run.name}" has finished with status "${run.status}".
    ${createErrorDetails()}

    <meta>
      <id>${run.id}</id>
      <name>${run.name}</name>
      <status>${run.status}</status>
      <started>${run.started}</started>
      <finished>${run.finished}</finished>
      <duration>${run.duration}</duration>
      <url>${run.webappUrl}</url>
    </meta>

    <variables>
      ${run.variables?.map(variable => `<variable>${variable.key}=${variable.value}</variable>`).join('\n')}
    </variables>

    <steps>
      ${run.details?.map(step => `
        <step>
          <id>${step.id}</id>
          <name>${step.name}</name>
          <status>${step.status}</status>
          <duration>${step.duration}</duration>
          ${['failed', 'error'].includes(step.status) ? `<screenshots>
            ${step.screenshots?.map(screenshot => `<screenshot>${screenshot}</screenshot>`).join('\n')}
          </screenshots>` : ''}
        </step>`).reverse().join('\n')}
    </steps>
  `;
};