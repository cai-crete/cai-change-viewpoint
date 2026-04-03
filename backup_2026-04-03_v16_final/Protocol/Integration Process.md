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
3.  **Image Pre-Processing — 이미지 재생성 (사용자 비노출)**: [분석] 버튼 클릭과 동시에 최초 수행.
    *   **Engine:** `gemini-3.1-flash-image-preview`
    *   **목적:** 업로드 원본의 JPEG 압축 노이즈, 렌즈 왜곡, 색보정 왜곡을 AI 정규화 거쳐 제거.
    *   **출력:** 내부 변수 `analysisImageBase64` — 캔버스에는 원본 이미지 유지, 이후 PHASE 1 분석에만 내부 사용.
    *   **실패 시:** Fallback으로 원본 이미지를 그대로 사용하며 분석 계속 진행.
4.  **Basic Viewpoint Analysis & 가이드라인 기반 분석 (분석 및 추출 동시 개시)**: 
    *   **Engine:** `gemini-3.1-pro-preview` (MODEL_ANALYSIS)
    *   **시점 추론:** 재생성된 이미지(`analysisImageBase64`)를 기반으로 "정면(06:00) 기준점" 대비 현재 관찰자의 시점 변수(Camera Angle, Altitude, Lens 설정)를 판단하여 상태(State) 값으로 업데이트.
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

## **PHASE 3. VIEWPOINT CONFIGURATION (Virtual Photography — 가상 촬영)**
사용자가 Generate 버튼을 클릭하는 순간. PHASE 2에서 확정된 5면 전개도 데이터를 3D 시공간에 고정하고, 지정된 좌표로 가상 카메라를 궤도 이동시켜 촬영(Render)하는 단계.

> **[Protocol Engine 자동 발동 — `protocol-Change Viewpoint-v4`]**
>
> PHASE 3가 개시되는 순간, **`protocol-Change Viewpoint-v4`** (Virtual Architectural Photography Engine)가 전체 실행 엔진으로 자동 발동됩니다.
>
> **핵심 패러다임 (v3 → v4 변경):**
> - **v3 (구 방식):** AI가 비가시권(후면/측면)에 서비스 도어, MEP 배관 등을 추론하여 새롭게 설계·추가하는 "생성(Generation)" 역할 수행.
> - **v4 (현재):** 건축물은 PHASE 2에서 이미 완성된 **'완성된 실체(Completed Reality)'**. AI는 형태를 수정하거나 추론할 권한이 없으며, 오직 **'좌표 통제관(Coordinate Controller) + 가상 사진가(Virtual Photographer)'**로서 카메라를 정확한 좌표로 이동시켜 사진을 찍는(렌더링) 임무만 수행.
>
> **발동 흐름:**
> `Generate 클릭` → `Protocol 초기화 (Ontological Declaration)` → `Phase 1: Coordinate Anchoring` → `Phase 2: Optical Engineering` → `Phase 3: Scene Capture Execution (촬영)` → `SMS 자동 매핑` → `최종 렌더링 이미지 반환`

1.  **Action Trigger**: 사용자가 우측 하단의 [Generate] 버튼 클릭.

> **[Layer 1: Governance — 온톨로지 선언 (Immutable Constants)]**
> *   **건축물 (불변 상수):** PHASE 2에서 확정된 5면 전개도 데이터(1_Geometry_MASTER + 2_Property_SLAVE)에 100% 종속. 형태, 비율, 마감재, 에이징 상태, 창호 위치 등은 절대 수정 불가능한 상수(Constant).
> *   **관찰자 카메라 (유일한 변수):** 사용자의 슬라이더 값(Angle, Altitude, Lens)은 건축물을 변형하는 지시가 아닌, 관찰자(Brown Point)의 궤도 경로(Camera Orbit Path). 오직 카메라 위치와 렌즈 설정만 변수.
> *   **형태 추가·타공 금지:** 비가시권(후면/측면)을 촬영할 때에도 새로운 창문, 도어, 배관 등을 추가·설계하는 행위 전면 차단.

2.  **Deterministic Prompt Assembly (결정론적 프롬프트 조립)**:

    **4-Layer Synergy 연동 지식 구조 (v4):**
    *   `{Viewpoint Change Simulation Technical Spec}` **(헌법)**: 1:1 데이터 매핑 강제. 원본 데이터 변형 차단.
    *   `{protocol-5_Point}` **(궤도 엔진)**: 직관 입력 → 5-Point Matrix 절대 좌표 변환, Haversine 거리 계산, 렌즈 자동 선택.
    *   `{Viewpoint Analysis 1 & 2}` **(광학 사전)**: 고도/수평선 관계, 방향별 볼륨 노출 범위 제어.
    *   `{protocol-Elevation Data Synchronization}` **(전개도 동기화 엔진)**: PHASE 2 확정 데이터를 3D 시공간에 있는 그대로(As-is) 종속시켜 안착. *(v3의 `protocol-Blind Spot Inference` 역할 대체)*

    **3단계 실행 프로세스 (v4):**
    *   **Phase 1: Coordinate Anchoring** — Angle/Altitude 슬라이더를 시계 방향 절대 벡터로 변환. PHASE 2의 `Primary_Facade`(06:00 고정 정면)를 원점(Origin)으로 자동 전이.
    *   **Phase 2: Optical Engineering** — Haversine 공식으로 관찰자-피사체 거리 계산 후 최적 렌즈·투시도법 결정. 정면 = 1-Point Perspective, 코너(04:30 등) = 2-Point Perspective.
    *   **Phase 3: Scene Capture Execution** — 계산된 좌표에서 PHASE 2의 1_Geometry_MASTER + 2_Property_SLAVE 앙상블 객체를 로드하여, 지정된 화각(FOV)과 투시도법으로 광학적 결과물만 렌더링. 어떠한 형태 수정도 없이 셔터 실행.

3.  **Scenario Mapping System (SMS) 자동 매핑:**

    | 시나리오 | 조건 | 장비 설정 |
    |---|---|---|
    | **[A] Street View** | Angle 06:00, Altitude 1.6m | Fujifilm GFX 100S + 23mm Tilt-Shift |
    | **[B] Aerial View** | Altitude ≥150m | Phase One + 32mm |
    | **[C] Detail View** | Short Range (Macro) | 110mm Macro |
    | **[D] General View** | Angle 04:30 / 07:30 (Corner) | 45mm Standard, 2-Point Perspective |

4.  **Corner View Face Direction (코너 뷰 좌우 면 배치 규칙):**

    | 시점 | IMAGE 2 (화면 왼쪽/Left-hand face) | IMAGE 3 (화면 오른쪽/Right-hand face) |
    |---|---|---|
    | **04:30** (Front-Right 코너) | FRONT 입면 | RIGHT 입면 |
    | **07:30** (Front-Left 코너)  | LEFT 입면  | FRONT 입면 |
    | **1:30**  (Rear-Right 코너)  | REAR 입면  | RIGHT 입면 |
    | **10:30** (Rear-Left 코너)   | LEFT 입면  | REAR 입면  |

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

