USE defaultdb;

CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

SET @has_category_id = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'products'
    AND COLUMN_NAME = 'category_id'
);

SET @add_category_id = IF(
  @has_category_id = 0,
  'ALTER TABLE products ADD COLUMN category_id INT NULL',
  'SELECT 1'
);
PREPARE migration_statement FROM @add_category_id;
EXECUTE migration_statement;
DEALLOCATE PREPARE migration_statement;

SET @has_category_foreign_key = (
  SELECT COUNT(*)
  FROM information_schema.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'products'
    AND COLUMN_NAME = 'category_id'
    AND REFERENCED_TABLE_NAME = 'categories'
    AND REFERENCED_COLUMN_NAME = 'id'
);

SET @add_category_foreign_key = IF(
  @has_category_foreign_key = 0,
  'ALTER TABLE products ADD CONSTRAINT fk_products_categories FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL',
  'SELECT 1'
);
PREPARE migration_statement FROM @add_category_foreign_key;
EXECUTE migration_statement;
DEALLOCATE PREPARE migration_statement;
