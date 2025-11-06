// src/main/java/kr/co/fittly/config/SchemaAutoPatch.java
package kr.co.fittly.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.*;

@Slf4j
@Component
public class SchemaAutoPatch implements ApplicationRunner {

    private final DataSource dataSource;

    public SchemaAutoPatch(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public void run(ApplicationArguments args) throws Exception {
        try (Connection c = dataSource.getConnection()) {
            String product = c.getMetaData().getDatabaseProductName().toLowerCase();
            log.info("[SchemaAutoPatch] DB: {}", product);

            patchCreatedAt(c, "cart_items", product);
            patchCreatedAt(c, "wishlist", product);
            normalizeEmptyToNull(c, "cart_items", "opt_color", product);
            normalizeEmptyToNull(c, "cart_items", "opt_size", product);

            dropIndexIfExists(c, "cart_items", "uk_cart_product", product);

            ensureUniqueIndex(
                    c,
                    "cart_items",
                    "uk_cart_product_option",
                    new String[]{"cart_id", "product_id", "opt_color", "opt_size"},
                    product
            );

            normalizeEmptyToNull(c, "wishlist", "opt_color", product);
            normalizeEmptyToNull(c, "wishlist", "opt_size", product);

            dropIndexIfExists(c, "wishlist", "uk_wishlist_user_product", product);

            ensureUniqueIndex(
                    c,
                    "wishlist",
                    "uk_wishlist_user_product_option",
                    new String[]{"user_id", "product_id", "opt_color", "opt_size"},
                    product
            );

            log.info("[SchemaAutoPatch] done.");
        }
    }

    private void patchCreatedAt(Connection c, String table, String product) throws SQLException {
        if (!columnExists(c, table, "created_at")) {
            log.info("[SchemaAutoPatch] {}.created_at 추가", table);
            exec(c, "ALTER TABLE " + table + " ADD COLUMN created_at " + tsType(product) + " NULL");
            String nowFunc = nowFunc(product);
            exec(c, "UPDATE " + table + " SET created_at = " + nowFunc + " WHERE created_at IS NULL");
            if (product.contains("mysql")) {
                exec(c, "ALTER TABLE " + table + " MODIFY COLUMN created_at " + tsType(product) + " NOT NULL");
            } else if (product.contains("postgresql")) {
                exec(c, "ALTER TABLE " + table + " ALTER COLUMN created_at SET NOT NULL");
            } else if (product.contains("h2")) {
            }
        } else {
            exec(c, "UPDATE " + table + " SET created_at = " + nowFunc(product) + " WHERE created_at IS NULL");
        }
    }

    private void ensureUniqueIndex(Connection c, String table, String indexName, String[] cols, String product) throws SQLException {
        if (indexExists(c, null, null, table, indexName)) {
            return;
        }
        String columnsCsv = String.join(",", cols);

        log.info("[SchemaAutoPatch] {}.{} 유니크 인덱스 보강", table, indexName);
        if (product.contains("mysql")) {
            exec(c, "CREATE UNIQUE INDEX " + indexName + " ON " + table + " (" + columnsCsv + ")");
        } else if (product.contains("postgresql")) {
            exec(c, "CREATE UNIQUE INDEX IF NOT EXISTS " + indexName + " ON " + table + " (" + columnsCsv + ")");
        } else if (product.contains("h2")) {
            exec(c, "CREATE UNIQUE INDEX IF NOT EXISTS " + indexName + " ON " + table + " (" + columnsCsv + ")");
        } else {
            exec(c, "CREATE UNIQUE INDEX " + indexName + " ON " + table + " (" + columnsCsv + ")");
        }
    }

    private boolean columnExists(Connection c, String table, String column) throws SQLException {
        DatabaseMetaData md = c.getMetaData();
        try (ResultSet rs = md.getColumns(null, null, table, column)) {
            return rs.next();
        }
    }

    private boolean indexExists(Connection c, String catalog, String schema, String table, String indexName) throws SQLException {
        DatabaseMetaData md = c.getMetaData();
        try (ResultSet rs = md.getIndexInfo(catalog, schema, table, false, false)) {
            while (rs.next()) {
                String idx = rs.getString("INDEX_NAME");
                if (idx != null && idx.equalsIgnoreCase(indexName)) {
                    return true;
                }
            }
        }
        return false;
    }

    private void dropIndexIfExists(Connection c, String table, String indexName, String product) throws SQLException {
        if (!indexExists(c, null, null, table, indexName)) return;

        log.info("[SchemaAutoPatch] drop index {}.{}", table, indexName);
        if (product.contains("mysql")) {
            exec(c, "DROP INDEX " + indexName + " ON " + table);
        } else if (product.contains("postgresql")) {
            exec(c, "DROP INDEX IF EXISTS " + indexName);
        } else if (product.contains("h2")) {
            exec(c, "DROP INDEX IF EXISTS " + indexName);
        } else {
            exec(c, "DROP INDEX " + indexName + " ON " + table);
        }
    }

    private void normalizeEmptyToNull(Connection c, String table, String column, String product) throws SQLException {
        exec(c, "UPDATE " + table + " SET " + column + " = NULL WHERE " + column + " = ''");
    }

    private void exec(Connection c, String sql) throws SQLException {
        try (Statement st = c.createStatement()) {
            st.execute(sql);
        } catch (SQLException e) {
            log.warn("[SchemaAutoPatch] SQL 실패 (무시): {}\nReason: {}", sql, e.getMessage());
        }
    }

    private String tsType(String product) {
        if (product.contains("mysql")) return "DATETIME";
        if (product.contains("postgresql")) return "TIMESTAMP";
        return "TIMESTAMP";
    }

    private String nowFunc(String product) {
        if (product.contains("mysql")) return "NOW()";
        if (product.contains("postgresql")) return "NOW()";
        if (product.contains("h2")) return "CURRENT_TIMESTAMP()";
        return "CURRENT_TIMESTAMP";
    }
}
