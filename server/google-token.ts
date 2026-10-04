export type GoogleClaims={iss:string;aud:string;azp?:string;exp:number;iat:number;nonce:string;sub:string;email:string;email_verified:boolean;name?:string};
export type SigningKey=JsonWebKey&{kid?:string};
export function base64url(bytes:Uint8Array){return btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
function decode(value:string){if(!/^[A-Za-z0-9_-]+$/.test(value))throw new Error('Invalid token encoding');return Uint8Array.from(atob(value.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));}
export async function validateGoogleToken(token:string,clientId:string,nonce:string,keys:SigningKey[],now=Date.now()):Promise<GoogleClaims>{
 if(token.length>16384)throw new Error('Invalid token');const parts=token.split('.');if(parts.length!==3)throw new Error('Invalid token');
 const header=JSON.parse(new TextDecoder().decode(decode(parts[0])));if(header.alg!=='RS256'||typeof header.kid!=='string')throw new Error('Invalid signing algorithm');
 const jwk=keys.find(k=>k.kid===header.kid&&k.kty==='RSA');if(!jwk)throw new Error('Unknown signing key');
 const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
 if(!await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,decode(parts[2]),new TextEncoder().encode(parts[0]+'.'+parts[1])))throw new Error('Invalid signature');
 const c=JSON.parse(new TextDecoder().decode(decode(parts[1]))) as GoogleClaims;
 if(!['https://accounts.google.com','accounts.google.com'].includes(c.iss)||c.aud!==clientId||c.azp!==undefined&&c.azp!==clientId)throw new Error('Invalid issuer or audience');
 if(!Number.isFinite(c.exp)||c.exp<=now/1000||!Number.isFinite(c.iat)||c.iat>now/1000+60||c.nonce!==nonce)throw new Error('Expired or replayed token');
 if(typeof c.sub!=='string'||!c.sub||c.sub.length>255||typeof c.email!=='string'||c.email_verified!==true)throw new Error('Invalid Google identity');
 return c;
}
