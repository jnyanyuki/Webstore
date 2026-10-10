-- =====================================================================================
-- NAIROBI MARKETPLACE CORE SCHEMA EXTENSIONS (PostgreSQL)
-- MedusaJS handles base e-commerce entities (orders, carts, users), 
-- these extensions power our specific Nairobi CBD marketplace requirements.
-- =====================================================================================

-- 1. Dynamic Category Taxonomy
-- Supports deep hierarchies and enforces JSON schemas for product attributes.
CREATE TABLE IF NOT EXISTS custom_category (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES custom_category(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    
    -- E.g. {"type": "object", "properties": {"screen_size": {"type": "string"}}}
    attribute_schema JSONB NOT NULL DEFAULT '{}', 
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fast lookup for slugs
CREATE INDEX idx_custom_category_slug ON custom_category(slug);


-- 2. Products with Polymorphic JSONB Attributes
CREATE TABLE IF NOT EXISTS custom_product (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medusa_product_id VARCHAR(255) UNIQUE NOT NULL, -- Link to Medusa's core product table
    seller_id UUID NOT NULL,                        -- Multi-vendor support
    category_id UUID REFERENCES custom_category(id),
    
    -- The actual dynamic data entered by the seller, validated against category.attribute_schema
    attributes JSONB NOT NULL DEFAULT '{}', 
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fast GIN index allowing us to query deep within the JSONB payload 
-- (e.g. Find all products where attributes->>'RAM' = '8GB')
CREATE INDEX idx_custom_product_attributes ON custom_product USING GIN (attributes);


-- 3. High-Concurrency Inventory Tracking (Variants)
CREATE TABLE IF NOT EXISTS custom_product_variant (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    custom_product_id UUID REFERENCES custom_product(id) ON DELETE CASCADE,
    medusa_variant_id VARCHAR(255) UNIQUE NOT NULL,
    sku VARCHAR(100) UNIQUE NOT NULL,
    
    -- Optimistic concurrency fields to prevent overselling during flash sales
    stock_available INT NOT NULL DEFAULT 0,
    stock_reserved INT NOT NULL DEFAULT 0,
    
    -- Specific variant options like {"color": "red", "size": "XL"}
    variant_options JSONB NOT NULL DEFAULT '{}',
    
    -- Database-level protection against negative stock
    CONSTRAINT chk_positive_stock CHECK (stock_available >= 0)
);


-- 4. Daraja M-Pesa Idempotency & Audit Log
-- Prevents double-processing if Safaricom sends duplicate callbacks
CREATE TABLE IF NOT EXISTS mpesa_transaction (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medusa_order_id VARCHAR(255) NOT NULL,
    checkout_request_id VARCHAR(255) UNIQUE NOT NULL, -- Safaricom's session tracker
    
    -- The actual M-Pesa receipt (e.g. OXL934ABCD) MUST be unique to prevent replay attacks
    mpesa_receipt_number VARCHAR(100) UNIQUE,
    
    amount DECIMAL(12, 2) NOT NULL,
    phone_number VARCHAR(15) NOT NULL,
    
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, COMPLETED, FAILED
    failure_reason TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensures fast lookups when Daraja callback hits our server
CREATE INDEX idx_mpesa_transaction_checkout_id ON mpesa_transaction(checkout_request_id);
