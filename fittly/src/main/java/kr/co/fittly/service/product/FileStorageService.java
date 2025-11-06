package kr.co.fittly.service.product;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Set;
import java.util.UUID;

@Service
public class FileStorageService {

    private final Path uploadDir;

    // 허용 확장자 (필요시 확장 가능)
    private static final Set<String> ALLOWED_EXT = Set.of("jpg", "jpeg", "png", "gif", "webp", "mp4");

    // application.properties의 fittly.upload-dir 값 사용 (기본: uploads)
    public FileStorageService(@Value("${fittly.upload-dir:uploads}") String uploadDir) throws IOException {
        this.uploadDir = Paths.get(uploadDir).toAbsolutePath().normalize();
        Files.createDirectories(this.uploadDir);
    }

    public String store(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) return null;

        String original = StringUtils.cleanPath(file.getOriginalFilename());
        if (original.contains("..")) {
            throw new IOException("잘못된 파일명: " + original);
        }

        // 확장자 추출
        String ext = "";
        int dot = original.lastIndexOf('.');
        if (dot != -1) {
            ext = original.substring(dot + 1).toLowerCase();
        }

        if (!ALLOWED_EXT.contains(ext)) {
            throw new IOException("허용되지 않은 파일 확장자: " + ext);
        }

        // 날짜별 디렉토리 생성
        String datePath = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy/MM/dd"));
        Path dir = this.uploadDir.resolve(datePath);
        Files.createDirectories(dir);

        // 새로운 파일명 생성
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        String filename = timestamp + "_" + UUID.randomUUID() + "." + ext;

        Path target = dir.resolve(filename);
        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

        // 정적 리소스로 매핑된 /uploads/** URL 반환 (날짜 경로 포함)
        return "/uploads/" + datePath.replace("\\", "/") + "/" + filename;
    }
}
