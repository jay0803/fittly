package kr.co.fittly.dto.ai.vision;

import lombok.*;
import java.util.List;
import java.util.Map;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class VisionTextResponse {
    private String text;
}

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
class VisionAnalyzePayload {
    private String question;
    private List<String> allowedTags;
    private Map<String,Object> userContext;
    private String imageUrl;      // 파일 없는 경우
}

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
class ChatMessage {
    private String role;          // system/user/assistant
    private String text;
    private String imageData;     // dataURL (optional)
}

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
class VisionChatRequest {
    private List<ChatMessage> messages;
    private List<String> allowedTags;
    private Map<String,Object> userContext;
}
