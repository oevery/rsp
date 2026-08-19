export class SessionState {
  constructor() {
    this.workspaceId = null
  }

  changeWorkspace(workspaceId) {
    this.workspaceId = workspaceId
  }
}
