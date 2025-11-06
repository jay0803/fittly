// src/main/java/kr/co/fittly/config/SchemaAutoPatchWishlist.java
package kr.co.fittly.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

@Slf4j
@Configuration
@RequiredArgsConstructor
public class SchemaAutoPatchWishlist {

    private final JdbcTemplate jdbc;

    @Bean
    ApplicationRunner patchWishlistUniqueKey() {
        return args -> {
            Integer cnt = jdbc.queryForObject("""
                SELECT COUNT(*)
                FROM information_schema.statistics
                WHERE table_schema = DATABASE()
                  AND table_name   = 'wishlist'
                  AND index_name   = 'uk_wishlist_user_product_option'
                """, Integer.class);

            if (cnt == null || cnt == 0) {
                log.info("[SchemaPatch] adding unique key uk_wishlist_user_product_option on wishlist ...");
                jdbc.execute("""
                    ALTER TABLE wishlist
                    ADD CONSTRAINT uk_wishlist_user_product_option
                    UNIQUE KEY (user_id, product_id, opt_color, opt_size)
                """);
                log.info("[SchemaPatch] done.");
            } else {
                log.info("[SchemaPatch] unique key already exists, skip.");
            }
        };
    }
}
