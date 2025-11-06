// src/main/java/kr/co/fittly/repository/user/UserImageRepository.java
package kr.co.fittly.repository.user;

import kr.co.fittly.vo.user.UserImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface UserImageRepository extends JpaRepository<UserImage, Long> {

    // 팀원 하위호환: 엔티티에 userId 필드가 없어도 안전히 동작하도록 JPQL로 구현
    @Query("select i from UserImage i where i.user.id = :userId")
    List<UserImage> findByUserId(@Param("userId") Long userId);

    // 팀원 하위호환: createdAt 기준 내림차순 (Auditing 기반)
    @Query("select i from UserImage i where i.user.id = :userId order by i.createdAt desc")
    List<UserImage> findAllByUserIdOrderByCreatedAtDesc(@Param("userId") Long userId);

    // 권장: 연관경로 기반 메서드 (필드명 정확, 파생쿼리로 바로 동작)
    List<UserImage> findAllByUser_IdOrderByIdDesc(Long userId);

    // 하위호환: 메서드명 유지 + id 내림차순 정렬 보장
    @Query("select i from UserImage i where i.user.id = :userId order by i.id desc")
    List<UserImage> findAllByUserIdOrderByIdDesc(@Param("userId") Long userId);
}
