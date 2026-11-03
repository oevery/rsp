# Read architecture

Projects can curate `.rsp/architecture.json` to describe architecture independently
of diagram layout. RSP does not discover code or generate this file. An absent model
is explicitly reported and other commands keep working.

## Define the model

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
target, type and description. Each view has an owning `node` and an explicit
`include` list. Duplicate IDs, missing references, cycles and unsupported schema
versions fail explicitly. Titles and descriptions are required non-empty strings.

A binding references a project-relative Markdown file. Omit `headings` for the whole
file; otherwise give a heading hierarchy, for example `["API", "Requests"]`.
Matching uses Markdown headings, not stored line ranges. Missing and ambiguous
headings produce diagnostics. Scope defaults to `node`; only `subtree` inherits.
Inherited references identify their origin. Several nodes can share one Spec, and
nodes can have no document. A chapter reference describes relevance; it does not
make the rest of the document inapplicable. Specs retain behavioral authority,
Decisions rationale, and CONTEXT vocabulary and navigation.

## Query and open

```sh
rsp architecture
rsp architecture --node api --json
rsp architecture --view application --json --compact
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
uses short authored relation-type labels; complete descriptions remain in the card.

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
