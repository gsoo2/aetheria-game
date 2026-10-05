export const ANIMAL_ATLASES=['/art/animal-motion-a-v15.webp','/art/animal-motion-b-v15.webp'] as const;
export const ANIMAL_SKINS=[
 {id:0,name:'별빛 토끼',atlas:0,row:0,price:0,currency:'gm',gmOnly:true},
 {id:1,name:'아기 고양이',atlas:0,row:1,price:800,currency:'gold',gmOnly:false},
 {id:2,name:'꼬마 펭귄',atlas:0,row:2,price:0,currency:'gm',gmOnly:true},
 {id:3,name:'숲속 여우',atlas:0,row:3,price:240,currency:'cash',gmOnly:false},
 {id:4,name:'말랑 판다',atlas:1,row:0,price:260,currency:'cash',gmOnly:false},
 {id:5,name:'햇살 병아리',atlas:1,row:1,price:500,currency:'gold',gmOnly:false},
 {id:6,name:'꼬리 너구리',atlas:1,row:2,price:280,currency:'cash',gmOnly:false},
 {id:7,name:'포근 수달',atlas:1,row:3,price:300,currency:'cash',gmOnly:false},
 {id:8,name:'GM 아기 고양이',atlas:0,row:1,price:0,currency:'gm',gmOnly:true}
] as const;
export function animalFrame({dead,deathAge,attackAge,moving,time}:{dead:boolean;deathAge:number;attackAge:number;moving:boolean;time:number}){
 if(dead)return 6+Math.min(1,Math.max(0,Math.floor(deathAge/220)));
 if(attackAge>=0&&attackAge<520)return attackAge<160?4:5;
 return moving?Math.floor(time/125)%4:0;
}
