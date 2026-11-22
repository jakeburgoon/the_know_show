// Host and contestant tokens are independent. Switching views never discards either one.
export type DeviceTab='player'|'host'|'tv';
export type DeviceCredentials={hostToken:string;playerToken:string};
export function actorToken(tab:DeviceTab,credentials:DeviceCredentials):string{
  return tab==='host'?credentials.hostToken:tab==='player'?credentials.playerToken:'';
}
