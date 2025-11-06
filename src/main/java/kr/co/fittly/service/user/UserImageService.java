package kr.co.fittly.service.user;

import kr.co.fittly.repository.user.UserImageRepository;
import kr.co.fittly.repository.user.UserRepository;
import kr.co.fittly.vo.user.User;
import kr.co.fittly.vo.user.UserImage;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class UserImageService {

    @Value("${fittly.upload-dir:uploads}")
    private String uploadDir;

    private final UserRepository userRepo;
    private final UserImageRepository imageRepo;

    public List<UserImage> saveUserPhotos(Long userId, List<MultipartFile> files) throws IOException {
        if (userId == null) throw new IllegalArgumentException("userId required");
        if (files == null || files.isEmpty()) return List.of();

        User user = userRepo.findById(userId).orElseThrow();

        Path root = Paths.get(uploadDir).toAbsolutePath().normalize();
        Path base = root.resolve("user-photos").resolve(String.valueOf(userId));
        Files.createDirectories(base);

        List<UserImage> saved = new ArrayList<>();

        for (MultipartFile mf : files) {
            if (mf == null || mf.isEmpty()) continue;

            String original = Optional.ofNullable(mf.getOriginalFilename()).orElse("image");
            String ext = "";
            int dot = original.lastIndexOf('.');
            if (dot > -1 && dot < original.length() - 1) {
                ext = original.substring(dot);
            }
            String stored = System.currentTimeMillis() + "_" + UUID.randomUUID() + ext.toLowerCase();

            Path dest = base.resolve(stored);
            try (InputStream in = mf.getInputStream()) {
                Files.copy(in, dest, StandardCopyOption.REPLACE_EXISTING);
            }

            String url = "/uploads/user-photos/" + userId + "/" + stored;

            UserImage ui = UserImage.builder()
                    .user(user)
                    .originalName(original)
                    .storedName(stored)
                    .url(url)
                    .size(mf.getSize())
                    .contentType(mf.getContentType())
                    .createdAt(LocalDateTime.now())
                    .build();

            saved.add(imageRepo.save(ui));
        }

        return saved;
    }
}
