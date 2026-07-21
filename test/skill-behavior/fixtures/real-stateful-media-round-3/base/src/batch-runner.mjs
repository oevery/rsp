export class BatchRunner {
  constructor(workflow) {
    this.workflow = workflow
  }

  run(segments) {
    const controller = new AbortController()
    const result = Promise.all(segments.map(segment => this.workflow.generate(segment, controller.signal)))
    return { cancel: () => controller.abort(), result }
  }
}
