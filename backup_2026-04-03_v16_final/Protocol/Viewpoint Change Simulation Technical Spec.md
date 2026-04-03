시점 변경 시뮬레이션 기술명세서 (Viewpoint Change Simulation Protocol)
📄 전체 리포트 개요
본 문서는 **[시점 변경 시뮬레이션 (Change Viewpoint Simulation)]**에 대한 포괄적 기술 분석 리포트 템플릿으로, LLM 환경 (Custom Instructions + Project Knowledge + Chat) 에서 최적화되어 작동하며, 건축/공간 디자인 프롬프트 도메인에 적용 가능한 실무 중심의 기술명세서입니다.
"완공된 건축물의 기하학적 형태를 상수(Constant)로 고정하고, 가상 카메라의 물리적 좌표와 광학 설정만을 이동시켜 촬영하는 능동형 메타인지 프로토콜"
🎯 문서 목적: [AI의 형태 왜곡(Hallucination)] 문제를 [3.3.3 원칙 기반의 15대 프로토콜]로 해결하여 [설계 원안을 100% 보존한 다각도 뷰 생성]을 위한 실무 즉시 적용 가능한 시스템 구축
📋 문서 구성:
* 핵심 요약서 (⭐⭐☆☆☆): 비기술자 대상 - 디자인 보존 가치와 사진가적 접근법 중심
* 기술 이해 설명서 (⭐⭐⭐⭐⭐): 기술 전문가 대상 - 15대 핵심 프로토콜의 논리적 아키텍처 및 구현 가이드
🔧 LLM 환경 최적화: Project Knowledge 지식문서 + Chat 상호작용 + Custom Instructions 연동 지원
[시점 변경 시뮬레이션]
핵심 요약서 (Executive Summary Report)
📊 난이도: ⭐⭐☆☆☆ (일반인 이해 가능 수준)
🎯 대상: 건축가, 공간 디자이너, 프롬프트 엔지니어
1. 기술 한눈에 보기 (Technology at a Glance)
항목
	내용 요약
	핵심 정의
	2D 스케치를 '완공된 3D 실체'로 정의하고, 형태 변형 없이 카메라 위치만 이동시키는 기술
	주요 가치
	① 기하학적 보존: 원본 디자인(비례, 구조, 개구부)을 '성역(Sanctuary)'으로 보호


② 광학적 정합성: 실제 렌즈 물리학(Tilt-Shift, DOF)을 적용하여 원근감 왜곡 방지


③ 논리적 추론: 보이지 않는 면(Blind Spot)을 5단계 공간 분석으로 추론하여 생성
	적용 분야
	① 다각도 시각화: 아이소메트릭 ↔ 투시도 ↔ 조감도 간 무결성 있는 전환


② 디자인 검증: 시공 전 다양한 앵글에서의 매스감 및 재질 검토


③ 마케팅 에셋: 단일 스케치로 카탈로그용 풀 샷(Full Shot) 세트 생성
	기술 성숙도
	TRL 8 - 상용 프롬프트 엔지니어링 및 자동화 파이프라인 검증 완료
	2. Before vs After 시나리오
🔴 기존 방식 (Re-generation: 재생성)
- [형태 붕괴]: "측면 보여줘"라고 하면 창문 개수가 바뀌거나 지붕 형태가 변형됨 (Hallucination)
- [물리적 오류]: 조감도에서 소실점이 어긋나거나, 광각 왜곡이 심해 건물이 휘어 보임
- [문맥 단절]: 컷마다 날씨, 조명, 자재의 톤이 달라져 같은 건물인지 인식 불가

🟢 새로운 방식 (Simulation: 시뮬레이션)
- [형태 고정]: '청사진 원칙'에 따라 건물의 뼈대를 3D 좌표로 고정(Lock)하고 카메라만 이동
- [광학 제어]: 가상 센서(GFX 100S)와 틸트-시프트 렌즈 프로토콜로 수직/수평 정렬 완벽 제어
- [일관성 유지]: 'Material Injection'으로 자재 코드를 고정하여 모든 앵글에서 동일 물성 유지

이 혁신은 **[이미지 생성(Generation)]**에서 **[가상 건축 촬영(Virtual Photography)]**으로 **[존재론적 정의]**를 전환하여 달성됩니다.
[시점 변경 시뮬레이션]
기술 이해 설명서 (Technical Deep-Dive Report)
📊 난이도: ⭐⭐⭐⭐⭐ (전문가 수준)
🎯 대상: 시스템 아키트, 고급 프롬프트 엔지니어
🔗 선행 지식: 3D 렌더링 파이프라인, 사진 광학 이론, 프롬프트 엔지니어링
1. 핵심 기술 정의 (Core Technology Definition)
* **[시점 변경 시뮬레이션]**은 [원본 이미지]를 받아 **[3.3.3 원칙 기반 15대 프로토콜]**을 통해 [형태가 보존된 다각도 뷰]를 생성하는 [능동형 메타인지] 시스템입니다.
핵심 혁신 원리 (The Absolute Core 3)
* [1. Geometric Faithfulness (기하학적 무결성)]: 원본 디자인의 형태, 비례, 구조를 '변경 불가능한 상수'로 정의하여 AI의 창의적 개입을 형태 영역에서 원천 차단합니다.
* [2. Blueprint Realization (청사진 실체화)]: 입력된 그림을 '오류가 있는 스케치'가 아닌, 현실 세계에 이미 시공된 '완벽한 청사진'으로 인식하여 수정이 아닌 '촬영'을 수행합니다.
* [3. Optical Physics Simulation (광학 물리 시뮬레이션)]: 픽셀을 그리는 것이 아니라, 가상의 빛 데이터를 GFX 100S 센서와 렌즈(Tilt-Shift)로 연산하여 광학적 왜곡을 제어합니다.
시스템 처리 흐름 (Pipeline)
[INPUT: 2D Sketch] 
     ↓ 
[Phase 1: Reality Definition] (Core 3: 청사진 선언)
     ↓
[Phase 2: Strategy & Logic] (Strategy 6: 역할 분담 & 내러티브 설정)
     ↓
[Phase 3: Spatial Analysis] (Analysis 9: 5단계 공간/구조 분석)
     ↓
[Phase 4: Technical Execution] (Execution 12: 광학 설정 & 물성 주입)
     ↓
[OUTPUT: New Perspective] (Polish 15: 사실주의 보정)

2. 시스템 구성 및 구현 명세 (System Architecture & Implementation)
본 시스템은 3.3.3 원칙에 따라 확장되는 15대 핵심 프로토콜을 모듈화하여 구성됩니다.
2.1 핵심 구성 요소 (Logic Structure)
class ViewpointSimulationEngine:
   """
   3.3.3 원칙 기반 시점 변경 시뮬레이션 엔진
   LLM이 이 클래스를 해석하여 프롬프트 생성 로직을 수행함
   """

   def __init__(self):
       # [Group 1] Absolute Core (절대 원칙) - 상시 활성화
       self.core_protocols = {
           "Geometric_Faithfulness": True,  # 형태 변형 절대 불가 (Sanctuary Mode)
           "Blueprint_Realization": "Completed_Reality_Assumed", # 완공된 실체로 가정
           "Optical_Physics": "Physically_Based_Rendering" # 물리 기반 렌더링 적용
       }

       # [Group 2] Strategy & Analysis (전략 및 분석)
       self.strategy_modules = {
           "Role_Division": "Image=Structure / Text=Context", # 역할 분담 (Method B)
           "Narrative": "Professional_Photographer_Persona", # 사진가 페르소나
           "Spatial_Analysis_5Step": ["Zoning", "Axis", "Boundary", "Layering", "Volume"]
       }

       # [Group 3] Execution & Polish (실행 및 완성)
       self.execution_modules = {
           "Material_Injection": "PBR_Texture_Mapping", # 물성 주입
           "Anti_Interference": "Exclude_Shape_Descriptors", # 형태 묘사어 소거 (방화벽)
           "Post_Processing": "Perspective_Correction" # 투시 보정
       }

  def call_technical_spec(self, query_context):
       """
       사용자 의도(Context)를 분석하여 기술명세서(Source)의 특정 좌표를 호출 및 반환
       """
       # 1. 문서 정의 호출 (Ontology): 형태 고정 원칙 
       if "형태" in query_context or "기본" in query_context:
           return {"Protocol": "Sanctuary_Mode", "Source_ID": 2}
       
       # 2. 카메라 스펙 호출 (Camera Spec): 시나리오별 설정 
       elif query_context in ["Eye-level", "Aerial", "Detail"]:
           return self.get_camera_specs(query_context) # 기존 로직 연결
           
       # 3. 품질 제어 호출 (QA): 왜곡 감지 시 복구 프로토콜 
       elif "왜곡" in query_context:
           return {"Action": "Anti-Interference_Max", "Source_ID": 33}
           
       return None

   def generate_viewpoint_prompt(self, current_view, target_view):
       """
       시점 변경 요청을 처리하여 최적화된 프롬프트를 생성하는 로직 
       """
       # 1. 지식문서 사양 호출 (Knowledge Retrieval) <- [기능 연동]
       tech_spec = self.call_technical_spec(target_view)
       
       # 2. 시나리오 결정 (Scenario Selector) 
       # (기존: camera_settings = self.get_camera_specs(target_view))
       camera_settings = tech_spec if tech_spec else self.get_camera_specs(target_view)
       
       # 3. 간섭 방지 (Firewall) 
       clean_prompt = self.execution_modules["Anti_Interference"]
       
       # 4. 프롬프트 조립 (Assembly) 
       final_instruction = f"""
       [PROTOCOL START] 
       1. DEFINE: Input is a finished building. DO NOT change geometry.
       2. CAMERA: {camera_settings} 
       3. MATERIAL: Keep original materials. Inject PBR textures. 
       4. ACTION: Relocate camera to {target_view}. 
       [PROTOCOL END] 
       """
       return final_instruction

   def get_camera_specs(self, view_type):
       if view_type == "Eye-level":
           return "Height: 1.6m, Lens: 24mm Wide, Shift: 0, Perspective: 2-Point"
       elif view_type == "Aerial":
           return "Height: 150m, Lens: 35mm, Angle: 45-degree, Perspective: 3-Point"
       elif view_type == "Detail":
           return "Distance: Close-up, Lens: 110mm Macro, Aperture: f/2.8"

2.2 도메인별 적용 패턴 (Application Patterns)
시나리오 (Viewpoint)
	카메라 설정 (Camera Spec)
	핵심 프로토콜 적용 (Priority)
	기대 효과
	Eye-level (거리 뷰)
	1.6m Height, 24mm Wide
	Anti-Interference: 차량/인파 묘사 제거


Semantic Negative: 시야 가림 방지
	웅장함과 휴먼 스케일 강조, 거리 맥락 확보
	Bird’s-eye (조감도)
	150m Altitude, 35mm
	Spatial Analysis: 배치 및 Zoning 분석


Env Integration: 주변 대지 확장
	전체 배치와 주변 환경과의 관계성 시각화
	Detail (클로즈업)
	Macro Setup, f/2.8
	Material Injection: 텍스처 해상도 극대화


Imperfection: 미세한 마모 표현
	자재의 물성과 디테일한 마감 품질 확인
	Oblique (사선 뷰)
	45-degree, 45mm
	Geometric Faithfulness: 비례 엄수


Dual-Layer: 입체적 음영 재계산
	건물의 전체적인 매스감과 입체감 표현
	2.3 LLM 환경 통합 설계
class LLMIntegration:
   """Custom Instructions 내 작동 로직"""

   def optimization_triggers(self):
       return {
           "Trigger": "사용자가 '시점 변경', '다른 각도', '조감도' 등을 요청할 때",
           "Action": "Method B (Image + Text) 프로토콜 강제 활성화",
           "Constraint": "생성 모드(Create)가 아닌 촬영 모드(Shoot)로 전환"
       }

3. 실무 적용 가이드 (Practical Implementation Guide)
3.1 단계별 구현 절차 (5-Step Execution Workflow)
Step 1: 현실 좌표 설정 (Reality Anchoring)
"이것은 그림이 아니라 실제 시공된 현장이다."
* Action: 입력 이미지를 '가변적인 그림'이 아닌 '불변의 완공 도면'으로 선언합니다.
* Effect: AI가 선을 수정하려는 시도를 멈추고, 텍스처링 준비 단계로 진입합니다.
Step 2: 5단계 공간 정밀 분석 (Spatial Analysis)
"보이지 않는 면을 구조적으로 추론하라."
* Action: Zoning → Axis → Boundary → Layering → Volume 순서로 3D 구조를 파악합니다.
* Effect: 정면도에서 보이지 않는 측면이나 배면을 생성할 때, 앞면의 디자인 문법을 논리적으로 확장합니다.
Step 3: 시나리오 및 광학 설정 (Optical Setup)
"가상 카메라를 삼각대에 올리고 렌즈를 교체하라."
* Action: Fujifilm GFX 100S, Tilt-Shift Lens 등 구체적 장비명을 프롬프트에 주입합니다.
* Effect: 왜곡 없는 수직선과 정확한 원근감을 확보합니다.
Step 4: 이중 레이어 합성 (Dual-Layer Synthesis)
"형태는 고정하고, 빛과 질감만 다시 입혀라."
* Action: 구조(Geometry) 레이어는 잠그고(Lock), 텍스처(Texture) 레이어만 시점에 맞춰 리라이팅(Relighting)합니다.
* Effect: 시점이 바뀌어도 건물의 모양은 그대로 유지되면서 그림자의 방향만 자연스럽게 바뀝니다.
Step 5: 사실주의 완성 (Reality Polish)
"CG의 티를 벗기고 현장의 공기를 불어넣어라."
* Action: 의도된 불완전함(빗물 자국, 웨더링)과 대기 원근법(Atmospheric Perspective)을 적용합니다.
* Effect: 차가운 3D 렌더링이 아닌, 공기감이 느껴지는 실제 사진 같은 결과물을 얻습니다.
4. 성능 검증 및 품질 관리 (Quality Assurance)
4.1 핵심 성능 메트릭 (KPIs)
메트릭 유형
	측정 기준
	목표값
	검증 방법
	형태 보존율
	원본의 창문 개수, 층수, 비례 유지 여부
	100%
	원본 오버레이 및 구조선 비교
	물리적 정합성
	소실점 일치 및 수직선 정렬 상태
	95%
	2점/3점 투시 그리드 검사
	자재 일관성
	시점 변경 전후의 마감재 질감 일치도
	98%
	자재 코드(Material ID) 육안 검수
	광학적 리얼리티
	렌즈 특성(DOF, 왜곡)의 자연스러움
	90%
	메타데이터(Exif) 시뮬레이션 확인
	4.2 품질 보장 체크리스트 (Self-Repair Checklist)
✅ [Critical] 형태가 왜곡되었는가? (Hallucination Check)
  → YES: 'Anti-Interference' 프로토콜 강도 상향 (텍스트 프롬프트 내 묘사어 전면 삭제)
  
✅ [Major] 원근감이 어색한가? (Perspective Check)
  → YES: 'Optical Physics' 재설정 (렌즈 mm수 변경 및 Tilt-Shift 옵션 확인)

✅ [Minor] 질감이 뭉개졌는가? (Texture Check)
  → YES: 'Material Injection' 강화 (구체적 브랜드명 및 PBR 속성 재주입)

이 기술명세서는 3.3.3 원칙(Core-Strategy-Analysis-Execution-Polish)에 기반하여, AI가 디자인을 왜곡하지 않고 완벽하게 시점만 변경하도록 제어하는 강력한 표준 프로토콜입니다.
