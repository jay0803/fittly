package kr.co.fittly.service.qna;

import kr.co.fittly.dto.product.ProductLatestResponse;
import kr.co.fittly.dto.qna.*;
import kr.co.fittly.repository.order.OrderRepository;
import kr.co.fittly.repository.qna.QnaRepository;
import kr.co.fittly.repository.product.ProductRepository;
import kr.co.fittly.vo.order.Order;
import kr.co.fittly.vo.product.Product;
import kr.co.fittly.vo.qna.QnA;
import kr.co.fittly.vo.qna.QnaStatus;
import kr.co.fittly.vo.qna.QnaSubCategory;
import kr.co.fittly.vo.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class QnaService {

    private final QnaRepository repo;
    private final OrderRepository orderRepo;
    private final ProductRepository productRepo;

    // 251021_영미 추가
    @Value("${fittly.upload-dir}")
    private String imageUrl;

    /** 특정 카테고리에서 주문번호가 필수인 경우 식별 */
    private static boolean requiresOrderUid(QnaSubCategory sub) {
        return sub == QnaSubCategory.주문변경
                || sub == QnaSubCategory.주문취소
                || sub == QnaSubCategory.교환
                || sub == QnaSubCategory.환불
                || sub == QnaSubCategory.불량하자
                || sub == QnaSubCategory.AS;
    }

    /** multipart 전용: 파일 업로드 + 주문/상품 매핑 */
    @Transactional
    public QnaResponseDTO createFromMultipart(User user, QnaRequestDTO dto, Long productId, MultipartFile file) {

        if (file != null && !file.isEmpty()) {
            try {
                String filename = UUID.randomUUID() + "_" + file.getOriginalFilename();
                Path savePath = Paths.get(imageUrl+"/qna", filename); // 251021_영미 수정
//                Files.createDirectories(savePath.getParent());
                file.transferTo(savePath);
                imageUrl = "/uploads/qna/" + filename; // 251021_영미 수정
                dto.setImageUrl(imageUrl); // 251021_영미 수정
            } catch (IOException e) {
                throw new RuntimeException("파일 업로드 실패", e);
            }
        }else{
            dto.setImageUrl(""); // 251021_영미 수정
        }

        // 주문/상품 FK 매핑 및 검증
        Order order = null;
        Product product = null;

        if (requiresOrderUid(dto.getSubcategory())) {
            if (dto.getOrderUid() == null || dto.getOrderUid().isBlank()) {
                throw new IllegalArgumentException("해당 카테고리에는 주문번호(orderUid)가 필수입니다.");
            }
            order = orderRepo.findByOrderUidAndUserFetch(dto.getOrderUid(), user)
                    .orElseThrow(() -> new IllegalArgumentException("주문번호가 없거나 회원 정보와 일치하지 않습니다."));
        } else if (dto.getOrderUid() != null && !dto.getOrderUid().isBlank()) {
            order = orderRepo.findByOrderUidAndUserFetch(dto.getOrderUid(), user)
                    .orElseThrow(() -> new IllegalArgumentException("주문번호가 없거나 회원 정보와 일치하지 않습니다."));
        }

        if (productId != null) {
            product = productRepo.findById(productId)
                    .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));
        }

        if (order != null && product != null) {
            final Long productIdRef = product.getId();
            boolean contains = order.getOrderItems().stream()
                    .anyMatch(oi -> oi.getProduct().getId().equals(productIdRef));
            if (!contains) {
                throw new IllegalStateException("해당 주문에는 선택한 상품이 포함되어 있지 않습니다.");
            }
        }

        QnA e = QnA.builder()
                .user(user)
                .category(dto.getCategory())
                .subcategory(dto.getSubcategory())
                .order(order)
                .orderUid(order != null ? order.getOrderUid() : dto.getOrderUid())
                .product(product)
                .title(dto.getTitle())
                .content(dto.getContent())
                .imageUrl(dto.getImageUrl())
                .status(QnaStatus.PENDING)
                .secret(dto.isSecret()) // ✅ 비밀글 여부 추가
                .createdAt(LocalDateTime.now())
                .build();
        imageUrl = "/uploads";
        repo.save(e);
        return toDTO(e);
    }
    /** multipart 전용: 파일 업로드 + 주문/상품 매핑 */
    @Transactional
    public QnaResponseDTO updateFromMultipart(User user, QnaResponseDTO dto, Long productId, MultipartFile file) {
        System.out.println("\n================================\n");
        System.out.println("updateFromMultipart 메소드 실행");
        if (file != null && !file.isEmpty()) {
            try {
                String filename = UUID.randomUUID() + "_" + file.getOriginalFilename();
                Path savePath = Paths.get(imageUrl+"/qna", filename); // 251021_영미 수정
                System.out.println("savePath 777 :: "+savePath);
                System.out.println("imageUrl 777 :: "+imageUrl+"/qna");
                System.out.println("filename 777 :: "+filename);
                file.transferTo(savePath);
                imageUrl = "/uploads/qna/" + filename; // 251021_영미 수정
                System.out.println("qnaImgUrl 777-1: "+imageUrl);
                dto.setImageUrl(imageUrl); // 251021_영미 수정
            } catch (IOException e) {
                throw new RuntimeException("파일 업로드 실패", e);
            }
        }

        // 주문/상품 FK 매핑 및 검증
        Order order = null;
        Product product = null;


        if (requiresOrderUid(dto.getSubcategory())) {
            if (dto.getOrderUid() == null || dto.getOrderUid().isBlank()) {
                throw new IllegalArgumentException("해당 카테고리에는 주문번호(orderUid)가 필수입니다.");
            }
            order = orderRepo.findByOrderUidAndUserFetch(dto.getOrderUid(), user)
                    .orElseThrow(() -> new IllegalArgumentException("주문번호가 없거나 회원 정보와 일치하지 않습니다."));
        } else if (dto.getOrderUid() != null && !dto.getOrderUid().isBlank()) {
            order = orderRepo.findByOrderUidAndUserFetch(dto.getOrderUid(), user)
                    .orElseThrow(() -> new IllegalArgumentException("주문번호가 없거나 회원 정보와 일치하지 않습니다."));
        }

        if (productId != null) {
            product = productRepo.findById(productId)
                    .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));
        }

        if (order != null && product != null) {
            final Long productIdRef = product.getId();
            boolean contains = order.getOrderItems().stream()
                    .anyMatch(oi -> oi.getProduct().getId().equals(productIdRef));
            if (!contains) {
                throw new IllegalStateException("해당 주문에는 선택한 상품이 포함되어 있지 않습니다.");
            }
        }

        QnA e = QnA.builder()
                .user(user)
                .category(dto.getCategory())
                .subcategory(dto.getSubcategory())
                .order(order)
                .orderUid(order != null ? order.getOrderUid() : dto.getOrderUid())
                .product(product)
                .id(dto.getId())
                .title(dto.getTitle())
                .content(dto.getContent())
                .imageUrl(dto.getImageUrl())
                .status(QnaStatus.PENDING)
                .secret(dto.isSecret()) // ✅ 비밀글 여부 추가
                .createdAt(LocalDateTime.now())
                .build();

        System.out.println("eeee 777 :: "+e.toString());
        imageUrl = "/uploads";
        repo.save(e);
        return toDTO(e);
    }


    @Transactional
    public QnaResponseDTO create(User user, QnaRequestDTO dto) {
        System.out.println("[DEBUG] dto.productId = " + dto.getProductId());
        Order order = null;
        Product product = null;

        if (requiresOrderUid(dto.getSubcategory())) {
            if (dto.getOrderUid() == null || dto.getOrderUid().isBlank()) {
                throw new IllegalArgumentException("해당 카테고리에는 주문번호(orderUid)가 필수입니다.");
            }
            order = orderRepo.findByOrderUidAndUserFetch(dto.getOrderUid(), user)
                    .orElseThrow(() -> new IllegalArgumentException("주문번호가 없거나 회원 정보와 일치하지 않습니다."));
        } else if (dto.getOrderUid() != null && !dto.getOrderUid().isBlank()) {
            order = orderRepo.findByOrderUidAndUserFetch(dto.getOrderUid(), user)
                    .orElseThrow(() -> new IllegalArgumentException("주문번호가 없거나 회원 정보와 일치하지 않습니다."));
        }

        // ✅ 상품 매핑 추가
        if (dto.getProductId() != null) {
            product = productRepo.findById(dto.getProductId())
                    .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));
        }

        QnA e = QnA.builder()
                .user(user)
                .category(dto.getCategory())
                .subcategory(dto.getSubcategory())
                .order(order)
                .orderUid(order != null ? order.getOrderUid() : dto.getOrderUid())
                .product(product) // ✅ 여기에 매핑
                .title(dto.getTitle())
                .content(dto.getContent())
                .imageUrl(dto.getImageUrl())
                .secret(dto.isSecret())
                .status(QnaStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build();

        repo.save(e);
        return toDTO(e);
    }



    /** 내 문의 목록 조회 */
    @Transactional(readOnly = true)
    public Page<QnaResponseDTO> myList(User user, int page, int size, String period) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        LocalDateTime fromDate = null;
        if (period != null) {
            switch (period) {
                case "1주일" -> fromDate = LocalDateTime.now().minusWeeks(1);
                case "1개월" -> fromDate = LocalDateTime.now().minusMonths(1);
                case "3개월" -> fromDate = LocalDateTime.now().minusMonths(3);
                default -> fromDate = null;
            }
        }

        Page<QnA> pageResult = (fromDate != null)
                ? repo.findByUserAndCreatedAtAfterOrderByCreatedAtDesc(user, fromDate, pageable)
                : repo.findByUserOrderByCreatedAtDesc(user, pageable);

        return pageResult.map(this::toDTO);
    }

    /** 관리자용 전체 목록 */
    @Transactional(readOnly = true)
    public Page<QnaResponseDTO> adminList(QnaAdminListFilter f) {
        Pageable pageable = PageRequest.of(
                f.getPage() == null ? 0 : f.getPage(),
                f.getSize() == null ? 20 : f.getSize(),
                Sort.by(Sort.Direction.DESC, "createdAt")
        );

        Page<QnA> page = (f.getStatus() != null)
                ? repo.findByStatusOrderByCreatedAtDesc(f.getStatus(), pageable)
                : repo.findAllByOrderByCreatedAtDesc(pageable);

        List<QnaResponseDTO> filtered = page.getContent().stream()
                .map(this::toDTO)
                .filter(dto -> f.getCategory() == null || dto.getCategory() == f.getCategory())
                .filter(dto -> f.getSubcategory() == null || dto.getSubcategory() == f.getSubcategory())
                .toList();

        return new PageImpl<>(filtered, pageable, page.getTotalElements());
    }

    /** 관리자 답변 등록 */
    @Transactional
    public QnaResponseDTO answer(Long id, String answer) {
        QnA q = repo.findById(id).orElseThrow(() -> new IllegalArgumentException("문의가 존재하지 않습니다."));
        q.setAnswer(answer);
        q.setStatus(QnaStatus.ANSWERED);
        q.setUpdatedAt(LocalDateTime.now());
        return toDTO(q);
    }

    private QnaResponseDTO toDTO(QnA qna) {
        Product product = qna.getProduct();

        QnaResponseDTO dto = QnaResponseDTO.builder()
                .id(qna.getId())
                .category(qna.getCategory())
                .subcategory(qna.getSubcategory())
                .orderUid(qna.getOrderUid())
                .title(qna.getTitle())
                .content(qna.getContent())
                .imageUrl(qna.getImageUrl())
                .answer(qna.getAnswer())
                .status(qna.getStatus())
                .secret(qna.isSecret())
                .createdAt(qna.getCreatedAt())
                .updatedAt(qna.getUpdatedAt())
                .userLoginId(qna.getUser().getLoginId())
                .build();

        if (product != null) {
            dto.setProduct(ProductLatestResponse.fromEntity(product));
        }

        return dto;
    }


    /** 사용자 문의 수정 */
    @Transactional
    public QnaResponseDTO update(User user, Long id, QnaResponseDTO dto) {
        QnA qna = repo.findByIdAndUser(id, user)
                .orElseThrow(() -> new IllegalArgumentException("본인 문의만 수정할 수 있습니다."));
        qna.setId(dto.getId());
        qna.setTitle(dto.getTitle());
        qna.setContent(dto.getContent());
        qna.setOrderUid(dto.getOrderUid());
        qna.setSecret(dto.isSecret()); // ✅ 수정 반영
        qna.setUpdatedAt(LocalDateTime.now());

        return toDTO(qna);
    }

    /** 사용자 문의 삭제 */
    @Transactional
    public void delete(User user, Long id) {
        QnA qna = repo.findByIdAndUser(id, user)
                .orElseThrow(() -> new IllegalArgumentException("본인 문의만 삭제할 수 있습니다."));
        repo.delete(qna);
    }

    @Transactional(readOnly = true)
    public QnaResponseDTO getOne(User user, Long id) {
        QnA qna = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("문의가 존재하지 않습니다."));

        boolean isAdmin = "ROLE_ADMIN".equals(user.getRole());
        boolean isOwner = qna.getUser().getId().equals(user.getId());

        if (qna.isSecret() && !isAdmin && !isOwner) {
            QnaResponseDTO dto = toDTO(qna);
            dto.setContent("🔒 비밀글입니다.");
            dto.setOwner(false);
            dto.setAdmin(false);
            return dto;
        }

        QnaResponseDTO dto = toDTO(qna);
        dto.setOwner(isOwner);
        dto.setAdmin(isAdmin);
        return dto;
    }


    /** 관리자 전용 전체 조회 */
    @Transactional(readOnly = true)
    public List<QnaResponseDTO> findAll() {
        return repo.findAll().stream()
                .map(this::toDTO)
                .toList();
    }

    /** 관리자 답변 등록 (AdminQnaController에서 사용) */
    @Transactional
    public QnaResponseDTO answerQna(Long id, String answer) {
        QnA qna = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("문의글 없음"));

        qna.setAnswer(answer);
        qna.setStatus(QnaStatus.ANSWERED);
        qna.setUpdatedAt(LocalDateTime.now());
        repo.save(qna);

        return toDTO(qna);
    }

    @Transactional(readOnly = true)
    public List<QnaResponseDTO> getByProduct(Long productId) {
        return repo.findByProductIdOrderByCreatedAtDesc(productId)
                .stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public Product getProductByCode(String productCode) {
        return productRepo.findByProductCode(productCode)
                .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));
    }


}
