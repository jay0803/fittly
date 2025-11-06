package kr.co.fittly.repository.notice;

import kr.co.fittly.vo.notice.Notice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface NoticeRepository extends JpaRepository<Notice, Long>, JpaSpecificationExecutor<Notice> {

    // 고정된 공지사항만 (pinOrder ASC, createdAt DESC)
    @Query("SELECT n FROM Notice n WHERE n.pinned = true ORDER BY n.pinOrder ASC, n.createdAt DESC")
    List<Notice> findPinnedAll();

    @Modifying
    @Query("update Notice n set n.views = n.views + 1 where n.id = :id")
    void increaseViews(@Param("id") Long id);
}
