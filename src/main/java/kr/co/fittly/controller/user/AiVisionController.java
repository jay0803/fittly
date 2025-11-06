package kr.co.fittly.controller.user;

import jakarta.validation.Valid;
import kr.co.fittly.dto.ai.vision.VisionDtos.ChatMessage;
import kr.co.fittly.dto.ai.vision.VisionDtos.AnalyzeRequestV2;
import kr.co.fittly.dto.ai.vision.VisionDtos.ChatRequestV2;
import kr.co.fittly.service.ai.OpenAIVisionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.MimeTypeUtils;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@RestController
@RequestMapping({"/api/ai/public/vision", "/api/ai/vision"})
@RequiredArgsConstructor
public class AiVisionController {

    private final OpenAIVisionService vision;

    @PostMapping(
            value = "/analyze",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<?> analyze(
            @RequestPart(value = "file", required = false) MultipartFile file,
            @RequestPart(value = "payload", required = false) AnalyzeRequestV2 payload,
            @RequestPart(value = "question", required = false) String questionFallback,
            @RequestPart(value = "categories", required = false) List<String> categoriesFallback
    ) throws Exception {

        String question = null;
        List<String> allowedTags = null;
        Map<String, Object> userContext = null;
        String imageUrl = null;

        if (payload != null) {
            question = payload.question();
            allowedTags = payload.allowedTags();
            userContext = payload.userContext();
            imageUrl = payload.imageUrl();
        }
        if (!StringUtils.hasText(question)) question = questionFallback;

        if (!StringUtils.hasText(question)) {
            question = "이미지를 한국어로 분석해줘. 핵심요소(착장/실루엣/색감/포인트)와 개선 팁, 추천 코디 키워드.";
        }

        StringBuilder prompt = new StringBuilder(question);
        if (allowedTags != null && !allowedTags.isEmpty()) {
            prompt.append("\n\n[허용 태그] ").append(String.join(", ", allowedTags));
        }
        if (userContext != null && !userContext.isEmpty()) {
            prompt.append("\n\n[사용자 정보] ").append(userContext);
        }

        List<byte[]> images = new ArrayList<>();
        List<String> mimes  = new ArrayList<>();

        if (file != null && !file.isEmpty()) {
            images.add(file.getBytes());
            mimes.add(safeMime(file.getContentType()));
        } else if (StringUtils.hasText(imageUrl)) {
            var pair = loadFromUrlOrData(imageUrl);
            if (pair != null && pair.bytes.length > 0) {
                images.add(pair.bytes);
                mimes.add(pair.mime);
            }
        }

        String text = vision.analyze(prompt.toString(), images, mimes);
        return ResponseEntity.ok(Map.of("ok", true, "text", text));
    }

    @PostMapping(
            value = "/chat",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<?> chat(@Valid @RequestBody ChatRequestV2 req) throws Exception {
        List<ChatMessage> msgs = Optional.ofNullable(req.messages()).orElseGet(List::of);

        StringBuilder sb = new StringBuilder();
        String system = msgs.stream()
                .filter(m -> "system".equalsIgnoreCase(m.role()))
                .map(ChatMessage::text)
                .filter(Objects::nonNull)
                .findFirst().orElse(null);
        if (StringUtils.hasText(system)) sb.append("시스템 지침: ").append(system).append("\n\n");

        sb.append("아래는 지금까지의 대화 맥락입니다.\n");
        for (ChatMessage m : msgs) {
            if (!StringUtils.hasText(m.text())) continue;
            String role = m.role() == null ? "user" : m.role().toLowerCase(Locale.ROOT);
            sb.append("[").append(role).append("] ").append(m.text()).append("\n");
        }

        if (req.allowedTags() != null && !req.allowedTags().isEmpty()) {
            sb.append("\n[허용 태그] ").append(String.join(", ", req.allowedTags()));
        }
        if (req.userContext() != null && !req.userContext().isEmpty()) {
            sb.append("\n[사용자 정보] ").append(req.userContext());
        }

        String lastUserQ = null;
        for (int i = msgs.size() - 1; i >= 0; i--) {
            ChatMessage m = msgs.get(i);
            if ("user".equalsIgnoreCase(m.role()) && StringUtils.hasText(m.text())) {
                lastUserQ = m.text().trim();
                break;
            }
        }
        sb.append("\n\n이 맥락을 바탕으로 한국어로 간결하고 실전적인 답변을 해줘.");
        if (StringUtils.hasText(lastUserQ)) sb.append("\n특히 마지막 질문: ").append(lastUserQ);
        String prompt = sb.toString();
        List<byte[]> images = new ArrayList<>();
        List<String> mimes  = new ArrayList<>();
        for (ChatMessage m : msgs) {
            if (!StringUtils.hasText(m.imageData())) continue;
            DataUrl du = parseDataUrl(m.imageData());
            if (du != null && du.bytes != null && du.bytes.length > 0) {
                images.add(du.bytes);
                mimes.add(du.mime != null ? du.mime : MediaType.IMAGE_JPEG_VALUE);
            }
        }

        String text = vision.analyze(prompt, images, mimes);
        return ResponseEntity.ok(Map.of("ok", true, "text", text));
    }

    private static final Pattern DATA_URL_RE =
            Pattern.compile("^data([:\\w/+.-]*?)(;charset=[\\w-]+)?(;base64)?,(.*)$", Pattern.CASE_INSENSITIVE);

    private static DataUrl parseDataUrl(String dataUrl) {
        try {
            Matcher m = DATA_URL_RE.matcher(dataUrl);
            if (!m.matches()) return null;

            String header = m.group(1);
            String mime = (header != null && header.startsWith(":")) ? header.substring(1) : header;
            String b64  = m.group(3);
            String data = m.group(4);

            if (b64 != null) {
                byte[] bytes = Base64.getDecoder().decode(data);
                return new DataUrl(mime != null ? mime : MediaType.APPLICATION_OCTET_STREAM_VALUE, bytes);
            } else {
                byte[] bytes = java.net.URLDecoder.decode(data, StandardCharsets.UTF_8).getBytes(StandardCharsets.UTF_8);
                return new DataUrl(mime != null ? mime : "text/plain", bytes);
            }
        } catch (Exception e) {
            return null;
        }
    }

    private static String safeMime(String s) {
        return StringUtils.hasText(s) ? s : MediaType.IMAGE_JPEG_VALUE;
    }
    private static DataUrl loadFromUrlOrData(String url) {
        if (!StringUtils.hasText(url)) return null;
        if (url.startsWith("data:")) return parseDataUrl(url);

        try (InputStream in = new URL(url).openStream();
             ByteArrayOutputStream bos = new ByteArrayOutputStream()) {

            byte[] buf = new byte[8192];
            int r;
            while ((r = in.read(buf)) != -1) bos.write(buf, 0, r);

            String mime = guessMimeByExt(url);
            return new DataUrl(mime, bos.toByteArray());
        } catch (Exception ignore) {
            return null;
        }
    }

    private static String guessMimeByExt(String url) {
        String lower = url.toLowerCase(Locale.ROOT);
        if (lower.endsWith(".png"))  return MimeTypeUtils.IMAGE_PNG_VALUE;
        if (lower.endsWith(".webp")) return "image/webp";
        if (lower.endsWith(".gif"))  return "image/gif";
        return MediaType.IMAGE_JPEG_VALUE;
    }

    private record DataUrl(String mime, byte[] bytes) {}
}
