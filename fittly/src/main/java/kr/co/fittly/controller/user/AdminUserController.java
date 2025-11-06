package kr.co.fittly.controller.user;

import kr.co.fittly.dto.user.UserListItem;
import kr.co.fittly.service.admin.AdminUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/users")
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping
    public Page<UserListItem> list(
            @RequestParam(required = false) String field,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sort,
            @RequestParam(defaultValue = "DESC") String dir
    ) {
        Sort s = "DESC".equalsIgnoreCase(dir) ? Sort.by(sort).descending() : Sort.by(sort).ascending();
        Pageable pageable = PageRequest.of(page, size, s);

        String f = field == null ? "" : field.trim().toLowerCase();
        String kw = keyword == null ? "" : keyword.trim();
        if (kw.isBlank() || f.isBlank()) {
            return adminUserService.listAll(pageable);
        }

        switch (f) {
            case "name":
                return adminUserService.listByNameExact(kw, pageable);

            case "phone":
                String digits = kw.replaceAll("\\D", "");
                if (digits.isBlank()) {
                    return Page.empty(pageable);
                }
                return adminUserService.listByPhoneDigits(digits, pageable);

            default:
                return Page.empty(pageable);
        }
    }
}
