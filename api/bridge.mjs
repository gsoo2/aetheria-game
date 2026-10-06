import {start} from '../hosting/gateway.mjs';

// Keep browser cookies and WebSocket traffic on the game's public origin.
// The authoritative game and its existing world stay on the configured backend.
const {server}=start(0,'127.0.0.1',{
 origin:process.env.GAME_BACKEND_ORIGIN||'https://aetheria-rpg.onrender.com',
 listen:false,
});
function originalPath(req){
 const url=new URL(req.url,'http://localhost');
 const route=url.searchParams.get('route');
 if(route!==null){
  url.searchParams.delete('route');
  req.url='/api/'+route.replace(/^\/+/, '')+(url.search?'?'+url.searchParams.toString():'');
 }
}
server.prependListener('request',originalPath);
server.prependListener('upgrade',originalPath);
export default server;
