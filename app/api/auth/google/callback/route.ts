import {finishGoogleLogin} from '../../../../../server/google-auth';
export const dynamic='force-dynamic';
export async function GET(request:Request){return finishGoogleLogin(request);}
