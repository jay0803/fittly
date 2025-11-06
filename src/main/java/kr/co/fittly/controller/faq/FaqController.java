package kr.co.fittly.controller.faq;

import kr.co.fittly.dto.user.ApiResponse;
import kr.co.fittly.dto.faq.*;
import kr.co.fittly.service.faq.FaqService;
import kr.co.fittly.vo.faq.FaqCategory;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/faqs")
public class FaqController {

    private final FaqService service;

    public FaqController(FaqService service) {
        this.service = service;
    }

    @GetMapping
    public Page<FaqSummaryDTO> list(
            @RequestParam(required = false) FaqCategory category,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return service.list(category, q, page, size);
    }

    @GetMapping("/{id}")
    public FaqDetailDTO detail(@PathVariable Long id) {
        return service.detail(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Long create(
            @AuthenticationPrincipal UserDetails user,
            @RequestBody FaqCreateRequest req
    ) {
        return service.create(getUserIdFromPrincipal(user), req);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void update(@PathVariable Long id, @RequestBody FaqUpdateRequest req) {
        service.update(id, req);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }

    private Long getUserIdFromPrincipal(UserDetails user) {
        return 1L;
    }
}
