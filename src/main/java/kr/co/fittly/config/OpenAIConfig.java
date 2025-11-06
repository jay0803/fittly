package kr.co.fittly.config;

import com.openai.client.OpenAIClient;
import com.openai.client.okhttp.OpenAIOkHttpClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenAIConfig {

    @Bean
    public OpenAIClient openAIClient(@Value("${openai.api.key:}") String apiKey) {
        if (apiKey != null && !apiKey.isBlank()) {
            return OpenAIOkHttpClient.builder()
                    .apiKey(apiKey.trim())
                    .build();
        }
        String envKey = System.getenv("OPENAI_API_KEY");
        if (envKey != null && !envKey.isBlank()) {
            return OpenAIOkHttpClient.builder()
                    .apiKey(envKey.trim())
                    .build();
        }
        throw new IllegalStateException(
                "OPENAI_API_KEY가 설정되지 않았습니다. " +
                        "환경변수 OPENAI_API_KEY 또는 application.properties의 openai.api.key를 설정하세요.");
    }
}
