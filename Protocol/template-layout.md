<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>Image to Elevation - Defense Maximized Layout</title>

<link rel="stylesheet" as="style" crossorigin href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.8/dist/web/static/pretendard.css" />
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap" rel="stylesheet">

<style>
  :root {
    /* [SYSTEM INJECTION] 건물의 절대 비례 파라미터 */
    --bldg-width: {{geometry_ratio_x}}; 
    --bldg-depth: {{geometry_ratio_y}}; 
    --bldg-height: {{geometry_ratio_z}};

    /* Bottom-Up 렌더링을 위한 픽셀 스케일 배수 */
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
    padding: 100px 80px; justify-content: center; align-items: center;
  }

  .main-panel {
    width: max-content; position: relative;
    display: flex; flex-direction: column;
    justify-content: center; align-items: center;
  }

  .title-overlay {
    position: absolute; top: -70px; left: 0px;
    font-family: 'Bebas Neue', cursive; font-size: 36px;
    color: var(--text-primary); z-index: 10; margin: 0; letter-spacing: 2px;
  }

  /* [패치 1 반영] 그리드 오버플로우 강제 차단 */
  .cross-grid-container {
    display: grid;
    gap: 60px; /* 안정적인 이격거리 */
    
    /* X축 방어선 */
    grid-template-columns: 
      calc(var(--bldg-depth) * var(--base-scale)) 
      calc(var(--bldg-width) * var(--base-scale)) 
      calc(var(--bldg-depth) * var(--base-scale)) 
      calc(var(--bldg-width) * var(--base-scale));
    
    /* Y/Z축 방어선 */
    grid-template-rows: 
      calc(var(--bldg-depth) * var(--base-scale)) 
      calc(var(--bldg-height) * var(--base-scale));
    
    grid-template-areas:
      ". top . ."
      "left front right rear";
      
    /* 🚨 핵심 패치: 내부 이미지 크기가 그리드를 밀어내는 것을 물리적으로 금지 */
    min-width: 0;
    min-height: 0;
  }

  .view-panel {
    position: relative; display: flex;
    justify-content: center; align-items: center;
    background-color: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    
    /* 🚨 핵심 패치: 셀 내부에서도 오버플로우 강제 차단 */
    min-width: 0;
    min-height: 0;
  }

  .top   { grid-area: top; }
  .left  { grid-area: left; }
  .front { grid-area: front; }
  .right { grid-area: right; }
  .rear  { grid-area: rear; }

  .view-img {
    width: 100%; height: 100%;
    /* 찌그러짐 방지 및 셀에 완벽히 맞춤 */
    object-fit: cover; 
    z-index: 1;
  }

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
      <h1 class="title-overlay">IMAGE TO ELEVATION: UNROLLED ORTHOGRAPHIC</h1>
      <div class="cross-grid-container">
        <div class="view-panel top"><img src="{{img_url_top}}" alt="Top View" class="view-img"><div class="label-overlay"><strong>TOP (PLAN)</strong></div></div>
        <div class="view-panel left"><img src="{{img_url_left}}" alt="Left View" class="view-img"><div class="label-overlay"><strong>LEFT</strong></div></div>
        <div class="view-panel front"><img src="{{img_url_front}}" alt="Front View" class="view-img"><div class="label-overlay"><strong>FRONT</strong></div></div>
        <div class="view-panel right"><img src="{{img_url_right}}" alt="Right View" class="view-img"><div class="label-overlay"><strong>RIGHT</strong></div></div>
        <div class="view-panel rear"><img src="{{img_url_rear}}" alt="Rear View" class="view-img"><div class="label-overlay"><strong>REAR</strong></div></div>
      </div>
    </div>
  </div>
</body>
</html>