import {TRANSLATIONS} from './translation-data';
export type Language='ko'|'ja'|'en';
export const LANGUAGE_STORAGE_KEY='aetheria-language';
let current:Language='ko';
const listeners=new Set<()=>void>();
export const getLanguage=()=>current;
export const getServerLanguage=():Language=>'ko';
export function subscribeLanguage(listener:()=>void){listeners.add(listener);return()=>{listeners.delete(listener);};}
export function setLanguage(language:Language){if(!['ko','ja','en'].includes(language))return;current=language;if(typeof document!=='undefined'){document.documentElement.lang=language;document.title=language==='en'?'Aetheria — Guardians of Starlight':language==='ja'?'エテリア — 星光の守護者':'에테리아 — 별빛의 수호자';try{localStorage.setItem(LANGUAGE_STORAGE_KEY,language);}catch{/* Storage may be disabled. */}}listeners.forEach(listener=>listener());}
export function restoreLanguage(){try{const saved=localStorage.getItem(LANGUAGE_STORAGE_KEY);if(saved==='ko'||saved==='ja'||saved==='en')setLanguage(saved);}catch{/* Keep Korean when storage is unavailable. */}}
const escape=(s:string)=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const patterns=Object.entries(TRANSLATIONS).filter(([key])=>/\{\d+\}/.test(key)).sort(([a],[b])=>b.replace(/\{\d+\}/g,'').length-a.replace(/\{\d+\}/g,'').length).map(([key,values])=>{
 const indices:number[]=[];let source='',offset=0;for(const match of key.matchAll(/\{(\d+)\}/g)){const before=key.slice(0,match.index),after=key.slice(match.index!+match[0].length);const numeric=/^(마리|개|초|차|명| 골드| 경험치)/.test(after)||/(LV\. |레벨 |입장 레벨 )$/.test(before);source+=escape(key.slice(offset,match.index))+(numeric?'([\\d,.]+)':'(.*?)');indices.push(Number(match[1]));offset=match.index!+match[0].length;}source+=escape(key.slice(offset));return {regex:new RegExp('^'+source+'$','s'),indices,values};
});
const fragments=Object.keys(TRANSLATIONS).filter(key=>!key.includes('{')&&key.trim().length>=2).sort((a,b)=>b.length-a.length);
const fragmentRegex=new RegExp(fragments.map(escape).join('|'),'g');
const cache:Record<'en'|'ja',Map<string,string>>={en:new Map(),ja:new Map()};
export function translateText(text:string,language:Language=current):string{
 if(language==='ko'||!/[가-힣]/.test(text))return text;
 const index=language==='en'?0:1,known=cache[language].get(text);if(known!==undefined)return known;
 const exact=TRANSLATIONS[text];let result=exact?exact[index]:'';
 if(!exact){const trimmed=text.trim(),entry=TRANSLATIONS[trimmed];if(entry)result=text.replace(trimmed,entry[index]);else {for(const pattern of patterns){const match=pattern.regex.exec(text);if(!match)continue;const args:Record<number,string>={};pattern.indices.forEach((key,i)=>{args[key]=translateText(match[i+1],language);});result=pattern.values[index].replace(/\{(\d+)\}/g,(_,key)=>args[Number(key)]??'');break;}if(!result)result=text.replace(fragmentRegex,key=>TRANSLATIONS[key][index]);}}
 if(cache[language].size>4000)cache[language].clear();cache[language].set(text,result);return result;
}
// JSX values retain their types; only authored strings are translated.
export function tr<T>(value:T,language:Language=current):T{return (typeof value==='string'?translateText(value,language):value) as T;}
