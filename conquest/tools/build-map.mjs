// 세계 지도 데이터 생성기
// 사용법: npm i world-atlas@2.0.2 topojson-client@3.1.0 후
//   node conquest/tools/build-map.mjs <node_modules 경로> > conquest/js/mapdata.js
// Natural Earth(world-atlas 110m) 국가 경계를 0.5° 격자로 래스터화하고
// 큰 나라는 k-means로 여러 영토(프로빈스)로 나눕니다.
import { createRequire } from "node:module";
import path from "node:path";

const nm = process.argv[2] || "node_modules";
const require = createRequire(path.resolve(nm, "x.js"));
const topo = require("world-atlas/countries-110m.json");
const tc = require("topojson-client");

const RES = 0.5, LAT_TOP = 84, LAT_BOT = -57;
const W = Math.round(360 / RES), H = Math.round((LAT_TOP - LAT_BOT) / RES);

const KO = {
  "Fiji":"피지","Tanzania":"탄자니아","W. Sahara":"서사하라","Canada":"캐나다","United States of America":"미국","Kazakhstan":"카자흐스탄","Uzbekistan":"우즈베키스탄","Papua New Guinea":"파푸아뉴기니","Indonesia":"인도네시아","Argentina":"아르헨티나","Chile":"칠레","Dem. Rep. Congo":"콩고민주공화국","Somalia":"소말리아","Kenya":"케냐","Sudan":"수단","Chad":"차드","Haiti":"아이티","Dominican Rep.":"도미니카","Russia":"러시아","Bahamas":"바하마","Falkland Is.":"포클랜드","Norway":"노르웨이","Greenland":"그린란드","Timor-Leste":"동티모르","South Africa":"남아프리카","Lesotho":"레소토","Mexico":"멕시코","Uruguay":"우루과이","Brazil":"브라질","Bolivia":"볼리비아","Peru":"페루","Colombia":"콜롬비아","Panama":"파나마","Costa Rica":"코스타리카","Nicaragua":"니카라과","Honduras":"온두라스","El Salvador":"엘살바도르","Guatemala":"과테말라","Belize":"벨리즈","Venezuela":"베네수엘라","Guyana":"가이아나","Suriname":"수리남","France":"프랑스","Ecuador":"에콰도르","Puerto Rico":"푸에르토리코","Jamaica":"자메이카","Cuba":"쿠바","Zimbabwe":"짐바브웨","Botswana":"보츠와나","Namibia":"나미비아","Senegal":"세네갈","Mali":"말리","Mauritania":"모리타니","Benin":"베냉","Niger":"니제르","Nigeria":"나이지리아","Cameroon":"카메룬","Togo":"토고","Ghana":"가나","Côte d'Ivoire":"코트디부아르","Guinea":"기니","Guinea-Bissau":"기니비사우","Liberia":"라이베리아","Sierra Leone":"시에라리온","Burkina Faso":"부르키나파소","Central African Rep.":"중앙아프리카","Congo":"콩고","Gabon":"가봉","Eq. Guinea":"적도기니","Zambia":"잠비아","Malawi":"말라위","Mozambique":"모잠비크","eSwatini":"에스와티니","Angola":"앙골라","Burundi":"부룬디","Israel":"이스라엘","Lebanon":"레바논","Madagascar":"마다가스카르","Palestine":"팔레스타인","Gambia":"감비아","Tunisia":"튀니지","Algeria":"알제리","Jordan":"요르단","United Arab Emirates":"아랍에미리트","Qatar":"카타르","Kuwait":"쿠웨이트","Iraq":"이라크","Oman":"오만","Vanuatu":"바누아투","Cambodia":"캄보디아","Thailand":"태국","Laos":"라오스","Myanmar":"미얀마","Vietnam":"베트남","North Korea":"북한","South Korea":"한국","Mongolia":"몽골","India":"인도","Bangladesh":"방글라데시","Bhutan":"부탄","Nepal":"네팔","Pakistan":"파키스탄","Afghanistan":"아프가니스탄","Tajikistan":"타지키스탄","Kyrgyzstan":"키르기스스탄","Turkmenistan":"투르크메니스탄","Iran":"이란","Syria":"시리아","Armenia":"아르메니아","Sweden":"스웨덴","Belarus":"벨라루스","Ukraine":"우크라이나","Poland":"폴란드","Austria":"오스트리아","Hungary":"헝가리","Moldova":"몰도바","Romania":"루마니아","Lithuania":"리투아니아","Latvia":"라트비아","Estonia":"에스토니아","Germany":"독일","Bulgaria":"불가리아","Greece":"그리스","Turkey":"튀르키예","Albania":"알바니아","Croatia":"크로아티아","Switzerland":"스위스","Luxembourg":"룩셈부르크","Belgium":"벨기에","Netherlands":"네덜란드","Portugal":"포르투갈","Spain":"스페인","Ireland":"아일랜드","New Caledonia":"뉴칼레도니아","Solomon Is.":"솔로몬 제도","New Zealand":"뉴질랜드","Australia":"오스트레일리아","Sri Lanka":"스리랑카","China":"중국","Taiwan":"타이완","Italy":"이탈리아","Denmark":"덴마크","United Kingdom":"영국","Iceland":"아이슬란드","Azerbaijan":"아제르바이잔","Georgia":"조지아","Philippines":"필리핀","Malaysia":"말레이시아","Brunei":"브루나이","Slovenia":"슬로베니아","Finland":"핀란드","Slovakia":"슬로바키아","Czechia":"체코","Eritrea":"에리트레아","Japan":"일본","Paraguay":"파라과이","Yemen":"예멘","Saudi Arabia":"사우디아라비아","Cyprus":"키프로스","Morocco":"모로코","Egypt":"이집트","Libya":"리비아","Ethiopia":"에티오피아","Djibouti":"지부티","Uganda":"우간다","Rwanda":"르완다","Bosnia and Herz.":"보스니아","Macedonia":"북마케도니아","Serbia":"세르비아","Montenegro":"몬테네그로","Kosovo":"코소보","Trinidad and Tobago":"트리니다드토바고","S. Sudan":"남수단"
};
const MERGE = { "Somaliland": "Somalia", "N. Cyprus": "Cyprus" };
const SKIP = new Set(["Antarctica", "Fr. S. Antarctic Lands"]);

// 큰 나라 지역 이름 앵커 [lat, lon, 이름]
const ANCHORS = {
  "Russia": [[55.7,37.6,"모스크바"],[60,30.3,"상트페테르부르크"],[64.5,40.5,"아르한겔스크"],[67,50,"코미"],[53,48,"볼가"],[44.5,43,"북캅카스"],[57,61,"우랄"],[55,73,"옴스크"],[63,75,"서시베리아"],[70,85,"타이미르"],[56,92,"크라스노야르스크"],[53,104,"이르쿠츠크"],[62,96,"에벤키"],[64,118,"야쿠티아"],[70,130,"레나 삼각주"],[52,120,"자바이칼"],[47,136,"연해주"],[60,150,"마가단"],[56,160,"캄차카"],[54.7,20.5,"칼리닌그라드"],[75,60,"노바야제믈랴"],[66,172,"추코트카"],[67,145,"콜리마"],[52,85,"알타이"],[50,140,"사할린"],[59,113,"비팀"],[68,65,"야말"]],
  "United States of America": [[37,-120,"캘리포니아"],[46,-120,"워싱턴"],[40,-111,"유타"],[33,-111,"애리조나"],[31,-99,"텍사스"],[39,-105,"콜로라도"],[46,-103,"다코타"],[47,-110,"몬태나"],[41,-95,"네브래스카"],[36,-97,"오클라호마"],[44,-89,"위스콘신"],[40,-86,"인디애나"],[33,-88,"미시시피"],[28,-82,"플로리다"],[34,-81,"캐롤라이나"],[38,-78,"버지니아"],[42,-74,"뉴욕"],[44,-70,"뉴잉글랜드"],[64,-150,"알래스카"],[66,-158,"북알래스카"],[60,-140,"남알래스카"],[37,-87,"켄터키"],[44,-117,"아이다호"]],
  "Canada": [[54,-125,"브리티시컬럼비아"],[54,-115,"앨버타"],[54,-106,"서스캐처원"],[54,-97,"매니토바"],[50,-86,"온타리오"],[48,-72,"퀘벡"],[54,-64,"래브라도"],[46,-63,"노바스코샤"],[63,-135,"유콘"],[64,-115,"노스웨스트"],[64,-95,"누나부트"],[73,-100,"북극 제도"],[78,-85,"엘즈미어"],[69,-72,"배핀"],[58,-75,"누나비크"]],
  "China": [[39.9,116.4,"베이징"],[31,121,"상하이"],[23,113,"광둥"],[30,104,"쓰촨"],[34,109,"산시"],[45,126,"동북"],[41,113,"내몽골"],[41,85,"신장"],[45,87,"준가르"],[32,88,"티베트"],[36,97,"칭하이"],[25,102,"윈난"],[38,104,"간쑤"],[28,113,"후난"],[36,118,"산둥"],[47,121,"후룬베이얼"]],
  "Brazil": [[-23,-46,"상파울루"],[-15,-48,"브라질리아"],[-3,-60,"아마존"],[-8,-35,"페르남부쿠"],[-30,-53,"남부"],[-12,-42,"바이아"],[-10,-55,"마투그로수"],[-2,-48,"파라"],[-9,-68,"아크리"],[-20,-54,"판타나우"]],
  "Australia": [[-33.8,151,"뉴사우스웨일스"],[-37.8,145,"빅토리아"],[-20,145,"퀸즐랜드"],[-27,135,"남오스트레일리아"],[-20,133,"노던테리토리"],[-30,120,"서오스트레일리아"],[-20,120,"킴벌리"],[-42,147,"태즈메이니아"]],
  "India": [[28.6,77,"델리"],[19,73,"마하라슈트라"],[13,78,"카르나타카"],[22,88,"벵골"],[26,73,"라자스탄"],[23,80,"마디아프라데시"],[26,92,"아삼"],[10,77,"타밀나두"],[32,76,"펀자브"]],
  "Argentina": [[-34.6,-58.4,"부에노스아이레스"],[-31,-64,"코르도바"],[-26,-65,"투쿠만"],[-40,-68,"파타고니아"],[-50,-70,"산타크루스"],[-33,-68,"멘도사"]],
  "Kazakhstan": [[43,77,"알마티"],[51,71,"아스타나"],[47,52,"서카자흐"],[49,82,"동카자흐"],[45,64,"크질오르다"]],
  "Indonesia": [[-6.2,106.8,"자바"],[0,102,"수마트라"],[0,114,"보르네오"],[-2,121,"술라웨시"],[-4,138,"파푸아"],[-8,120,"소순다"]],
  "Mexico": [[19.4,-99,"멕시코시티"],[29,-106,"치와와"],[25,-100,"누에보레온"],[20,-89,"유카탄"],[27,-112,"바하"],[17,-95,"오악사카"]],
  "Algeria": [[36.7,3,"알제"],[28,0,"사하라 북부"],[24,7,"호가르"]],
  "Saudi Arabia": [[24.7,46.7,"리야드"],[21.5,39.2,"헤자즈"],[19,50,"룹알할리"],[28,38,"타북"]],
  "Libya": [[32.9,13.2,"트리폴리"],[31,20,"키레나이카"],[25,15,"페잔"]],
  "Egypt": [[30,31.2,"카이로"],[25,32,"상이집트"],[27,27,"서부 사막"]],
  "Dem. Rep. Congo": [[-4.3,15.3,"킨샤사"],[2,22,"적도주"],[-10,26,"카탕가"],[-1,28,"키부"]],
  "Iran": [[35.7,51.4,"테헤란"],[29.6,52.5,"파르스"],[36,59,"호라산"],[31,49,"후제스탄"]],
  "Greenland": [[64,-51,"서그린란드"],[72,-40,"내륙 빙원"],[80,-40,"북그린란드"],[68,-30,"동그린란드"]],
  "Sudan": [[15.6,32.5,"하르툼"],[13,25,"다르푸르"],[19,33,"누비아"]],
  "Mongolia": [[47.9,106.9,"울란바토르"],[47,92,"서몽골"],[44,108,"고비"]],
  "Peru": [[-12,-77,"리마"],[-13.5,-72,"쿠스코"],[-5,-75,"로레토"]],
  "Chile": [[-33.4,-70.6,"산티아고"],[-23,-69,"아타카마"],[-45,-72,"아이센"]],
  "Japan": [[35.7,139.7,"간토"],[34.7,135.5,"간사이"],[33,131,"규슈"],[43,142,"홋카이도"],[39,140,"도호쿠"]],
  "Norway": [[59.9,10.7,"오슬로"],[66,14,"노를란"],[69.6,19,"트롬스"]],
  "Sweden": [[59.3,18,"스톡홀름"],[64,18,"노를란드"],[56,14,"예탈란드"]],
  "Turkey": [[41,29,"이스탄불"],[39.9,32.8,"앙카라"],[38,40,"동아나톨리아"]],
  "Ukraine": [[50.4,30.5,"키이우"],[48,37,"동부"],[49,24,"서부"]],
  "Nigeria": [[6.5,3.4,"라고스"],[11,8,"북부"]],
  "Ethiopia": [[9,38.7,"아디스아바바"],[7,43,"오가덴"]],
  "Pakistan": [[24.9,67,"신드"],[31.5,74,"펀자브"],[28,64,"발루치스탄"]],
  "Venezuela": [[10.5,-66.9,"카라카스"],[5,-64,"기아나 고원"]],
  "Colombia": [[4.7,-74,"보고타"],[2,-71,"야노스"]],
  "Bolivia": [[-16.5,-68,"라파스"],[-17,-62,"산타크루스"]],
  "Angola": [[-8.8,13.2,"루안다"],[-14,18,"남부"]],
  "Niger": [[13.5,2.1,"니아메"],[18,10,"아이르"]],
  "Chad": [[12,15,"은자메나"],[18,19,"티베스티"]],
  "Mali": [[12.6,-8,"바마코"],[19,-2,"팀북투"]],
  "Mauritania": [[18,-16,"누악쇼트"],[22,-10,"아드라르"]],
  "Namibia": [[-22.6,17,"빈트후크"]],
  "South Africa": [[-26,28,"하우텡"],[-33.9,18.4,"케이프"],[-29,25,"내륙"]],
  "Tanzania": [[-6.8,39.3,"해안"],[-5,33,"내륙"]],
  "France": [[48.8,2.3,"파리"],[44,4,"남프랑스"]],
  "Spain": [[40.4,-3.7,"마드리드"],[41.4,2.2,"카탈루냐"]],
  "Germany": [[52.5,13.4,"베를린"],[48.1,11.6,"바이에른"]],
  "Italy": [[41.9,12.5,"로마"],[45.5,9.2,"롬바르디아"]],
  "United Kingdom": [[51.5,-0.1,"잉글랜드"],[57,-4,"스코틀랜드"]],
  "Afghanistan": [[34.5,69.2,"카불"],[31.6,65.7,"칸다하르"]],
  "Myanmar": [[16.8,96.2,"양곤"],[22,96,"만달레이"]],
  "Finland": [[60.2,25,"헬싱키"],[67,26,"라플란드"]],
  "Iraq": [[33.3,44.4,"바그다드"],[36,43,"모술"]],
  "Somalia": [[2,45.3,"모가디슈"],[9.5,47,"북부"]],
  "Madagascar": [[-18.9,47.5,"안타나나리보"],[-23,45,"남부"]],
  "Kenya": [[-1.3,36.8,"나이로비"]],
  "Zambia": [[-15.4,28.3,"루사카"]],
  "Mozambique": [[-25.9,32.6,"마푸투"],[-15,38,"북부"]],
  "Turkmenistan": [[37.9,58.4,"아시가바트"]],
  "Uzbekistan": [[41.3,69.2,"타슈켄트"],[42,60,"호라즘"]],
  "Papua New Guinea": [[-9.4,147.2,"포트모르즈비"]],
  "New Zealand": [[-41.3,174.8,"북섬"],[-44,170.5,"남섬"]],
  "Philippines": [[14.6,121,"루손"],[7.5,125,"민다나오"]],
  "Malaysia": [[3.1,101.7,"말라야"],[3,114,"사라왁"]],
  "Vietnam": [[21,105.8,"하노이"],[10.8,106.6,"사이공"]],
  "Thailand": [[13.7,100.5,"방콕"],[17,102,"이산"]],
  "Morocco": [[34,-6.8,"라바트"],[30,-8,"아틀라스"]],
  "Cameroon": [[3.9,11.5,"야운데"],[10,14,"북부"]],
  "Central African Rep.": [[4.4,18.6,"방기"]],
  "Botswana": [[-24.6,25.9,"가보로네"]],
  "Paraguay": [[-25.3,-57.6,"아순시온"],[-22,-60,"차코"]],
  "Ecuador": [[-0.2,-78.5,"키토"]],
  "Oman": [[23.6,58.5,"무스카트"]],
  "Yemen": [[15.4,44.2,"사나"],[16,49,"하드라마우트"]],
  "Syria": [[33.5,36.3,"다마스쿠스"]],
  "Greece": [[38,23.7,"아테네"]],
};

// ---------- 래스터화 ----------
const geo = tc.feature(topo, topo.objects.countries);
const countries = []; // {name, ko, polys:[[ring...]], bbox}
const byName = {};
for (const f of geo.features) {
  let name = f.properties.name;
  if (SKIP.has(name)) continue;
  if (MERGE[name]) name = MERGE[name];
  const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
  let c = byName[name];
  if (!c) { c = byName[name] = { name, ko: KO[name] || name, polys: [] }; countries.push(c); }
  for (let p of polys) {
    // 날짜변경선을 가로지르는 고리는 경도를 이어 붙인다 (음수 경도 +360)
    const crosses = p.some((ring) => ring.some((pt, k) => k > 0 && Math.abs(pt[0] - ring[k - 1][0]) > 180));
    if (crosses) p = p.map((ring) => ring.map(([x, y]) => [x < 0 ? x + 360 : x, y]));
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const [x, y] of p[0]) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    c.polys.push({ rings: p, bbox: [x0, y0, x1, y1] });
  }
}
function inRing(x, y, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function inPoly(x, y, poly) {
  const [x0, y0, x1, y1] = poly.bbox;
  if (x < x0 || x > x1 || y < y0 || y > y1) return false;
  if (!inRing(x, y, poly.rings[0])) return false;
  for (let k = 1; k < poly.rings.length; k++) if (inRing(x, y, poly.rings[k])) return false;
  return true;
}
const cgrid = new Int16Array(W * H).fill(-1);
for (let r = 0; r < H; r++) {
  const lat = LAT_TOP - (r + 0.5) * RES;
  for (let c = 0; c < W; c++) {
    const lon = -180 + (c + 0.5) * RES;
    for (let i = 0; i < countries.length; i++) {
      if (countries[i].polys.some((p) => inPoly(lon, lat, p) || inPoly(lon + 360, lat, p))) { cgrid[r * W + c] = i; break; }
    }
  }
}
// 너무 작아서 안 잡힌 나라는 중심 셀 하나를 부여
countries.forEach((cn, i) => {
  if (cgrid.some((v) => v === i)) return;
  let sx = 0, sy = 0, n = 0;
  for (const p of cn.polys) for (const [x, y] of p.rings[0]) { sx += x; sy += y; n++; }
  const c = Math.floor((sx / n + 180) / RES), r = Math.floor((LAT_TOP - sy / n) / RES);
  if (r >= 0 && r < H) cgrid[r * W + c] = i;
});

// ---------- 셀 가치(인구·경제 대용) ----------
const DESERTS = [[15, 30, -15, 33], [16, 30, 36, 56], [38, 46, 92, 112], [-31, -20, 120, 142], [36, 42, 78, 90], [-27, -19, 15, 24], [24, 32, -116, -108], [-28, -20, -71, -68]];
function cellValue(r, c) {
  const lat = LAT_TOP - (r + 0.5) * RES, lon = -180 + (c + 0.5) * RES;
  const a = Math.abs(lat);
  let v = 1;
  if (a > 66) v = 0.15; else if (a > 58) v = 0.4; else if (a > 50) v = 0.8;
  if (a < 12) v *= 0.8;
  for (const [la0, la1, lo0, lo1] of DESERTS) if (lat >= la0 && lat <= la1 && lon >= lo0 && lon <= lo1) v *= 0.25;
  if (lon > -60 && lon < -20 && lat > 59) v = 0.05; // 그린란드
  return v;
}

// ---------- 프로빈스 분할 ----------
const pgrid = new Int16Array(W * H).fill(-1);
const provinces = [];
const TARGET = 300, MAXK = 16;
// 본토에서 멀리 떨어진 해외 영토(예: 프랑스령 기아나)는 별도 국가 단위로 분리
const OVERSEAS = { "France": "프랑스령 기아나", "Norway": "스발바르", "United States of America": "하와이", "Indonesia": "말루쿠" };
function splitFar(ci) {
  const cells = [];
  for (let i = 0; i < W * H; i++) if (cgrid[i] === ci) cells.push(i);
  if (cells.length < 8) return [cells];
  // 연결 요소 (8방향)
  const comp = new Map(); const comps = [];
  for (const s0 of cells) {
    if (comp.has(s0)) continue;
    const q = [s0]; comp.set(s0, comps.length); const list = [];
    while (q.length) {
      const i = q.pop(); list.push(i); const r = Math.floor(i / W), c = i % W;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const rr = r + dy; if (rr < 0 || rr >= H) continue;
        const j = rr * W + ((c + dx + W) % W);
        if (cgrid[j] === ci && !comp.has(j)) { comp.set(j, comps.length); q.push(j); }
      }
    }
    comps.push(list);
  }
  comps.sort((a, b) => b.length - a.length);
  // 본토에서 "섬 건너기" 거리: 자국 땅은 0, 그 외 칸은 1 (0-1 BFS, 최대 8)
  const dist = new Map(); const dq = []; let head = 0;
  for (const i of comps[0]) dist.set(i, 0);
  const front = comps[0].slice();
  while (front.length || head < dq.length) {
    const i = front.length ? front.pop() : dq[head++];
    const d = dist.get(i); if (d >= 8) continue;
    const r = Math.floor(i / W), c = i % W;
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const rr = r + dy; if (rr < 0 || rr >= H) continue;
      const j = rr * W + ((c + dx + W) % W);
      const nd = d + (cgrid[j] === ci ? 0 : 1);
      if (!dist.has(j) || dist.get(j) > nd) { dist.set(j, nd); if (cgrid[j] === ci) front.push(j); else dq.push(j); }
    }
  }
  const main = comps[0].slice(), far = [];
  for (const k of comps.slice(1)) { if (k.length >= 3 && !dist.has(k[0])) far.push(k); else main.push(...k); }
  return [main, ...far];
}
buildProvinces.used = {};
function buildProvinces(cn, ci, cells, partIdx) {
  if (!cells.length) return;
  let avg = 0; for (const i of cells) avg += cellValue(Math.floor(i / W), i % W); avg /= cells.length;
  let k = Math.max(1, Math.min(MAXK, Math.round((cells.length / TARGET) * (0.35 + 0.65 * avg))));
  const pts = cells.map((i) => {
    const r = Math.floor(i / W), c = i % W;
    let x = c;
    return [x, r];
  });
  // 날짜변경선 처리: 러시아/피지 등 동쪽 끝 셀은 x를 +W 로 펼친다
  const minX = Math.min(...pts.map((p) => p[0])), maxX = Math.max(...pts.map((p) => p[0]));
  if (maxX - minX > W / 2) for (const p of pts) if (p[0] < W / 2) p[0] += W;
  // 위도 보정: 고위도 셀은 실제 폭이 좁다
  const mx = pts.reduce((a, p) => a + p[0], 0) / pts.length;
  const fx = (p) => mx + (p[0] - mx) * Math.cos(((LAT_TOP - p[1] * RES) * Math.PI) / 180);
  const P = pts.map((p) => [fx(p), p[1]]);
  // 초기 시드: 균등 간격 샘플
  const sorted = P.map((p, i) => i).sort((a, b) => P[a][0] - P[b][0] || P[a][1] - P[b][1]);
  let C = [];
  for (let j = 0; j < k; j++) C.push(P[sorted[Math.floor(((j + 0.5) * sorted.length) / k)]].slice());
  const asg = new Int32Array(P.length);
  for (let it = 0; it < 40; it++) {
    for (let i = 0; i < P.length; i++) {
      let best = 0, bd = 1e18;
      for (let j = 0; j < k; j++) { const dx = P[i][0] - C[j][0], dy = P[i][1] - C[j][1], d = dx * dx + dy * dy; if (d < bd) { bd = d; best = j; } }
      asg[i] = best;
    }
    const S = C.map(() => [0, 0, 0]);
    for (let i = 0; i < P.length; i++) { const s = S[asg[i]]; s[0] += P[i][0]; s[1] += P[i][1]; s[2]++; }
    C = S.map((s, j) => (s[2] ? [s[0] / s[2], s[1] / s[2]] : C[j]));
  }
  const base = provinces.length;
  const groups = [];
  for (let j = 0; j < k; j++) groups.push([]);
  cells.forEach((cell, i) => groups[asg[i]].push(cell));
  const live = groups.filter((g) => g.length);
  // 나라 bbox (방향 이름용)
  const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length, cx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
  const sx = Math.sqrt(pts.reduce((s, p) => s + (p[0] - cx) ** 2, 0) / pts.length) || 1;
  const sy = Math.sqrt(pts.reduce((s, p) => s + (p[1] - cy) ** 2, 0) / pts.length) || 1;
  const used = buildProvinces.used[ci] || (buildProvinces.used[ci] = {});
  // 1) 각 군집의 중심과 라벨 셀
  const info = live.map((g) => {
    let gx = 0, gy = 0, val = 0;
    for (const cell of g) {
      let c = cell % W; const r = Math.floor(cell / W);
      if (maxX - minX > W / 2 && c < W / 2) c += W;
      gx += c; gy += r; val += cellValue(r, cell % W);
    }
    gx /= g.length; gy /= g.length;
    let lc = g[0], ld = 1e18;
    for (const cell of g) { let c = cell % W; const r = Math.floor(cell / W); if (maxX - minX > W / 2 && c < W / 2) c += W; const d = (c - gx) ** 2 + (r - gy) ** 2; if (d < ld) { ld = d; lc = cell; } }
    return { gx, gy, val, lc, lat: LAT_TOP - (gy + 0.5) * RES, lon: -180 + (((gx % W) + 0.5) * RES), name: null };
  });
  // 2) 지역 이름: (군집, 앵커) 쌍을 거리순으로 탐욕 배정
  if (live.length > 1 || partIdx > 0) {
    const an = (ANCHORS[cn.name] || []).filter((a) => !used[a[2]]);
    const pairs = [];
    info.forEach((f, j) => an.forEach((a, k) => pairs.push([((a[0] - f.lat) ** 2 + ((a[1] - f.lon) * Math.cos((f.lat * Math.PI) / 180)) ** 2) * (a === ANCHORS[cn.name][0] ? 0.5 : 1), j, k])));
    pairs.sort((x, y) => x[0] - y[0]);
    const takenA = new Set();
    for (const [d, j, k] of pairs) { if (info[j].name || takenA.has(k) || d > 400) continue; info[j].name = an[k][2]; takenA.add(k); used[an[k][2]] = 1; }
    info.forEach((f) => {
      if (f.name) return;
      let sub;
      if (partIdx > 0) sub = OVERSEAS[cn.name] || cn.ko + " 해외령";
      else {
        const ny = (f.gy - cy) / sy, nx = (f.gx - cx) / sx;
        const v = ny < -0.45 ? "북" : ny > 0.45 ? "남" : "";
        const hz = nx < -0.45 ? "서" : nx > 0.45 ? "동" : "";
        sub = cn.ko + " " + (v && hz ? v + hz : v ? v + "부" : hz ? hz + "부" : "중부");
      }
      let n = 2; const s0 = sub; while (used[sub]) sub = s0 + " " + n++;
      used[sub] = 1; f.name = sub;
    });
  } else info[0].name = cn.ko;
  live.forEach((g, j) => {
    const id = base + j;
    for (const cell of g) pgrid[cell] = id;
    const { val, lc, name } = info[j];
    provinces.push({ id, country: ci, name, cells: g.length, value: Math.round(val * 10) / 10, label: lc });
  });
}
countries.forEach((cn, ci) => {
  const parts = splitFar(ci);
  parts.forEach((cells, pi) => buildProvinces(cn, ci, cells, pi));
});
// 셀 1개짜리 고립 섬 조각을 이웃 프로빈스로 흡수하지 않고 그대로 둔다 (단순화)

// ---------- 인접 ----------
const adj = provinces.map(() => new Set());
const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
  const a = pgrid[r * W + c]; if (a < 0) continue;
  for (const [dx, dy] of N4) {
    const rr = r + dy; if (rr < 0 || rr >= H) continue;
    const cc = (c + dx + W) % W, b = pgrid[rr * W + cc];
    if (b >= 0 && b !== a) { adj[a].add(b); adj[b].add(a); }
  }
}
// 바다 항로: 해안 셀에서 바다로 D 칸 이내 도달 가능한 다른 프로빈스
const D = 7;
const sea = provinces.map(() => new Set());
const dist = new Int16Array(W * H);
for (const p of provinces) {
  // 이 프로빈스의 해안 셀에서 BFS
  dist.fill(-1);
  const q = [];
  for (let i = 0; i < W * H; i++) if (pgrid[i] === p.id) { dist[i] = 0; q.push(i); }
  let h = 0;
  while (h < q.length) {
    const i = q[h++]; const r = Math.floor(i / W), c = i % W;
    if (dist[i] >= D) continue;
    for (const [dx, dy] of N4) {
      const rr = r + dy; if (rr < 0 || rr >= H) continue;
      const j = rr * W + ((c + dx + W) % W);
      if (dist[j] >= 0) continue;
      const b = pgrid[j];
      if (b >= 0) {
        // 다른 나라 땅: 바다를 건너 도달했다면 항로
        if (b !== p.id && dist[i] > 0 && !adj[p.id].has(b)) { sea[p.id].add(b); sea[b].add(p.id); }
        continue;
      }
      dist[j] = dist[i] + 1; q.push(j);
    }
  }
}
// 장거리 항로(직접 지정)
function provAt(lat, lon) {
  const r = Math.floor((LAT_TOP - lat) / RES), c = Math.floor((lon + 180) / RES);
  let best = -1, bd = 1e9;
  for (let rr = Math.max(0, r - 12); rr < Math.min(H, r + 12); rr++) for (let cc = c - 12; cc < c + 12; cc++) {
    const v = pgrid[rr * W + ((cc + W) % W)]; if (v < 0) continue;
    const d = (rr - r) ** 2 + (cc - c) ** 2; if (d < bd) { bd = d; best = v; }
  }
  return best;
}
const LONG = [[[64.1, -21.9], [60.4, 5.3]], [[64.1, -21.9], [57, -4]], [[64.1, -21.9], [64, -51]], [[-41.3, 174.8], [-33.8, 151]], [[-5.8, -35.2], [14.7, -17.4]], [[38.7, -9.1], [32.6, -16.9]], [[-18.9, 47.5], [-25.9, 32.6]], [[21.3, -157.8], [37, -120]], [[35, 25], [31, 30]], [[-51.7, -59], [-50, -69]], [[-17.8, 178], [-15.4, 167]], [[-15.4, 167], [-21.5, 165.5]], [[-21.5, 165.5], [-27, 153]], [[-15.4, 167], [-9.4, 160]]];
for (const [a, b] of LONG) { const pa = provAt(...a), pb = provAt(...b); if (pa >= 0 && pb >= 0 && pa !== pb && !adj[pa].has(pb)) { sea[pa].add(pb); sea[pb].add(pa); } }

// 고립된 영토는 가장 가까운 영토와 항로로 잇는다
provinces.forEach((p) => {
  if (adj[p.id].size + sea[p.id].size > 0) return;
  const pr = Math.floor(p.label / W), pc = p.label % W;
  let best = -1, bd = 1e18;
  for (const q of provinces) {
    if (q.id === p.id) continue;
    const qr = Math.floor(q.label / W); let dc = Math.abs((q.label % W) - pc); dc = Math.min(dc, W - dc);
    const d = (qr - pr) ** 2 + dc ** 2; if (d < bd) { bd = d; best = q.id; }
  }
  if (best >= 0) { sea[p.id].add(best); sea[best].add(p.id); }
});

// ---------- 출력 ----------
// pgrid RLE: 행 단위로 [값,길이] base36
const rle = [];
for (let r = 0; r < H; r++) {
  const row = [];
  let c = 0;
  while (c < W) {
    const v = pgrid[r * W + c]; let n = 1;
    while (c + n < W && pgrid[r * W + c + n] === v) n++;
    row.push((v + 1).toString(36) + "." + n.toString(36));
    c += n;
  }
  rle.push(row.join(","));
}
const out = {
  W, H, RES, LAT_TOP,
  countries: countries.map((c) => ({ en: c.name, ko: c.ko })),
  provinces: provinces.map((p) => [p.country, p.name, p.cells, p.value, p.label, [...adj[p.id]], [...sea[p.id]]]),
  grid: rle.join("|"),
};
process.stdout.write("// 자동 생성: tools/build-map.mjs (Natural Earth / world-atlas 110m 기반)\nwindow.MAPDATA=" + JSON.stringify(out) + ";\n");
process.stderr.write(`countries ${countries.length}, provinces ${provinces.length}, size ${W}x${H}\n`);
