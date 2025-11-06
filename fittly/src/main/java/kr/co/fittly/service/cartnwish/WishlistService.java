// src/main/java/kr/co/fittly/service/cartnwish/WishlistService.java
package kr.co.fittly.service.cartnwish;

import kr.co.fittly.dto.cartnwish.WishlistResponse;

import java.util.List;

/**
 * 위시리스트 서비스 인터페이스
 *
 * - 옵션(색상코드 color / 사이즈 size) 조합을 '중복 판정 키'로 사용해서 멱등 처리
 * - colorName은 '표시용 라벨'이므로 중복 판정에는 사용하지 않음  // [NEW] 명시
 * - null/공백 문자열은 구현에서 trim 후 null로 정규화하여 비교
 * - 기존(옵션 없음 / color+size만) 호출부와의 하위 호환을 위해 default 오버로드 제공
 */
public interface WishlistService {

    /** 사용자 위시리스트 전체 조회 */
    List<WishlistResponse> getWishlist(String loginId);

    // ───── 핵심(권장) 시그니처: color+size만 키로 사용 ─────

    /**
     * 찜 추가 (멱등)
     * 동일 (productId, color, size) 조합이 이미 있으면 no-op.   // [NEW] colorName 제외
     */
    void add(String loginId, Long productId, String color, String size);   // [NEW] 핵심 추상 메서드

    /**
     * 찜 해제 (옵션까지 일치하는 항목만 제거, 없으면 no-op)       // [NEW] colorName 제외
     */
    void remove(String loginId, Long productId, String color, String size); // [NEW] 핵심 추상 메서드

    /**
     * 해당 옵션으로 이미 찜했는지 여부 (color+size 기준)          // [NEW] colorName 제외
     */
    boolean exists(String loginId, Long productId, String color, String size); // [NEW] 핵심 추상 메서드

    // ───── 하위 호환: 기존 호출 형태 보존 (colorName 인자는 무시) ─────

    /**
     * @deprecated colorName은 표시용이므로 중복 판정에 사용하지 않습니다. color/size만 전달하세요.
     */
    @Deprecated // [NEW]
    default void add(String loginId, Long productId, String color, String colorName, String size) {
        add(loginId, productId, color, size); // [NEW] colorName 무시하여 위임
    }

    /**
     * @deprecated colorName은 표시용이므로 중복 판정에 사용하지 않습니다. color/size만 전달하세요.
     */
    @Deprecated // [NEW]
    default void remove(String loginId, Long productId, String color, String colorName, String size) {
        remove(loginId, productId, color, size); // [NEW] colorName 무시하여 위임
    }

    /**
     * @deprecated colorName은 표시용이므로 중복 판정에 사용하지 않습니다. color/size만 전달하세요.
     */
    @Deprecated // [NEW]
    default boolean exists(String loginId, Long productId, String color, String colorName, String size) {
        return exists(loginId, productId, color, size); // [NEW] colorName 무시하여 위임
    }

    // ───── 하위 호환: 옵션 없는 형태 유지 ─────

    /** 옵션 없이 찜 추가 → color/size = null */
    default void add(String loginId, Long productId) {
        add(loginId, productId, null, null);
    }

    /** 옵션 없이 찜 해제 */
    default void remove(String loginId, Long productId) {
        remove(loginId, productId, null, null);
    }

    /** 옵션 없이 존재 여부 */
    default boolean exists(String loginId, Long productId) {
        return exists(loginId, productId, null, null);
    }
}
