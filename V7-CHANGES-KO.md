# 에테리아 v7 변경 기록

- 사용자 제공 400 Sounds Pack.zip에서 30개 효과음을 골라 압축하고 공격·피격·원소 마법·회피·골드·성장·UI와 초원/설원/돌바닥 발자국에 연결했습니다. 전체 사운드 파일을 복제하지 않고 사용하는 파일만 포함했습니다. 원본 대응표: public/sfx/SOURCE-MAP.json.
- 세계 채팅이 캐릭터 위 말풍선으로 7초간 표시됩니다. 한국어 줄바꿈과 긴 메시지 생략, 다른 유저의 말풍선 표시를 지원합니다. 말풍선 상점에서 12종을 게임 골드로 구매하고 변경합니다. 원본 벡터 에셋: public/bubbles/0.svg ~ 11.svg.
- 다른 수호자를 우클릭하거나 클릭하면 레벨·직업·장비·레이드 승리를 볼 수 있습니다. 가까운 수호자에게 거래를 요청하고 상대가 수락하면 아이템 최대 12개와 골드를 제안합니다. 양측 확인 후 서버가 동시에 교환합니다. 제안 변경은 확인을 해제하며, 오래된 확인·다른 계정의 접근·중복 아이템·장착 장비·음수 골드·가방 초과·거리 이탈·접속 종료를 검사합니다.
- LV10·20·30 레이드 3종과 별도 성소 맵 25·26·27을 추가했습니다. 하단 레이드 버튼은 LV10부터 나타납니다. 같은 성소로 입장한 최대 4명이 함께 싸우며 혼자도 도전할 수 있습니다. 강타 예고, 체력 50% 이하 광폭화, 제한 시간과 실패·승리 HUD를 지원합니다. 보스에게 피해를 준, 같은 맵에 접속 중인 참가자에게 보상을 한 번 지급합니다. 가방이 가득 차면 전설 무기는 따로 보관하며 레이드 창에서 수령합니다.
- 기존 25개 일반 맵과 퀘스트·전직·펫·음성·캐릭터 저장 기능을 유지합니다. 서버 저장소 및 Durable Object 식별자를 유지하므로 이전 로컬 버전은 UPDATE-WINDOWS.bat로 저장 데이터를 유지하며 업데이트할 수 있습니다.

## 검증

47개 엔진/편의성 테스트, TypeScript 검사, 외부 런타임 빌드, 실제 Miniflare HTTP/SQLite/WebSocket 테스트가 통과했습니다. 실제 서로 다른 인증 계정의 거래를 테스트했고 21개 동시 소켓에서 로컬 스냅샷 최대 간격은 105ms였습니다. production Canvas 렌더러로 성소·말풍선·NPC·모션·펫을 렌더링했습니다. 브라우저에서 실제 클릭/청각 및 외부 인터넷 환경의 지연을 검증한 결과는 아닙니다.

외부 공개 사이트는 아직 계정 인증을 통한 배포가 필요합니다. 이 파일은 로컬 실행본과 외부 배포 설정, 전체 수정 소스를 포함합니다. 기존에 공개된 구버전 사이트가 자동으로 업데이트되는 파일은 아닙니다.

## 새 성소 이미지 제작 기록

내장 image_gen 도구로 생성했습니다. 게임 내 파일: public/art/raid-arena.png (배포본: dist/external/client/art/raid-arena.png). 하나의 원화를 색상 필터로 달리하여 3개의 레이드 맵에 사용합니다. 말풍선 UI 에셋은 직접 제작한 SVG이며, 실제 채팅 글자는 Canvas에서 그립니다.

최종 생성 프롬프트:

Use case: stylized-concept. Asset type: polished fantasy RPG boss arena background, landscape 1536x1024. High detail hand painted anime fantasy game environment, elevated three-quarter top-down camera. A vast celestial ruined sanctuary, open oval stone courtyard occupying almost entire middle 80 percent of image, subtle engraved star runes and mosaic marble, moonlight teal and gold accents, broken ornate columns only on outside edges, distant mystical void around edges. Walkable area completely empty unobstructed floor from x180 to1360 and y160 to880 in image coordinates. Broad entry at bottom center. Symmetrical lavish architectural ornament on perimeter, cinematic magical atmosphere but readable gameplay floor. No characters, no monsters, no UI, no lettering or text. Professional richly painted texture, absolutely no crude pixel art.
