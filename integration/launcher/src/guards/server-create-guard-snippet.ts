/**
 * Before createLocalServer in launcher, call:
 *
 *   const gate = await window.desktopApi.accountCanCreateServer?.();
 *   if (gate && !gate.allowed) { show modal; return; }
 */
