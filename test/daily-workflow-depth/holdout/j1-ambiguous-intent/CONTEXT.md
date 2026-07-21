# Course runtime context

- `CourseSession` owns the currently running course session.
- `ActivitySession` owns the lifecycle of one activity inside a course session.
- A course transition replaces the current `ActivitySession`; it does not replace the `CourseSession`.
- The transition API is currently called by both the course coordinator and individual activity adapters.
