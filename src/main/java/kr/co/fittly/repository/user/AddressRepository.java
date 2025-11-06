// src/main/java/kr/co/fittly/repository/user/AddressRepository.java
package kr.co.fittly.repository.user;

import kr.co.fittly.vo.user.Address;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AddressRepository extends JpaRepository<Address, Long> {
    List<Address> findByUser_IdOrderByIsDefaultDescIdDesc(Long userId);
    Optional<Address> findByIdAndUser_Id(Long id, Long userId);
    long countByUser_Id(Long userId);

    @Modifying
    @Query("update Address a set a.isDefault = false where a.user.id = :userId and a.id <> :keepId")
    int unsetDefaultForOthers(@Param("userId") Long userId, @Param("keepId") Long keepId);
}
