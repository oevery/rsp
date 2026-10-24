# Changelog

## [4.0.0](https://github.com/oevery/rsp/compare/v3.3.0...v4.0.0) (2026-10-24)

### ⚠ BREAKING CHANGES

* **skills:** Individual core Skill installation is no longer supported.
  Install the complete suite and inspect customized obsolete audit directories
  before forced migration.
* **research:** Maintainer research no longer supports sealed-study,
  coverage or custom bundle commands. Write ordinary timestamped reports and
  use explicit capture recovery and cleanup commands.
* **research:** Maintainer studies use brief and --brief in place of question
  and --question. Historical sealed bytes are preserved without implicit migration.
* **workflow:** Replace manage configuration with workflow.delegation and
  workflow.closeout, defaulting to off/ask. Legacy manage mappings require explicit
  migration; rsp update does not convert them or grant Git authority.
* **evaluation:** retire the former Skill runner commands and case/suite
  formats. Use tests/skills/evaluate.py and native Harbor task/job settings.
* **rsp:** rsp commit, its snapshot flags and JSON receipt are removed.
  Use rsp-commit with native Git and a prepared message file.
* **runtime:** RSP requires project Skills. Use an exact target CLI,
  explicit version adoption and selected legacy Rules removal after preserving
  custom content, then refresh the complete Skill suite before resuming work.
* **skills:** rsp-manage moves into rsp; rsp-design moves into rsp-shape; rsp-diagnose, rsp-tdd and rsp-resolve-findings move into rsp-implement. Inspect existing Skill trees before explicitly forcing migration.
* **setup:** skills install, the Skill installer UI, doctor --fix, and
  the update adoption/removal switches are retired. Use init for setup and
  update [--dry-run] for managed upgrades; save managed customizations first.

### Features

* **ci:** integrate pinned xova project workflows ([86f790c](https://github.com/oevery/rsp/commit/86f790c97c568dce0fc1fb0bb414651d97517990))
* **ci:** unify code and docs checks with shared caches ([44b790a](https://github.com/oevery/rsp/commit/44b790ab85828e152c3e5548e29956fb08d8bdee))
* **cli:** add config inspection and streamline status output ([ca774af](https://github.com/oevery/rsp/commit/ca774aff9828718830eb807aed9da5a087634ef9))
* **docs:** add reader-focused documentation workflow ([0cd01fd](https://github.com/oevery/rsp/commit/0cd01fd14f9fd5735b0f79ec223b101d23bb0bfb))
* **docs:** unify document and skill authoring ([0ab61cb](https://github.com/oevery/rsp/commit/0ab61cb063b3af50460e67abb8a5cfbb809da47e))
* **eval:** select exact calibration samples ([d966e3c](https://github.com/oevery/rsp/commit/d966e3c69c599ac7ba37a6f6fe0bbe1382c9571e))
* **runtime:** distinguish source checkouts from pinned projects ([622fcb1](https://github.com/oevery/rsp/commit/622fcb1448e0ae9e520217b7a0c488d966bca691))
* **runtime:** pin project versions and retire Rules ([74bd852](https://github.com/oevery/rsp/commit/74bd85227def962935f02035f3c87f7c5c14f640))
* **workflow:** separate delegation from delivery closeout ([178eaaa](https://github.com/oevery/rsp/commit/178eaaae6e5f43eb0b6d196edf98839f578a902d))

### Bug Fixes

* **archive:** check history summary before archiving ([c630a4b](https://github.com/oevery/rsp/commit/c630a4ba0d6c917e9fc51533257c23b480d7526c))
* **eval:** align four task fixtures with their output contracts ([a85ee98](https://github.com/oevery/rsp/commit/a85ee987bb96c00215ea9107a7ac508f9df4a781))
* **eval:** distinguish inherited regrade usage from current duration ([0bec0bc](https://github.com/oevery/rsp/commit/0bec0bcf60a3dd993bd6748a69320839b860402a))
* **eval:** distinguish saved provenance in comparison reports ([cb92ce4](https://github.com/oevery/rsp/commit/cb92ce4af9ab4b6fa83437edd62f70f8e5c543e2))
* **eval:** distinguish unavailable grading in reports ([fe5ea05](https://github.com/oevery/rsp/commit/fe5ea05a7aba5b9753b517fcad0554ff64a9e978))
* **eval:** expose cached token usage with source attribution ([fb33f16](https://github.com/oevery/rsp/commit/fb33f16b19c4f9724a947004170058bdff0d57b5))
* **eval:** handle missing calibration expectations and labels ([4b36217](https://github.com/oevery/rsp/commit/4b36217232440e26600a194d767c0636310203eb))
* **eval:** preserve comparisons with unreadable baseline trials ([a344d48](https://github.com/oevery/rsp/commit/a344d4871c1c6bf8ad3aa32b6b72434aef6e14cc))
* **eval:** preserve reports on verifier discovery errors ([f42d2dd](https://github.com/oevery/rsp/commit/f42d2dd87728188edd4fbc680ec3c99663f83add))
* **eval:** preserve reports when execution status is unreadable ([2c2ad02](https://github.com/oevery/rsp/commit/2c2ad0261c22eb320cc0bebf970cd73e1dc7d713))
* **eval:** preserve reports when grading details are unreadable ([1042872](https://github.com/oevery/rsp/commit/1042872f941fe3151eae5b6ee4e172ea760a744c))
* **eval:** preserve reports when job plans are unavailable ([aaf64cb](https://github.com/oevery/rsp/commit/aaf64cbe8ee6615164a02d7684535e475824a688))
* **eval:** preserve reports when usage evidence is unreadable ([ce6bc98](https://github.com/oevery/rsp/commit/ce6bc985746fa00555fd0de59a2995e1cccb5216))
* **eval:** preserve reports with unreadable trial results ([62e1592](https://github.com/oevery/rsp/commit/62e159280eca2de22c8b511ea1d0b65580e432e9))
* **eval:** reject stale usage from corrupt session JSON ([189124f](https://github.com/oevery/rsp/commit/189124f19555dbe0c662f7c7a784f7590a2c8c97))
* **eval:** report baseline plan completeness ([8550f7e](https://github.com/oevery/rsp/commit/8550f7e75b3e7fb95ab57068b71a5d3e3d2b4e00))
* **eval:** require complete calibration expectations ([43f31ce](https://github.com/oevery/rsp/commit/43f31ce8c199eb46a8d0d743193cc498976a3de6))
* **eval:** retain calibration identity for regrades missing manifests ([8dda2aa](https://github.com/oevery/rsp/commit/8dda2aa4e353c6266d30f8c3533498d0f4b62b95))
* **eval:** retain root-cause locations in exception records ([6976c81](https://github.com/oevery/rsp/commit/6976c81897a75cbcc1bfe2a9b4722e1c07764285))
* **eval:** retain unscored calibration when manifests are unavailable ([e7bbb19](https://github.com/oevery/rsp/commit/e7bbb191681f87ef81b88004dbc40490125c4b69))
* **eval:** specify next-action and evidence-reference formats ([598474a](https://github.com/oevery/rsp/commit/598474a402770f08bcf6ac23f36c1bd6047b5ec5))
* **rsp:** clarify focus writeback and archive evidence boundaries ([1cde234](https://github.com/oevery/rsp/commit/1cde23447d46ccf15375153eeb9dd18cde3a55e7))
* **rsp:** enforce writeback order and remove evaluation quotas ([a2014ea](https://github.com/oevery/rsp/commit/a2014ea9feafcb8264e7ce7374ab453e6b2099d4))
* **skills:** align work selection and change record guidance ([1f29dcc](https://github.com/oevery/rsp/commit/1f29dcc5d0dc05da7c92130f89f7fe25685b87de))
* **skills:** clarify routing and work-record boundaries ([47a5231](https://github.com/oevery/rsp/commit/47a5231f9bcbd637440af16fe58be784686df472))
* **skills:** clarify test expectations and useful comments ([37b7ec0](https://github.com/oevery/rsp/commit/37b7ec059b91a0605c5e80106d512cc7b006dd34))
* **skills:** gate commit writes on successful prerequisites ([ca5b6a6](https://github.com/oevery/rsp/commit/ca5b6a68571bf0d259f9e81b353f1ce596222ee5))
* **skills:** unify core suite identity and review boundaries ([b53390c](https://github.com/oevery/rsp/commit/b53390c433375c9b1c0b16a288a4a6cf5980c892))
* **testing:** enforce evaluation evidence and acceptance ([1d4cd37](https://github.com/oevery/rsp/commit/1d4cd37e2e56ab3fd4a127fa84bba308b145011c))
* **tests:** make skill review evidence traceable ([1f50a60](https://github.com/oevery/rsp/commit/1f50a60969861fe45e0ec66a792c91d01f7edd7e))
* **tests:** preserve task evidence without blanket redaction ([79cb6d2](https://github.com/oevery/rsp/commit/79cb6d2bc6e23aaa52ea90c5f8cdab6d7b146103))
* **test:** stabilize fixture evidence across CI color settings ([6ae5b10](https://github.com/oevery/rsp/commit/6ae5b10fba703aae57ed18d8d433d185202bc1bc))

### Code Refactoring

* **evaluation:** migrate skill testing to Harbor and Reward Kit ([adbc2ed](https://github.com/oevery/rsp/commit/adbc2ed4d10f4c39e25593b0c3330a7e9e117d97))
* **research:** simplify capture recovery and dated reports ([d22805e](https://github.com/oevery/rsp/commit/d22805e7ad519ad28bd7a286fd1ef5ed7972ed57))
* **research:** support upstream discovery and traceable coverage ([8b96947](https://github.com/oevery/rsp/commit/8b9694706263efaaa2e2867cf2c8235958e2173b))
* **rsp:** streamline delivery and verification evidence ([899e90a](https://github.com/oevery/rsp/commit/899e90a4114524e2df62b4d57136be5127534f8e))
* **setup:** unify ownership-based project updates ([2a2e7ea](https://github.com/oevery/rsp/commit/2a2e7ea30cf20824db855c89bbdf48f5e09b5495))
* **skills:** consolidate workflow and stabilize evaluations ([fff714b](https://github.com/oevery/rsp/commit/fff714b6f6cd48918e45a1288f6880978c23166f))

Historical entries through 3.3.0 were rebuilt from tagged Conventional Commits. They retain intermediate changes later revised or removed; the historical compatibility notes and linked migration guides clarify the shipped upgrade requirements. Previously recorded release dates are preserved.

## [3.3.0](https://github.com/oevery/rsp/compare/v3.2.0...v3.3.0) (2026-08-24)

### Historical compatibility

The tagged release requires Node.js >=22 and retains `rsp create --lite`, `--lite=true` and `--lite=false` for one compatibility cycle. Commit messages below include intermediate CLI/runtime changes that were revised before the tag; their removal and Node.js >=22.13.0 statements do not describe the final 3.3.0 compatibility contract.

### ⚠ BREAKING CHANGES

* **manage:** managed Discipline WorkerReceipts no longer accept compound result values, and Verify receipts require evidence_delta.
* **cli:** **Reverted before 3.3.0.** The commit removed `rsp create --lite`; final 3.3.0 retained `--lite`, `--lite=true` and `--lite=false` for one compatibility cycle.
* **runtime:** **Revised before 3.3.0.** The commit proposed Node.js >=22.13.0 and removal of `rsp create --lite`; final 3.3.0 requires Node.js >=22 and retains those compatibility forms. Direct Specs queries did ship.

### Features

* **evaluation:** add candidate no-regression gate ([d3e5f0b](https://github.com/oevery/rsp/commit/d3e5f0b44fa5adb1e3ae439df7c6991d9e8586d3))
* **evaluation:** add deterministic Skill routing gate ([a8fc9ba](https://github.com/oevery/rsp/commit/a8fc9ba4ffea65ab1db6e96107c22ad367fd27fa))
* **evaluation:** add skill observability dimensions ([bd18fe5](https://github.com/oevery/rsp/commit/bd18fe559ae68756ecaaa4bbcb8318ffe89e8ce9))
* **manage:** streamline workspace orchestration ([93fed00](https://github.com/oevery/rsp/commit/93fed007d88610be815a75a967e4751b0b2a8df6))
* **release:** add behavior acceptance campaign ([ece1246](https://github.com/oevery/rsp/commit/ece12467247cda4db0c5e1e5d41f57bf097e299c))
* **release:** add replayable provider comparison matrix ([e29a5cc](https://github.com/oevery/rsp/commit/e29a5ccd4cd383e8e1d354296f13233b994b81dc))
* **release:** add serial acceptance campaign ([c9de6fd](https://github.com/oevery/rsp/commit/c9de6fdaa73bbba027614a0893f3b7d73d849ad8))
* **rsp:** enforce verification criticality gates ([82ca55f](https://github.com/oevery/rsp/commit/82ca55fac694060a4bf00ac1569170a396af2db1))
* **runtime:** add local runtime and observability ([6b20fe8](https://github.com/oevery/rsp/commit/6b20fe88a73994fc800a6a8c4fec7ca3d7235fc5))
* **runtime:** complete broker and web observability ([811cfa3](https://github.com/oevery/rsp/commit/811cfa394ec1d5fae972190741faa68273820fd0))
* **security:** gate Skill release candidates ([de3aeb8](https://github.com/oevery/rsp/commit/de3aeb8f8879a5b012d2fbbd18df2dc6e563c8b2))
* **skills:** add RSP skill authoring workflow ([a4ba2e5](https://github.com/oevery/rsp/commit/a4ba2e571dc4676b1916c26c5f70a1ba757c6011))
* **skills:** improve agent artifact hygiene ([0b4582a](https://github.com/oevery/rsp/commit/0b4582aee6db393fb951283644274263b87cb26b))
* **tui:** unify dashboard navigation and detail views ([8b119be](https://github.com/oevery/rsp/commit/8b119be59df7b5d2dfd4f411682003549254967e))
* **workspace:** add isolated execution and exact landing ([30a3922](https://github.com/oevery/rsp/commit/30a39226a13d469b6fa6e56aefa8accf4c5e4c09))
* **workspace:** add project activation policy ([6a3da3e](https://github.com/oevery/rsp/commit/6a3da3e76a344d4acb3a631c479681857a483050))

### Bug Fixes

* **cli:** block invalid Change closeout ([8c35a7f](https://github.com/oevery/rsp/commit/8c35a7f15e845d6b565d3d6d0b63908336dd75ab))
* **commit:** harden multiline message transport ([4477f11](https://github.com/oevery/rsp/commit/4477f11020ff773f448218e0152edaf15a1db39f))
* **config:** reconcile generated project defaults ([e358397](https://github.com/oevery/rsp/commit/e358397a5f908678c81363015fb6b0f31d4ddede))
* **core:** tolerate none blocker variants ([eb164b7](https://github.com/oevery/rsp/commit/eb164b7f38cd2a13a5b76c8213fcac0014a54b59))
* **evaluation:** accept agent-reported metadata ([e07c1cd](https://github.com/oevery/rsp/commit/e07c1cd8337c0c2f3fb345cd3e5da5a77423843a))
* **manage:** clarify worker boundary semantics ([3a8d01f](https://github.com/oevery/rsp/commit/3a8d01f9f73171dde9eab65a6b9d8476ede597d1))
* **manage:** enforce required worker contracts ([e0dd5ea](https://github.com/oevery/rsp/commit/e0dd5eaec90b69e393d26134d6cd037c78d52228))
* **manage:** keep controller fixtures archive-safe ([9b95697](https://github.com/oevery/rsp/commit/9b956972af758e8d41092beef5b2344fdef6f7d7))
* **release:** accept equivalent production-chain tests ([579ba77](https://github.com/oevery/rsp/commit/579ba77e0d1d2e20cd87795f559f1d1e4b61ce22))
* **release:** accept inline-code control values ([62a2dd2](https://github.com/oevery/rsp/commit/62a2dd2bea3a650ae4b8366450f0c598de0c8fc3))
* **release:** accept observable timestamp implementations ([818ab30](https://github.com/oevery/rsp/commit/818ab30677f78ae5d2d4b9fe9057224c8865bf3e))
* **release:** align coordinated required changes ([21647fb](https://github.com/oevery/rsp/commit/21647fbf2e9838af357443641a34d182392d86bb))
* **release:** correct provider execution boundary ([7688570](https://github.com/oevery/rsp/commit/7688570ca3a5da481a5974aff7fc05f97381b9ea))
* **release:** disclose evaluation mutation authority ([8b66180](https://github.com/oevery/rsp/commit/8b661808f582281f8a380b4d5b5bf2b77d3818de))
* **release:** enforce worker assignment compliance ([6030db6](https://github.com/oevery/rsp/commit/6030db6a57c1df4d066d00c806ca5315e2a0f45a))
* **release:** ignore negated forbidden actions ([f96f6d9](https://github.com/oevery/rsp/commit/f96f6d95d41fdc8db2d55894ad2d9662e349a050))
* **release:** localize material fact acceptance ([a485b02](https://github.com/oevery/rsp/commit/a485b02f0e64a3d6a44a2f5a3b42942566f86699))
* **release:** normalize provider trigger receipts ([10873ca](https://github.com/oevery/rsp/commit/10873ca4ab1f089921af3c150de303a6f708936e))
* **release:** persist worker-capable provider sessions ([c3af09d](https://github.com/oevery/rsp/commit/c3af09da62b8df8a1338af0d1bc6ad596d5ae341))
* **release:** preserve paired provider evidence ([561b7ff](https://github.com/oevery/rsp/commit/561b7ff3b45ae8690fa92b2f5d7c5ea14d30972d))
* **release:** relax commit holdout scope ([f370ba2](https://github.com/oevery/rsp/commit/f370ba2b9a88576607034fa0e7d2a1e1de1c0642))
* **release:** reuse provider comparison evidence ([c4adccd](https://github.com/oevery/rsp/commit/c4adccdda4d62b3a4e3645b70c8197f621d8fb70))
* **release:** test the observable production chain ([6f5c1ef](https://github.com/oevery/rsp/commit/6f5c1effc13be0c35f3b8a28582620de11ce694e))
* **release:** trust structured worker counts ([8b59948](https://github.com/oevery/rsp/commit/8b59948a3bcb951632471e66ce0968602d5c2a5a))
* **review:** require production reachability before clean ([2fb99fa](https://github.com/oevery/rsp/commit/2fb99faa24928c2d4eb9341dcbb58b0d2ba99cbd))
* **skills:** add context scanner type declarations ([6e295c8](https://github.com/oevery/rsp/commit/6e295c8aa06cd696ece9b354aef991d8403cbe04))
* **skills:** decouple managed release identity ([232c793](https://github.com/oevery/rsp/commit/232c7932c3dab31b6a37925654f3700d54f40831))
* **skills:** preserve material release actions ([8639d01](https://github.com/oevery/rsp/commit/8639d0185babdec36f8c00fb9aa07edd1e83ad95))
* **skills:** require consumer consequence coverage ([7d22b0e](https://github.com/oevery/rsp/commit/7d22b0ee0a32542944aec69566eae4eae36ad763))
* **skills:** support direct commit boundaries ([35a971f](https://github.com/oevery/rsp/commit/35a971f9e74e382878f896323e792e2b7a86a5e1))
* **test:** align verification topology inventory ([260f0d5](https://github.com/oevery/rsp/commit/260f0d50ef006038c247ebf24de44b25b644eb04))
* **test:** stabilize shared CLI builds ([b6f5937](https://github.com/oevery/rsp/commit/b6f5937dc5ff0f1ad1424f0863c17a53e1720491))
* **tui:** accept canonical ancestor path aliases ([874e0fe](https://github.com/oevery/rsp/commit/874e0fee65586adb16c259b64838097ace47284f))
* **workspace:** converge recovery contracts ([ef110f6](https://github.com/oevery/rsp/commit/ef110f60178a5e5d012e09a01622ee00a6a582b9))
* **workspace:** return structured JSON errors ([437430e](https://github.com/oevery/rsp/commit/437430e89deb06b86fd80e4bf3f556b72fc4cbcb))

### Code Refactoring

* **cli:** simplify default experience ([a36496e](https://github.com/oevery/rsp/commit/a36496e7311a6dd357ed2c7ecb57e3ef4811124d))
* **manage:** orthogonalize discipline receipts ([9bdffe2](https://github.com/oevery/rsp/commit/9bdffe2406ede27fd4fd6a6aa24ebe0b6f5d363c))

## [3.2.0](https://github.com/oevery/rsp/compare/v3.1.1...v3.2.0) (2026-08-05)

### Features

* **manage:** unify orchestration control model ([301acc0](https://github.com/oevery/rsp/commit/301acc004abd7385ce9e3d5ed88aadf01d6c48ef))
* **rsp:** stabilize WorkRef identity and expose work summaries ([ea43e51](https://github.com/oevery/rsp/commit/ea43e51486337e97c9e4ac5ad8e8a7ff852ab83d))

### Bug Fixes

* **manage:** preserve routing stop contracts ([32e766a](https://github.com/oevery/rsp/commit/32e766a967f63e057550284467b89302c94f9198))

## [3.1.1](https://github.com/oevery/rsp/compare/v3.1.0...v3.1.1) (2026-07-30)

### Historical compatibility

This was the first stable 3.1 package published to npm; 3.1.0 was available as a GitHub release only.

### Bug Fixes

* **commit:** preserve multiline messages ([8782a2d](https://github.com/oevery/rsp/commit/8782a2dfc694690e61c964fa9938d2795ad35c87))

## [3.1.0](https://github.com/oevery/rsp/compare/v3.1.0-beta.5...v3.1.0) (2026-07-30)

### Historical compatibility

Requires Node.js >=22. When upgrading from 2.x, apply the [3.0 migration](https://github.com/oevery/rsp/blob/v3.1.0/docs/migrations/3.0.md) before the [3.1 migration](https://github.com/oevery/rsp/blob/v3.1.0/docs/migrations/3.1.md). This version was not published to npm; the first stable 3.1 registry package was 3.1.1.

### Bug Fixes

* **build:** declare root workspace package ([e300f89](https://github.com/oevery/rsp/commit/e300f89d456526e86b0b37729335522c7a421aed))
* **core:** omit comments from change scaffolds ([c6020d4](https://github.com/oevery/rsp/commit/c6020d4fccd675d5068812e5f2513168fc0d91cd))

## [3.1.0-beta.5](https://github.com/oevery/rsp/compare/v3.1.0-beta.4...v3.1.0-beta.5) (2026-07-29)

### Features

* **core:** link Changes to external issues ([ec4b8e9](https://github.com/oevery/rsp/commit/ec4b8e960164004046c86c99b149661976a4a7c9))
* **rsp:** harden managed recovery ([e648950](https://github.com/oevery/rsp/commit/e648950279e9b15df5e78be666d05fac7a7d208c))

### Bug Fixes

* **release:** restore typecheck gate ([0a4d33f](https://github.com/oevery/rsp/commit/0a4d33f5c73ca3e147132a543b3b92b73150d25b))

## [3.1.0-beta.4](https://github.com/oevery/rsp/compare/v3.1.0-beta.3...v3.1.0-beta.4) (2026-07-28)

### Features

* **core:** add language policy and Unicode WorkRefs ([1df907f](https://github.com/oevery/rsp/commit/1df907f5345d1256c80147b8da943cb0391b512b))

### Bug Fixes

* **manage:** make automatic routing proactive ([e0a08ff](https://github.com/oevery/rsp/commit/e0a08ffad1dd3fe3b451f97984937d4db2466ee6))

## [3.1.0-beta.3](https://github.com/oevery/rsp/compare/v3.1.0-beta.2...v3.1.0-beta.3) (2026-07-28)

### Features

* **cli:** reopen archived changes ([424e801](https://github.com/oevery/rsp/commit/424e8013d0088f57b5b0ca8c153419cdcd1ebeb4))
* **cli:** replace global indexes with bounded navigation ([ce7083a](https://github.com/oevery/rsp/commit/ce7083a9452df4a4b0eeb918c78e4f893ec109a3))

### Bug Fixes

* **manage:** make local closeout deterministic ([83004be](https://github.com/oevery/rsp/commit/83004be3bfe792a5fd6b829bf01295e31c08cd7c))
* **skills:** harden managed adoption routing ([a91ee98](https://github.com/oevery/rsp/commit/a91ee98a13a649cb15a3e06f45e80690d7950a7b))

## [3.1.0-beta.2](https://github.com/oevery/rsp/compare/v3.1.0-beta.1...v3.1.0-beta.2) (2026-07-27)

### Features

* **design:** support pre-change inquiries ([31fb745](https://github.com/oevery/rsp/commit/31fb74520c6255ea3e8de66eba50845eb9a4ecc6))
* **manage:** configure automatic routing and closeout ([bcf5833](https://github.com/oevery/rsp/commit/bcf58333aafe6e0f279fd31c25ca03112fffa225))
* **manage:** converge in-scope review corrections ([520a0c3](https://github.com/oevery/rsp/commit/520a0c3e622904cfc1c2ad43bb6496f4de3154bc))
* **manage:** support long-running managed goal continuation ([09b3fb9](https://github.com/oevery/rsp/commit/09b3fb9f950f67c51fa3e44f594fd7a725c47389))
* **rsp-manage:** execute shallow groups by waves ([d8f2561](https://github.com/oevery/rsp/commit/d8f2561919a7a1dd0a210373244fd6e3ead2272d))
* **skills:** add interactive project skill manager ([f278997](https://github.com/oevery/rsp/commit/f278997f2a68eed95033520c4664706d7775cc38))
* **skills:** add optional codebase audit capability ([a37fbf0](https://github.com/oevery/rsp/commit/a37fbf020454c9f95ef74956d8b9293b14a5b258))
* **skills:** add RSP commit capability ([34b0af3](https://github.com/oevery/rsp/commit/34b0af3d89b3b16541565ba8318d923ca45c1f76))

### Bug Fixes

* **release:** harden pre-dogfood maintenance gates ([7dea2e8](https://github.com/oevery/rsp/commit/7dea2e8d4d1af8bbb6dbd8cb2a547fa63f3f776c))
* **release:** simplify release operation tracking ([6f8f455](https://github.com/oevery/rsp/commit/6f8f45591cbb75c5908d510b7560264c4535bf73))
* **rsp-shape:** preserve independent change owners ([149f09e](https://github.com/oevery/rsp/commit/149f09e40b4e3a106f1722ad2a95546cfd793674))
* **rsp:** shape managed goals before qualification ([7a681d1](https://github.com/oevery/rsp/commit/7a681d1baa539710a92536dafe63ea33596c5e14))

## [3.1.0-beta.1](https://github.com/oevery/rsp/compare/v3.1.0-beta.0...v3.1.0-beta.1) (2026-07-25)

### Bug Fixes

* **evaluation:** decouple retained evidence identity ([f1a3a23](https://github.com/oevery/rsp/commit/f1a3a236d69374c51ca70ae4e74e285ce438c868))
* **release:** defer release identity finalization ([f5d9d23](https://github.com/oevery/rsp/commit/f5d9d237241751a0d9e8913870aa32a23411ffca))
* **release:** harden finalization boundary ([586fcce](https://github.com/oevery/rsp/commit/586fcce78da0bd89855f93a76f87de646212b1f5))

## [3.1.0-beta.0](https://github.com/oevery/rsp/compare/v3.0.0...v3.1.0-beta.0) (2026-07-25)

### Historical compatibility

Raises the minimum runtime from Node.js 18 to Node.js 22. This prerelease was published under the npm `beta` dist-tag; npm `latest` remained on 2.0.4 at that observation.

### Features

* **cli:** add bounded history query ([89a3ccd](https://github.com/oevery/rsp/commit/89a3ccdbd8457f837dd381bb3ca5e9703f7c015e))
* **cli:** add compact JSON output ([78c79ec](https://github.com/oevery/rsp/commit/78c79ec86cccfc9ae4e04671c63e231f7671a24f))
* **cli:** add dependency graph status output ([8d351c2](https://github.com/oevery/rsp/commit/8d351c270b1116e9d1b2929208ee898cd7f7e998))
* **rsp:** prepare managed workflow beta ([c232f07](https://github.com/oevery/rsp/commit/c232f07e633e9ea677f7f0b65e3ccfc700fba70e))
* **tui:** add bounded history browser ([94a1803](https://github.com/oevery/rsp/commit/94a1803e0ca3fffcc3f2da05d77147201bdda17f))
* **tui:** add interactive dashboard ([37db2e6](https://github.com/oevery/rsp/commit/37db2e69af1cdf9c16273de5c8570574039e57a6))

### Bug Fixes

* **blockers:** ignore non-semantic comments ([2d50876](https://github.com/oevery/rsp/commit/2d5087619dfbf6f94a26a32c5a29ecffcf08fab6))
* **rsp:** layer archive closeout authority ([62a3ff8](https://github.com/oevery/rsp/commit/62a3ff8dbd59a9e1df2effcbcd0d9dc310c5d015))
* **workflow:** reduce test and artifact noise ([36c7eb9](https://github.com/oevery/rsp/commit/36c7eb97848a5f29f72894dcb3faf2e19e875865))

## [3.0.0](https://github.com/oevery/rsp/compare/v2.0.4...v3.0.0) (2026-07-23)

### Historical compatibility

Requires Node.js >=18. Follow the [2.x migration guide](https://github.com/oevery/rsp/blob/v3.0.0/docs/migrations/3.0.md) for the fallback protocol, removed project-rules commands and shallow work paths. This version was not published to npm by maintainer decision; npm `latest` remained on 2.0.4 at that observation.

### ⚠ BREAKING CHANGES

* **protocol:** .rsp/rules/rsp-rules.md and the project-rules CLI are no longer runtime protocol surfaces.
* **groups:** add shallow change coordination
* **work-ref:** enforce typed bounded work identities
* **work:** Group Brief files now use `<group>/00-brief.md`; legacy brief.md paths are rejected.

### Features

* **commands,design:** add commands, update design ([aeaad62](https://github.com/oevery/rsp/commit/aeaad6206ca17bd76202d5c3573137fc4687bfeb))
* **decisions:** add authoritative decision record routing ([77b1372](https://github.com/oevery/rsp/commit/77b1372f206e6c75325cd2c23a36dd25a92e350f))
* **groups:** add shallow change coordination ([086a1d2](https://github.com/oevery/rsp/commit/086a1d2275c7f3cf92e29f18c681bb0cc0c6ee82))
* **protocol:** adopt canonical fallback path ([b52d801](https://github.com/oevery/rsp/commit/b52d8015764cfb6b3d90168dae8af769c153822c))
* **review:** harden candidate evaluation ([326852c](https://github.com/oevery/rsp/commit/326852c10a19eb32af5528464ffa37fbfa920b8e))
* **rsp:** derive one next action ([dd50648](https://github.com/oevery/rsp/commit/dd50648e8a9cdaf211ae06cf2e16009aec137894))
* **skills:** add assisted engineering loop ([629b657](https://github.com/oevery/rsp/commit/629b6575e710b18f3fa4fdd24649827c89ba23ba))
* **skills:** add release documentation capability ([9f14b50](https://github.com/oevery/rsp/commit/9f14b50cbe44690a80e6f46c362301fe6bb6fb42))
* **skills:** add shape and implement ([d7fc818](https://github.com/oevery/rsp/commit/d7fc8189b3053749ff6b26ebc3018bf1503db78a))
* **skills:** add tdd and diagnosis workflows ([6797ca0](https://github.com/oevery/rsp/commit/6797ca07e5c09b092da27aa01a091067a11d17dd))
* **skills:** complete 3.0 eight-skill suite ([6d7de73](https://github.com/oevery/rsp/commit/6d7de73a2a24a6e0eb71ee030510d744ee4e0dfb))
* **skills:** establish review evaluation foundation ([58cc450](https://github.com/oevery/rsp/commit/58cc45044f706a8def653ad8a2550ea037f66846))
* **skills:** finalize 3.0 workflow integration ([eae0d1b](https://github.com/oevery/rsp/commit/eae0d1b68c411f787261687928bc4f9430cd605c))
* **skills:** promote rsp-review ([37d55f6](https://github.com/oevery/rsp/commit/37d55f694bbd65b8447a09402703e5f67f6dd133))
* **skills:** qualify daily workflow depth ([1653f55](https://github.com/oevery/rsp/commit/1653f55e16d886135c8d5016adcda461ae5b301a))
* **upstreams:** add deterministic distillation workflow ([89ba7f6](https://github.com/oevery/rsp/commit/89ba7f660632a33cb48e36ac5c05cdaad3289644))
* **work-ref:** enforce typed bounded work identities ([86b67c8](https://github.com/oevery/rsp/commit/86b67c802a53ff6e2430b938d1e7767f96e8572b))
* **work:** derive group navigation and dependency plans ([8d35190](https://github.com/oevery/rsp/commit/8d35190c0c091d11e51996d6e917a0503cc3c0ca))

### Bug Fixes

* **cli:** unify doctor config diagnostics ([c5c319e](https://github.com/oevery/rsp/commit/c5c319e0a2f23f9ccdbf1af284e51563816b12ae))
* **docs:** stabilize 3.0 migration link ([4462e87](https://github.com/oevery/rsp/commit/4462e87b4912ac4922b4160d02ffa7f3b8f61a07))
* **release:** keep npm 10 pack output machine-readable ([bf05aab](https://github.com/oevery/rsp/commit/bf05aabd4545bd056a3250fc3738855452620e83))
* **review:** trace production seams ([2b5af1b](https://github.com/oevery/rsp/commit/2b5af1bb1cebdad225e34acbe58ac6c653c7e0d9))
* **review:** use user provider by default ([d13502e](https://github.com/oevery/rsp/commit/d13502eda631ce59e050e9f4c84d3b04564c33dc))
* **skill:** conform metadata and use independent calver ([9321291](https://github.com/oevery/rsp/commit/9321291a9db72dee93f06ee0926ac2cd5e3324ef))
* **types:** restore strict typecheck baseline ([5e4ed2c](https://github.com/oevery/rsp/commit/5e4ed2c01f497e5b52cc1cbb3579c0c6e5b42f27))
* **workflow:** align config and templates with 3.0 ([9d8f582](https://github.com/oevery/rsp/commit/9d8f5821bd7c9563eb3840ea869962152dc60229))

## [2.0.4](https://github.com/oevery/rsp/compare/v2.0.3...v2.0.4) (2026-05-28)

### Features

* add .rsp scaffolding and AGENTS.md ([7a118d3](https://github.com/oevery/rsp/commit/7a118d3ccab63e0be30705d7ae698d220d319820))
* add check hygiene warnings ([245eb2a](https://github.com/oevery/rsp/commit/245eb2a3584bbc1a08e917ef01471adb22c71e68))
* add durable review guidance ([8e15c13](https://github.com/oevery/rsp/commit/8e15c1350b2fadde77ed32627dc197cf1595fed9))
* add generated index metadata ([be2f19e](https://github.com/oevery/rsp/commit/be2f19eaa8a7441febe1271d2f3d3c1ae9143af6))
* add lite change template ([890a7e9](https://github.com/oevery/rsp/commit/890a7e9b9f5e710817bd37663ed492aa5fdb5a11))
* add rsp agent readiness commands ([fdf940c](https://github.com/oevery/rsp/commit/fdf940cbca5d2dcc976e81e336381062721bf631))
* add safe doctor fix mode ([d4e4023](https://github.com/oevery/rsp/commit/d4e4023ee769b31a04718c8c5f0fea490fc98465))
* clarify archive readiness signals ([85a29f8](https://github.com/oevery/rsp/commit/85a29f856488d147a3c4887a833eefbccfa41720))
* guide no-focus status actions ([daf0541](https://github.com/oevery/rsp/commit/daf0541f464d7a7dd29b30ddd6a25269e40641e3))

### Bug Fixes

* make bin/rsp.mjs executable (0755) ([fdbbb5c](https://github.com/oevery/rsp/commit/fdbbb5c3c2cc3beb73cdbb2c84f4a97b77c3d21d))

## [2.0.3](https://github.com/oevery/rsp/compare/v2.0.2...v2.0.3) (2026-05-26)

### Features

* **core,commands,test:** enrich change templates ([d3989bf](https://github.com/oevery/rsp/commit/d3989bfccc9fa95989edd627ac8a95536f84b99a))
* **core,commands:** add focus name lookup helper ([04867ec](https://github.com/oevery/rsp/commit/04867ec9882a652c79340be9743aedbea0258bcc))
* **core:** add templates for change kinds ([33be2af](https://github.com/oevery/rsp/commit/33be2af034647383b4eb7fe1e67a9e2e906c0fb3))

### Bug Fixes

* **archive,test:** guard RSP initialization ([9da234a](https://github.com/oevery/rsp/commit/9da234a255e2100f34b824b5558037de92853609))
* **commands:** use stderr and clearer init message ([ebb8379](https://github.com/oevery/rsp/commit/ebb837912aabe3d63d409d7d633613b97dec9f8c))

## [2.0.2](https://github.com/oevery/rsp/compare/v2.0.1...v2.0.2) (2026-05-25)

### Features

* **update,docs:** show skill refresh hint ([d6a2653](https://github.com/oevery/rsp/commit/d6a265319427afa366afac2913bd62f84ed46ec0))

## [2.0.1](https://github.com/oevery/rsp/compare/v2.0.0...v2.0.1) (2026-05-25)

### Features

* **specs:** exclude design.md from INDEX ([36e51bb](https://github.com/oevery/rsp/commit/36e51bb2f031a70aed724011b6f91d49f4a28765))

## [2.0.0](https://github.com/oevery/rsp/compare/v1.2.0...v2.0.0) (2026-05-25)

## [1.2.0](https://github.com/oevery/rsp/compare/v1.1.0...v1.2.0) (2026-05-24)

### Features

* **init:** support --with-project-setup ([c59d721](https://github.com/oevery/rsp/commit/c59d721cde0aa46f45bffe112b89dd02826a2cf8))
* **rsp:** introduce project-setup workflow ([94cb8b8](https://github.com/oevery/rsp/commit/94cb8b8b77d13c8b1d9b003a41926e9c7d3723ce))

### Bug Fixes

* **core,tests:** add blank line after frontmatter ([512c689](https://github.com/oevery/rsp/commit/512c6891b9268a5d439e4dc52623308473bad3dc))

## [1.1.0](https://github.com/oevery/rsp/compare/v1.0.3...v1.1.0) (2026-05-24)

### Features

* **cli,rules:** add spec and rules workflow commands ([580c055](https://github.com/oevery/rsp/commit/580c055eb59471c6b828448a3a1cf21b0aab01a7))
* **cli,test:** validate feature name and require init ([c2240db](https://github.com/oevery/rsp/commit/c2240db2d174e6a3a8187fecfa06fa82b8cae090))
* **deps,cli,test:** add focus & reverse options ([97b4881](https://github.com/oevery/rsp/commit/97b4881d54310cf2684de5ed31a581bf523ec3c5))
* **doctor,test:** validate config.yaml semantics ([3bc14a1](https://github.com/oevery/rsp/commit/3bc14a1c6b0f4c39bd5c5d8e986bb22915a6b788))
* **doctor:** require date-first archive names ([dd637c7](https://github.com/oevery/rsp/commit/dd637c7a921916697edea84baf5e2ad19a8c7484))
* **status,cli,test:** add status filters ([c0eac88](https://github.com/oevery/rsp/commit/c0eac884c024cbde90382e7149a218a217127257))

### Bug Fixes

* **cli,test:** add repair hints to doctor output ([84ca9fd](https://github.com/oevery/rsp/commit/84ca9fd25a53baae04b32ef6ed793a16e657338b))
* **cli,test:** prevent closing features with deps ([0873403](https://github.com/oevery/rsp/commit/0873403d690844cc9829dae9ff4678f53ebfbf3b))
* **cli,test:** stale must be non-negative integer ([5075dab](https://github.com/oevery/rsp/commit/5075dab622280b2d0483068914f7be122bfb75a9))
* **cli,test:** validate stale and deps flag usage ([575c91f](https://github.com/oevery/rsp/commit/575c91f3f6b05aef69febed94dcdf5363df9eb6f))
* **commands,test:** block add before rsp init ([533fdb1](https://github.com/oevery/rsp/commit/533fdb176b2f982429653f11ea9d0f93889deab3))
* **commands,test:** remove empty parent dirs ([908a1f2](https://github.com/oevery/rsp/commit/908a1f27bae49dc869b070fe000434b94538f496))
* **commands,test:** return 0 when no feature files ([b37cd4c](https://github.com/oevery/rsp/commit/b37cd4c0bb057b33f0d684ba951108bfb0274850))
* **core,test:** accept CRLF frontmatter ([fc7d1c1](https://github.com/oevery/rsp/commit/fc7d1c11e6c1c607dc095656518e755c7978eeae))
* correct bin path in package.json ([a6647fe](https://github.com/oevery/rsp/commit/a6647fe9b84ec9086d4bd7b592449b8852fc5225))
* **doctor,test:** report invalid archive filenames ([7a7a21f](https://github.com/oevery/rsp/commit/7a7a21fda7cdd399c6289d31d74cdbcef713e9f5))

## [1.0.3](https://github.com/oevery/rsp/compare/v1.0.2...v1.0.3) (2026-05-23)

## [1.0.2](https://github.com/oevery/rsp/compare/v1.0.1...v1.0.2) (2026-05-23)

## [1.0.1](https://github.com/oevery/rsp/compare/v1.0.0...v1.0.1) (2026-05-23)

## [1.0.0](https://github.com/oevery/rsp/compare/9e2ad6645131d95cf0b086dc7c1b47057edde75e...v1.0.0) (2026-05-22)

### Features

* add RSP workflow commands, rules, and skills ([9e2ad66](https://github.com/oevery/rsp/commit/9e2ad6645131d95cf0b086dc7c1b47057edde75e))
* TypeScript CLI and RSP workflow v1.0.0 ([a0cc39f](https://github.com/oevery/rsp/commit/a0cc39f58fb29b567c8f52691a42f7e58789c042))
