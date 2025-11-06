package kr.co.fittly.controller.notice;

import kr.co.fittly.dto.user.ApiResponse;
import kr.co.fittly.dto.notice.*;
import kr.co.fittly.service.notice.NoticeService;
import kr.co.fittly.repository.user.UserRepository;
import kr.co.fittly.vo.user.User;
import kr.co.fittly.vo.notice.NoticeSearchType;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/notices")
public class NoticeController {

    private final NoticeService service;
    private final UserRepository userRepo;

    public NoticeController(NoticeService service, UserRepository userRepo) {
        this.service = service;
        this.userRepo = userRepo;
    }

    @GetMapping("/pinned")
    public java.util.List<NoticeSummaryDTO> getPinned() {
        return service.pinned();
    }

    @GetMapping
    public Page<NoticeSummaryDTO> list(
            @RequestParam(defaultValue = "TITLE") NoticeSearchType type,
            @RequestParam(defaultValue = "") String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return service.list(type, q, page, size);
    }

    @GetMapping("/{id}")
    public NoticeDetailDTO detail(@PathVariable Long id) {
        return service.readAndIncreaseViews(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Long create(@RequestBody NoticeCreateRequest req, Principal principal) {
        // principal.getName() → loginId 라고 가정
        User admin = userRepo.findByLoginId(principal.getName())
                .orElseThrow(() -> new IllegalStateException("관리자 정보 없음"));
        return service.create(admin.getId(), req);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void update(@PathVariable Long id, @RequestBody NoticeUpdateRequest req) {
        service.update(id, req);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }

    @PatchMapping("/{id}/pin")
    @PreAuthorize("hasRole('ADMIN')")
    public void pin(@PathVariable Long id,
                    @RequestParam boolean pinned,
                    @RequestParam(required = false) Integer pinOrder) {
        service.setPin(id, pinned, pinOrder);
    }
}
