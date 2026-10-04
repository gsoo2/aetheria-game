import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateGoogleToken,base64url,type SigningKey} from '../server/google-token';
import {linkGoogleAccount} from '../shared/google-accounts';
import {createWorld,newPlayer} from '../server/engine';
import {accountFor,ownedPlayer} from '../shared/accounts';
const now=1800000000000;
async function signedClaims(overrides:Record<string,unknown>={}){
 const pair=await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
 const header=base64url(new TextEncoder().encode(JSON.stringify({alg:'RS256',kid:'test-key'})));
 const payload=base64url(new TextEncoder().encode(JSON.stringify({iss:'https://accounts.google.com',aud:'client-id',exp:now/1000+3600,iat:now/1000,nonce:'nonce',sub:'google-subject',email:'player@example.test',email_verified:true,...overrides})));
 const input=header+'.'+payload,signature=base64url(new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5',pair.privateKey,new TextEncoder().encode(input))));
 const jwk=await crypto.subtle.exportKey('jwk',pair.publicKey) as SigningKey;jwk.kid='test-key';return {token:input+'.'+signature,keys:[jwk]};
}
test('Google identity is accepted only after a valid RSA signature and claim checks',async()=>{const t=await signedClaims();const c=await validateGoogleToken(t.token,'client-id','nonce',t.keys,now);assert.equal(c.sub,'google-subject');const parts=t.token.split('.');parts[2]=(parts[2][0]==='A'?'B':'A')+parts[2].slice(1);await assert.rejects(validateGoogleToken(parts.join('.'),'client-id','nonce',t.keys,now),/signature/);});
test('reject wrong audience, issuer, nonce, expiry, unverified email and future tokens',async()=>{for(const overrides of [{aud:'other-client'},{iss:'https://evil.test'},{nonce:'other-nonce'},{exp:now/1000-1},{email_verified:false},{iat:now/1000+1000}]){const t=await signedClaims(overrides);await assert.rejects(validateGoogleToken(t.token,'client-id','nonce',t.keys,now));}});
test('guest migration preserves progress, equipment, purchased slots and repeats safely',()=>{const w=createWorld(now),p=newPlayer('guest','기존수호자',0,now);p.level=12;p.gold=777;p.done=[0,1];p.inventory=[0,3,14];w.players.guest=p;accountFor(w,'guest').slots=6;linkGoogleAccount(w,'google-id','guest',{name:'수호자',email:'player@example.test'});assert.equal(ownedPlayer(w,'google-id')?.id,p.id);assert.equal(p.level,12);assert.equal(p.gold,777);assert.deepEqual(p.done,[0,1]);assert.equal(accountFor(w,'google-id').slots,6);assert.equal(ownedPlayer(w,'guest','guest'),undefined);linkGoogleAccount(w,'google-id','guest',{name:'수호자',email:'new@example.test'});assert.deepEqual(accountFor(w,'google-id').characters,['guest']);assert.equal(accountFor(w,'google-id').google?.email,'new@example.test');});
test('merging two full rosters preserves every character and never merges a different Google account',()=>{const w=createWorld(now);for(const owner of ['guest','google-id']){const a=accountFor(w,owner);for(let i=0;i<8;i++){const id=owner+i;w.players[id]=newPlayer(id,'수호자'+i,0,now);a.characters.push(id);}a.slots=8;}linkGoogleAccount(w,'google-id','guest',{name:'수호자',email:'p@example.test'});assert.equal(accountFor(w,'google-id').characters.length,16);assert.equal(accountFor(w,'google-id').slots,16);linkGoogleAccount(w,'second-google','google-id',{name:'다른계정',email:'other@example.test'});assert.equal(accountFor(w,'second-google').characters.length,0);assert.equal(accountFor(w,'google-id').characters.length,16);});
