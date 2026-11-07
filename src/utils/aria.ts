/**
 * ARIA relationship-id helpers.
 *
 * Deterministic, prefix-based ids keep `aria-controls` / `aria-labelledby`
 * pairs in sync without threading refs or random ids through the tree.
 */

/** Id of the tab button that controls the given panel. */
export const tabId = (idBase: string, id: string): string => `${idBase}-tab-${id}`;

/** Id of the panel controlled by the given tab. */
export const panelId = (idBase: string, id: string): string => `${idBase}-panel-${id}`;
