# Read architecture

Projects can curate `.rsp/architecture.json` to describe architecture independently
of diagram layout. RSP does not discover code or generate this file. An absent model
is explicitly reported and other commands keep working.

## Define the model

When adding this model, add one navigation link in the root `CONTEXT.md`, reusing
an existing entry. If that file is absent, create a minimal entry as part of the
architecture setup. For example:

```md
Architecture navigation: [`.rsp/architecture.json`](.rsp/architecture.json), with module relationships and related documents.
```

Installation alone needs no link when there is no model; ordinary installation
and updates do not rewrite project context for this purpose. Keep the model's
descriptions brief and current, with detailed contracts in the linked documents.
Planned architecture belongs in the Change's Design until implemented.

```json
{
  "schemaVersion": 1,
  "nodes": [
    { "id": "app", "title": "Application", "description": "Owns the application contract" },
    { "id": "api", "parent": "app", "title": "API", "description": "Accepts requests" },
    { "id": "store", "title": "Store", "description": "Persists records" }
  ],
  "relations": [
    { "id": "writes", "source": "api", "target": "store", "type": "write", "description": "Writes records" }
  ],
  "views": [
    { "id": "application", "title": "Application boundary", "node": "app", "include": ["api", "store"] }
  ],
  "bindings": [
    { "node": "app", "file": ".rsp/specs/application.md", "scope": "subtree" },
    { "node": "api", "file": ".rsp/specs/application.md", "headings": ["Requests"] }
  ]
}
```

Node, relation and view IDs are stable within their collections. Node IDs do not
encode hierarchy: `parent` supplies placement. Each relation has an ID, source,
target, type and description, plus an optional display `label` (defaults to `type`).
Each view has an owning `node` and either an explicit `include` list or a scenario.
Duplicate IDs, missing references, cycles and unsupported schema
versions fail explicitly. Titles and descriptions are required non-empty strings.

A binding references a project-relative Markdown file. Omit `headings` for the whole
file; otherwise give a heading hierarchy, for example `["API", "Requests"]`.
Matching uses Markdown headings, not stored line ranges. Missing and ambiguous
headings produce diagnostics. Scope defaults to `node`; only `subtree` inherits.
Inherited references identify their origin. Several nodes can share one Spec, and
nodes can have no document. A chapter reference describes relevance; it does not
make the rest of the document inapplicable. Specs retain behavioral authority,
Decisions rationale, and CONTEXT vocabulary and navigation.

## Separate structure from scenarios

A structural view can filter `relationTypes` and/or exact `relationIds`. When both
are present they intersect; an empty list shows no relations. `boundary: "exclude"`
keeps only relations between included nodes. The default `"include"` adds external
endpoints only after filtering, without expanding their other relationships.
Existing views keep their previous behavior.

For example, this entry in `views` shows only the write relationship from the model above:

```json
{
  "id": "storage",
  "title": "Storage access",
  "node": "app",
  "include": ["api"],
  "relationTypes": ["write"],
  "boundary": "include"
}
```

For runtime behavior, add a scenario view referencing the same modules:

```json
{
  "id": "save",
  "title": "Save a record",
  "node": "app",
  "scenario": {
    "participants": [
      { "id": "caller", "node": "api", "title": "Request handler" },
      { "id": "database", "node": "store" }
    ],
    "steps": [
      { "id": "write", "source": "caller", "target": "database", "type": "call", "label": "Write record" },
      { "id": "saved", "source": "database", "target": "caller", "type": "return", "label": "Record ID", "replyTo": "write" }
    ]
  }
}
```

Scenario views omit `include` and structural filters. Participants have IDs local
to the view and reference existing module nodes; two roles may reference the same
module. Keep module responsibility and document bindings on the original node.
Steps use `call`, `return` or `event`, ordered by the array. Optional `description`
supplies details; a return's optional `replyTo` must identify an earlier call with
reversed endpoints. Repeated calls have distinct step IDs. This first scenario
format describes representative linear paths; it does not infer loops, branches,
concurrency or timestamps.

Open the scenario for a **Sequence** diagram or switch to **Collaboration**.
Select a step to highlight its message, inspect the participants and follow
**Reply to**. Selecting a participant opens the original module and its documents.
Calls use solid lines, returns dashed lines and events dotted lines, with a legend.
Module cards list related structural views and scenarios.

For AI reading, first list views with `rsp architecture --json`, then query
`rsp architecture --view save --json --compact`. The result contains participant
modules, bindings and ordered steps, without unrelated structural edges or document
bodies. Returned view metadata has a derived `include` list; omit it when authoring
a scenario. Use stable IDs for updates and read bound documents only as needed.
Do not copy layout aliases or duplicate module nodes to isolate a scenario.

## Query and open

```sh
rsp architecture
rsp architecture --node api --json
rsp architecture --view application --json --compact
rsp doctor
rsp view
rsp view --no-open
rsp view status
rsp view stop
```

`architecture` returns structure, view metadata, binding reasons, provenance and
diagnostics without document bodies. Node selection includes descendants. View
selection includes its explicit nodes. Incident relations add marked external
endpoints without expanding their neighbors. Selectors are mutually exclusive.
Text output retains parents, relation IDs, view owners and direct or inherited binding
scope, just as JSON does. The same named Web view uses this exact selection and
marks boundary nodes; a parent container does not substitute for a relation endpoint.
The full query has no count truncation. Files larger than 16 MiB fail explicitly
rather than returning truncated content. Architecture and ordinary commands do
not start the service or import the layout runtime.

`doctor` also checks the complete model and its document/chapter bindings.
An absent model is non-blocking; an invalid model or unresolved binding is an
issue and makes the command fail. Use `doctor --json` for structured results.
Passing these checks does not establish semantic agreement with implementation.

`view` opens a prebuilt shared frontend; `--no-open` prints its URL. Open each project
or Git worktree from its own directory using its selected RSP invocation. The
workspace menu contains only explicitly opened projects from this runtime. Each has
independent graph, documents, revisions and navigation.

Registered Git workspaces are grouped by repository, with branch or detached
commit, main or linked worktree status, and paths. Missing Git metadata falls back to
directory names. This does not discover or register other worktrees.

## Navigate the graph

The stable left sidebar contains workspace selection, object search and all declared
views. Opening selects the first declared view; without views, it opens the complete
registered structure. Choose another view in the sidebar; the current view is
highlighted and navigation stays in place. There is no required homepage or new
default-view setting. Direct links to a view or relationship focus open that context.
View membership is a reading choice, not
structural ownership: shared packages can appear in several views with one identity.
No universal product or platform hierarchy is required.
Search accepts Up/Down and Home/End to choose a result, then Enter to inspect it
without navigating. Escape clears the current search.
The compact project selector sits at the top of the sidebar. Long workspace names
truncate without moving the arrow; focus or hover to read the full name.

The **Language** control switches the RSP interface between **English** and
**简体中文**. On first use, a Chinese primary browser language selects `zh-CN`;
other browser languages select English. The browser remembers a manual choice
for the current local viewer origin, not in project or global configuration.
Authored object, view and workspace names, responsibilities, relationship types,
Spec content, paths and code stay unchanged. Boundary and reference markers and host
statuses translate; technical details retain their original text in expandable
sections.

LikeC4 1.60.0 has no public translation option. Its native **Browse … relationships**,
**Relationships of**, **Scope**, **Global**, **Current view**, relationship-URL
controls and diagram keyboard descriptions remain English. RSP does not patch or
remove these capabilities; the language setting covers the RSP host, not every
native diagram string.

Click an object for a compact information card with its responsibility, structural
parent and associated views and documents, without changing the view or its pan/zoom.
It does not reserve a detail column. Objects without documents have no empty
Documents section; expand **Relationships** for the exact incident list.
**View inside** explicitly opens an owned
view; several views offer a choice and objects with none have no internal-view action.
**Focus relationships** opens only the object's direct incident relationships and
their real endpoints. It does not expand descendants like CLI `--node`. Structural
parents remain available in details, but the focus diagram is flat: it does not add
unselected ancestor containers. Local structure views keep their real hierarchy.
Authored relation types, including lifecycle and retry, remain explicit; arrows do not imply
execution order. External endpoints are textually labeled boundaries.
When that object is already focused, its card omits the repeated focus action.

Click an edge or a relationship row for exact source, target, type and description.
No relations are automatically aggregated. Any relation absent from the drawing has
a **relationship not drawn** indication and reachable exact details. Native
relationship browsing and pan/zoom remain available. The compact horizontal diagram
uses authored display labels, falling back to relation types; complete descriptions remain in the card.
**View selection** shows the current relation filters and boundary policy.
The initial view fits the diagram. **Navigation** and **Scenario steps** open tabs in the same
sidebar; use **Collapse sidebar** to close it. Switching tabs keeps search, scroll and the selected
step, without moving or resizing the canvas. Your explicit desktop open choice lasts for the browser
session; scenarios start with the sidebar collapsed unless you have chosen to keep it open.
Click the view title to switch views; the sidebar icon has an **Open navigation** tooltip.
The scenario toolbar provides sequence/collaboration switching and previous/next steps.
Selecting a step brings its message into view, clear of the details card; on narrow screens it also
closes the shared drawer. Opening or closing the sidebar preserves zoom and reading position,
with only the necessary pan if the selected message becomes obscured. Resizing the browser preserves
the graph reading center and zoom; **Fit** restores the overview. Presentation preferences do not change
the architecture file. Controls and floating surfaces use brief transitions and respect reduced-motion
preferences; the desktop sidebar and canvas do not animate their size or position.

In structural views, LikeC4 cannot directly draw a self-relation or a relation
between an ancestor and descendant. Expanded containers can also suppress their
own relations. The adapter uses explicitly labeled
relationship-reference nodes for those targets and for participating container
endpoints, while keeping ordinary leaf endpoints and the visible hierarchy intact.
Selecting that reference opens the original node's bindings and view choices; it is
not an additional architecture identity. Details and native relationship browsing
are available on the reference; a reference edge is not a graphical self-loop.
Separate relations are not merged or discarded. The collapsed **Source & diagnostics**
area exposes source identity, reference explanation and model diagnostics.

## Read Specs

Click a document link to open its complete Markdown in a separate right reading
drawer, positioned at the bound chapter when specified. The information card hides
while reading, rather than competing with the document. Use **On this page** for
chapter navigation. Drag the drawer's left divider to resize it; when focused, the
divider also accepts Left/Right arrow keys. **Expand reading** uses the full canvas
width without hiding the sidebar. **Return to graph** closes the drawer and restores
the original information card. Opening, resizing, expanding and closing the drawer
do not relayout, auto-fit or change the graph's pan/zoom.
Long document paths truncate before these actions; focus or hover on the path to
read it in full.
Desktop reading is non-modal: the uncovered canvas and its pan/zoom controls remain
usable, with no backdrop or focus trap. Escape closes the topmost layer; closing
the reader returns keyboard focus to the selected object when it is still visible.
The original selection stays in place while reading; close the reader before
selecting another object or opening native relationship browsing.

Spec prose, code and tables use 14px at the default browser text size, with compact
spacing and a bounded prose width. Long code and tables scroll horizontally rather
than shrinking. Table headers and declared column alignment are preserved.
Switching between desktop and narrow layouts retains the current reading position,
whether the document was opened at a chapter or as a whole file.

Fenced `mermaid` blocks render locally as inert images. **Diagram source** retains
the original text; malformed diagrams show an error and the source. No diagram
scripts or clickable SVG links are activated. A safe relative link to a supported
source/configuration file offers **Copy source path**, including a `#L12` or
`#L12-L20` locator when supplied. This is a locator, not a file-reading grant;
source files do not become available through the document endpoint.

## Narrow screens and state recovery

On narrow screens, **Navigation** opens workspace selection, search and views; documents
have a separate full-width reading area. The UI does not squeeze three columns.
These narrow-screen drawers trap keyboard focus until closed. Escape first clears
an open search, then closes its drawer; closing navigation returns focus to
**Navigation**. Selecting a search result moves focus to its information card.
Deep links, refresh and back restore valid views, focus and selection.
In-session returns also restore pan/zoom
for the same workspace and graph revision. Removed views or focused objects show
an explicit full-structure fallback; removed selections show an unavailable notice.
No viewport or layout history persists across browser sessions.

## Content access and safety

Bound Markdown documents are reading entry points. Their relative Markdown links
and PNG/JPEG/GIF/WebP images may reach sibling directories inside the project, for
example `docs/specs/api.md` can reference `../images/a.png`. Linked Markdown can
link onward; cycles terminate. Files not reachable from a binding are not served,
even if another file in their directory is readable. Removing a link revokes that
access on the next read. Authorization inspects at most 16 MiB of Markdown per
request and fails explicitly if the reachable search exceeds that limit.

Symlinks, traversal, runtime directories, hidden paths and paths named for secrets,
credentials or private content are rejected. Authored `.rsp/specs/` documents and
explicitly bound `.rsp/` document directories are the hidden-path exception.
Rejected links are labeled unavailable. Local document links must target Markdown. Raw HTML,
MDX and project scripts are not executed; external images do not load. Ordinary
HTTP/HTTPS and email links remain available. HTTP/HTTPS links open a new tab for
both inline and reference-style Markdown; local document links use the reader.
Do not bind private documents that you do not want the local reading session to
access. The URL grants local read access
to the runtime's registered workspaces; keep it private.

## Refresh and service lifecycle

Active pages poll sources every five seconds and on reactivation. Document-only
edits reuse graph layout; changed documents retain a valid reading position.
Errors mark displayed content stale, and repaired sources can load again. The
viewer reads dirty working files, configuration and architecture from source; Git
HEAD alone is not the revision identity. Polling uses no filesystem watchers.

The detached service listens only on `127.0.0.1` with an automatically selected
port. Discovery uses owner-only records under `~/.cache/rsp/viewer/`; records contain
runtime identity and local credentials, never models or document bodies. Concurrent
starts reuse one compatible service. Package version, real installation path and
build identity select the runtime; different identities get isolated services.
A source rebuild therefore uses a new service. No runtime substitution, upgrade,
separate install, project website build, `.c4` generation or runtime download occurs.
The package includes viewer dependencies and prebuilt assets, increasing its size.

A valid page heartbeat every 20 seconds keeps the service alive, including while
backgrounded. After 30 continuous minutes without reading heartbeats the service
exits. Inactive workspaces release models and layouts after five minutes and reconstruct
on reopening. A long browser suspension may disconnect; reopen with `rsp view`.
`view status` reports only this runtime; `view stop` disconnects all its workspaces
and releases its port. Closing the invoking terminal does not stop the service.
