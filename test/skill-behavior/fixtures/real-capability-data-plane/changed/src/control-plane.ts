export interface UploadIntent {
  url: string
  headers: Record<string, string>
  workspaceId: string
  completionToken: string
  auditContext: { operation: string }
}

export interface UploadControlPlane {
  prepareUpload(input: { objectName: string }): Promise<UploadIntent>
  completeUpload(input: { completionToken: string }): Promise<void>
}
