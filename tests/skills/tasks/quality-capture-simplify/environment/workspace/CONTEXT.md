# Source capture and recovery

The tool captures selected files from a committed Git revision. Recovery records contain exactly repository, revision and paths, sufficient to reacquire the selected committed bytes. Capture directories contain only the selected upstream files at their original paths. Read the requested historical commit even when repository HEAD has advanced. The caller owns the destination.

changedPaths(repository, before, after) reports all changed repository paths from the two commits, including paths outside the capture selection. Equal revisions return an empty list. Preserve signatures and caller inputs. There is no independent requirement for local tampering audits, byte deduplication, research-report version management or non-Git release authentication.
