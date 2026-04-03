<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>Image to Elevation - Final Unfolded Box Layout</title>

<link rel="stylesheet" as="style" crossorigin href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.8/dist/web/static/pretendard.css" />
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap" rel="stylesheet">

<style>
  :root {
    /* [SYSTEM INJECTION] 건물의 절대 비례 파라미터 */
    --bldg-width: {{geometry_ratio_x}}; 
    --bldg-depth: {{geometry_ratio_y}}; 
    --bldg-height: {{geometry_ratio_z}};

    /* [CORE 2] Bottom-Up 렌더링을 위한 픽셀 스케일 배수 */
    --base-scale: 30px; 

    --bg-color: #121212;
    --text-primary: #FFFFFF;
    --accent-color: #F4C430;
  }

  * { box-sizing: border-box; cursor: default; }

  body, html {
    margin: 0; padding: 0; width: 100%; min-height: 100vh;
    background-color: var(--bg-color);
    font-family: 'Pretendard', sans-serif;
  }

  .layout-container {
    display: flex; width: 100%; min-height: 100vh;
    padding: 120px 80px; justify-content: center; align-items: center;
  }

  .main-panel {
    /* Top-down 캔버스 제한 폐지, 콘텐츠에 맞게 유연하게 확장 */
    width: max-content; position: relative;
    display: flex; flex-direction: column;
    justify-content: center; align-items: center;
  }

  .title-overlay {
    position: absolute; top: -90px; left: 0px;
    font-family: 'Bebas Neue', cursive; font-size: 36px;
    color: var(--text-primary); z-index: 10; margin: 0; letter-spacing: 2px;
  }

  /* [CORE 1 & 3] 십자가형 중앙집중식 그리드 제어 & 버퍼 스페이스 */
  .cross-grid-container {
    display: grid;
    gap: 60px; /* 안정적인 이격거리 확보 */
    
    /* 열(X축): 왼쪽 전개(높이) | 중앙 지붕(너비) | 오른쪽 전개(높이) */
    grid-template-columns: 
      calc(var(--bldg-height) * var(--base-scale)) 
      calc(var(--bldg-width) * var(--base-scale)) 
      calc(var(--bldg-height) * var(--base-scale));
    
    /* 행(Y축): 상단 전개(높이) | 중앙 지붕(깊이) | 하단 전개(높이) */
    grid-template-rows: 
      calc(var(--bldg-height) * var(--base-scale)) 
      calc(var(--bldg-depth) * var(--base-scale)) 
      calc(var(--bldg-height) * var(--base-scale));
    
    grid-template-areas:
      ". rear ."
      "left top right"
      ". front .";
      
    /* [CORE 1] 내부 콘텐츠 비대화로 인한 레이아웃 붕괴 물리적 차단 */
    min-width: 0; min-height: 0;
  }

  /* 그리드 셀 (이미지가 담길 껍데기 공간) */
  .view-panel {
    position: relative; display: flex;
    justify-content: center; align-items: center;
    /* 그리드 자식 요소에서의 2차 오버플로우 방어 */
    min-width: 0; min-height: 0; 
  }

  .top   { grid-area: top; }
  .left  { grid-area: left; }
  .front { grid-area: front; }
  .right { grid-area: right; }
  .rear  { grid-area: rear; }

  /* [CORE 4] 회전하는 알맹이 (이미지와 라벨을 그룹화하여 축 기준 회전) */
  .rotate-wrap {
    position: relative; display: flex;
    justify-content: center; align-items: center;
    background-color: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 4px;
  }

  /* 각 뷰포인트별 수학적 원본 크기 맵핑 및 정사영 전개(Unfold) 회전 */
  .wrap-top {
    width: calc(var(--bldg-width) * var(--base-scale));
    height: calc(var(--bldg-depth) * var(--base-scale));
    transform: rotate(0deg);
  }
  .wrap-front {
    width: calc(var(--bldg-width) * var(--base-scale));
    height: calc(var(--bldg-height) * var(--base-scale));
    transform: rotate(0deg);
  }
  .wrap-rear {
    width: calc(var(--bldg-width) * var(--base-scale));
    height: calc(var(--bldg-height) * var(--base-scale));
    transform: rotate(180deg); /* 상단 배치, 하늘 방향이 중앙을 향하도록 상하 반전 */
  }
  .wrap-left {
    width: calc(var(--bldg-depth) * var(--base-scale));
    height: calc(var(--bldg-height) * var(--base-scale));
    transform: rotate(90deg); /* 좌측 배치, 시계방향 회전 */
  }
  .wrap-right {
    width: calc(var(--bldg-depth) * var(--base-scale));
    height: calc(var(--bldg-height) * var(--base-scale));
    transform: rotate(-90deg); /* 우측 배치, 반시계방향 회전 */
  }

  .view-img {
    width: 100%; height: 100%;
    object-fit: cover; z-index: 1; /* 비율 불일치 시 찌그러짐 방지 */
  }

  /* 라벨은 항상 건물의 '땅(Ground)' 방향(이미지 밖)에 렌더링 */
  .label-overlay {
    position: absolute; bottom: -40px; left: 0; width: 100%;
    display: flex; justify-content: center; z-index: 2; pointer-events: none;
  }

  .label-overlay strong {
    font-size: 16px; font-weight: 600; color: var(--text-primary);
    background-color: transparent; width: 100%; text-align: center;
    padding: 8px 0; margin: 0; letter-spacing: 2px;
  }
</style>
</head>
<body>
  <div class="layout-container">
    <div class="main-panel">
      <h1 class="title-overlay">IMAGE TO ELEVATION: UNFOLDED BOX</h1>
      <div class="cross-grid-container">
        
        <div class="view-panel top">
          <div class="rotate-wrap wrap-top">
            <img src="{{img_url_top}}" alt="Top View" class="view-img">
            <div class="label-overlay"><strong>TOP (PLAN)</strong></div>
          </div>
        </div>

        <div class="view-panel left">
          <div class="rotate-wrap wrap-left">
            <img src="{{img_url_left}}" alt="Left View" class="view-img">
            <div class="label-overlay"><strong>LEFT</strong></div>
          </div>
        </div>

        <div class="view-panel front">
          <div class="rotate-wrap wrap-front">
            <img src="{{img_url_front}}" alt="Front View" class="view-img">
            <div class="label-overlay"><strong>FRONT</strong></div>
          </div>
        </div>

        <div class="view-panel right">
          <div class="rotate-wrap wrap-right">
            <img src="{{img_url_right}}" alt="Right View" class="view-img">
            <div class="label-overlay"><strong>RIGHT</strong></div>
          </div>
        </div>

        <div class="view-panel rear">
          <div class="rotate-wrap wrap-rear">
            <img src="{{img_url_rear}}" alt="Rear View" class="view-img">
            <div class="label-overlay"><strong>REAR</strong></div>
          </div>
        </div>

      </div>
    </div>
  </div>
</body>
</html>