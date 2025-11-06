package kr.co.fittly.service.user;

import kr.co.fittly.dto.user.*;
import kr.co.fittly.ticket.EmailVerifyCode;
import kr.co.fittly.repository.user.EmailVerifyCodeRepository;
import kr.co.fittly.repository.user.PasswordResetTicketRepository;
import kr.co.fittly.repository.user.UserRepository;
import kr.co.fittly.ticket.PasswordResetTicket;
import kr.co.fittly.vo.user.User;
import kr.co.fittly.vo.user.UserProfile;
import kr.co.fittly.vo.product.FashionStyle;
import kr.co.fittly.vo.product.ProductCategory;
import kr.co.fittly.repository.user.UserProfileRepository;
import kr.co.fittly.repository.product.FashionStyleRepository;
import kr.co.fittly.repository.product.ProductCategoryRepository;
import kr.co.fittly.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordResetTicketRepository tokenRepository;
    private final EmailVerifyCodeRepository emailCodeRepo;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final JwtUtil jwtUtil;
    private final FashionStyleRepository fashionStyleRepo;
    private final ProductCategoryRepository categoryRepo;
    private final UserProfileRepository userProfileRepo;
    private final AuthenticationManager authenticationManager;

    @Value("${app.frontend.base:http://localhost:3000}")
    private String frontendBase;

    private static final SecureRandom RND = new SecureRandom();

    // ... signup, login 및 유틸 메서드는 기존과 동일 ...

    @Transactional
    public SignupResponse signup(SignupRequest req) {
        final String loginId = trimOrNull(req.getLoginId());
        final String email   = trimOrNull(req.getEmail());
        final String rawPw   = req.getPassword();
        if (isBlank(loginId) || isBlank(email) || isBlank(rawPw)) { throw new IllegalArgumentException("invalid_payload"); }
        if (userRepository.existsByLoginId(loginId)) { throw new IllegalArgumentException("duplicate_loginId"); }
        if (userRepository.existsByEmailIgnoreCase(email)) { throw new IllegalArgumentException("duplicate_email"); }
        User u = new User(loginId, passwordEncoder.encode(rawPw), email, req.getName());
        if (!isBlank(req.getPhone()))    u.setPhone(req.getPhone().trim());
        if (!isBlank(req.getZipcode()))  u.setZipcode(req.getZipcode().trim());
        if (!isBlank(req.getAddress1())) u.setAddress1(req.getAddress1().trim());
        if (!isBlank(req.getAddress2())) u.setAddress2(req.getAddress2().trim());
        LocalDateTime since = LocalDateTime.now().minusHours(24);
        boolean verifiedRecently = emailCodeRepo.existsByEmailAndUsedAtIsNotNullAndCreatedAtAfter(email, since);
        u.setEmailVerified(verifiedRecently);
        userRepository.save(u);
        UserProfile profile = new UserProfile();
        profile.setUser(u);
        profile.setHeightCm(req.getHeightCm());
        profile.setWeightKg(req.getWeightKg());
        profile.setBodyType(parseBodyType(req.getBodyType()));
        profile.setHairstyle(req.getHairstyle());
        profile.setHairstylePreset(req.getHairstylePreset());
        List<String> styleCodes = (req.getFashionStyles() == null) ? List.of() : req.getFashionStyles().stream().filter(Objects::nonNull).map(s -> STYLE_KR_TO_CODE.getOrDefault(s, s)).toList();
        var styles = new HashSet<FashionStyle>(fashionStyleRepo.findByCodeIn(styleCodes));
        if (styles.isEmpty() && req.getFashionStyles() != null && !req.getFashionStyles().isEmpty()) { styles.addAll(fashionStyleRepo.findByLabelIn(req.getFashionStyles())); }
        profile.setFashionStyles(styles);
        List<String> catCodes = (req.getPreferredCategories() == null) ? List.of() : req.getPreferredCategories().stream().filter(Objects::nonNull).map(c -> CAT_KR_TO_CODE.getOrDefault(c, c)).toList();
        var cats = new HashSet<ProductCategory>(categoryRepo.findByCodeIn(catCodes));
        if (cats.isEmpty() && req.getPreferredCategories() != null && !req.getPreferredCategories().isEmpty()) { cats.addAll(categoryRepo.findByLabelIn(req.getPreferredCategories())); }
        profile.setPreferredCategories(cats);
        userProfileRepo.save(profile);
        return new SignupResponse(u.getId(), u.getLoginId(), u.getEmail(), u.isEmailVerified());
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest req) {
        final String loginId = trimOrNull(req.getLoginId());
        final String pw = req.getPassword();
        if (isBlank(loginId) || pw == null) { throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "invalid_payload"); }
        authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(loginId, pw));
        User u = userRepository.findByLoginId(loginId).orElseThrow(() -> new UsernameNotFoundException("user_not_found"));
        if (!u.isEmailVerified()) { throw new ResponseStatusException(HttpStatus.FORBIDDEN, "email_not_verified"); }
        String token = jwtUtil.generateToken(u.getId(), u.getLoginId(), u.getRole());
        return new LoginResponse(u.getLoginId(), u.getRole(), token);
    }

    @Transactional
    public void requestSignupEmailCode(EmailCodeSendRequest req) {
        String email = normEmail(req.email());
        if (isBlank(email)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "email_required");
        if (userRepository.existsByEmailIgnoreCase(email)) { throw new ResponseStatusException(HttpStatus.CONFLICT, "duplicate_email"); }
        String code = String.format("%06d", RND.nextInt(1_000_000));
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime exp = now.plusMinutes(10);
        emailCodeRepo.deleteByEmailAndExpiresAtBefore(email, now.minusDays(1));
        EmailVerifyCode evc = new EmailVerifyCode(email, code, now, exp);
        emailCodeRepo.save(evc);
        String subject = "[Fittly] 회원가입 이메일 인증코드";
        String html = "<p>안녕하세요.</p><p>아래 인증코드를 회원가입 화면에 입력해 주세요. 유효시간은 <b>10분</b>입니다.</p><h2>%s</h2>".formatted(code);
        emailService.sendHtml(email, subject, html);
    }

    @Transactional
    public void verifySignupEmailCode(EmailCodeVerifyRequest req) {
        String email = normEmail(req.email());
        String code  = (req.code() == null) ? "" : req.code().trim();
        if (isBlank(email) || code.length() != 6) { throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "invalid_payload"); }
        var evcOpt = emailCodeRepo.findTopByEmailAndUsedAtIsNullOrderByCreatedAtDesc(email);
        if (evcOpt.isEmpty()) { throw new ResponseStatusException(HttpStatus.GONE, "no_pending_code"); }
        EmailVerifyCode evc = evcOpt.get();
        LocalDateTime now = LocalDateTime.now();
        if (evc.isExpired(now)) { throw new ResponseStatusException(HttpStatus.GONE, "code_expired"); }
        if (!evc.getCode().equals(code)) {
            evc.addAttempt();
            emailCodeRepo.save(evc);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "invalid_code");
        }
        evc.markUsed(now);
        emailCodeRepo.save(evc);
        userRepository.findByEmail(email).ifPresent(u -> {
            if (!u.isEmailVerified()) {
                u.setEmailVerified(true);
                userRepository.save(u);
            }
        });
    }

    /* ================= 비밀번호 재설정 (수정된 부분) ================= */
    @Transactional
    public void requestPasswordReset(PasswordResetDtos.SendCodeRequest req) {
        tokenRepository.deleteByExpiresAtBefore(LocalDateTime.now());
        final String email = normEmail(req.email());
        final String loginId = trimOrNull(req.loginId());
        Optional<User> userOpt = Optional.empty();
        if (email != null && !email.isEmpty()) {
            userOpt = userRepository.findByEmail(email);
            if (userOpt.isPresent() && loginId != null && !loginId.isEmpty()) {
                if (!loginId.equals(userOpt.get().getLoginId())) {
                    userOpt = Optional.empty();
                }
            }
        }
        if (userOpt.isEmpty()) {
            return;
        }
        User user = userOpt.get();
        String token = java.util.UUID.randomUUID().toString().replace("-", "");
        LocalDateTime exp = LocalDateTime.now().plusMinutes(30);
        PasswordResetTicket ticket = new PasswordResetTicket(token, user, exp);
        tokenRepository.save(ticket);
        String base = (frontendBase == null) ? "http://localhost:3000" : frontendBase;
        base = base.replaceAll("/+$", "");
        String link = base + "/auth/reset-password?token=" + token;
        String subject = "[Fittly] 비밀번호 재설정 링크 (30분 유효)";
        String html = "<p>안녕하세요.</p><p>아래 버튼을 눌러 비밀번호를 재설정하세요. 유효기간: <b>30분</b></p><p><a href=\"%s\" style=\"display:inline-block;padding:10px 16px;border-radius:6px;background:#222;color:#fff;text-decoration:none\">비밀번호 재설정</a></p><p>버튼이 동작하지 않으면 아래 링크를 복사해 브라우저에 붙여넣기:</p><p>%s</p>".formatted(link, link);
        emailService.sendHtml(user.getEmail(), subject, html);
    }

    @Transactional(readOnly = true)
    public boolean verifyResetToken(String token) {
        if (token == null || token.isBlank()) return false;
        var opt = tokenRepository.findByToken(token);
        if (opt.isEmpty()) return false;
        var t = opt.get();
        return !t.isUsed() && t.getExpiresAt().isAfter(LocalDateTime.now());
    }

    @Transactional
    public void performPasswordReset(PasswordResetDtos.ConfirmRequest req) {
        var ticket = tokenRepository.findByTokenAndUsedFalse(req.resetToken())
                .orElseThrow(() -> new IllegalArgumentException("토큰이 유효하지 않습니다."));
        if (ticket.getExpiresAt().isBefore(LocalDateTime.now())) {
            tokenRepository.deleteById(ticket.getId());
            throw new IllegalArgumentException("토큰이 만료되었습니다.");
        }
        String newPassword = req.newPassword();
        if (newPassword == null || newPassword.length() < 8) {
            throw new IllegalArgumentException("비밀번호는 8자 이상이어야 합니다.");
        }
        User user = ticket.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        ticket.markUsed();
        userRepository.save(user);
        tokenRepository.save(ticket);
    }

    /* ================= 유틸 ================= */
    private static boolean isBlank(String s) { return s == null || s.trim().isEmpty(); }
    private static String trimOrNull(String s) { return s == null ? null : s.trim(); }
    private static String normEmail(String s) { return isBlank(s) ? null : s.trim().toLowerCase(); }
    private static final Map<String, String> STYLE_KR_TO_CODE = Map.ofEntries(Map.entry("미니멀","MINIMAL"), Map.entry("스트리트","STREET"), Map.entry("캐주얼","CASUAL"), Map.entry("애슬레저","ATHLEISURE"), Map.entry("아메카지","AMEKAZI"), Map.entry("클래식/포멀","CLASSIC"), Map.entry("테크웨어","TECHWEAR"), Map.entry("빈티지","VINTAGE"), Map.entry("모던","MODERN"), Map.entry("프레피","PREPPY"), Map.entry("고프코어","GORPCORE"), Map.entry("Y2K","Y2K"));
    private static final Map<String, String> CAT_KR_TO_CODE = Map.of("상의","TOP", "하의","BOTTOM", "아우터","OUTER", "신발","SHOES");
    private static UserProfile.BodyType parseBodyType(String s) {
        if (s == null) return null;
        String u = s.trim().toUpperCase();
        if (u.isBlank()) return null;
        if (u.contains("슬림")) return UserProfile.BodyType.SLIM;
        if (u.contains("보통") || u.contains("NORMAL")) return UserProfile.BodyType.NORMAL;
        if (u.contains("근육") || u.contains("MUSCLE")) return UserProfile.BodyType.MUSCULAR;
        if (u.contains("통통") || u.contains("CHUB")) return UserProfile.BodyType.CHUBBY;
        try { return UserProfile.BodyType.valueOf(u); } catch (Exception ignore) { return UserProfile.BodyType.OTHER; }
    }
}