# [Macro-AEPL 마스터 스키마: 도시 및 대지 맥락 파라미터 세팅]

# **1. 프로젝트 메타데이터 및 전역 제약 조건 (Global GIS & Environment)**
## 가상의 캔버스에서 확장-->실제 지구 좌표계와 광학 법칙을 세팅-->시스템 전역에 작용하는 환경 물리량과 동적 변수를 규정
* **`anchor_google_coordinates`**: [위도, 경도] (태양 궤적 및 그림자 연산의 절대 기준)
* **`site_base_elevation`**: [EL +00m] (대지 레벨 영점)
* **`time_and_season`**: [시간대] + [계절코드] (일조각, 식생 색상, 태양 남중 고도 동기화)
* **`M_atmospheric_optics`**: 빛 산란도, 틴들 현상, 안개 밀도, 글로벌 일루미네이션(GI) 반사 강도 및 입체감 확보를 위한 동적 환경광 차폐(Dynamic AO). 
* **`M_dynamic_agents`**: 보행자 군중 흐름, 이동 차량 모션 블러, 
* **`M_building_emissions`**: 야간 실내 조명 투사(Spill light), 실외기/냉각탑 배기 수증기, 

# **2. 뷰별 절대 카메라 및 렌즈 제어 (View Camera & Optics Map)**
## 피사체(건축물)를 중심에 세팅--> 5-GAP 벡터를 통해 카메라의 궤도를 직교 투영 방식 및 원근 투영 방식으로 제어 
* **`camera_5_GAP_vector`**: [06:00 / 04:30 / 12:00 등] (피사체 중심 상대 방위각. 정면 06:00 기준)
* **`camera_altitude_msl`**: [1.6m(Eye-level) / 45m(Drone) / 150m(Bird's-eye)]
* **`lens_optics`**: [24mm TS / 35mm / 85mm] (시야각 및 왜곡 제어)
* **절대 방위 맵핑:**
  * 정면(Front): 카메라 방위각 0, 법선 벡터 (0, -1, 0)
  * 탑(Top): 카메라 방위각 0, 고도 90, 법선 벡터 (0, 0, 1) 
  * 우측/좌측/배면 역시 90도 단위의 절대 방위와 법선 벡터로 카메라 위치를 수학적으로 고정. 

# **3. 공통 파라미터 딕셔너리 (Shared Entity Defaults)**
## 모든 도시/대지 맥락 객체는 형태(Geometry)와 속성(Property)이 서로의 영역을 침범하지 않고 완벽히 결합하는 `ensemble_pair` 형태로 짝을 이루어 저장
## **A. 1_Geometry_Data_MASTER (대지/도시 형태 확정자)**
*역할: 오직 Z-Depth/Normal Map 등 이미지 프롬프트로만 변환--> 픽셀이 존재해야 할 대지와 주변 건물의 절대적 시각적 경계와 3D 공간 좌표를 고정
* **[E-Series] 도시 맥락 및 외부 환경 기하학:** 
    * `E_mass_scale`: 인접 건물의 층수/높이/볼륨
    * `E_setback_distance`: 인접 대지 및 건물과의 이격 거리
    * `E_skyline_contour`: 가로 전체의 연속적 지붕선 및 스카이라인
    * `E_road_width`: 차선 수 및 폭원
    * `E_intersection_layout`: 교차로 및 가각 전제 형태
    * `E_view_corridor`: 가로망에 의한 시거 및 시각적 개방 축
* **[S-Series] 대지 내부 및 외부 공간 기하학:**
    * `S_paving_layout`: 보차도 분리선, 램프 경사도, 주차 구획선의 물리적 경계
    * `S_level_difference`: 단차 및 배수 구배
    * `S_ramp_clearance`: 차량 진출입구 폭/높이
    * `S_landscape_mounding`: 인공지반 고저차 및 지형 뼈대
    * `S_planter_structure`: 플랜터 및 수경 시설 물리적 형태
    * `S_tree_spacing`: 배식 간격 및 수관의 3D 체적 크기

## **B. 2_Property_Data_SLAVE (대지/도시 정보 귀속자)**
*역할: 오직 텍스트 프롬프트로만 변환--> 형태 마스터가 세워둔 시각적 틀 내부에 질감, 재질, 물리적 현상 등의 구체적인 수치값을 오차 없이 적용
* **[E-Series] 도시 맥락 및 외부 환경 속성:**
    * `E_facade_material`: 인접 건물 외장재의 반사율/색상 및 PBR 속성
    * `E_privacy_impact`: 시선 교차 및 간섭 정도
    * `E_shadow_cast`: 인접 건물 매스가 대상 대지로 드리우는 영구 음영 영역 및 일조 간섭
    * `E_traffic_density`: 통행 차량 밀도 및 동적 흐름
    * `E_street_furniture`: 가로등, 버스 쉘터 등 구조물의 질감 및 디테일
    * `E_paving_status`: 가로망 도로 아스팔트의 에이징 및 질감 상태
* **[S-Series] 대지 내부 및 외부 공간 속성:**
    * `S_paving_material`: 아스팔트/투수성 블록/친환경 포장재의 고유 알베도 및 거칠기
    * `S_ground_wetness`: 0.0~1.0 사이의 젖은 노면 반사율 및 PBR 렌더링 수치
    * `S_parking_occupancy`: 주차 차량 점유 밀도
    * `S_vegetation_type`: 상록/낙엽 구분 및 time_and_season에 연동된 계절별 엽색 변화
    * `S_green_coverage`: 녹지율 및 토심 마감 상태
    * `S_LID_status`: 저영향개발 우수 관리 시설(빗물 정원 등)의 표면 상태

# **4. 개별 객체 조립 및 앙상블 페어 동기화 (Entity_List Assembly)**
카메라가 정면, 배면, 측면 등 5개의 뷰 시퀀스를 순회할 때, 위에서 정의된 E-Series와 S-Series의 `ensemble_pair` 파라미터들이 방위각에 따라 화면의 전경(Foreground)과 배경(Background)으로 자동 교차 배치됩니다. 이 과정을 통해 건축물 단일 객체가 아닌 **'건축물 + 대지 + 도시 맥락'이 하나로 동기화된 완벽한 디지털 트윈 정사영 및 투시도**가 산출되어 렌더링 엔진으로 이관됩니다. 

