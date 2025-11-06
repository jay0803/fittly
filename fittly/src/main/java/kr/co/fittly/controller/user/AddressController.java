package kr.co.fittly.controller.user;

import kr.co.fittly.dto.user.AddressDto;
import kr.co.fittly.repository.user.AddressRepository;
import kr.co.fittly.repository.user.UserRepository;
import kr.co.fittly.vo.user.Address;
import kr.co.fittly.vo.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/addresses")
public class AddressController {

    private final AddressRepository repo;
    private final UserRepository userRepo;
    @GetMapping
    @Transactional
    public List<AddressDto> list() {
        Long uid = currentUserId();
        if (repo.countByUser_Id(uid) == 0) {
            userRepo.findById(uid).ifPresent(u -> {
                if (nonBlank(u.getZipcode()) && nonBlank(u.getAddress1())) {
                    Address a = Address.builder()
                            .user(u)
                            .label(nonBlank(u.getName()) ? u.getName() : "기본")
                            .receiver(nonBlank(u.getName()) ? u.getName() : u.getLoginId())
                            .phone(u.getPhone())
                            .zipcode(u.getZipcode())
                            .address1(u.getAddress1())
                            .address2(u.getAddress2())
                            .isDefault(true)
                            .build();
                    Address saved = repo.save(a);
                }
            });
        }

        return repo.findByUser_IdOrderByIsDefaultDescIdDesc(uid)
                .stream().map(this::toDto).toList();
    }

    @PostMapping
    @Transactional
    public AddressDto create(@RequestBody AddressDto req) {
        Long uid = currentUserId();
        User u = userRepo.findById(uid).orElseThrow();

        Address a = Address.builder()
                .user(u)
                .label(nonBlank(req.getLabel()) ? req.getLabel()
                        : nonBlank(req.getName()) ? req.getName() : "기본")
                .receiver(nonBlank(req.getName()) ? req.getName() : req.getReceiver())
                .phone(req.getPhone())
                .zipcode(req.getZipcode())
                .address1(req.getAddress1())
                .address2(req.getAddress2())
                .isDefault(Boolean.TRUE.equals(req.getIsDefault()))
                .build();

        Address saved = repo.save(a);

        if (saved.isDefault()) {
            repo.unsetDefaultForOthers(uid, saved.getId());
        }
        return toDto(saved);
    }

    @PutMapping("/{id}")
    @Transactional
    public AddressDto update(@PathVariable Long id, @RequestBody AddressDto req) {
        Long uid = currentUserId();
        Address a = repo.findByIdAndUser_Id(id, uid).orElseThrow();
        if (nonBlank(req.getLabel())) a.setLabel(req.getLabel());
        if (nonBlank(req.getName()))  a.setReceiver(req.getName());
        a.setPhone(req.getPhone());
        a.setZipcode(req.getZipcode());
        a.setAddress1(req.getAddress1());
        a.setAddress2(req.getAddress2());
        repo.save(a);
        return toDto(a);
    }

    @DeleteMapping("/{id}")
    @Transactional
    public void delete(@PathVariable Long id) {
        Long uid = currentUserId();
        Address a = repo.findByIdAndUser_Id(id, uid).orElseThrow();
        repo.delete(a);
    }

    @PatchMapping("/{id}/default")
    @Transactional
    public AddressDto setDefault(@PathVariable Long id) {
        Long uid = currentUserId();
        Address a = repo.findByIdAndUser_Id(id, uid).orElseThrow();
        repo.unsetDefaultForOthers(uid, id);
        a.setDefault(true);
        repo.save(a);
        return toDto(a);
    }

    @PostMapping("/seed")
    @Transactional
    public AddressDto seedFromUser() {
        Long uid = currentUserId();

        if (repo.countByUser_Id(uid) > 0) {
            return repo.findByUser_IdOrderByIsDefaultDescIdDesc(uid)
                    .stream().findFirst().map(this::toDto).orElse(null);
        }

        User u = userRepo.findById(uid).orElseThrow();
        if (isBlank(u.getZipcode()) || isBlank(u.getAddress1())) {
            throw new IllegalStateException("no_address_on_user");
        }

        Address a = Address.builder()
                .user(u)
                .label(nonBlank(u.getName()) ? u.getName() : "기본")
                .receiver(nonBlank(u.getName()) ? u.getName() : u.getLoginId())
                .phone(u.getPhone())
                .zipcode(u.getZipcode())
                .address1(u.getAddress1())
                .address2(u.getAddress2())
                .isDefault(true)
                .build();

        Address saved = repo.save(a);
        repo.unsetDefaultForOthers(uid, saved.getId());
        return toDto(saved);
    }

    private Long currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) throw new IllegalStateException("unauthenticated");
        String loginId = auth.getName();
        return userRepo.findByLoginId(loginId)
                .map(User::getId)
                .orElseThrow(() -> new IllegalStateException("user_not_found"));
    }

    private AddressDto toDto(Address a) {
        return AddressDto.builder()
                .id(a.getId())
                .name(a.getReceiver())
                .label(a.getLabel())
                .receiver(a.getReceiver())
                .phone(a.getPhone())
                .zipcode(a.getZipcode())
                .address1(a.getAddress1())
                .address2(a.getAddress2())
                .isDefault(a.isDefault())
                .build();
    }

    private static boolean isBlank(String s){ return s == null || s.trim().isEmpty(); }
    private static boolean nonBlank(String s){ return s != null && !s.trim().isEmpty(); }
}
