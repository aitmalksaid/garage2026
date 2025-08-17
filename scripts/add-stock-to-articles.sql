-- Adding stock_disponible column to articles table for inventory management
ALTER TABLE articles 
ADD COLUMN stock_disponible INTEGER DEFAULT 0;

-- Adding comment for clarity
COMMENT ON COLUMN articles.stock_disponible IS 'Nombre d''articles disponibles en stock';

-- Adding some sample stock data for existing articles
UPDATE articles SET stock_disponible = 10 WHERE stock_disponible = 0;
