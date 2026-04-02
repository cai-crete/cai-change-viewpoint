# **[System Master Document] App Integration Process**

본 문서는 앱의 최초 구동 시점부터, 사용자가 이미지를 업로드하고 분석을 거쳐 최종 렌더링을 실행하기까지의 '시스템 통합 제어 흐름'을 타임라인 순으로 명세합니다.

---

## **PHASE 0. INIT (시스템 초기화 및 구조 대기)**
앱이 최초 로드될 때의 초기 상태 설정.

*   **UI 상태**: 다크모드/라이트모드 설정 로드.
*   **Canvas 초기화**: 빈 무한 캔버스(가운데 정렬)와 3x3 비율의 합성 그리드 출력.
*   **Tool Load**: 컨트롤 바는 하단 중앙에 배치되며 기본 모드는 Select (Cursor) 유지. 옵션 패널(Right Sidebar)은 닫혀있음.

---

> **[System Coordinate Constants — Architectural Front-Identification Logic]**
>
> 본 시스템의 모든 PHASE에서 공통으로 적용되는 **건축 방위 좌표계 상수**. 정면 인식의 절대적 기준.
>
> | 모서리 코드 | 위치 | 설명 |
> |---|---|---|
> | **Blue (좌전)** | Front-Left | 건축물 정면을 바라보았을 때의 왼쪽 앞 모서리 |
> | **Red (우전)** | Front-Right | 건축물 정면을 바라보았을 때의 오른쪽 앞 모서리 |
> | **Yellow (좌후)** | Back-Left | 건축물의 왼쪽 뒤 모서리 |
> | **Green (우후)** | Back-Right | 건축물의 오른쪽 뒤 모서리 |
>
> **정면(Front, 06:00)** = Blue–Red 선(Front Edge). 이 방향이 모든 PHASE의 시점 연산 원점(Origin).

---

## **PHASE 1. INGESTION (이미지 주입 및 기본 시점 분석)**
사용자가 원본 이미지의 [분석] 버튼을 클릭하는 시점. 여기서부터 AI 엔진(Protocol A)이 부분 가동됩니다.

1.  **Image Upload Event**: 사용자가 .jpg, .png 등 건축물 이미지를 업로드.
2.  **State Reset**: 기존의 생성된 이미지(generatedImage) 및 배치도(sitePlanImage)를 초기화(Null)하고 UI를 갱신.
3.  **Basic Viewpoint Analysis & 가이드라인 기반 분석 (분석 및 추출 동시 개시)**: 
    *   **Engine:** `gemini-3.1-pro-preview` (MODEL_ANALYSIS)
    *   **시점 추론:** 입력된 이미지의 "정면(06:00) 기준점" 대비 현재 관찰자의 시점 변수(Camera Angle, Altitude, Lens 설정)를 판단하여 상태(State) 값으로 업데이트.
    *   **가이드라인 발동:** `ANALYZE` 기능 호출 즉시 `전개도작성 가이드라인`을 최초부터 적용하여, 5면 입면도 기반 데이터를 탐색 시작.
    *   **AEPL 스키마 선제 도출:** 형태적 기하학(`1_Geometry_MASTER`)과 재질/광학적 속성(`2_Property_SLAVE`)을 1:1 앙상블 페어로 분석한 JSON 트리를 구성하고 브라우저 Developer Console에 강제 로깅함.
    *   옵션 패널(Right Sidebar)이 자동으로 열리며 분석 중 텍스트가 표시됨.

---

## **PHASE 2. ARCHITECTURAL INFERENCE (심층 설계 추론 및 파라미터화)**
단순 시점 분석을 넘어 보이지 않는 면(Blind Spot)을 채우기 위한 백그라운드 프로세싱(Protocol A).

> **[Protocol Engine 자동 발동 — `protocol-image to elevation-v6`]**
>
> PHASE 2가 개시되는 순간, **`protocol-image to elevation-v6`** (Protocol A: Architectural Logic Engine)가 전체 실행 엔진으로 자동 발동됩니다.
>
> 이 프로토콜은 입력된 2D 이미지의 가시권 상수를 스캔하고, 내부 조닝(Zoning) 로직을 통해 비가시권 영역의 3D 절대 좌표 및 속성 데이터를 결정론적으로 역설계합니다. 형태(Geometry)와 속성(Property)의 1:1 매칭 원칙(ensemble_pair)에 따라 연산을 분리하여 AI Hallucination을 원천 차단합니다.
>
> **발동 흐름:**
> `PHASE 1 분석 완료` → `Protocol A 초기화` → `Phase 1: Macro Context & Global Datum Lock-on` → `Phase 2: Meso-Macro Geometry & Boundary Parameterization` → `Phase 3: Meso-Micro Zoning & Master-Priority Voids` → `Phase 4: Micro Properties & One-Way Specification (AEPL JSON 패키징)` → `Protocol B 이관`

1.  **protocol-image to elevation-v6 연동**: 가시권 이미지에서 건축적 당위성을 역산하는 4단계 파이프라인 가동.
    *   **Phase 1: Macro Context & Global Datum Lock-on** — 가시권 영역 정보 분석 및 기준선, 시방서 상수 동결.
    *   **Phase 2: Meso-Macro Geometry & ...** — 3D 기하학 체적화 및 외피 시스템 파라미터화.
    *   **Phase 3: Meso-Micro Zoning & ...** — 비가시권 개구부 요구사항 산출 및 가시권 그리드 최우선 강제 정렬.
    *   **Phase 4: Micro Properties & One-Way Specification** — 단방향 마감재 타설 및 `1_Geometry_MASTER` / `2_Property_SLAVE` JSON 패키징.

> **[Protocol Reference 자동 연동 — `AEPS-v4` 및 `전개도작성 가이드라인`]**
>
> `protocol-image to elevation-v6`의 Phase 4(Design Specification Output)가 완료되면, **`AEPS-v4`(Architectural Elevation Parameter System v4)** 와 **`전개도작성 가이드라인`** 이 자동으로 참조됩니다.
>
> 이 프로토콜은 추출된 건축 요소를 `ensemble_pair` 원칙에 따라 형태(Geometry)와 속성(Property)의 상호보완적 이분화 기준을 정의하는 **시스템 헌법(Constitution)** 으로 작동합니다. Protocol A의 최종 산출물인 `1_Geometry_Data_MASTER` + `2_Property_Data_SLAVE` 패키징의 규격이 이 프로토콜에서 확정됩니다.
>
> **연동 역할:** `ensemble_pair` 단독 유효성 규칙의 근거 문서 | **핵심 산출물:** `1_Geometry_Data_MASTER` + `2_Property_Data_SLAVE` → Protocol B 이관

2.  **Parameter Library 연동**: 추출된 건축 요소를 `ensemble_pair` 원칙에 따라 형태(Geometry)와 속성(Property)으로 이분화.

> **`ensemble_pair` 단독 유효성 규칙 (핵심 원칙)**
> *   `1_Geometry_Data (Shape Anchor)`: Z-Depth/Normal Map 기반 Image Prompt로만 작동. 픽셀의 절대 위치와 3D 좌표의 시각적 틀을 확정하며, 단독으로 렌더링에 진입 불가.
> *   `2_Property_Data (Data Binder)`: 파라미터 기반 Text Prompt로만 작동. 확정된 기하학적 틀 내부에 치수와 광학 물성을 주입하며, Geometry 없이 단독 연산 불가.
> *   **`ensemble_pair`가 성립된 상태(Geometry + Property)에서만 렌더링 실행 허가.**

3.  **Elevation Parameter Binding (상태 고정 및 인수인계 준비)**:
    *   Phase 1에서 미리 발동한 `전개도작성 가이드라인` 연산을 통해 도출된 `1_Geometry_MASTER` 및 `2_Property_SLAVE` JSON 결과값(AEPL 스키마)을 시스템 내 불변의 기준값(Constant Reference)으로 영구 바인딩.
    *   **AEPL 핸드오버 포맷**: 확정 형태(ControlNet 단방향 가이드)와 속성(Text Prompt 단방향 지시) 데이터가 완벽히 패키징되어, 백엔드/프로토콜 B 시각화 단계로 최종 전달될 준비를 완료.

4.  **Contextual Image Synthesis (입면 합성 및 보정)**:
    *   **Target:** `Original Input Image` + `elevationParams`
    *   **Process**:
        *   원본 이미지에서 명확하게 파악할 수 있는 정교한 디자인, 텍스처, 구조적 특징(Front, 일부 측면)을 원천 데이터(Source of Truth)로 유지.
        *   원본에서 관측 불가능한 배면(Rear view) 및 측면부 등 사각지대(Blind Spot)는 'Step 3'에서 도출된 `elevationParams` 기반으로 맥락적(Contextual)으로 지능적 추론 및 연결.
        *   (결과) 원본 건축물의 디자인 정체성을 100% 반영하면서 사각지대까지 채워진 완전한 마스터 데이터 확보.

5.  **Architectural Multi-View Generation (5면 입면 생성 및 추출)**:
    *   **Engine:** `gemini-3.1-flash-image-preview` (MODEL_IMAGE_GEN)
    *   **View Camera Map (뷰별 카메라 절대 좌표)**:

| 뷰 | Azimuth | Altitude | 정방향 벡터 | 슬롯 ID |
|---|---|---|---|---|
| 정면 (Front) | 0° | 0° | (0, -1, 0) | Primary_Facade |
| 탑/평면 (Top) | 0° | 90° | (0, 0, 1) | Top_Elevation |
| 우측면 (Right) | 90° | 0° | (1, 0, 0) | Right_Facade |
| 좌측면 (Left) | 270° | 0° | (-1, 0, 0) | Left_Facade |
| 배면 (Back) | 180° | 0° | (0, 1, 0) | Rear_Facade |

    *   **Process**:
        *   `System Protocol B` (Node 3)를 가동하여 'Step 4'에서 합성 및 완성된 마스터 데이터를 기반으로 [Top, Front, Right, Rear, Left]가 포함된 **십자(Cross) 레이아웃 통합 건축 참조 시트**를 단일 패스로 생성.
        *   생성된 통합 이미지에서 **Top View(Roof Plan)** 영역을 수학적으로 계산하여 크롭(Crop) 추출.
        *   추출된 평면 이미지를 `SITE PLAN` 상태에 매핑하여 출력.
    *   **[ORIENTATION RULE — 정면 고정 선언]**:
        *   `FRONT Elevation`은 5면 통합 시트 이미지 레이아웃의 **하단(Bottom)**에 고정 정렬. (`Row 2, Col 1` 위치)
        *   생성 완료 시, 시트의 `FRONT Elevation` 슬롯 = 해당 건축물의 **절대적 정면(06:00)** 기준값으로 시스템에 고정. (`Primary_Facade` 상태 변수에 잠금)
        *   `Top View(Roof Plan)`의 **하단 방향 = FRONT 방향**으로 방위 일치. Blue–Red 선(정면 모서리)이 Top View 하단에 위치하도록 정렬.
        *   이 고정 선언 이후, 어떠한 PHASE에서도 정면 방향을 재해석하거나 임의로 변경하는 연산 차단.

    *   **완료 조건**: 5개 뷰 각각의 `ensemble_pair`가 성립되어 앙상블 조립이 완료된 시점에 시각화 엔진(Protocol B) 이관 트리거 발동.
    *   완성 시 "Analysis Report" 탭의 로딩 상태 종료.

---

## **PHASE 3. VIEWPOINT CONFIGURATION (5-IVSP 시점 설정)**
사용자가 도출된 결과물과 UI 상의 슬라이더를 확인하고, PHASE 2의 건축 설계 데이터에 적용할 관찰자 시점을 설정하는 5-IVSP 실행 단계.

> **[Protocol Engine 자동 발동 — `protocol-Change Viewpoint-v3`]**
>
> PHASE 3가 개시되는 순간, **`protocol-Change Viewpoint-v3`** (5-Point Integrated Viewpoint Simulation Architect, 5-IVSP)가 전체 실행 엔진으로 자동 발동됩니다.
>
> 이 프로토콜은 사용자의 직관적 시점 명령(슬라이더 값)을 수치 지리 좌표로 변환하고, 4-Layer Synergy와 3-Phase Simulation을 통해 결정론적 최종 실행 프롬프트를 생성합니다.
>
> **발동 흐름:**
> `Action Trigger` → `Protocol 초기화 (Ontological Declaration)` → `Phase 1: Coordinate Anchoring` → `Phase 2: Optical Engineering` → `Phase 3: Layering Execution` → `SMS 자동 매핑` → `Final Execution Prompt 생성`

1.  **Action Trigger**: 사용자가 우측 하단의 Generate 버튼 클릭.
> **5-IVSP 온톨로지 선언 (Layer 1: Governance)**
> *   **Subject (불변 상수)**: 입력된 건축물의 형태(Geometry)는 수정 불가능한 "Completed Reality"로 선언. 비율, 구조, 디테일은 Immutable Constants.
> *   **Observer (변수)**: 사용자의 시점 명령은 건축물을 수정하는 지시가 아닌, 관찰자(Brown Point)의 카메라 궤도 경로(Camera Orbit Path). 오직 관찰자의 위치와 렌즈 설정만 변수.
> *   **Sanctuary Mode**: 온톨로지가 위반되는 명령(창문 개수 변경, 층수 변경 등) 감지 시 렌더링 실행 중단.

3.  **Deterministic Prompt Assembly (5-IVSP 실행 엔진 가동)**:

    **5-IVSP 연동 지식 문서 구조:**
    *   `{Viewpoint Change Simulation Technical Spec}` **(헌법)**: Sanctuary Mode, 재질 잠금, Reality Definition→Strategy→Analysis→Execution→Polish 파이프라인 제어.
    *   `{protocol-5_Point}` **(실행 엔진)**: 직관→좌표 변환, 5-Point Matrix 벡터 계산, 최적 렌즈/퍼스펙티브 자동 선택.
    *   `{Viewpoint Analysis 1 & 2}` **(시각 사전)**: 수직 사전(고도/수평선 관계), 수평 사전(방향 로직/볼륨 제어) 정의.
    *   `{protocol-Blind Spot Inference}` **(추론 엔진)**: 비가시권 설계 DNA 연장, 내부 기능(주거/사무) 역추론으로 코어 위치 및 후면 창호/도어 배치 결정.

    **5-IVSP 3단계 실행 프로세스:**
    *   **Phase 1: Coordinate Anchoring** — 사용자 슬라이더 입력(Angle, Altitude)을 **시계 방향 벡터**로 변환하고 Brown Point(관찰자)의 GPS 좌표 확정. (정면 Facade = 06:00 기준)
        *   **[정면 기준 전이]**: PHASE 2 Step 5에서 고정된 `Primary_Facade`(FRONT Elevation 슬롯)가 이 단계의 **06:00 원점(Origin)**으로 자동 전이됨. 절대 방위(North)가 아닌 건축물의 설계 정면이 기준.
    *   **Phase 2: Optical Engineering** — **Haversine 공식**으로 관찰자↔건축물 거리 계산 후 최적 렌즈(mm) 및 퍼스펙티브 자동 선택. 정면=1-Point, 코너=2-Point Perspective.
    *   **Phase 3: Layering Execution** — 확정된 좌표에 재질(Material Injection) 및 광학 레이어 적용. 비가시권(Rear/Side) 이동 시 `protocol-Blind Spot Inference` 엔진 자동 가동.


    **Protocol B 물성 위계 조립 (5면 전개도 렌더링 시):**
    *   사용자가 조정한 **광학/시점 파라미터** (Angle 01:30, Altitude 45deg, 85mm 등) 결합.
    *   Phase 2에서 메모리에 숨겨둔 **건축 입면 파라미터** (Exposed Concrete, Punch Window 등)를 호출하여 Step 5: Structural & Material Parameters로 강제 주입.
    *   **B-1. Geometry Master Locking (형태 고정)**:
        *   5개 뷰 시퀀스를 순회하며 `1_Geometry_Data_MASTER`에서 절대 수치 추출.
        *   재질 연산이 보류된 순수 3D 화이트박스 메쉬 자동 생성 후, Z-Depth / Surface Normal / 3-Tier Line 3종 레퍼런스 맵 추출.
        *   ControlNet에 최대 가중치(1.0)로 적용하여 픽셀의 절대 좌표 시스템에 고정.
    *   **B-2. Property Slave Injection (속성 주입)**:
        *   `2_Property_Data_SLAVE`만 활용하여 PBR 물성(알베도, 거칠기, 반사율), 유리 굴절/투과율, AO 그림자, 표면 풍화 레벨 등 3단계 물성 위계 텍스트 프롬프트 조립.
        *   텍스트 내 형태를 암시하는 단어를 배제하여, 이미지 프롬프트가 확정한 기하학적 뼈대를 보호.
    *   **B-3. Dynamic AO 설정**: 도시 맥락 파라미터를 통합 적용하여 동적 환경광 차폐(Dynamic AO) 기본 강도 설정.

    **최종 출력 포맷 (3파트 구조, `template.md` 필수 준수):**
    *   `[Metacognitive Coordinate Analysis]`: 입력 벡터 변환 결과(시계 방향) + 5-Point 상태 판정 + 거리 분석 기반 렌즈 그룹 선택.
    *   `[Scenario & Optical Simulation]`: 매핑된 시나리오 + 카메라 바디/렌즈mm/조리개 스펙.
    *   `[Final Execution Prompt]`: 아래 **`template.md`** 구조를 반드시 준수하여 결정론적 프롬프트 생성. 임의 프롬프트 생성 금지.

    ```
    # SYSTEM: 5-Point Integrated Viewpoint Simulation Architect (5-IVSP)

    # GOAL
    Change the angle of view of the provided architectural image to a specific new perspective without altering the building's original geometry, materials, or style.
    Then, translate the user's abstract directional commands into "Numerical Geo-Spatial Coordinates" and simulate a photorealistic architectural image based on physical optical laws. The objective is to execute a "Physical Movement Command" within a completed 3D reality, shifting from simple generation to precise "Coordinate-Based Virtual Photography."

    # CONTEXT
    - Ontological Status: The input image is a "Completed Architectural Reality." It is a fixed physical object, not a sketch.
    - Operational Logic: Apply "Intuition-to-Coordinate Translation". Convert subjective inputs (e.g., "Show me the right side") into precise relative vectors (e.g., "3 o'clock position relative to the facade").
    - Geometric Sanctuary: The building's proportions, structure, and details are Immutable Constants. Only the observer (Brown Point) moves.

    # ROLE
    Coordinate Controller & Virtual Architectural Photographer
    You are an engine that calculates precise GPS coordinates relative to the subject and selects optimal industrial standard camera equipment (Fujifilm GFX 100S, Phase One, etc.) based on the calculated distance and angle.

    # ACTION PROTOCOL (MANDATORY EXECUTION WORKFLOW)
    ## Pre-Step: Define Viewpoint Delta (Δ) & Anchor Reality

    GOAL: Define the coordinates before (V₀) and after (V₁) the change to confirm this is a "Physical Camera Movement" rather than simple image generation.

    1. Current Viewpoint Analysis (V₀):
       - Input Status: Reverse-engineer the camera position of the input image.
       - Example: "Top-Down Aerial View (Satellite View, Pitch -90°, Altitude 300m)"
       - Geometry Check: Fix the building's geometric form and layout identified in the current view as an "Immutable Reference."

    2. Target Viewpoint Setting (V₁):
       - User Command: Convert the user's request into specific coordinates.
       - Input: "Bird's-eye view from {4 o'clock direction}"
       - Coordination: Azimuth 120° (4 o'clock), Altitude 45° (High Angle), Distance 200m.

    3. Movement Vector Calculation (Δ):
       - Action: Calculate the Optimal Orbit Path from V₀ to V₁.
       - Continuity: Maintain the "Geometric Sanctuary" protocol to ensure the building's form is not distorted.

    ## Step 1: Coordinate Anchoring & Vector Calculation
    1. Define Reference: Fix the building's main facade at 06:00 (Front).
    2. Translate Input: Convert the user's request into a specific vector.
       - "Right/Side" → 03:00 Vector
       - "Rear/Back" → 12:00 Vector
       - "Bird's eye" → High Altitude (>150m)
       - "Corner/General" → 04:30 Vector (ISO View)

    ## Step 2: Scenario Mapping & Optical Engineering
    - IF [Street View (06:00~06:30)]: Mount 23mm Tilt-Shift on Fujifilm GFX 100S. Height 1.6m.
    - IF [Aerial View (High Altitude)]: Mount 32mm on Phase One System. >150m.
    - IF [Detail View (Close-range)]: Mount 110mm Macro (f/2.8).
    - IF [General View (04:30 Corner)]: Mount 45mm Standard Lens. 2-Point Perspective.

    ## Step 3: Layering & Blind Spot Inference
    1. Perspective Enforcement: 1-Point (face-on) / 2-Point (corner).
    2. Blind Spot Logic (Inside-Out):
       - Trigger: Moving to Rear (12:00) or hidden sides.
       - Execution: Extract Design DNA. Place Service Doors, Ventilation Windows, MEP details.
    3. Material Injection: Lock original textures. Apply Relighting only for new solar angle.

    ## Step 4: Final Execution & Compliance Check
    - Command: "Orbit the Brown Point to the target coordinate and capture the Completed Reality."
    - Compliance Monitor:
      [ ] Is the original geometry preserved 100%? (No Hallucination)
      [ ] Is the perspective mathematically correct? (No Distortion)
      [ ] Is the blind spot logically inferred? (No Blank Spaces)

    [GENERATE IMAGE NOW]
    ```


---

## **PHASE 4. SYNTHESIS & GENERATION (통합 프롬프트 조립 및 최종 이미지 생성)**
PHASE 2(건축 설계 진실)와 PHASE 3(5-IVSP 시점 제어)의 출력물을 포함한 **단일 결정론적 최종 프롬프트**를 조립하고 이미지를 생성하는 확정 실행 단계.

1.  **Integration Validation (콜레스터뢰 통합 검증)**:
    *   PHASE 2 산출물 `ensemble_pair` 성립 여부 재확인: `1_Geometry_Data_MASTER` + `2_Property_Data_SLAVE` 모두 존재할 때만 진행.
    *   PHASE 3 5-IVSP Coordinate Anchoring 결과(Azimuth/Altitude/렌즈 수치) 유효성 확인.
    *   **양손역부족 시 실행 차단**(업로드 이미지 없거나 시점 설정이 완료 되기 전 실행 불가).

2.  **Unified Prompt Assembly (3레이어 통합 프롬프트 조립)**:

| 레이어 | 데이터 소스 | 렌더링 역할 |
|---|---|---|
| **Layer A (형태 고정)** | PHASE 2 `1_Geometry_Data_MASTER` | ControlNet Image Prompt, 가중치 1.0 |
| **Layer B (시점 주입)** | PHASE 3 5-IVSP Phase 1/2 결과 + **`analyzedOpticalParams`(V₀)** | template.md Pre-Step + Step 1~2 변수 주입 |
| **Layer C (물성 주입)** | PHASE 2 `2_Property_Data_SLAVE` + PHASE 3 Material Injection | template.md Step 3~4 변수 주입 |

    *   **통합 우선순위 규칙**: 형태(Geometry)는 항상 최종 결정권(MASTER). 시점은 5-IVSP Phase 1 GPS 좌표가 절대적으로 우선. 물성은 PHASE 2 분석값이 PHASE 3 Relighting 전에 고정.
    *   **Elevation Parameter 직접 주입**: `elevationParams`(Mass Typology, Core, Material, Fenestration, Balcony)를 template.md Step 5(구조/재질 파라미터)로 강제 주입.
    *   **[V73] Layer B Pre-Step — V₀ 실제 좌표 주입 (카메라 이동 벡터 Δ 계산)**:
        *   `analyzedOpticalParams` (PHASE 1에서 AI가 역산한 원본 카메라 위치)를 V₀로 프롬프트에 명시적으로 주입.
        *   사용자가 슬라이더로 설정한 값이 V₁(목표 시점)이며, AI는 V₀→V₁ 이동 벡터(Δ)를 계산하여 정밀한 카메라 궤도 경로를 실행.
        *   **주입 포맷**: `V₀: Angle ${v0_angle} | Altitude ${v0_altitude} | Lens ${v0_lens}` / `Δ: ${v0_angle} → ${currentAngle}`

3.  **Final Image Generation (AI 렌더링 실행)**:
    *   **Engine:** `gemini-3.1-flash-image-preview` (MODEL_IMAGE_GEN)
    *   Layer A(Geometry MASTER) + Layer B(5-IVSP 시점) + Layer C(Property SLAVE) 통합 패키지를 AI 엔진에 전송.
    *   원본 이미지(Reference)와 5면 참조 시트(`architecturalSheetImage`) 동시 제공.
    *   **Compliance Check**:
        *   [ ] 원본 형태 100% 보존? (No Hallucination)
        *   [ ] 퍼스펙티브 수학적 정확성? (No Distortion)
        *   [ ] 비가시권 논리적 완성? (No Blank Spaces)
        *   [ ] **정면(06:00) 방위 보존?** (Primary_Facade 기준 유지, No Reorientation)


4.  **Result Projection (결과 출력 및 캔버스 주입)**:
    *   생성된 이미지를 `simulationViewpoint` 상태에 저장.
    *   코드 시도 영역에 원본 이미지 우측에 새 `CanvasItem`으로 주입. 선택 자동 활성화.
    *   다운로드 버튼 활성화 (`simulation.png`).

