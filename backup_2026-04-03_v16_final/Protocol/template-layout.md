<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>Image to Elevation - 5 Viewpoints (Active Orthographic Layout)</title>

<link rel="stylesheet" as="style" crossorigin href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.8/dist/web/static/pretendard.css" />
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap" rel="stylesheet">

<style>
  :root {
    /* [SYSTEM INJECTION] Protocol A에서 추출된 건물의 절대 비례 파라미터 (기본값 세팅) */
    --bldg-width: {{geometry_ratio_x}};   /* 예: 10 (정면 가로 길이) */
    --bldg-depth: {{geometry_ratio_y}};   /* 예: 8  (측면 깊이) */
    --bldg-height: {{geometry_ratio_z}};  /* 예: 15 (건물 전체 높이) */

    --bg-color: #121212;
    --text-primary: #FFFFFF;
    --accent-color: #F4C430; 
  }

  * { 
    box-sizing: border-box;
    cursor: default;
  }

  body, html {
    margin: 0; 
    padding: 0; 
    width: 100vw; 
    height: 100vh;
    background-color: var(--bg-color);
    overflow: hidden;
    font-family: 'Pretendard', sans-serif;
  }

  .layout-container {
    display: flex;
    width: 100%; 
    height: 100%;
    padding: 60px 40px 40px 40px;
    justify-content: center;
    align-items: center;
  }

  .main-panel {
    width: 100%;
    max-width: 1600px;
    height: 100%;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  .title-overlay {
    position: absolute;
    top: -45px;
    left: 0px;
    font-family: 'Bebas Neue', cursive;
    font-size: 36px;
    color: var(--text-primary);
    z-index: 10;
    margin: 0;
    letter-spacing: 2px;
  }

  /* [CORE PATCH] 능동형 정사영 그리드 (Active Orthographic Grid) 
    건축 제도 원칙에 따라 Front(정면)를 중앙에 배치하여 모든 Z축(높이) 라인을 강제 정렬합니다.
  */
  .cross-grid-container {
    display: grid;
    /* 열(X축): 좌측면(깊이) | 정면/평면/배면(가로) | 우측면(깊이) */
    grid-template-columns: var(--bldg-depth) var(--bldg-width) var(--bldg-depth);
    
    /* 행(Y/Z축): 평면(깊이) | 좌측/정면/우측(높이) | 배면(높이) */
    grid-template-rows: var(--bldg-depth) var(--bldg-height) var(--bldg-height);
    
    grid-template-areas:
      ". top ."
      "left front right"
      ". rear .";
    
    gap: 16px;
    max-width: 100%;
    max-height: 100%;
    aspect-ratio: calc((var(--bldg-depth) * 2 + var(--bldg-width)) / (var(--bldg-depth) + var(--bldg-height) * 2));
  }

  .view-panel {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: rgba(255, 255, 255, 0.03); 
    border: 1px solid rgba(255, 255, 255, 0.1);
    overflow: hidden;
  }

  .top   { grid-area: top; }
  .left  { grid-area: left; }
  .front { grid-area: front; }
  .right { grid-area: right; }
  .rear  { grid-area: rear; }

  .view-img {
    width: 100%;
    height: 100%;
    object-fit: fill; /* 뼈대 비율이 이미 완벽하므로 픽셀을 그리드에 1:1로 고정 */
    z-index: 1;
  }

  .label-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    display: flex;
    justify-content: center;
    z-index: 2;
    pointer-events: none;
    user-select: none;
  }

  .label-overlay strong {
    font-size: 14px;
    font-weight: 600;
    color: var(--bg-color);
    background-color: var(--accent-color);
    width: 100%;
    text-align: center;
    padding: 8px 0;
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 1px;
    opacity: 0.95;
  }
</style>
</head>
<body>

  <div class="layout-container">
    <div class="main-panel">
      <h1 class="title-overlay">IMAGE TO ELEVATION: DETERMINISTIC ORTHOGRAPHIC</h1>
      
      <div class="cross-grid-container">
        
        <div class="view-panel top">
          <img src="{{img_url_top}}" alt="Top View" class="view-img">
          <div class="label-overlay"><strong>TOP (PLAN)</strong></div>
        </div>

        <div class="view-panel left">
          <img src="{{img_url_left}}" alt="Left View" class="view-img">
          <div class="label-overlay"><strong>LEFT</strong></div>
        </div>

        <div class="view-panel front">
          <img src="{{img_url_front}}" alt="Front View" class="view-img">
          <div class="label-overlay"><strong>FRONT</strong></div>
        </div>

        <div class="view-panel right">
          <img src="{{img_url_right}}" alt="Right View" class="view-img">
          <div class="label-overlay"><strong>RIGHT</strong></div>
        </div>

        <div class="view-panel rear">
          <img src="{{img_url_rear}}" alt="Rear View" class="view-img">
          <div class="label-overlay"><strong>REAR</strong></div>
        </div>

      </div>
    </div>
  </div>

</body>
</html>