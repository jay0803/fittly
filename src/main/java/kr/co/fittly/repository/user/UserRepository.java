// src/main/java/kr/co/fittly/repository/user/UserRepository.java
package kr.co.fittly.repository.user;

import kr.co.fittly.vo.user.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /** loginId로 PK만 빠르게 조회 (존재/외래키 검증용) */
    @Query("select u.id from User u where u.loginId = :loginId")
    Optional<Long> findIdByLoginId(@Param("loginId") String loginId);

    Optional<User> findByLoginId(String loginId);
    Optional<User> findByEmail(String email);

    Optional<User> findByEmailOrLoginId(String email, String loginId);

    Optional<User> findByLoginIdAndEmail(String loginId, String email);

    boolean existsByLoginId(String loginId);
    boolean existsByEmailIgnoreCase(String email);

    List<User> findAllByNameAndEmailIgnoreCase(String name, String email);
    List<User> findAllByEmailIgnoreCase(String email);

    Page<User> findByNameContainingIgnoreCase(String name, Pageable pageable);
    Page<User> findByNameIgnoreCase(String name, Pageable pageable);

    /** 하이픈 제거한 숫자만 비교해서 휴대폰 검색 */
    @Query("""
        select u
        from User u
        where replace(coalesce(u.phone, ''), '-', '') like concat('%', :digits, '%')
        """)
    Page<User> findByPhoneDigitsLike(@Param("digits") String digits, Pageable pageable);

    /** 이름(대소문자 무시) 또는 숫자만 남긴 휴대폰으로 통합 검색 */
    @Query("""
        select u from User u
        where (:q is null or :q = '')
           or lower(coalesce(u.name, '')) like lower(concat('%', :q, '%'))
           or replace(coalesce(u.phone, ''), '-', '') like concat('%', :qDigits, '%')
        """)
    Page<User> searchByNameOrPhone(@Param("q") String q,
                                   @Param("qDigits") String qDigits,
                                   Pageable pageable);
}
