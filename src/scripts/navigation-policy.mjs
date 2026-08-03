export const NAVIGATION_CHILD_LIMIT = 5;

export function navigationChildren(children) {
  return { visible: children.slice(0, NAVIGATION_CHILD_LIMIT), hasMore: children.length > NAVIGATION_CHILD_LIMIT };
}

export function clickAction({ hasChildren, expanded }) {
  return hasChildren && !expanded ? 'expand' : 'open';
}

export function isWidescreen(viewportWidth, viewportHeight) {
  return viewportWidth / viewportHeight >= 16 / 9;
}

export function shouldDismissSidebar({ wide, clickedInsideSidebar, clickedToggle }) {
  return !wide && !clickedInsideSidebar && !clickedToggle;
}
