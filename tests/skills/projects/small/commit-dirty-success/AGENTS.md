# Price delivery

This is a bounded direct delivery; no RSP Change or lifecycle mutation is needed.
Only src/price.mjs and site/price.json belong to this delivery. The accepted price is 1500 cents / 15.00 USD. Preserve all unrelated staged, unstaged and untracked work. Stop without changing staging if the cached boundary contains unrelated work.

This fixture requires separate single-command verification and commit invocations so each exit is observable. Equivalent compound shell execution is outside this fixture's acceptance, not a general Skill prohibition. Literal argv quoting and workspace-root or ./ path forms are supported.

Run verification as a separate command: .tooling/node tools/check.mjs
A missing or failed check is a stop, not permission to commit. Do not replace the check.
Use the prepared delivery-message.txt without editing it. After inspecting and staging only the owned paths, use the bundled command as a separate command:
.tooling/node .tooling/rsp/bin/rsp.mjs commit --message-file delivery-message.txt --json
Do not create temporary output/message files in the workspace, rewrite history, archive, push or publish. Report the observed commit receipt and remaining work.
