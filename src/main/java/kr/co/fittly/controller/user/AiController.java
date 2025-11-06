package kr.co.fittly.controller.user;

import kr.co.fittly.dto.ai.AiAnalyzeResponse;
import kr.co.fittly.dto.ai.RecommendRequest;
import kr.co.fittly.dto.ai.RecommendResponse;
import kr.co.fittly.service.product.AiRecommendationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiRecommendationService aiService;

    @PostMapping({"/recommend", "/recommend/outfits"})
    public RecommendResponse recommend(@RequestBody RecommendRequest req, Authentication auth) {
        if (req.getOutfitCount() == null || req.getOutfitCount() < 1) req.setOutfitCount(2);
        Long userId = extractUserId(auth); // 없으면 null
        return aiService.recommend(req, userId);
    }

    @PostMapping({"/public/recommend", "/public/recommend/outfits"})
    public RecommendResponse preview(@RequestBody RecommendRequest req) {
        if (req.getOutfitCount() == null || req.getOutfitCount() < 1) req.setOutfitCount(2);
        return aiService.recommend(req, null); // 저장 없이 계산만
    }

    @PostMapping(
            value = { "/public/vision/analyze", "/vision/analyze", "/analyze" },
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public AiAnalyzeResponse analyze(
            @RequestPart(value = "file",      required = false) MultipartFile file1,
            @RequestPart(value = "image",     required = false) MultipartFile file2,
            @RequestPart(value = "files",     required = false) List<MultipartFile> files,
            @RequestPart(value = "images",    required = false) List<MultipartFile> images,
            @RequestPart(value = "photos",    required = false) List<MultipartFile> photos,
            @RequestPart(value = "files[]",   required = false) List<MultipartFile> filesArr,
            @RequestPart(value = "images[]",  required = false) List<MultipartFile> imagesArr,
            @RequestPart(value = "photos[]",  required = false) List<MultipartFile> photosArr,
            @RequestParam(value = "question", required = false) String question
    ) {
        List<MultipartFile> all = new ArrayList<>();
        if (file1     != null) all.add(file1);
        if (file2     != null) all.add(file2);
        if (files     != null) all.addAll(files);
        if (images    != null) all.addAll(images);
        if (photos    != null) all.addAll(photos);
        if (filesArr  != null) all.addAll(filesArr);
        if (imagesArr != null) all.addAll(imagesArr);
        if (photosArr != null) all.addAll(photosArr);

        String bodyType = "NORMAL";
        List<String> styleHints = List.of("STREET", "CASUAL");

        if (question != null && question.toLowerCase().contains("포멀")) {
            styleHints = List.of("CLASSIC", "MINIMAL");
        }

        return AiAnalyzeResponse.simple(bodyType, styleHints);
    }

    private Long extractUserId(Authentication auth) {
        if (auth == null) return null;
        Object principal = auth.getPrincipal();
        if (principal == null) return null;

        try {
            Class<?> clazz = Class.forName("kr.co.fittly.security.AuthUser");
            if (clazz.isInstance(principal)) {
                Method m = clazz.getMethod("getUserId");
                Object val = m.invoke(principal);
                if (val instanceof Long l) return l;
                if (val != null) return Long.valueOf(String.valueOf(val));
            }
        } catch (Throwable ignored) {}

        try {
            String name = auth.getName();
            if (name != null && name.matches("\\d+")) return Long.parseLong(name);
        } catch (Throwable ignored) {}

        return null;
    }
}
