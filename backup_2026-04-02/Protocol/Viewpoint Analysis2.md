# Viewpoint Analysis2

{
  "project_title": "Basic_Photo_Analysis_Perspective_Horizon",
  "core_principle": {
    "definition": "투시의 핵심은 관찰자(카메라)의 높이와 지평선(LH)의 관계",
    "terms": {
      "LH": "Linea del Horizonte (Horizon Line / Eye Level)",
      "LT": "Linea de Tierra (Ground Line)"
    }
  },
  "perspective_modules": [
    {
      "id": 1,
      "name_en": "Bird's Eye View",
      "name_kr": "조감도",
      "camera_position": "High (Above Subject)",
      "horizon_relation": "Above Top of Subject",
      "visual_features": [
        "Top face visible",
        "Broad overview",
        "Contextual layout"
      ],
      "prompt_keywords": ["High Angle", "Aerial Shot", "Cityscape"],
      "color_code": "Blue/Cool"
    },
    {
      "id": 2,
      "name_en": "Eye Level View",
      "name_kr": "눈높이 뷰",
      "camera_position": "Neutral (Standing Height)",
      "horizon_relation": "Through Middle of Subject",
      "visual_features": [
        "Vertical faces emphasized",
        "Human scale reality",
        "Minimal distortion"
      ],
      "prompt_keywords": ["Eye Level", "Straight On", "Human Scale"],
      "color_code": "Green/Neutral"
    },
    {
      "id": 3,
      "name_en": "Low Angle View",
      "name_kr": "로우 앵글 (개구리 시점)",
      "camera_position": "Low (Near Ground)",
      "horizon_relation": "Near or At Ground Line (LT)",
      "visual_features": [
        "Verticals exaggerated",
        "Monumentality",
        "Dynamic tension"
      ],
      "prompt_keywords": ["Low Angle", "Frog's Eye View", "Heroic"],
      "color_code": "Orange/Warm"
    },
    {
      "id": 4,
      "name_en": "Worm's Eye View",
      "name_kr": "앙시도",
      "camera_position": "Extreme Low (Below Subject Base)",
      "horizon_relation": "Far Below Subject",
      "visual_features": [
        "Bottom face visible",
        "Floating sensation",
        "Overwhelming scale"
      ],
      "prompt_keywords": ["Extreme Low Angle", "Look Up", "Surreal"],
      "color_code": "Red/Intense"
    }
  ],
  "application_guide": {
    "tip": "Do not describe vaguely; specify the angle (e.g., 'Eye-Level') to control the horizon line explicitly."
  }
}

{
  "project_title": "Advanced_Photo_Analysis_Directional_Viewpoints",
  "core_principle": {
    "definition": "피사체를 바라보는 수평적 방향(Horizontal Angle)과 면의 노출 범위에 따른 분류",
    "objective": "건축물의 입면(Facade), 볼륨감(Volume), 혹은 특정 기능(Roof)을 강조하기 위함"
  },
  "perspective_modules": [
    {
      "id": 5,
      "name_en": "Frontal View / Elevation",
      "name_kr": "정면 뷰 / 입면도",
      "camera_position": "Directly in front (0° Axis)",
      "visual_features": [
        "Symmetry emphasized",
        "Flat composition (2D feel)",
        "Formal and static atmosphere"
      ],
      "prompt_keywords": ["Front View", "Symmetrical Composition", "Elevation Shot", "Flat Lay"],
      "application": "Building facade design, formal portraits, product front packaging"
    },
    {
      "id": 6,
      "name_en": "Side View / Profile",
      "name_kr": "측면 뷰 / 프로필",
      "camera_position": "90° to the subject",
      "visual_features": [
        "Silhouette emphasis",
        "Depth implies length rather than volume",
        "Reveals structural details hidden from front"
      ],
      "prompt_keywords": ["Side Profile", "Side Angle", "Lateral View", "Silhouette"],
      "application": "Vehicle length, character profile, narrow building sides"
    },
    {
      "id": 7,
      "name_en": "Three-Quarter View",
      "name_kr": "반측면 뷰 (45도 얼짱각도)",
      "camera_position": "45° Angle (Corner focus)",
      "visual_features": [
        "Displays two faces (Front + Side)",
        "Maximizes 3D volume perception",
        "Most dynamic and informative angle"
      ],
      "prompt_keywords": ["3/4 View", "Three Quarter Angle", "Corner Shot", "Oblique View"],
      "application": "Real estate listing (standard), car photography, architectural volume"
    },
    {
      "id": 8,
      "name_en": "Rear View",
      "name_kr": "후면 뷰 / 배면도",
      "camera_position": "Directly behind (180° Axis)",
      "visual_features": [
        "Reveals context or 'hidden' aspects",
        "Storytelling (leaving, mystery)",
        "Service areas of buildings"
      ],
      "prompt_keywords": ["Rear View", "Back View", "From Behind", "Dorsal View"],
      "application": "Garden/patio design, character walking away, device ports/connections"
    },
    {
      "id": 9,
      "name_en": "Roof Plan / Top-Down",
      "name_kr": "지붕 뷰 / 평면도",
      "camera_position": "Directly above (90° Vertical down)",
      "visual_features": [
        "Geometric patterns of roofing",
        "Layout distribution",
        "Zero vertical distortion (Map-like)"
      ],
      "prompt_keywords": ["Top-Down", "Roof Plan", "Direct Overhead", "Knolling"],
      "application": "Roofing material detail, floor plan visualization, object organization"
    }
  ],
  "usage_tip": {
    "combination_strategy": "Combine vertical (e.g., Eye-Level) and horizontal (e.g., Frontal) angles for precise control. Example: 'Eye-Level Frontal View' vs 'High-Angle Three-Quarter View'."
  }
}
