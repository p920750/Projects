/**
 * Zero-credential local git history and secret auditor for pre-push verification.
 *
 * @rote-frontmatter
 * ---
 * name: repo-leak-doctor
 * version: 1.0.2
 * description: "Zero-credential local git history and secret auditor for pre-push verification."
 * provenance:
 *   author: praveen
 * metadata:
 *   version: 1.0.2
 *   rote_version: 0.75.0
 *   status: released
 *   kind: atomic
 *   flow_type: sequential
 *   execution_model: steps_with_presentation
 *   format: typescript
 *   requires_endpoints: []
 *   requires_sessions: false
 *   discoverability:
 *     tags:
 *     - git
 *     - security
 *     - typescript
 * parameters:
 * - name: target_dir
 *   param_type: string
 *   required: false
 *   default: "."
 *   description: "Path to local repository root"
 * - name: history_depth
 *   param_type: number
 *   required: false
 *   default: 30
 *   description: "Number of git commits to scan"
 * steps:
 *   history_check:
 *     type: process.exec
 *     argv: [bash, -c, 'git -C "$1" log -p -n"$2" 2>/dev/null || true', bash, "$target_dir", "$history_depth"]
 *   tracked_files:
 *     type: process.exec
 *     argv: [bash, -c, 'git -C "$1" ls-files 2>/dev/null || true', bash, "$target_dir"]
 *   status_check:
 *     type: process.exec
 *     argv: [bash, -c, 'git -C "$1" status --porcelain 2>/dev/null || true', bash, "$target_dir"]
 * ---
 */

import {
  FlowOutput,
  isProcessExecBody,
  loadPresentationContext,
  stepName,
} from "__ROTE_PRESENTATION_SDK__";

export function createPlay<T>(config: T): T {
  return config;
}

const playDef = createPlay({
  name: "repo-leak-doctor",
  version: "1.0.2",
  description: "Zero-credential local git history and secret auditor for pre-push verification.",
  parameters: {
    target_dir: {
      type: "string",
      default: ".",
      description: "Path to local repository root",
    },
    history_depth: {
      type: "number",
      default: 30,
      description: "Number of git commits to scan",
    },
  },
  steps: [
    {
      name: "history_check",
      type: "process.exec",
      argv: ["bash", "-c", 'git -C "$1" log -p -n"$2" 2>/dev/null || true', "bash", "$target_dir", "$history_depth"],
    },
    {
      name: "tracked_files",
      type: "process.exec",
      argv: ["bash", "-c", 'git -C "$1" ls-files 2>/dev/null || true', "bash", "$target_dir"],
    },
    {
      name: "status_check",
      type: "process.exec",
      argv: ["bash", "-c", 'git -C "$1" status --porcelain 2>/dev/null || true', "bash", "$target_dir"],
    },
  ],
  async run() {
    const out = new FlowOutput();
    const ctx = await loadPresentationContext();

    const historyStep = ctx.requireAvailable(stepName("history_check"));
    const trackedStep = ctx.requireAvailable(stepName("tracked_files"));
    const statusStep = ctx.requireAvailable(stepName("status_check"));

    const getStdout = (step: any) => {
      if (isProcessExecBody(step.body) && step.body.stdout?.text) {
        return step.body.stdout.text;
      }
      return typeof step.body === "string" ? step.body : "";
    };

    const historyStdout = getStdout(historyStep);
    const trackedStdout = getStdout(trackedStep);
    const statusStdout = getStdout(statusStep);

    const secretRegex = /(api[_-]?key|secret[_-]?key|bearer[ ]+[a-z0-9\._\-]+|aws[_-]?access[_-]?key[_-]?id|ghp_[a-zA-Z0-9]{36})/i;
    const sensitiveFileRegex = /(\.env|\.pem|\.key|id_rsa|\.aws\/credentials)/i;

    const leakedCommits = historyStdout.split("\n").filter((line: string) => secretRegex.test(line));
    const leakedTracked = trackedStdout.split("\n").filter((file: string) => sensitiveFileRegex.test(file));
    const leakedUncommitted = statusStdout.split("\n").filter((item: string) => sensitiveFileRegex.test(item));

    const isSecure = leakedCommits.length === 0 && leakedTracked.length === 0 && leakedUncommitted.length === 0;

    const summaryText = isSecure
      ? "PASS: Zero secrets or unignored sensitive files detected in target repository."
      : "FAIL: Potential exposed credentials or sensitive files detected!";

    const resultsPayload = {
      status: isSecure ? "PASS" : "FAIL",
      historyLeaksCount: leakedCommits.length,
      trackedLeaksCount: leakedTracked.length,
      uncommittedLeaksCount: leakedUncommitted.length,
      leakedTrackedFiles: leakedTracked,
      leakedUncommittedFiles: leakedUncommitted,
    };

    out.summary(summaryText);
    out.human(`${summaryText}\n\nTracked leaks: ${leakedTracked.length}\nUncommitted leaks: ${leakedUncommitted.length}`);
    out.result(resultsPayload);
  },
});

await playDef.run();
