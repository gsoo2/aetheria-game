import {ZONES} from './content';
import type {Player} from './types';
export const beginnerProtected=(p:Player)=>p.level<=20&&!(p.promotionTier||0)&&!ZONES[p.zone]?.raid;
