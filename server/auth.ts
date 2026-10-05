import {digest} from './auth-crypto';
import {cookie,readLoginSession,type LoginSession} from './google-auth';
export type Identity={token:string;id:string;provider?:'guest'|'google';profile?:Pick<LoginSession,'name'|'email'>};
export async function guestIdentity(request:Request):Promise<Identity|null>{
 const session=cookie(request,'__Host-aetheria_session');
 if(session){const record=await readLoginSession(session);return record?{token:session,id:record.account_id,provider:'google',profile:{name:record.name,email:record.email}}:null;}
 const token=request.headers.get('cookie')?.match(/(?:^|;\s*)aetheria_guest=([a-f0-9-]{36})(?:;|$)/)?.[1];
 return token?{token,id:await digest(token),provider:'guest'}:null;
}
export async function identityStillValid(auth:Identity){return auth.provider!=='google'||!!await readLoginSession(auth.token);}
export {digest} from './auth-crypto';
