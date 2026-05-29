/**
 * Merge into electron/preload/index.ts api object:
 *
 *   accountGetState: () => ipcRenderer.invoke("account:getState"),
 *   accountLink: (payload: { code: string; deviceName?: string }) =>
 *     ipcRenderer.invoke("account:link", payload),
 *   accountLogout: () => ipcRenderer.invoke("account:logout"),
 *   accountRedeemKey: (code: string) => ipcRenderer.invoke("account:redeemKey", { code }),
 *   accountCanCreateServer: () => ipcRenderer.invoke("account:canCreateServer"),
 */
