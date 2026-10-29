# Source workflow checks - October29

New bounded GitHub workflow uses Node24, read-only repository permissions, no provider secrets and disposable SQLite tests. All commands passed in an isolated source-only copy: both npm ci installs,21 extension tests, the backend ownership/quota/health/restore fixture, privacy/extension build and runtime audits (zero vulnerabilities in both packages).

[Command output](ci.log). The initial private-copy build omitted the tracked PRIVACY.md input; both test suites had passed. The copy helper now includes that build input, and build/audits were rerun successfully. This was a fixture error, not an application defect. Accepted installed dist and Store ZIP were never changed. Reproduce with `python3 qa/verify-source.py`; the finish-build option is only a focused debug continuation.

Hosted execution remains subject to the existing shared Actions allowance. This local proof does not claim a hosted pass, Store submission or repeated installed/provider acceptance. Remaining popup UX is explicit in U1.
