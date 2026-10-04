export type VoiceAction='attack'|'hurt'|'heal'|'dodge'|'level';
export function voiceClip(classId:number,action:VoiceAction,skill=0,variant=0){const suffix=1+Math.abs(variant)%3;if(action==='hurt')return `damaged${suffix}`;if(action==='heal'||action==='level')return `healed${suffix}`;if(action==='dodge')return `jump${suffix}`;if(classId===2)return ['attack'+suffix,'fire','freeze','hellstorm','aqua','blizzard','cure','corruption','burn','ice','tornado','hellstorm'][skill]||'attack1';if(classId===1&&[3,5,7,9,11].includes(skill))return 'wind';if(classId===0&&[2,6,8,10].includes(skill))return 'cyclone';return `attack${suffix}`;}

export function voicePath(classId:number,action:VoiceAction,skill=0,variant=0){
 if(classId!==0)return `/voices/type-${classId+1}/${voiceClip(classId,action,skill,variant)}.mp3`;
 const v=Math.abs(Math.floor(variant));const name=action==='hurt'?'hurt'+v%10:action==='dodge'?'jump'+v%2:action==='level'?'victory'+v%2:action==='heal'?'yes'+v%2:skill===0?'attack'+v%9:'attackbig'+v%6;
 return '/voices/male/'+name+'.mp3';
}
