# v16 캐시샵·날개·펫·사냥 업데이트

## 상품과 이용 방법

고양이 800 G, 병아리 500 G는 일반 동물 상점에서 판매합니다. 토끼 180 C, 펭귄 220 C, 여우 240 C, 판다 260 C, 너구리 280 C, 수달 300 C는 캐시샵에서 판매합니다. 기존 소장권과 GM 지급 스킨은 유지됩니다.

무지개 깃털 날개 250 C, 하늘 구름 날개 350 C, 별빛 은하 날개 450 C. 모두 등에 표시되는 4프레임 날갯짓과 빛 효과를 사용합니다. 이미지 칭호 3종은 180/220/260 C. 스킨·날개·칭호는 능력치를 바꾸지 않습니다.

새 동행 펫: 꿀빛 코기 180 C, 별구름 아기 용 300 C. 기존 골드 펫에도 자동 회복을 제공합니다. 메뉴의 ‘펫 자동 회복’에서 펫을 불러내고 가방의 생명·마나 포션을 맡긴 다음 자동 회복을 켜세요. 생명 회복 기준 30/40/50/60%, 마나 기준 35%; 포션은 1개씩 실제 소모되며 일반 포션과 2.2초 재사용 시간을 공유합니다. 맡긴 포션은 돌려받을 수 있습니다. 사망·로그아웃·펫 휴식 중에는 회복하지 않습니다.

캐시 사냥 보급: 천공의 수호 무기 700 C, LV15부터 직업에 맞는 공격 +24 / HP +15 무기 1개 지급. 캐릭터 귀속으로 판매·거래·분해 불가, 개인 창고는 사용 가능. 모험가 포션 보급 상자 100 C, 고정 구성 생명 60개 + 마나 40개. 일반 골드 장비·포션·제작·레이드 보상은 계속 이용할 수 있습니다. 캐시 충전은 기존 후원 확인 요청과 GM의 실제 입금 확인·승인 방식입니다.

새 몬스터: 에메랄드 슬라임·달빛 늑대·구름 그리핀·불씨 멧돼지. 초원·설원·불씨 지역에 배치하며 서버가 공격, 체력, 경험치, 전리품, 재등장을 계산합니다. 기존 저장 월드에 중복 없이 추가하며 일반 전리품에서 GM/캐시 전용 장비를 제외했습니다.

## 직접 제작한 이미지와 스프라이트 사양

- public/art/wings-motion-v16.webp — 1024×768, 4열×3행, 셀 256px. 각 행 무지개·하늘 구름·별빛 은하, 열마다 날갯짓 4단계.
- public/art/creatures-motion-v16.webp — 1024×1536, 4열×6행, 셀 256px. 행마다 코기·아기 용·슬라임·늑대·그리핀·멧돼지. 열 순서 대기·걷기·공격·쓰러짐.
- public/art/shop-icons-v16.webp — 1024×512, 4열×2행, 셀 256px. 위 행 칭호 배지 3종과 보급 상자. 아래 행 기사 검·순찰자 활·마도사 지팡이·포션.

모든 이미지는 내장 이미지 생성 도구로 직접 제작했습니다. 투명 배경, 귀여운 한국 판타지 RPG 손그림, 명확한 실루엣과 부드러운 명암, 동물 전신과 일관된 종별 특징을 기준으로 생성했습니다. 게임 시트로 내보낼 때 알파 투명도를 유지하고 격자 여백과 발 위치를 맞추고 이웃 프레임 조각을 정리했습니다. 실행용 dist/external/client/art에 같은 파일을 포함했습니다.

제작 프롬프트 사양:
1. Wings: transparent sprite sheet, exactly four columns and three rows; paired decorative back wings without character bodies; rainbow feather wings, fluffy sky-blue cloud wings, pastel lavender starlight wings; four distinct open/down/fold/up flap poses; cute polished hand-painted fantasy RPG style; sparkling effects contained within cells; no text, no background.
2. Creatures: transparent sprite sheet, exactly four columns and six rows; honey corgi, lavender baby dragon, emerald crystal slime, moonlight wolf, cloud griffin, ember boar; each row same character in idle, walk, attack, peacefully defeated pose; right-facing three-quarter view, full bodies, consistent proportions; readable paws, wings and faces; no text, no background.
3. Shop icons: transparent sprite sheet, four columns and two rows; rainbow-star badge, sky-cloud badge, violet-moon badge, supply chest; luminous knight sword, elegant ranger bow, magic staff, red and blue potion bottles; coherent premium cute fantasy illustration style; isolated complete icons; no text, no background.

게임: https://aetheria-rpg.onrender.com
GM: https://aetheria-rpg.onrender.com/gm/
