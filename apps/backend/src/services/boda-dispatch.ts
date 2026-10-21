import {
  OrderFulfillmentStatus,
  OrderStatusTimeline,
  RiderInfo,
  DeliveryAddress,
} from "@webstore/types";
import { AfricasTalkingService } from "./africas-talking";
import { dbPool } from "./navigation";
import { NotificationHub } from "./notifications";

// Fallback in-memory cache
const memoryTimelines: Map<string, OrderStatusTimeline> = new Map();

const DEFAULT_RIDERS: RiderInfo[] = [
  { id: "r1", name: "Kamau Njuguna", phone: "+254712345678", motorbikePlate: "KMCE 452X", currentStage: "Kencom Stage" },
  { id: "r2", name: "Otieno Omondi", phone: "+254723456789", motorbikePlate: "KMDF 891Z", currentStage: "Afya Centre Stage" },
  { id: "r3", name: "Kipchumba Bett", phone: "+254734567890", motorbikePlate: "KMCG 112Y", currentStage: "OTC / Ronald Ngala" },
];

export class BodaDispatchService {
  private atService: AfricasTalkingService;
  private static tablesInitialized = false;

  constructor() {
    this.atService = new AfricasTalkingService();
  }

  public static async ensureTablesExist(): Promise<void> {
    if (this.tablesInitialized) return;
    try {
      await dbPool.query(`
        CREATE TABLE IF NOT EXISTS riders (
          id VARCHAR(50) PRIMARY KEY,
          name VARCHAR(150) NOT NULL,
          phone VARCHAR(30) NOT NULL,
          motorbike_plate VARCHAR(30) NOT NULL,
          current_stage VARCHAR(100) NOT NULL,
          is_available BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS merchant_orders (
          id VARCHAR(100) PRIMARY KEY,
          user_id UUID,
          merchant_id VARCHAR(100) DEFAULT 'VEND-CBD-042',
          total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
          currency VARCHAR(10) DEFAULT 'KES',
          status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
          customer_name VARCHAR(150),
          customer_phone VARCHAR(30),
          delivery_address JSONB,
          items JSONB,
          rider_id VARCHAR(50) REFERENCES riders(id) ON DELETE SET NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS order_timeline_events (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          order_id VARCHAR(100) NOT NULL REFERENCES merchant_orders(id) ON DELETE CASCADE,
          status VARCHAR(50) NOT NULL,
          note TEXT,
          timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);

      // Seed riders if empty
      const ridersRes = await dbPool.query(`SELECT COUNT(*) FROM riders`);
      if (parseInt(ridersRes.rows[0].count, 10) === 0) {
        for (const rider of DEFAULT_RIDERS) {
          await dbPool.query(
            `INSERT INTO riders (id, name, phone, motorbike_plate, current_stage)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (id) DO NOTHING`,
            [rider.id, rider.name, rider.phone, rider.motorbikePlate, rider.currentStage]
          );
        }
      }

      // Seed initial demo order ORD-CBD-8891 if empty
      const orderRes = await dbPool.query(`SELECT COUNT(*) FROM merchant_orders WHERE id = 'ORD-CBD-8891'`);
      if (parseInt(orderRes.rows[0].count, 10) === 0) {
        const address = {
          zone: "CBD Core",
          landmark: "Imenti House",
          buildingName: "Imenti House",
          shopOrFloorNumber: "Stall G14",
          recipientPhone: "+254712345678",
        };
        const items = [
          { name: "Sony WH-1000XM5 Wireless Headphones", qty: 1, price: 38500 },
        ];
        await dbPool.query(
          `INSERT INTO merchant_orders (id, merchant_id, total_amount, currency, status, customer_name, customer_phone, delivery_address, items)
           VALUES ('ORD-CBD-8891', 'VEND-CBD-042', 38500, 'KES', 'PENDING', 'Frederick Mabeya', '+254712345678', $1, $2)
           ON CONFLICT (id) DO NOTHING`,
          [JSON.stringify(address), JSON.stringify(items)]
        );

        await dbPool.query(
          `INSERT INTO order_timeline_events (order_id, status, note, timestamp)
           VALUES ('ORD-CBD-8891', 'PENDING', 'M-Pesa payment confirmed (Receipt: QK42L89X)', NOW())`
        );
      }

      this.tablesInitialized = true;
    } catch (err) {
      console.error("[BodaDispatchService] Table init error:", err);
    }
  }

  /**
   * Initialize a new order timeline when order is created
   */
  async createOrderTimeline(orderId: string, deliveryAddress: DeliveryAddress): Promise<OrderStatusTimeline> {
    await BodaDispatchService.ensureTablesExist();
    try {
      await dbPool.query(
        `INSERT INTO merchant_orders (id, delivery_address, status)
         VALUES ($1, $2, 'PENDING')
         ON CONFLICT (id) DO NOTHING`,
        [orderId, JSON.stringify(deliveryAddress)]
      );

      await dbPool.query(
        `INSERT INTO order_timeline_events (order_id, status, note, timestamp)
         VALUES ($1, 'PENDING', 'Order placed by customer', NOW())`,
        [orderId]
      );
    } catch (err) {
      console.warn("[BodaDispatchService] Error creating order timeline in DB", err);
    }

    const timeline: OrderStatusTimeline = {
      orderId,
      status: "PENDING",
      updatedAt: new Date().toISOString(),
      deliveryAddress,
      history: [
        {
          status: "PENDING",
          timestamp: new Date().toISOString(),
          note: "Order placed by customer",
        },
      ],
    };
    memoryTimelines.set(orderId, timeline);
    return timeline;
  }

  /**
   * Retrieves list of orders for a merchant
   */
  async getMerchantOrders(merchantId = "VEND-CBD-042"): Promise<any[]> {
    await BodaDispatchService.ensureTablesExist();
    try {
      const res = await dbPool.query(
        `SELECT o.*, 
                r.id as rider_code, r.name as rider_name, r.phone as rider_phone, 
                r.motorbike_plate, r.current_stage
         FROM merchant_orders o
         LEFT JOIN riders r ON r.id = o.rider_id
         WHERE o.merchant_id = $1
         ORDER BY o.updated_at DESC
         LIMIT 50`,
        [merchantId]
      );

      return res.rows.map((row) => ({
        id: row.id,
        orderId: row.id,
        status: row.status,
        totalAmount: parseFloat(row.total_amount),
        currency: row.currency,
        customerName: row.customer_name,
        customerPhone: row.customer_phone,
        deliveryAddress: row.delivery_address,
        items: row.items,
        updatedAt: row.updated_at,
        rider: row.rider_id
          ? {
              id: row.rider_code,
              name: row.rider_name,
              phone: row.rider_phone,
              motorbikePlate: row.motorbike_plate,
              currentStage: row.current_stage,
            }
          : undefined,
      }));
    } catch (err) {
      console.warn("[BodaDispatchService] Error fetching orders, using memory fallback", err);
      return [];
    }
  }

  /**
   * Get single order status timeline
   */
  async getOrderTimeline(orderId: string): Promise<OrderStatusTimeline | undefined> {
    await BodaDispatchService.ensureTablesExist();
    try {
      const orderRes = await dbPool.query(
        `SELECT o.*, r.id as r_id, r.name as r_name, r.phone as r_phone, r.motorbike_plate, r.current_stage
         FROM merchant_orders o
         LEFT JOIN riders r ON r.id = o.rider_id
         WHERE o.id = $1`,
        [orderId]
      );

      if (orderRes.rows.length === 0) {
        return memoryTimelines.get(orderId);
      }

      const row = orderRes.rows[0];
      const historyRes = await dbPool.query(
        `SELECT status, note, timestamp FROM order_timeline_events WHERE order_id = $1 ORDER BY timestamp ASC`,
        [orderId]
      );

      return {
        orderId: row.id,
        status: row.status as OrderFulfillmentStatus,
        updatedAt: row.updated_at,
        deliveryAddress: row.delivery_address,
        rider: row.rider_id
          ? {
              id: row.r_id,
              name: row.r_name,
              phone: row.r_phone,
              motorbikePlate: row.motorbike_plate,
              currentStage: row.current_stage,
            }
          : undefined,
        history: historyRes.rows.map((h) => ({
          status: h.status,
          timestamp: h.timestamp,
          note: h.note,
        })),
      };
    } catch {
      return memoryTimelines.get(orderId);
    }
  }

  /**
   * Update order status, assign rider, notify via SMS & broadcast via SSE
   */
  async updateStatus(
    orderId: string,
    newStatus: OrderFulfillmentStatus,
    note?: string,
    merchantPhone?: string
  ): Promise<OrderStatusTimeline> {
    await BodaDispatchService.ensureTablesExist();

    let assignedRider: RiderInfo | undefined;
    let nextStatus = newStatus;

    // Pick available rider
    if (newStatus === "PACKED") {
      try {
        const riderRes = await dbPool.query(
          `SELECT * FROM riders WHERE is_available = TRUE ORDER BY RANDOM() LIMIT 1`
        );
        if (riderRes.rows.length > 0) {
          const r = riderRes.rows[0];
          assignedRider = {
            id: r.id,
            name: r.name,
            phone: r.phone,
            motorbikePlate: r.motorbike_plate,
            currentStage: r.current_stage,
          };
          nextStatus = "RIDER_ASSIGNED";
        }
      } catch {
        assignedRider = DEFAULT_RIDERS[0];
        nextStatus = "RIDER_ASSIGNED";
      }
    }

    const noteText = note || `Order updated to ${nextStatus}`;

    // Update DB
    try {
      await dbPool.query(
        `UPDATE merchant_orders 
         SET status = $1, rider_id = COALESCE($2, rider_id), updated_at = NOW() 
         WHERE id = $3`,
        [nextStatus, assignedRider ? assignedRider.id : null, orderId]
      );

      await dbPool.query(
        `INSERT INTO order_timeline_events (order_id, status, note, timestamp)
         VALUES ($1, $2, $3, NOW())`,
        [orderId, nextStatus, noteText]
      );
    } catch (err) {
      console.warn("[BodaDispatchService] DB update error, falling back to memory", err);
    }

    const timeline = (await this.getOrderTimeline(orderId)) || {
      orderId,
      status: nextStatus,
      updatedAt: new Date().toISOString(),
      deliveryAddress: {
        zone: "CBD Core",
        landmark: "Imenti House",
        buildingName: "Imenti House",
        shopOrFloorNumber: "Stall G14",
        recipientPhone: "+254712345678",
      },
      rider: assignedRider,
      history: [
        { status: nextStatus, timestamp: new Date().toISOString(), note: noteText },
      ],
    };

    memoryTimelines.set(orderId, timeline);

    // Broadcast Real-time Server-Sent Event
    NotificationHub.broadcast({
      type: "ORDER_STATUS_UPDATE",
      order_id: orderId,
      message: `Order #${orderId} is now ${nextStatus}`,
      payload: timeline,
    });

    // Notify merchant & customer via SMS
    if (merchantPhone && assignedRider) {
      await this.atService.notifyMerchantRiderAssigned(
        merchantPhone,
        orderId,
        assignedRider.name,
        assignedRider.phone
      ).catch(() => {});
    }

    if (timeline.deliveryAddress?.recipientPhone) {
      await this.atService.notifyCustomerOrderStatus(
        timeline.deliveryAddress.recipientPhone,
        orderId,
        nextStatus,
        assignedRider ? `Rider: ${assignedRider.name} (${assignedRider.motorbikePlate})` : undefined
      ).catch(() => {});
    }

    return timeline;
  }
}
