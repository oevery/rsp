export class BatchRunner {
  constructor(workflow) {
    this.workflow = workflow
  }

  run(segments) {
    return Promise.all(segments.map(segment => this.workflow.generate(segment)))
  }
}
