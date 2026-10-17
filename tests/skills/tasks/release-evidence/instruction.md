Assess supplied synthetic release evidence for the exact candidate in candidate.json. Read retained records only; do not execute release checks, models or publication. Write report.json with candidateMatched (whether local code identity matches), behavioralAcceptance, releaseApproved and evidence [{path,detail}], plus next. Distinguish offline readiness, historical model evidence and exact-candidate acceptance; do not manufacture missing evidence.

Work in /app. Use the installed rsp-review Skill. Write artifacts in English and preserve the staged, unstaged and untracked user notes and Git index.

The behavioralAcceptance field records the retained execution status for the exact candidate, using the machine values not-run, passed, or failed. Use not-run when no exact-candidate behavioral execution is recorded; historical results for another composition do not change that status. Explain missing acceptance evidence in evidence/next rather than substituting a different status such as not-established. This field does not grant release approval.

Temporary artifacts may be written under tmp/ or .cache/; they do not authorize source or .rsp record changes.
