package kr.co.fittly.controller.qna;

import jakarta.validation.Valid;
import kr.co.fittly.dto.qna.QnaRequestDTO;
import kr.co.fittly.dto.qna.QnaResponseDTO;
import kr.co.fittly.dto.qna.QnaUpdateRequest;
import kr.co.fittly.repository.order.OrderRepository;
import kr.co.fittly.repository.user.UserRepository;
import kr.co.fittly.service.qna.QnaService;
import kr.co.fittly.vo.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class QnaController {

    private final QnaService service;
    private final UserRepository userRepository;
    private final OrderRepository orderRepo;

    @PostMapping(value = "/api/qna", consumes = MediaType.APPLICATION_JSON_VALUE)
    public QnaResponseDTO createJson(
            @AuthenticationPrincipal org.springframework.security.core.userdetails.User principal,
            @RequestBody @Valid QnaRequestDTO body
    ) {
        User loginUser = userRepository.findByLoginId(principal.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("로그인 유저를 찾을 수 없습니다."));
        return service.create(loginUser, body);
    }

    @PostMapping(value = "/api/qna", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public QnaResponseDTO createMultipart(
            @AuthenticationPrincipal org.springframework.security.core.userdetails.User principal,
            @RequestPart("dto") @Valid QnaRequestDTO dto,
            @RequestPart(value = "file", required = false) MultipartFile file
    ) {
        User loginUser = userRepository.findByLoginId(principal.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("로그인 유저를 찾을 수 없습니다."));
        Long productId = dto.getProductId();
        return service.createFromMultipart(loginUser, dto, productId, file);
    }

    @GetMapping("/api/qna/my")
    public Page<QnaResponseDTO> myList(
            @AuthenticationPrincipal org.springframework.security.core.userdetails.User principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String period
    ) {
        User loginUser = userRepository.findByLoginId(principal.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("로그인 유저를 찾을 수 없습니다."));
        return service.myList(loginUser, page, size, period);
    }

    //업데이트 로직 에러 발생 . 파일 업로드 기능 처리 안됨
//    @PutMapping("/api/qna/{id}")
    @PostMapping(value = "/api/qna/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public QnaResponseDTO update(
            @PathVariable Long id,
            @AuthenticationPrincipal org.springframework.security.core.userdetails.User principal,
            @RequestBody @Valid QnaResponseDTO body
    ) {
        System.out.println("update메소드 실행77777::: "+ body);
        User loginUser = userRepository.findByLoginId(principal.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("로그인 유저를 찾을 수 없습니다."));
        return service.update(loginUser, id, body);
    }

    @PostMapping(value = "/api/qna/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public QnaResponseDTO updateMultipart(
            @PathVariable Long id,
            @AuthenticationPrincipal org.springframework.security.core.userdetails.User principal,
            @RequestPart("dto") @Valid QnaResponseDTO dto,
            @RequestPart(value = "file", required = false) MultipartFile file
    ) {
        System.out.println("updateMultipart메소드 실행77777: "+dto);
        User loginUser = userRepository.findByLoginId(principal.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("로그인 유저를 찾을 수 없습니다."));
        Long productId = dto.getProductId();
        return service.updateFromMultipart(loginUser, dto, productId, file);
    }

    @DeleteMapping("/api/qna/{id}")
    public void delete(
            @PathVariable Long id,
            @AuthenticationPrincipal org.springframework.security.core.userdetails.User principal
    ) {
        User loginUser = userRepository.findByLoginId(principal.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("로그인 유저를 찾을 수 없습니다."));
        service.delete(loginUser, id);
    }

    @GetMapping("/api/qna/{id}")
    public QnaResponseDTO getOne(
            @PathVariable Long id,
            @AuthenticationPrincipal org.springframework.security.core.userdetails.User principal
    ) {
        User loginUser = userRepository.findByLoginId(principal.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("로그인 유저를 찾을 수 없습니다."));
        return service.getOne(loginUser, id);
    }

    @GetMapping("/api/products/{productId}/qna")
    public List<QnaResponseDTO> getByProductId(@PathVariable Long productId) {
        return service.getByProduct(productId);
    }

    @GetMapping("/api/user/orders/{orderUid}")
    public ResponseEntity<?> getOrderByUid(
            @AuthenticationPrincipal org.springframework.security.core.userdetails.User principal,
            @PathVariable String orderUid
    ) {
        User loginUser = userRepository.findByLoginId(principal.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("로그인 유저를 찾을 수 없습니다."));
        var order = orderRepo.findByOrderUidAndUserFetch(orderUid, loginUser)
                .orElseThrow(() -> new IllegalArgumentException("해당 주문을 찾을 수 없습니다."));
        return ResponseEntity.ok(order);
    }

}
