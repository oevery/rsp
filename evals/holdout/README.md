# Private holdout contract

This directory documents the interface, not a private dataset. Public prompts are not holdout cases. The harness does not create acceptance answers or claim independent authorship on the operator's behalf.

An independent case author provides an external private directory containing one subdirectory per case ID. Each subdirectory has the ordinary case.yaml, an optional fixture/ and its oracle.mjs (or the read-only built-in oracle). Only fixture/ and the task prompt are given to the executor. Schema validation rejects path escapes and symlinks.

The registry contains metadata only:

    {
      "schema": "rsp-holdout-v1",
      "provenance": {
        "authorId": "independent-case-author",
        "candidateAuthorId": "candidate-maintainer",
        "candidateHash": "FROZEN_COMPOSITION_HASH",
        "frozenAt": "ISO_8601_FREEZE_TIME",
        "unsealedAt": "ISO_8601_UNSEAL_TIME",
        "isolation": "separate-read-boundary",
        "isolationEvidence": "EXTERNAL_ISOLATION_EVIDENCE_ID"
      },
      "cases": [
        {
          "id": "private-case-id",
          "version": "1",
          "sha256": "CASE_TREE_HASH",
          "tags": ["authority", "recovery"]
        }
      ]
    }

Compute the case hash using hash(treeFiles(caseDirectory, { rejectLinks: true })) from evals/runner/files.mjs, not a platform-dependent archive hash. The hash covers file paths, executable bits and contents, including the oracle. Compute the candidate hash with compositionIdentity(skillDirectory).hash from evals/observers/workspace.mjs. Public and holdout case IDs must be distinct.

Freeze the candidate before unsealing. Independent authorship, frozen candidate identity, unseal ordering and enforced read isolation are mandatory for release acceptance. An un-attested registry can be exercised during local harness development, but it cannot pass the release gate. The attestation is supplied by a trusted operator and is not cryptographic proof; tests use explicitly synthetic attestations only to exercise gate logic.

Use a separately enforced filesystem/container/remote boundary so the task process cannot read the private case source, oracle, registry or other arms' reports. The current adapter isolates configuration and working files but does not itself create that read boundary. An external directory on the same readable host is insufficient.

Provide public and private coverage for every packaged Skill. Include successful workflows as well as negative authority, interruption recovery and preservation scenarios. The release gate checks coverage and results; it cannot judge dataset representativeness. Case quality remains the independent author's responsibility.

Keep private inputs and reports outside Git. A holdout failure is evidence for a new regression/design decision, not automatic permission to modify a Skill or expose its answer. Create a new version/hash when an independently reviewed case changes.
