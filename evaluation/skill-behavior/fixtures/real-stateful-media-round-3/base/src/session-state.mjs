export class SessionState {
  constructor(drafts) {
    this.drafts = drafts
    this.workspaceId = null
  }

  changeWorkspace(workspaceId) {
    this.workspaceId = workspaceId
  }

  setDraft(draft) {
    this.drafts.set(draft)
  }

  currentDraft() {
    return this.drafts.get()
  }
}
