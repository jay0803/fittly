package kr.co.fittly.service.product;

import jakarta.servlet.http.HttpServletRequest;
import kr.co.fittly.dto.ai.AiAnalyzeResponse;
import kr.co.fittly.vo.user.User;
import kr.co.fittly.vo.user.UserProfile;
import kr.co.fittly.repository.user.UserRepository;
import kr.co.fittly.repository.user.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.core.context.SecurityContextHolder;

import java.io.File;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AiAnalysisService {

    private final UserRepository userRepo;
    private final UserProfileRepository profileRepo;

//    @Value("${fittly.upload-dir:C:/uploads}")  // 251021_영미 수정
    private String aiUploadDir;

    private static final Map<UserProfile.BodyType, String> BODY_KOR = Map.of(
            UserProfile.BodyType.SLIM, "슬림",
            UserProfile.BodyType.NORMAL, "보통",
            UserProfile.BodyType.MUSCULAR, "근육형",
            UserProfile.BodyType.CHUBBY, "통통",
            UserProfile.BodyType.OTHER, "기타"
    );

    @Transactional
    public AiAnalyzeResponse analyze(List<MultipartFile> images, HttpServletRequest request) throws IOException {
        if (images == null || images.isEmpty()) {
            throw new IllegalArgumentException("이미지가 필요합니다.");
        }

        Long userId = resolveUserId();
        // 1) 업로드 저장
        File base = new File(aiUploadDir, String.valueOf(userId == null ? 0 : userId));
        base.mkdirs();

        List<String> urls = new ArrayList<>();
        for (MultipartFile mf : images) {
            if (mf.isEmpty()) continue;
            String ext = Optional.ofNullable(mf.getOriginalFilename())
                    .filter(n -> n.contains("."))
                    .map(n -> n.substring(n.lastIndexOf('.') + 1))
                    .orElse("jpg");
            String name = System.currentTimeMillis() + "_" + Math.abs(new Random().nextInt()) + "." + ext;
            File dest = new File(base, name);
            mf.transferTo(dest);
            urls.add("/uploads/ai/" + (userId == null ? 0 : userId) + "/" + name);
        }

        // 2) 간이 “AI” 분석: BMI/선호 기반
        UserProfile.BodyType aiType = inferBodyTypeFromProfile(userId);
        Map<String, Double> styleScores = inferStyleScoresFromProfile(userId);

        // 3) 프로필에 저장(로그인한 경우)
        if (userId != null) {
            var profile = profileRepo.findById(userId).orElseGet(() -> {
                var p = new UserProfile();
                p.setUserId(userId);
                // 관계 주입은 나중에…
                return p;
            });
            profile.setAiBodyType(aiType);
            profile.setAiStyleScoresJson(toJson(styleScores));
            profile.setAiLastAnalyzedAt(LocalDateTime.now());
            profileRepo.save(profile);
        }

        return AiAnalyzeResponse.builder()
                .bodyType(aiType)
                .bodyTypeKor(BODY_KOR.getOrDefault(aiType, "기타"))
                .styleScores(styleScores)
                .detectedStyles(guessStyles(styleScores))
                .photoUrls(urls)
                .build();
    }

    private Long resolveUserId() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return null;
        String loginId = auth.getName();
        return userRepo.findByLoginId(loginId).map(User::getId).orElse(null);
    }

    private UserProfile.BodyType inferBodyTypeFromProfile(Long userId) {
        if (userId == null) return UserProfile.BodyType.OTHER;
        return profileRepo.findById(userId).map(p -> {
            Integer h = p.getHeightCm();
            Integer w = p.getWeightKg();
            if (h == null || w == null || h < 120) return UserProfile.BodyType.OTHER;
            double bmi = (w * 1.0) / Math.pow(h / 100.0, 2);
            if (bmi < 19) return UserProfile.BodyType.SLIM;
            if (bmi < 24) return UserProfile.BodyType.NORMAL;
            if (bmi < 27) return UserProfile.BodyType.MUSCULAR; // 임시 기준
            return UserProfile.BodyType.CHUBBY;
        }).orElse(UserProfile.BodyType.OTHER);
    }

    private Map<String, Double> inferStyleScoresFromProfile(Long userId) {
        // 간단히: 기존 선호 스타일이 있으면 그쪽 가중치를 높임
        Map<String, Double> m = new LinkedHashMap<>();
        List<String> base = List.of("MINIMAL","STREET","CASUAL","ATHLEISURE","CLASSIC","VINTAGE","MODERN","PREPPY","TECHWEAR","GORPCORE","AMEKAZI","Y2K");
        base.forEach(code -> m.put(code, 0.3));
        if (userId != null) {
            profileRepo.findById(userId).ifPresent(p -> {
                p.getFashionStyles().forEach(s -> m.computeIfPresent(s.getCode(), (k,v) -> Math.max(v, 0.75)));
            });
        }
        // 정규화
        double sum = m.values().stream().mapToDouble(Double::doubleValue).sum();
        if (sum > 0) m.replaceAll((k,v) -> v / sum);
        return m;
    }

    private String toJson(Map<String, Double> m) {
        StringBuilder sb = new StringBuilder("{");
        boolean first = true;
        for (var e : m.entrySet()) {
            if (!first) sb.append(",");
            sb.append("\"").append(e.getKey()).append("\":").append(String.format(Locale.US,"%.4f", e.getValue()));
            first = false;
        }
        sb.append("}");
        return sb.toString();
    }

    private List<String> guessStyles(Map<String, Double> scores) {
        return scores.entrySet().stream()
                .sorted((a,b) -> Double.compare(b.getValue(), a.getValue()))
                .limit(3)
                .map(Map.Entry::getKey)
                .toList();
    }
}
