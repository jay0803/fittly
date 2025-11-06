package kr.co.fittly.service.ai;

import com.openai.client.OpenAIClient;
import com.openai.models.ChatModel;
import com.openai.models.chat.completions.ChatCompletion;
import com.openai.models.chat.completions.ChatCompletionContentPart;
import com.openai.models.chat.completions.ChatCompletionContentPartImage;
import com.openai.models.chat.completions.ChatCompletionContentPartText;
import com.openai.models.chat.completions.ChatCompletionCreateParams;
import com.openai.models.chat.completions.ChatCompletionMessageParam;
import com.openai.models.chat.completions.ChatCompletionUserMessageParam;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class OpenAIVisionService {

    private final OpenAIClient client;

    @Value("${openai.model.vision:gpt-4o-mini}")
    private String defaultModel;

    /**
     * 업로드 이미지 + 프롬프트로 멀티모달 분석
     *
     * @param userPrompt     사용자 프롬프트(비워도 됨)
     * @param images         이미지 바이트 배열 목록(0~N장)
     * @param imageMimeTypes 각 이미지 MIME 타입(예: image/jpeg). null/부재 시 image/jpeg로 처리
     * @return 모델 텍스트 응답(없으면 안내 문구)
     */
    public String analyze(String userPrompt,
                          List<byte[]> images,
                          List<String> imageMimeTypes) {

        ChatModel model = mapModel(defaultModel);

        // 1) 텍스트 파트
        String prompt = (userPrompt != null && !userPrompt.isBlank())
                ? userPrompt
                : "업로드된 이미지를 보고 체형/스타일 특징을 요약하고, 어울리는 코디 3가지를 간단히 추천해줘.";

        List<ChatCompletionContentPart> parts = new ArrayList<>();
        parts.add(ChatCompletionContentPart.ofText(
                ChatCompletionContentPartText.builder().text(prompt).build()
        ));

        // 2) 이미지 파트(들)
        if (images != null) {
            for (int i = 0; i < images.size(); i++) {
                byte[] bytes = images.get(i);
                if (bytes == null || bytes.length == 0) continue;

                String mime = "image/jpeg";
                if (imageMimeTypes != null && i < imageMimeTypes.size() && imageMimeTypes.get(i) != null && !imageMimeTypes.get(i).isBlank()) {
                    mime = imageMimeTypes.get(i);
                }
                String dataUrl = "data:" + mime + ";base64," + Base64.getEncoder().encodeToString(bytes);

                parts.add(ChatCompletionContentPart.ofImageUrl(
                        ChatCompletionContentPartImage.builder()
                                .imageUrl(ChatCompletionContentPartImage.ImageUrl.builder()
                                        .url(dataUrl) // http(s) URL도 가능, 여기선 Data URL 사용
                                        .build())
                                .build()
                ));
            }
        }

        // 3) 유저 메시지 구성(컨텐츠 파트 배열)
        ChatCompletionUserMessageParam userMsg = ChatCompletionUserMessageParam.builder()
                .content(ChatCompletionUserMessageParam.Content.ofArrayOfContentParts(parts))
                .build();

        // 4) 요청 생성 및 호출
        ChatCompletionCreateParams params = ChatCompletionCreateParams.builder()
                .model(model)
                .addMessage(ChatCompletionMessageParam.ofUser(userMsg))
                .build();

        ChatCompletion completion = client.chat().completions().create(params);

        // 5) 첫 번째 choice의 message.content 문자열만 간단 추출
        if (completion.choices() != null && !completion.choices().isEmpty()) {
            Optional<String> out = completion.choices().get(0).message().content();
            String text = out.orElse("").trim();
            if (!text.isEmpty()) return text;
        }
        return "(분석 결과를 읽을 수 없습니다)";
    }

    // 문자열 모델명을 SDK 상수로 안전 매핑
    private static ChatModel mapModel(String name) {
        if (name == null) return ChatModel.GPT_4O_MINI;
        switch (name.trim().toLowerCase()) {
            case "gpt-5":
                return ChatModel.GPT_5;
            case "gpt-4o":
                return ChatModel.GPT_4O;
            case "gpt-4o-mini":
                return ChatModel.GPT_4O_MINI;
            default:
                return ChatModel.GPT_4O_MINI;
        }
    }
}
