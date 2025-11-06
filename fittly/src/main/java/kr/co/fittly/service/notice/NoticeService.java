package kr.co.fittly.service.notice;

import kr.co.fittly.dto.notice.*;
import kr.co.fittly.repository.notice.NoticeRepository;
import kr.co.fittly.repository.user.UserRepository;
import kr.co.fittly.vo.user.User;
import kr.co.fittly.vo.notice.Notice;
import kr.co.fittly.vo.notice.NoticeSearchType;
import kr.co.fittly.vo.notice.NoticeSpecs;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class NoticeService {

    private final NoticeRepository repo;
    private final UserRepository userRepo;

    public NoticeService(NoticeRepository repo, UserRepository userRepo) {
        this.repo = repo;
        this.userRepo = userRepo;
    }

    @Transactional(readOnly = true)
    public Page<NoticeSummaryDTO> list(NoticeSearchType type, String q, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        var spec = NoticeSpecs.excludePinned().and(NoticeSpecs.search(type, q));
        return repo.findAll(spec, pageable).map(this::toSummaryDTO);
    }

    @Transactional(readOnly = true)
    public List<NoticeSummaryDTO> pinned() {
        return repo.findPinnedAll().stream()
                .map(this::toSummaryDTO)
                .toList();
    }

    @Transactional
    public NoticeDetailDTO readAndIncreaseViews(Long id) {
        repo.increaseViews(id); // DB에서 직접 +1
        Notice n = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("공지 없음"));
        return toDetailDTO(n);
    }


    @Transactional
    public Long create(Long adminUserId, NoticeCreateRequest req) {
        User author = userRepo.findById(adminUserId)
                .orElseThrow(() -> new IllegalArgumentException("작성자 없음"));

        Notice n = new Notice();
        n.setAuthor(author);
        n.setTitle(req.title());
        n.setContent(req.content());
        n.setPinned(req.pinned());
        n.setPinOrder(req.pinOrder() != null ? req.pinOrder() : 0);
        n.setViews(0L);

        return repo.save(n).getId();
    }

    @Transactional
    public void update(Long id, NoticeUpdateRequest req) {
        Notice n = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("공지 없음"));

        if (req.title() != null) n.setTitle(req.title());
        if (req.content() != null) n.setContent(req.content());
        if (req.pinned() != null) n.setPinned(req.pinned());
        if (req.pinOrder() != null) n.setPinOrder(req.pinOrder());
    }

    @Transactional
    public void delete(Long id) {
        repo.deleteById(id);
    }

    @Transactional
    public void setPin(Long id, boolean pinned, Integer pinOrder) {
        Notice n = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("공지 없음"));
        n.setPinned(pinned);
        if (pinOrder != null) n.setPinOrder(pinOrder);
    }

    private NoticeSummaryDTO toSummaryDTO(Notice n) {
        String authorName = (n.getAuthor().getName() != null && !n.getAuthor().getName().isBlank())
                ? n.getAuthor().getName()
                : n.getAuthor().getLoginId();

        return new NoticeSummaryDTO(
                n.getId(),
                n.getTitle(),
                n.isPinned(),
                n.getPinOrder(),
                n.getViews(),
                authorName,
                n.getCreatedAt()
        );
    }

    private NoticeDetailDTO toDetailDTO(Notice n) {
        String authorName = (n.getAuthor().getName() != null && !n.getAuthor().getName().isBlank())
                ? n.getAuthor().getName()
                : n.getAuthor().getLoginId();

        return new NoticeDetailDTO(
                n.getId(),
                n.getTitle(),
                n.getContent(),
                n.isPinned(),
                n.getPinOrder(),
                n.getViews(),
                authorName,
                n.getCreatedAt(),
                n.getUpdatedAt()
        );
    }
}
