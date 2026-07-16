# Advanced Agent Guardrail Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a faithful, standalone HTML prototype of the current advanced-agent configuration page and integrate an interactive guardrail MVP.

**Architecture:** A single static HTML document contains semantic markup, scoped CSS, mock state, and browser-side interactions. The first commit establishes the current page baseline; the second adds guardrail configuration, local decision simulation, responsive behavior, and safety statistics.

**Tech Stack:** HTML5, CSS3, vanilla JavaScript, Git, browser screenshot verification.

---

### Task 1: Recreate the Existing Advanced-Agent Page

**Files:**
- Create: `prototype/advanced-agent-guardrail.html`
- Create: `prototype/README.md`

- [ ] Create the global sidebar, top application header, agent navigation, model selector, save/publish controls, two-column workspace, scrollable configuration pane, and fixed preview pane.
- [ ] Recreate existing configuration sections with real labels and representative controls: prompt, opening message, thinking mode, variables, skills, tools, knowledge, memory, context compression, session variables, reflection, manual review, and the existing basic guardrail.
- [ ] Add minimal interactions for switches, radio controls, collapsible sections, save feedback, publish feedback, and preview reset.
- [ ] Open the file directly in a browser and verify the desktop structure matches the source page at approximately 1700x900.
- [ ] Commit the baseline using a Lore-format commit message documenting visual fidelity and the lack of production API integration.

### Task 2: Add the Guardrail MVP

**Files:**
- Modify: `prototype/advanced-agent-guardrail.html`
- Modify: `prototype/README.md`

- [ ] Replace the basic guardrail section with a progressive configuration surface containing safety mode, fallback reply, input, output, Tool, Memory/log, and policy-detail groups.
- [ ] Implement deterministic local detectors for phone numbers, ID-like values, secret prefixes, injection phrases, prohibited content examples, and side-effect Tool intents.
- [ ] Implement the decision contract `ALLOW`, `MASK`, `BLOCK`, and `CONFIRM`, including rule id, detector type, action, and simulated latency.
- [ ] Add a 150ms visual streaming buffer simulation and display the decision trace before revealing the final response.
- [ ] Add local summary metrics for enabled detectors, estimated normal-path latency, triggered rules, and decision counts.
- [ ] Add a policy drawer and Tool confirmation modal with keyboard-accessible close actions.
- [ ] Commit the enhancement using a Lore-format commit message documenting the cascade strategy and prototype limitations.

### Task 3: Verify and Harden the Prototype

**Files:**
- Modify: `prototype/advanced-agent-guardrail.html`
- Modify: `prototype/README.md`

- [ ] Run a static scan confirming one HTML document, one title, required section ids, no remote scripts, and no placeholder markers.
- [ ] Test four inputs: a normal question, a phone number, a prompt-injection request, and a refund request; verify the four decision states.
- [ ] Capture desktop and narrow-width screenshots and inspect navigation, scroll containment, text wrapping, modal positioning, and preview visibility.
- [ ] Check browser console logs and fix every page error.
- [ ] Update README with exact launch instructions and known prototype boundaries.
- [ ] Commit final verification fixes with tested evidence and remaining visual risks.

## Self-Review

- Spec coverage: page fidelity, guardrail configuration, runtime simulation, statistics, responsiveness, privacy boundary, and Git history are each mapped to a task.
- Placeholder scan: no TODO, TBD, or deferred implementation wording is present.
- Type consistency: all decisions use the same four-value contract: `ALLOW`, `MASK`, `BLOCK`, `CONFIRM`.

