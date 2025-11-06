package kr.co.fittly.dto.ai;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import kr.co.fittly.vo.user.UserProfile.BodyType;
import lombok.*;

import java.util.List;
import java.util.Map;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AiAnalyzeResponse {

    /** 체형 코드(enum) — JSON에서는 "SLIM" 같은 문자열로 직렬화됨 */
    private BodyType bodyType;

    /** 체형 한글 표기 (슬림/보통/근육형/통통/기타) */
    private String bodyTypeKor;

    /** 스타일 점수 맵: 스타일코드 -> 점수 (0.0~1.0 등 가중치) */
    private Map<String, Double> styleScores;

    /** 감지된 스타일 "코드" 리스트 (예: ["MINIMAL","CLASSIC"]) */
    private List<String> detectedStyles;

    /** 감지된 스타일 "한글 라벨" 리스트 (예: ["미니멀","클래식"]) */
    private List<String> detectedStyleLabels;

    /** 업로드/저장된 사진 접근 URL 리스트 */
    private List<String> photoUrls;

    /** 심플 클라이언트 호환을 위한 파생 필드: bodyType 문자열 코드 */
    @JsonProperty("bodyTypeCode")
    public String getBodyTypeCode() {
        return bodyType == null ? null : bodyType.name();
    }

    /* ================= 편의 팩토리 ================= */

    /** 모든 필드를 채울 때 사용 */
    public static AiAnalyzeResponse of(BodyType type,
                                       Map<String, Double> scores,
                                       List<String> styleCodes,
                                       List<String> styleLabels,
                                       List<String> photoUrls) {
        return AiAnalyzeResponse.builder()
                .bodyType(type)
                .bodyTypeKor(korOf(type))
                .styleScores(scores)
                .detectedStyles(styleCodes)
                .detectedStyleLabels(styleLabels)
                .photoUrls(photoUrls)
                .build();
    }

    /** 최소 정보만 내려야 할 때(심플 버전 대체) */
    public static AiAnalyzeResponse simple(String bodyTypeCode, List<String> styleCodes) {
        BodyType t = null;
        if (bodyTypeCode != null) {
            try { t = BodyType.valueOf(bodyTypeCode.toUpperCase()); } catch (Exception ignore) {}
        }
        return AiAnalyzeResponse.builder()
                .bodyType(t)
                .bodyTypeKor(korOf(t))
                .detectedStyles(styleCodes)
                .build();
    }

    /* ================= 내부 유틸 ================= */

    public static String korOf(BodyType t) {
        if (t == null) return null;
        return switch (t) {
            case SLIM -> "슬림";
            case NORMAL -> "보통";
            case MUSCULAR -> "근육형";
            case CHUBBY -> "통통";
            case OTHER -> "기타";
        };
    }
}
