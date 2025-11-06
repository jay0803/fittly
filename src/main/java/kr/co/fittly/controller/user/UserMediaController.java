package kr.co.fittly.controller.user;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import kr.co.fittly.repository.user.UserRepository;
import kr.co.fittly.service.user.UserImageService;
import kr.co.fittly.vo.user.User;
import kr.co.fittly.vo.user.UserImage;

import java.io.InputStream;
import java.lang.reflect.Method;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserMediaController {

    private final UserRepository userRepository;
    private final UserImageService userImageService;

    @Value("${fittly.upload-dir:uploads}")
    private String uploadRoot;

    @PostMapping(
            value = { "/photos", "/images", "/profile/photos", "/profile/images", "/photos/upload", "/images/upload" },
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<?> uploadPhotos(
            @RequestPart(value = "files",     required = false) List<MultipartFile> files,
            @RequestPart(value = "photos",    required = false) List<MultipartFile> photos,
            @RequestPart(value = "images",    required = false) List<MultipartFile> images,
            @RequestPart(value = "files[]",   required = false) List<MultipartFile> filesArr,
            @RequestPart(value = "photos[]",  required = false) List<MultipartFile> photosArr,
            @RequestPart(value = "images[]",  required = false) List<MultipartFile> imagesArr,
            @RequestPart(value = "file",      required = false) MultipartFile file1,
            @RequestPart(value = "image",     required = false) MultipartFile file2,
            Authentication auth
    ) throws Exception {

        final Long userId = resolveUserId(auth);
        List<MultipartFile> all = new ArrayList<>();
        if (files     != null) all.addAll(files);
        if (photos    != null) all.addAll(photos);
        if (images    != null) all.addAll(images);
        if (filesArr  != null) all.addAll(filesArr);
        if (photosArr != null) all.addAll(photosArr);
        if (imagesArr != null) all.addAll(imagesArr);
        if (file1     != null) all.add(file1);
        if (file2     != null) all.add(file2);

        if (all.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("ok", false, "message", "no files"));
        }

        List<String> paths = new ArrayList<>();
        List<Long> imageIds = new ArrayList<>();

        if (userImageService != null) {
            List<UserImage> saved = userImageService.saveUserPhotos(userId, all);
            for (UserImage ui : saved) {
                paths.add(ui.getUrl());
                imageIds.add(ui.getId());
            }
        } else {
            Path base = Paths.get(uploadRoot).toAbsolutePath().normalize()
                    .resolve("user-photos").resolve(String.valueOf(userId));
            Files.createDirectories(base);

            for (MultipartFile f : all) {
                if (f == null || f.isEmpty()) continue;

                String original = Optional.ofNullable(f.getOriginalFilename()).orElse("image");
                String ext = "";
                int dot = original.lastIndexOf('.');
                if (dot > -1 && dot < original.length() - 1) ext = original.substring(dot);

                String filename = System.currentTimeMillis() + "_" + UUID.randomUUID() + ext;
                Path dest = base.resolve(filename);
                try (InputStream in = f.getInputStream()) {
                    Files.copy(in, dest, StandardCopyOption.REPLACE_EXISTING);
                }
                paths.add("/uploads/user-photos/" + userId + "/" + filename);
            }
        }

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("ok", true);
        body.put("count", paths.size());
        body.put("paths", paths);
        if (!imageIds.isEmpty()) body.put("imageIds", imageIds);
        body.put("uploadedAt", LocalDateTime.now().toString());

        return ResponseEntity.ok(body);
    }

    private Long resolveUserId(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            throw new IllegalStateException("No authentication");
        }

        Object principal = auth.getPrincipal();

        if (principal != null) {
            for (String m : new String[]{"getId", "getUserId"}) {
                try {
                    Method method = principal.getClass().getMethod(m);
                    Object val = method.invoke(principal);
                    if (val instanceof Number n) return n.longValue();
                } catch (Exception ignored) {}
            }
        }

        String loginIdCandidate = null;
        if (principal instanceof UserDetails ud) {
            loginIdCandidate = ud.getUsername();
        }
        if (!StringUtils.hasText(loginIdCandidate)) {
            loginIdCandidate = auth.getName();
        }
        if (!StringUtils.hasText(loginIdCandidate)) {
            throw new IllegalStateException("Cannot resolve loginId");
        }

        final String loginIdFinal = loginIdCandidate;

        return userRepository.findIdByLoginId(loginIdFinal)
                .orElseGet(() ->
                        userRepository.findByLoginId(loginIdFinal)
                                .map(User::getId)
                                .orElseThrow(() ->
                                        new IllegalStateException("Cannot resolve userId from loginId=" + loginIdFinal)
                                )
                );
    }
}
