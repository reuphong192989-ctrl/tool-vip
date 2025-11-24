
export interface MotionPrompt {
  character: string;
  setting: string;
  lighting: string;
  action: string;
  dialogue: string;
  camera_movement: string;
  sound_effects: string;
  background_music: string;
  secondary_character_details?: string;
  visuals_notes: string;
  negativeMotionPrompt: string;
}

export interface Scene {
  sceneNumber: number;
  setting: string;
  imagePrompt: string;
  negativeImagePrompt: string;
  motionPrompt: MotionPrompt;
}

export interface SeoInfo {
  tieu_de: string;
  tu_khoa_chinh: string[];
  tu_khoa_phu: string[];
  tu_khoa_lien_quan: string[];
}

export interface CharacterProfile {
  name: string;
  description: string;
  appearance: string;
  personality: string;
  voice_profile: string; // Detailed string including Tone, Pitch, Speed, Style.
}


export interface ScriptOverview {
    tom_tat: string;
    boi_canh: string;
    ho_so_nhan_vat: CharacterProfile[];
    tong_giong: string;
    phong_cach_hinh_anh: string;
}

export interface Script {
  overview: ScriptOverview;
  seo: SeoInfo;
  intro: Scene[];
  body: Scene[];
  outro: Scene[];
}

export interface StructuralAnalysisItem {
  phan_doan: string; // e.g., "Mở đầu (0:00-0:30)"
  mo_ta: string;
}

export interface CompetitorAnalysis {
  structuralAnalysis: StructuralAnalysisItem[];
  strengths: string[];
  weaknesses: string[];
  contentGaps: string[];
}

export interface Suggestions {
  titles: string[];
  thumbnailIdeas: string[];
}

export interface SeriesBible {
  ho_so_nhan_vat: CharacterProfile[];
  phong_cach_hinh_anh: string;
  tong_giong: string;
  boi_canh_chung: string;
}

export interface AnalysisAndScript {
  id: string;
  competitorAnalysis: CompetitorAnalysis;
  optimizedScript: Script;
  suggestions: Suggestions;
  seriesBible?: SeriesBible;
}