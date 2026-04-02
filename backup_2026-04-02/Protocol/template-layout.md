<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>Image to Elevation - 5 Viewpoints (Cross Layout)</title>

<link rel="stylesheet" as="style" crossorigin href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.8/dist/web/static/pretendard.css" />
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap" rel="stylesheet">

<style>
  :root {
    --bg-color: #121212;
    --text-primary: #FFFFFF;
    --accent-color: #F4C430; /* LAYOUT.jpg의 메인 옐로우 컬러 참조 */
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

  /* Single Image Wrapper */
  .composite-wrapper {
    flex: 1;
    width: 100%;
    height: 100%;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  /* 렌더링된 단일 통합 십자형 이미지 (건축물 비례 능동 반응) */
  .master-composite-img {
    width: 100%;
    height: 100%;
    object-fit: contain; /* 건축물 비례에 맞추어 유연하게 스케일링 */
    position: absolute;
    top: 0;
    left: 0;
    z-index: 1;
  }

  /* CSS Grid를 활용한 십자(Cross) 레이아웃 오버레이 */
  .visual-grid-overlay {
    position: absolute;
    top: 0; 
    left: 0;
    width: 100%; 
    height: 100%;
    display: grid;
    /* 3x3 그리드 구성 (십자 형태) */
    grid-template-columns: 1fr 1fr 1fr;
    grid-template-rows: 1fr 1fr 1fr;
    grid-template-areas:
      ". rear ."
      "left top right"
      ". front .";
    gap: 8px;
    z-index: 2;
  }

  /* 라벨 공통 속성 */
  .label-item {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: center;
    pointer-events: none; 
    user-select: none;
    border: 1px solid rgba(255, 255, 255, 0.1); /* 영역 확인용 미세 가이드라인 */
  }

  /* 레이아웃 에어리어 할당 */
  .rear  { grid-area: rear; }
  .left  { grid-area: left; }
  .top   { grid-area: top; }
  .right { grid-area: right; }
  .front { grid-area: front; }

  /* 빈 공간 처리 */
  .empty {
    visibility: hidden;
  }

  .label-item strong {
    font-size: 16px;
    font-weight: 500;
    color: var(--bg-color);
    background-color: var(--accent-color);
    width: 100%;
    text-align: center;
    padding: 10px 0;
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 1px;
    opacity: 0.9;
  }
</style>
</head>
<body>

  <div class="layout-container">
    <div class="main-panel">
      <h1 class="title-overlay">IMAGE TO ELEVATION: 5-VIEW ORTHOGRAPHIC</h1>
      
      <div class="composite-wrapper">
        <img src="{{img_url_5view_cross_composite}}" class="master-composite-img" alt="5-View Architectural Sheet">
        
        <div class="visual-grid-overlay">
          <div class="label-item empty"></div>
          <div class="label-item rear"><strong>REAR</strong></div>
          <div class="label-item empty"></div>
          
          <div class="label-item left"><strong>LEFT</strong></div>
          <div class="label-item top"><strong>TOP</strong></div>
          <div class="label-item right"><strong>RIGHT</strong></div>
          
          <div class="label-item empty"></div>
          <div class="label-item front"><strong>FRONT</strong></div>
          <div class="label-item empty"></div>
        </div>
      </div>

    </div>
  </div>

</body>
</html>