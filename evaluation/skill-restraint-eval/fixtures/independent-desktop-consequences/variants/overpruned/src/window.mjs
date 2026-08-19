export function resizeWindow(windowRef, size) {
  windowRef.resize(size.width, size.height)
  return windowRef
}
