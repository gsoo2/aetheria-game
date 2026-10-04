import {voicePath,type VoiceAction} from '../../shared/voice';
let unlocked=false,last=0,current:HTMLAudioElement|null=null;
const clips=new Map<string,HTMLAudioElement>();
export function unlockVoices(){unlocked=true;}
export function stopVoice(){current?.pause();current=null;}
export function playVoice(classId:number,action:VoiceAction,volume:number,skill=0,variant=0){if(!unlocked||volume<=0)return;const now=Date.now();if(now-last<(action==='hurt'?850:550))return;const path=voicePath(classId,action,skill,variant);let audio=clips.get(path);if(!audio){audio=new Audio(path);audio.preload='auto';clips.set(path,audio);}current?.pause();audio.currentTime=0;audio.volume=Math.max(0,Math.min(1,volume));current=audio;last=now;void audio.play().catch(()=>{});}
