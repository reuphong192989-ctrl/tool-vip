import { GoogleGenAI, Type } from "@google/genai";
import type { AnalysisAndScript, SeriesBible, CharacterProfile } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = (error) => reject(error);
  });
};

export const suggestKeywords = async (youtubeUrl: string): Promise<string[]> => {
  if (!youtubeUrl) {
    throw new Error("YouTube URL is required to suggest keywords.");
  }

  const prompt = `Phân tích nội dung của video YouTube tại URL này: ${youtubeUrl}. Dựa trên tiêu đề, mô tả và nội dung có thể suy ra được, hãy tạo một danh sách gồm 10-15 từ khóa chính và phụ có liên quan. Các từ khóa này phải hữu ích để tạo nội dung mới, có liên quan. Trả về các từ khóa dưới dạng một mảng JSON chứa các chuỗi ký tự. Chỉ trả về mảng JSON, không có markdown hay giải thích nào khác.`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.STRING,
        },
      },
    },
  });

  try {
    const jsonText = response.text;
    const result = JSON.parse(jsonText);
    return result as string[];
  } catch (e) {
    console.error("Failed to parse keyword suggestion response from Gemini:", response.text, e);
    throw new Error("AI returned an invalid response for keywords. Please try again.");
  }
};

// --- START: NEW SCHEMA DEFINITIONS ---

const motionPromptSchema = {
  type: Type.OBJECT,
  properties: {
    character: { type: Type.STRING, description: "Description of all characters in the scene, in English. CRITICAL: This MUST START WITH the full, detailed descriptions (concatenation of 'description' and 'appearance' fields) from EACH character's profile object in 'ho_so_nhan_vat'." },
    setting: { type: Type.STRING, description: "A very detailed description of the immediate environment and atmosphere in English, including specific objects, furniture, and overall feel (e.g., 'In a cozy, slightly cluttered living room, hidden behind a large armchair')." },
    lighting: { type: Type.STRING, description: "Detailed description of the lighting to create a specific mood, in English (e.g., 'Soft, warm, and slightly shadowed lighting to enhance the feeling of a secret')." },
    action: { type: Type.STRING, description: "Description of the characters' actions in the scene, in English. Be specific and evocative (e.g., 'Whispering conspiratorially')." },
    dialogue: { type: Type.STRING, description: "The dialogue for the scene. CRITICAL RULE: If multiple characters are speaking, you MUST prefix each line with the character's name (e.g., 'Bé An: Con chào mẹ! Mẹ: Chào con yêu.'). The total dialogue MUST NOT exceed 20 words or approximately 100 characters. This is essential to keep the scene under 8 seconds. This must be written in a style appropriate for each character's 'voice_profile'." },
    camera_movement: { type: Type.STRING, description: "Instructions for camera movement, in English. Should complement the action and mood." },
    sound_effects: { type: Type.STRING, description: "Relevant sound effects, in English. Include subtle sounds that add to the atmosphere." },
    background_music: { type: Type.STRING, description: "Description of the style or mood of the background music, in English." },
    secondary_character_details: { type: Type.STRING, description: "OPTIONAL. Detailed description of any secondary character's appearance and actions/reactions in this specific scene, in English (e.g., 'The red panda is perched on the armrest, looking at the biscuit with wide, eager eyes')." },
    visuals_notes: { type: Type.STRING, description: "Ghi chú sản xuất hoặc hình ảnh quan trọng cho cảnh này bằng tiếng Việt. Ví dụ: 'Cần nhấn mạnh biểu cảm ngạc nhiên của nhân vật', 'Sử dụng hiệu ứng slow-motion ở đoạn này'."},
    negativeMotionPrompt: { type: Type.STRING, description: "A comprehensive negative prompt to avoid unwanted elements in the motion (e.g., 'shaky camera, flickering lights, inconsistent character appearance, harsh lighting, empty background'), in English." }
  },
  required: ['character', 'setting', 'lighting', 'action', 'dialogue', 'camera_movement', 'sound_effects', 'background_music', 'visuals_notes', 'negativeMotionPrompt']
};

const sceneSchema = {
  type: Type.OBJECT,
  properties: {
    sceneNumber: { type: Type.INTEGER, description: "Số thứ tự cảnh, bắt đầu từ 1 và tăng dần liên tục qua tất cả các phần." },
    setting: { type: Type.STRING, description: "Mô tả bối cảnh hoặc địa điểm của cảnh bằng tiếng Việt." },
    imagePrompt: { type: Type.STRING, description: "A highly detailed and evocative prompt for an image generation AI, written in English. CRITICAL: This prompt MUST be a synthesis of the following, in order: 1. The full, detailed description from 'phong_cach_hinh_anh'. 2. The full description (concatenated 'description' and 'appearance' fields) from the profile(s) of ALL character(s) in the 'ho_so_nhan_vat' array present in the scene. 3. The detailed 'setting', 'lighting', 'action', and 'secondary_character_details' from this scene's motionPrompt to create a complete, cinematic picture." },
    negativeImagePrompt: { type: Type.STRING, description: "Negative prompt for the image generation AI, in English. E.g., 'deformed, blurry, extra limbs, ugly, bad hands'." },
    motionPrompt: motionPromptSchema,
  },
  required: ['sceneNumber', 'setting', 'imagePrompt', 'negativeImagePrompt', 'motionPrompt'],
};

const seoSchema = {
    type: Type.OBJECT,
    properties: {
        tieu_de: { type: Type.STRING, description: "Một tiêu đề video hấp dẫn, tối ưu SEO, bằng tiếng Việt." },
        tu_khoa_chinh: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Danh sách 2-3 từ khóa chính quan trọng nhất bằng tiếng Việt." },
        tu_khoa_phu: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Danh sách 4-5 từ khóa phụ, hỗ trợ cho từ khóa chính, bằng tiếng Việt." },
        tu_khoa_lien_quan: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Danh sách các từ khóa liên quan hoặc LSI (Latent Semantic Indexing) bằng tiếng Việt." }
    },
    required: ["tieu_de", "tu_khoa_chinh", "tu_khoa_phu", "tu_khoa_lien_quan"]
};

const characterProfileSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "Tên nhân vật." },
    description: { type: Type.STRING, description: "Mô tả chi tiết về nhân vật, bao gồm cả vai trò và nguồn gốc nếu có." },
    appearance: { type: Type.STRING, description: "Mô tả cực kỳ chi tiết về ngoại hình: khuôn mặt, tóc, phong cách, trang phục đặc trưng." },
    personality: { type: Type.STRING, description: "Mô tả tính cách cốt lõi của nhân vật." },
    voice_profile: { type: Type.STRING, description: "Mô tả chi tiết giọng nói: Tông (Tone), Cao độ (Pitch), Tốc độ (Speed), và Phong cách (Style)." }
  },
  required: ["name", "description", "appearance", "personality", "voice_profile"]
};

const scriptSchema = {
  type: Type.OBJECT,
  properties: {
    overview: {
      type: Type.OBJECT,
      properties: {
        tom_tat: { type: Type.STRING, description: "Tóm tắt ngắn gọn nội dung chính của kịch bản bằng tiếng Việt." },
        boi_canh: { type: Type.STRING, description: "Mô tả bối cảnh chung của video bằng tiếng Việt." },
        ho_so_nhan_vat: { 
            type: Type.ARRAY,
            description: "Một mảng các đối tượng, mỗi đối tượng là một hồ sơ chi tiết cho TỪNG nhân vật (chính và phụ). Đây là nguồn dữ liệu duy nhất cho thông tin nhân vật.",
            items: characterProfileSchema 
        },
        tong_giong: { type: Type.STRING, description: "Tông giọng và phong cách chung của video (ví dụ: hài hước, nghiêm túc, truyền cảm hứng) bằng tiếng Việt." },
        phong_cach_hinh_anh: { type: Type.STRING, description: "Phong cách hình ảnh nhất quán cho toàn bộ video (ví dụ: 'Hoạt hình 3D phong cách Pixar', 'Ảnh thực tế, điện ảnh, 8K') bằng tiếng Việt. Đây là yếu tố quyết định để hình ảnh nhất quán." }
      },
      required: ["tom_tat", "boi_canh", "ho_so_nhan_vat", "tong_giong", "phong_cach_hinh_anh"]
    },
    seo: seoSchema,
    intro: { type: Type.ARRAY, description: "Mở đầu: Các cảnh giới thiệu, tạo sự tò mò (hook).", items: sceneSchema },
    body: { type: Type.ARRAY, description: "Thân bài: Các cảnh phát triển nội dung chính, cao trào.", items: sceneSchema },
    outro: { type: Type.ARRAY, description: "Kết luận: Các cảnh kết thúc, tóm tắt và kêu gọi hành động (CTA).", items: sceneSchema }
  },
  required: ["overview", "seo", "intro", "body", "outro"]
};

const competitorAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    structuralAnalysis: {
      type: Type.ARRAY,
      description: "Phân tích cấu trúc của video đối thủ, chia theo từng phân đoạn với mốc thời gian. Bằng tiếng Việt.",
      items: {
        type: Type.OBJECT,
        properties: {
          phan_doan: { type: Type.STRING, description: "Tên phân đoạn và mốc thời gian. Ví dụ: 'Mở đầu - Hook (0:00 - 0:25)'." },
          mo_ta: { type: Type.STRING, description: "Mô tả ngắn gọn nội dung và mục đích của phân đoạn đó." }
        },
        required: ["phan_doan", "mo_ta"]
      }
    },
    strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Danh sách các điểm mạnh chính của video đối thủ. Bằng tiếng Việt." },
    weaknesses: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Danh sách các điểm yếu, thiếu sót hoặc cơ hội bị bỏ lỡ của video đối thủ. Bằng tiếng Việt." },
    contentGaps: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Đúng 3 lỗ hổng nội dung hoặc góc nhìn mà đối thủ chưa khai thác. Bằng tiếng Việt." }
  },
  required: ["structuralAnalysis", "strengths", "weaknesses", "contentGaps"]
};

const suggestionsSchema = {
  type: Type.OBJECT,
  properties: {
    titles: { type: Type.ARRAY, items: { type: Type.STRING }, description: "5 tiêu đề video được tối ưu hóa SEO và thu hút, dựa trên kịch bản mới. Bằng tiếng Việt." },
    thumbnailIdeas: { type: Type.ARRAY, items: { type: Type.STRING }, description: "5 ý tưởng thumbnail độc đáo, gây tò mò, thể hiện được nội dung kịch bản mới. Bằng tiếng Việt." }
  },
  required: ["titles", "thumbnailIdeas"]
};

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    competitorAnalysis: competitorAnalysisSchema,
    optimizedScript: scriptSchema,
    suggestions: suggestionsSchema
  },
  required: ["competitorAnalysis", "optimizedScript", "suggestions"]
};

// --- END: NEW SCHEMA DEFINITIONS ---

export interface GenerationOptions {
    scriptType: 'analysis' | 'series';
    scriptDuration: string;
    genre: string;
    language: string;
    voice: string;
    // for analysis
    youtubeUrl?: string;
    userYoutubeUrl?: string;
    referenceImages?: File[];
    competitiveAngle?: string;
    targetKeywords?: string[];
    suggestedKeywords?: string[];
    // for series
    seriesBibleContent?: string; 
    lastSceneJson?: string;
    newEpisodeTopic?: string;
}

export const generateScript = async (options: GenerationOptions): Promise<AnalysisAndScript> => {
  let prompt: string;
  let imageParts: any[] = [];
  const durationInMinutes = parseInt(options.scriptDuration, 10);
  
  // Calculations for scene count flexibility
  const targetScenes = Math.round((durationInMinutes * 60) / 8);
  const minDurationInMinutes = Math.max(1, durationInMinutes - 1);
  const maxDurationInMinutes = durationInMinutes + 1;
  const minScenes = Math.round((minDurationInMinutes * 60) / 8);
  const maxScenes = Math.round((maxDurationInMinutes * 60) / 8);


  if (options.scriptType === 'analysis') {
    if (!options.youtubeUrl || !options.referenceImages) {
        throw new Error("YouTube URL and reference images are required for analysis.");
    }
    imageParts = await Promise.all(options.referenceImages.map(async (file) => {
        const base64Image = await fileToBase64(file);
        return {
          inlineData: {
            mimeType: file.type,
            data: base64Image,
          },
        };
    }));
    const userUrlInstruction = options.userYoutubeUrl
      ? `\n- URL Video/Kênh của bạn để tham khảo phong cách: ${options.userYoutubeUrl}`
      : '';
    const suggestedKeywordInstruction = options.suggestedKeywords && options.suggestedKeywords.length > 0
      ? `\n- Từ khóa gợi ý (để tham khảo): ${options.suggestedKeywords.join(', ')}.`
      : '';
    const targetKeywordInstruction = options.targetKeywords && options.targetKeywords.length > 0
      ? `\n- TỪ KHÓA SEO MỤC TIÊU (bắt buộc phải tối ưu cho): ${options.targetKeywords.join(', ')}.`
      : '';
    const styleInstruction = options.genre.toLowerCase().includes('3d')
      ? `**YÊU CẦU PHONG CÁCH HÌNH ẢNH (TỐI QUAN TRỌNG):**\n       - 'phong_cach_hinh_anh' PHẢI là một phong cách hoạt hình 3D chi tiết (ví dụ: 'Pixar-style 3D animation, vibrant colors, soft textures, cinematic lighting'). TUYỆT ĐỐI KHÔNG tạo prompt ảnh thực.`
      : `**YÊU CẦU PHONG CÁCH HÌNH ẢNH (TỐI QUAN TRỌNG):**\n       - 'phong_cach_hinh_anh' PHẢI là một phong cách điện ảnh, thực tế (ví dụ: 'Cinematic, realistic 8K photo, dramatic lighting, sharp focus, hyper-detailed'). TUYỆT ĐỐI KHÔNG tạo prompt hoạt hình.`;
    
    prompt = `
    Nhiệm vụ của bạn là một AI chiến lược gia nội dung và biên kịch bậc thầy.

    **Thông tin đầu vào:**
    - URL Video Đối Thủ để Phân Tích: ${options.youtubeUrl}${userUrlInstruction}
    - Hình ảnh tham chiếu về phong cách.
    - Thể loại yêu cầu: ${options.genre}
    - Thời lượng kịch bản mong muốn: ${options.scriptDuration} phút.
    - Ngôn ngữ hội thoại: **${options.language}**.
    - Giọng đọc: **${options.voice}**.
    - Góc nhìn/Mục tiêu Cạnh tranh của tôi: "${options.competitiveAngle}"
    ${targetKeywordInstruction}
    ${suggestedKeywordInstruction}

    ${styleInstruction}

    **QUY TRÌNH THỰC HIỆN (2 GIAI ĐOẠN):**

    **GIAI ĐOẠN 1: PHÂN TÍCH ĐỐI THỦ CHUYÊN SÂU**
    1.  **Phân tích cấu trúc:** Xem video đối thủ, chia nhỏ thành các phân đoạn logic (Mở đầu, Vấn đề, Giải pháp, Cao trào, Kết luận, v.v.) kèm theo mốc thời gian và mô tả mục đích của từng đoạn.
    2.  **Đánh giá điểm mạnh/yếu:** Xác định chính xác những gì đối thủ làm tốt (ví dụ: cốt truyện, hình ảnh, nhịp độ) và những gì họ làm chưa tốt hoặc bỏ lỡ (ví dụ: tình tiết vô lý, lời thoại sáo rỗng, cái kết hụt hẫng).
    3.  **Tìm lỗ hổng nội dung (Content Gaps):** Đề xuất chính xác 3 góc nhìn hoặc khía cạnh mà video đối thủ chưa khai thác, đây sẽ là cơ hội để chúng ta tạo ra sự khác biệt.
    4.  Điền tất cả thông tin này vào đối tượng \`competitorAnalysis\`.

    **GIAI ĐOẠN 2: SÁNG TẠO KỊCH BẢN VƯỢT TRỘI & ĐỀ XUẤT CHIẾN LƯỢC**
    1.  **Viết kịch bản mới:** Dựa trên TOÀN BỘ phân tích ở Giai đoạn 1, "Góc nhìn/Mục tiêu Cạnh tranh" của tôi, và quan trọng là phải kết hợp phong cách từ các hình ảnh tham chiếu và từ video/kênh của tôi (nếu được cung cấp), hãy viết một kịch bản **hoàn toàn mới** cùng thể loại.
        - **Mục tiêu:** Giữ lại điểm mạnh, khắc phục triệt để điểm yếu, và lấp đầy các content gaps đã xác định. Kịch bản của bạn phải **hấp dẫn hơn, logic hơn, và có cao trào kịch tính hơn**. Nó phải là phiên bản nâng cấp toàn diện.
        - Tối ưu hóa nội dung kịch bản để xoay quanh các "TỪ KHÓA SEO MỤC TIÊU".
    2. **Xây dựng Hồ sơ Nhân vật (CỰC KỲ QUAN TRỌNG):** Trong 'overview.ho_so_nhan_vat', bạn phải tạo một mảng các hồ sơ CHI TIẾT cho TỪNG nhân vật. Mỗi hồ sơ phải bao gồm: 'name', 'description', 'appearance', 'personality', và 'voice_profile' (mô tả chi tiết Tông, Cao độ, Tốc độ, Phong cách nói). Đây sẽ là nền tảng cho sự nhất quán của cả series sau này.
    3.  **Đạo diễn từng cảnh:**
        - Mỗi 'motionPrompt' phải là một bức tranh sống động, gợi tả cảm xúc và không khí.
        - Thêm 'visuals_notes' (bằng tiếng Việt) để đưa ra các chỉ dẫn sản xuất quan trọng.
    4.  **Đề xuất chiến lược:** Tạo 5 tiêu đề và 5 ý tưởng thumbnail hấp dẫn, tối ưu SEO cho kịch bản mới này.
    5.  Điền kịch bản vào \`optimizedScript\` và các đề xuất vào \`suggestions\`.

    **5 QUY TẮC VÀNG VỀ TÍNH NHẤT QUÁN (TUYỆT ĐỐI KHÔNG VI PHẠM):**
    1.  **ĐỒNG NHẤT HÌNH ẢNH:** Chuỗi 'phong_cach_hinh_anh' từ phần overview phải được sao chép y hệt và đặt ở **ĐẦU TIÊN** trong **MỌI** 'imagePrompt'.
    2.  **TOÀN VẸN NHÂN VẬT (CỰC KỲ QUAN TRỌNG):** Với **MỌI CẢNH**, bạn phải xác định (các) nhân vật nào xuất hiện. Sau đó:
        -   Tìm (các) đối tượng hồ sơ tương ứng của **TẤT CẢ** các nhân vật đó trong mảng \`overview.ho_so_nhan_vat\`.
        -   Trong 'imagePrompt', ngay sau phần 'phong_cach_hinh_anh', bạn PHẢI chèn vào mô tả đầy đủ, chi tiết của **TẤT CẢ** các nhân vật đó bằng cách kết hợp chuỗi từ trường 'description' và 'appearance' trong hồ sơ của họ.
        -   Trường 'character' trong 'motionPrompt' cũng PHẢI bắt đầu bằng mô tả đầy đủ (kết hợp 'description' và 'appearance') của **TẤT CẢ** các nhân vật đó.
        -   Sự nhất quán này là yếu tố then chốt và phải được thực hiện chính xác tuyệt đối.
    3.  **NHẤT QUÁN GIỌNG NÓI & GÁN THOẠI:** Toàn bộ lời thoại ('dialogue') phải được viết theo phong cách phù hợp với **'voice_profile' của nhân vật đang nói**. **Nếu có nhiều nhân vật nói trong một cảnh, bạn BẮT BUỘC phải định dạng lời thoại là 'TÊN NHÂN VẬT: Lời thoại...' để chỉ định rõ ai đang nói.**
    4.  **KỶ LUẬT NGÔN NGỮ (MỆNH LỆNH):** TOÀN BỘ trường 'dialogue' PHẢI và CHỈ ĐƯỢC viết bằng ngôn ngữ **${options.language}**. TUYỆT ĐỐI KHÔNG được sử dụng bất kỳ ngôn ngữ nào khác trong trường 'dialogue'. Các trường mô tả tiếng Anh phải bằng tiếng Anh, các trường tiếng Việt phải bằng tiếng Việt.
    5.  **LIÊN TỤC CẢNH QUAY (LOGIC NỐI TIẾP):** Đảm bảo tính liền mạch tuyệt đối giữa các cảnh. Hành động, lời thoại, hoặc bối cảnh ở đầu mỗi cảnh PHẢI là sự tiếp nối trực tiếp và logic từ cuối cảnh ngay trước đó. Việc chuyển cảnh phải mượt mà như một bộ phim thực thụ, không có những bước nhảy vọt vô lý về thời gian hoặc không gian trừ khi đó là ý đồ nghệ thuật rõ ràng (ví dụ: montage, flashback).

    **QUY TẮC TỐI THƯỢỢNG VỀ SỐ LƯỢỢNG CẢNH (MỆNH LỆNH QUAN TRỌNG NHẤT):**
    -   Dựa trên thời lượng yêu cầu ${options.scriptDuration} phút, tổng số cảnh của kịch bản (cộng dồn từ intro, body, và outro) BẮT BUỘC PHẢI nằm chính xác trong khoảng từ **${minScenes} đến ${maxScenes} cảnh**.
    -   Đây là một MỆNH LỆNH TUYỆT ĐỐI, không phải gợi ý. Việc tạo ra số cảnh nằm ngoài khoảng này được coi là một thất bại hoàn toàn.
    -   Bạn PHẢI điều chỉnh nhịp độ câu chuyện, kéo dài hoặc rút ngắn các tình tiết để câu chuyện vừa vặn một cách hoàn hảo trong giới hạn số cảnh đã cho. Đừng chỉ viết câu chuyện rồi đếm cảnh; hãy thiết kế câu chuyện để đạt được số cảnh mục tiêu.
    -   Phân bổ tổng số cảnh vào Intro, Body, Outro một cách hợp lý. 'sceneNumber' phải tăng dần liên tục và không được reset.

    **YÊU CẦU SẮT ĐÁ KHÁC:**
    - **Thời lượng lời thoại (CỰC KỲ QUAN TRỌNG):** Mỗi cảnh chỉ dài tối đa 8 giây. Do đó, trường 'dialogue' TUYỆT ĐỐI KHÔNG ĐƯỢC VƯỢT QUÁ 20 TỪ (khoảng 100 ký tự). Vi phạm quy tắc này sẽ gây ra lỗi nghiêm trọng.

    Chỉ trả về một đối tượng JSON hợp lệ duy nhất tuân thủ schema. Không có bất kỳ văn bản giải thích nào khác.
    `;
  } else if (options.scriptType === 'series') {
    if (!options.seriesBibleContent || !options.lastSceneJson || !options.newEpisodeTopic) {
        throw new Error("Series Bible, last scene, and new topic are required for series generation.");
    }
    prompt = `
    Nhiệm vụ của bạn là một AI biên kịch bậc thầy, chuyên viết kịch bản nối tiếp cho series.

    **Bối cảnh:** Bạn sẽ viết kịch bản cho TẬP TIẾP THEO của một series đã có. Bạn phải duy trì sự nhất quán tuyệt đối với các tập trước.
    
    **Thông tin đầu vào CỐT LÕI:**
    1.  **SERIES BIBLE (Kim chỉ nam):** Đây là file JSON chứa các quy tắc bất biến của series.
        -   Nội dung: ${options.seriesBibleContent}
        -   **MỆNH LỆNH:** Mọi mô tả về nhân vật, phong cách hình ảnh, và tông giọng trong kịch bản mới PHẢI TUÂN THỦ TUYỆT ĐỐI theo Series Bible này.
    2.  **CẢNH CUỐI CỦA TẬP TRƯỚC:** Đây là file JSON của cảnh cuối cùng đã diễn ra.
        -   Nội dung: ${options.lastSceneJson}
        -   **MỆNH LỆNH:** Cảnh đầu tiên của tập mới phải là sự tiếp nối trực tiếp, hợp lý từ hành động/lời thoại trong cảnh này.
    3.  **CHỦ ĐỀ/Ý TƯỞNG CHO TẬP MỚI:**
        -   Nội dung: "${options.newEpisodeTopic}"
    
    **Thông tin Sản xuất:**
    -   Thời lượng kịch bản mong muốn: ${options.scriptDuration} phút.
    -   Ngôn ngữ hội thoại: **${options.language}**.
    -   Giọng đọc: **${options.voice}**.
    
    **QUY TRÌNH THỰC HIỆN:**
    1.  **Nghiên cứu Tài liệu:** Đọc và hiểu sâu sắc Series Bible, Cảnh Cuối Tập Trước, và Chủ đề Tập Mới.
    2.  **Viết kịch bản Nối tiếp:**
        -   Dựa trên "Chủ đề Tập Mới", hãy viết một kịch bản **hoàn toàn mới** và hấp dẫn.
        -   **Cảnh Mở đầu:** Phải bắt đầu ngay sau diễn biến của "Cảnh Cuối Tập Trước".
        -   **Tính nhất quán:** Áp dụng Series Bible một cách nghiêm ngặt cho tất cả các cảnh để đảm bảo nhân vật, hình ảnh, và không khí không bị thay đổi.
    3.  **Đạo diễn từng cảnh:**
        -   Mỗi 'motionPrompt' phải sống động và phù hợp với tông giọng đã định.
        -   Thêm 'visuals_notes' (bằng tiếng Việt) để đưa ra các chỉ dẫn sản xuất.
    4.  **Tạo Đề xuất Mới:** Dựa trên kịch bản vừa viết, tạo 5 tiêu đề và 5 ý tưởng thumbnail mới, hấp dẫn cho tập phim này.
    5.  **Bỏ qua Phân tích:** Vì đây là tập nối tiếp, bạn không cần phân tích video đối thủ. Hãy điền vào trường \`competitorAnalysis\` với dữ liệu giả hoặc thông báo rằng đây là tập nối tiếp. Ví dụ: structuralAnalysis: [{phan_doan: "N/A", mo_ta: "Đây là kịch bản nối tiếp series, không thực hiện phân tích đối thủ mới."}], strengths: [], weaknesses: [], contentGaps: [].
    
    **5 QUY TẮC VÀNG VỀ TÍNH NHẤT QUÁN (TUYỆT ĐỐI KHÔNG VI PHẠM):**
    1.  **ĐỒNG NHẤT HÌNH ẢNH:** Chuỗi 'phong_cach_hinh_anh' từ **Series Bible** phải được sao chép y hệt và đặt ở **ĐẦU TIÊN** trong **MỌI** 'imagePrompt'.
    2.  **TOÀN VẸN NHÂN VẬT (CỰC KỲ QUAN TRỌNG):** Với **MỌI CẢNH**, bạn phải xác định (các) nhân vật nào xuất hiện. Sau đó:
        -   Tìm (các) đối tượng hồ sơ tương ứng của **TẤT CẢ** các nhân vật đó trong mảng \`ho_so_nhan_vat\` trong **Series Bible**.
        -   Trong 'imagePrompt', ngay sau phần 'phong_cach_hinh_anh', bạn PHẢI chèn vào mô tả đầy đủ, chi tiết của **TẤT CẢ** các nhân vật đó bằng cách kết hợp chuỗi từ trường 'description' và 'appearance' trong hồ sơ của họ.
        -   Trường 'character' trong 'motionPrompt' cũng PHẢI bắt đầu bằng mô tả đầy đủ (kết hợp 'description' và 'appearance') của **TẤT CẢ** các nhân vật đó.
        -   Sự nhất quán này là yếu tố then chốt và phải được thực hiện chính xác tuyệt đối.
    3.  **NHẤT QUÁN GIỌNG NÓI & GÁN THOẠI:** Toàn bộ lời thoại ('dialogue') phải được viết theo phong cách phù hợp với **'voice_profile' của nhân vật đang nói** trong Series Bible. **Nếu có nhiều nhân vật nói trong một cảnh, bạn BẮT BUỘC phải định dạng lời thoại là 'TÊN NHÂN VẬT: Lời thoại...' để chỉ định rõ ai đang nói.**
    4.  **KỶ LUẬT NGÔN NGỮ (MỆNH LỆNH):** TOÀN BỘ trường 'dialogue' PHẢI và CHỈ ĐƯỢC viết bằng ngôn ngữ **${options.language}**. TUYỆT ĐỐI KHÔNG được sử dụng bất kỳ ngôn ngữ nào khác trong trường 'dialogue'. Các trường mô tả tiếng Anh phải bằng tiếng Anh, các trường tiếng Việt phải bằng tiếng Việt.
    5.  **LIÊN TỤC CẢNH QUAY (LOGIC NỐI TIẾP):** Đảm bảo tính liền mạch tuyệt đối giữa các cảnh. Hành động, lời thoại, hoặc bối cảnh ở đầu mỗi cảnh PHẢI là sự tiếp nối trực tiếp và logic từ cuối cảnh ngay trước đó. Việc chuyển cảnh phải mượt mà như một bộ phim thực thụ, không có những bước nhảy vọt vô lý về thời gian hoặc không gian trừ khi đó là ý đồ nghệ thuật rõ ràng (ví dụ: montage, flashback).
    
    **QUY TẮC TỐI THƯỢỢNG VỀ SỐ LƯỢỢNG CẢNH (MỆNH LỆNH QUAN TRỌNG NHẤT):**
    -   Dựa trên thời lượng yêu cầu ${options.scriptDuration} phút, tổng số cảnh của kịch bản (cộng dồn từ intro, body, và outro) BẮT BUỘC PHẢI nằm chính xác trong khoảng từ **${minScenes} đến ${maxScenes} cảnh**.
    -   Đây là một MỆNH LỆNH TUYỆT ĐỐI, không phải gợi ý. Việc tạo ra số cảnh nằm ngoài khoảng này được coi là một thất bại hoàn toàn.
    -   Bạn PHẢI điều chỉnh nhịp độ câu chuyện, kéo dài hoặc rút ngắn các tình tiết để câu chuyện vừa vặn một cách hoàn hảo trong giới hạn số cảnh đã cho. Đừng chỉ viết câu chuyện rồi đếm cảnh; hãy thiết kế câu chuyện để đạt được số cảnh mục tiêu.
    -   Phân bổ tổng số cảnh vào Intro, Body, Outro một cách hợp lý. 'sceneNumber' phải tăng dần liên tục và không được reset.
    
    **YÊU CẦU SẮT ĐÁ KHÁC:**
    - **Thời lượng lời thoại (CỰC KỲ QUAN TRỌNG):** Mỗi cảnh chỉ dài tối đa 8 giây. Do đó, trường 'dialogue' TUYỆT ĐỐI KHÔNG ĐƯỢC VƯỢT QUÁ 20 TỪ (khoảng 100 ký tự). Vi phạm quy tắc này sẽ gây ra lỗi nghiêm trọng.
    
    Chỉ trả về một đối tượng JSON hợp lệ duy nhất tuân thủ schema. Không có bất kỳ văn bản giải thích nào khác.
    `;
  } else {
    throw new Error("Invalid script type specified.");
  }
  
  const textPart = { text: prompt };
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-pro',
    contents: { parts: [textPart, ...imageParts] },
    config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.8,
    }
  });

  try {
    const jsonText = response.text;
    const result = JSON.parse(jsonText);

    if (options.scriptType === 'analysis') {
      const overview = result.optimizedScript.overview;
      const seriesBible: SeriesBible = {
        ho_so_nhan_vat: overview.ho_so_nhan_vat,
        phong_cach_hinh_anh: overview.phong_cach_hinh_anh,
        tong_giong: overview.tong_giong,
        boi_canh_chung: overview.boi_canh
      };
      return { id: `analysis_${new Date().getTime()}`, seriesBible, ...result } as AnalysisAndScript;
    }

    // For series script, we don't generate a *new* series bible, it uses the existing one.
    const seriesBibleFromInput = JSON.parse(options.seriesBibleContent || '{}');
    return { 
        id: `series_${new Date().getTime()}`, 
        seriesBible: seriesBibleFromInput, // Attach the bible that was used
        ...result 
    } as AnalysisAndScript;
  } catch (e) {
    console.error("Không thể phân tích phản hồi từ Gemini dưới dạng JSON:", response.text, e);
    throw new Error("AI đã trả về một phản hồi không hợp lệ. Vui lòng thử lại.");
  }
};
