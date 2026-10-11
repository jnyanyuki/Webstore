-- ====================================================================
-- Phase 3 Alert Triggers: Price-Drop & Back-in-Stock Notifications
-- ====================================================================

-- Function to evaluate listing mutations and dispatch pg_notify events
CREATE OR REPLACE FUNCTION notify_vendor_listing_changes()
RETURNS TRIGGER AS $$
DECLARE
    event_payload JSONB;
BEGIN
    -- Scenario 1: Back-in-Stock (Stock was 0, now > 0)
    IF OLD.stock_quantity = 0 AND NEW.stock_quantity > 0 THEN
        event_payload := jsonb_build_object(
            'event', 'BACK_IN_STOCK',
            'canonical_product_id', NEW.canonical_product_id,
            'vendor_id', NEW.vendor_id,
            'old_stock', OLD.stock_quantity,
            'new_stock', NEW.stock_quantity,
            'current_price', NEW.price
        );
        PERFORM pg_notify('product_events', event_payload::text);
    END IF;

    -- Scenario 2: Price Drop (New price is strictly lower than old price, and stock > 0)
    IF NEW.price < OLD.price AND NEW.stock_quantity > 0 THEN
        event_payload := jsonb_build_object(
            'event', 'PRICE_DROP',
            'canonical_product_id', NEW.canonical_product_id,
            'vendor_id', NEW.vendor_id,
            'old_price', OLD.price,
            'new_price', NEW.price,
            'discount_amount', ROUND((OLD.price - NEW.price)::numeric, 2),
            'discount_percent', ROUND((((OLD.price - NEW.price) / OLD.price) * 100)::numeric, 1),
            'stock_quantity', NEW.stock_quantity
        );
        PERFORM pg_notify('product_events', event_payload::text);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to vendor_listings
DROP TRIGGER IF EXISTS trg_vendor_listing_alerts ON vendor_listings;
CREATE TRIGGER trg_vendor_listing_alerts
AFTER UPDATE ON vendor_listings
FOR EACH ROW
EXECUTE FUNCTION notify_vendor_listing_changes();
