// src/main/java/kr/co/fittly/dto/ai/vision/VisionDtos.java
package kr.co.fittly.dto.ai.vision;

import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.Map;

public class VisionDtos {

    // 대화 메시지(텍스트 + 이미지 dataURL)
    public record ChatMessage(
            @NotNull String role,     // "user" | "assistant" | "system"
            String text,
            String imageData          // data URL ("data:image/jpeg;base64,...")
    ) {}

    // === 팀원취합본 유지(호환성 보장) ===
    // 대화형 요청 (기존 시그니처)
    public record ChatRequest(
            @NotNull List<ChatMessage> messages,
            String model
    ) {}

    // === 추가: 확장 버전(V2) - allowedTags/userContext 포함 ===
    public record ChatRequestV2(
            @NotNull List<ChatMessage> messages,
            List<String> allowedTags,         // optional
            Map<String, Object> userContext,  // optional
            String model                       // optional
    ) {
        // 편의 팩토리: 기존 ChatRequest + 확장 옵션 → V2
        public static ChatRequestV2 of(ChatRequest base,
                                       List<String> allowedTags,
                                       Map<String, Object> userContext) {
            return new ChatRequestV2(base.messages(), allowedTags, userContext, base.model());
        }
    }

    // === 팀원취합본 유지(호환성 보장) ===
    // 업로드+1차 분석 요청(프리셋 카테고리 포함 가능)
    public record AnalyzeRequest(
            String question,
            List<String> categories
    ) {}

    // === 추가: 확장 버전(V2) - allowedTags/userContext/imageUrl 포함 ===
    public record AnalyzeRequestV2(
            String question,
            List<String> categories,
            List<String> allowedTags,         // optional
            Map<String, Object> userContext,  // optional
            String imageUrl                    // optional (파일 없이 URL로 분석)
    ) {
        // 편의 팩토리: 기존 AnalyzeRequest + 확장 옵션 → V2
        public static AnalyzeRequestV2 of(AnalyzeRequest base,
                                          List<String> allowedTags,
                                          Map<String, Object> userContext,
                                          String imageUrl) {
            return new AnalyzeRequestV2(base.question(), base.categories(), allowedTags, userContext, imageUrl);
        }
    }

    public record AiReply(String text) {}
}
