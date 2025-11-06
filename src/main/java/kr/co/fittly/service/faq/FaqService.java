package kr.co.fittly.service.faq;

import kr.co.fittly.dto.faq.*;
import kr.co.fittly.repository.faq.FaqRepository;
import kr.co.fittly.repository.user.UserRepository;
import kr.co.fittly.vo.user.User;
import kr.co.fittly.vo.faq.Faq;
import kr.co.fittly.vo.faq.FaqCategory;
import kr.co.fittly.vo.faq.FaqSpecs;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FaqService {

    private final FaqRepository repo;
    private final UserRepository userRepo;

    public FaqService(FaqRepository repo, UserRepository userRepo) {
        this.repo = repo;
        this.userRepo = userRepo;
    }

    /** FAQ 목록 조회 (검색 + 페이징) */
    @Transactional(readOnly = true)
    public Page<FaqSummaryDTO> list(FaqCategory category, String q, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return repo.findAll(FaqSpecs.search(category, q), pageable)
                .map(this::toSummaryDTO);
    }

    /** FAQ 상세 조회 */
    @Transactional(readOnly = true)
    public FaqDetailDTO detail(Long id) {
        Faq f = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("FAQ 없음"));
        return toDetailDTO(f);
    }

    /** FAQ 생성 */
    @Transactional
    public Long create(Long adminUserId, FaqCreateRequest req) {
        User author = userRepo.findById(adminUserId)
                .orElseThrow(() -> new IllegalArgumentException("작성자 없음"));

        Faq f = new Faq();
        f.setCategory(req.category());
        f.setTitle(req.title());
        f.setContent(req.content());
        f.setAuthor(author);

        return repo.save(f).getId();
    }

    /** FAQ 수정 */
    @Transactional
    public void update(Long id, FaqUpdateRequest req) {
        Faq f = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("FAQ 없음"));

        if (req.category() != null) f.setCategory(req.category());
        if (req.title() != null) f.setTitle(req.title());
        if (req.content() != null) f.setContent(req.content());
    }

    /** FAQ 삭제 */
    @Transactional
    public void delete(Long id) {
        repo.deleteById(id);
    }

    // DTO 변환 ------------------------
    private FaqSummaryDTO toSummaryDTO(Faq f) {
        return new FaqSummaryDTO(
                f.getId(),
                f.getCategory().getDisplayName(), // enum → 한글 변환
                f.getTitle(),
                f.getCreatedAt()
        );
    }

    private FaqDetailDTO toDetailDTO(Faq f) {
        String authorName = (f.getAuthor().getName() != null && !f.getAuthor().getName().isBlank())
                ? f.getAuthor().getName()
                : f.getAuthor().getLoginId();

        return new FaqDetailDTO(
                f.getId(),
                f.getCategory().getDisplayName(), // enum → 한글 변환
                f.getTitle(),
                f.getContent(),
                authorName,
                f.getCreatedAt(),
                f.getUpdatedAt()
        );
    }
}
