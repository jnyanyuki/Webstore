import {
  OrderFulfillmentStatus,
  OrderStatusTimeline,
  RiderInfo,
  DeliveryAddress,
} from "@webstore/types";
import { AfricasTalkingService } from "./africas-talking";

// Mock database store for Order Timelines
const orderTimelines: Map<string, OrderStatusTimeline> = new Map();

// Sample Boda Boda Riders stationed in Nairobi CBD Stages
const AVAILABLE_RIDERS: RiderInfo[] = [
  { id: "r1", name: "Kamau Njuguna", phone: "+254712345678", motorbikePlate: "KMCE 452X", currentStage: "Kencom Stage" },
  { id: "r2", name: "Otieno Omondi", phone: "+254723456789", motorbikePlate: "KMDF 891Z", currentStage: "Afya Centre Stage" },
  { id: "r3", name: "Kipchumba Bett", phone: "+254734567890", motorbikePlate: "KMCG 112Y", currentStage: "OTC / Ronald Ngala" },
];

export class BodaDispatchService {
  private atService: AfricasTalkingService;

  constructor() {
    this.atService = new AfricasTalkingService();
  }

  /**
   * Initialize a new order timeline when order is created
   */
  createOrderTimeline(orderId: string, deliveryAddress: DeliveryAddress): OrderStatusTimeline {
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
    orderTimelines.set(orderId, timeline);
    return timeline;
  }

  /**
   * Get order status timeline
   */
  getOrderTimeline(orderId: string): OrderStatusTimeline | undefined {
    return orderTimelines.get(orderId);
  }

  /**
   * Update order fulfillment status and dispatch alerts
   */
  async updateStatus(
    orderId: string,
    newStatus: OrderFulfillmentStatus,
    note?: string,
    merchantPhone?: string
  ): Promise<OrderStatusTimeline> {
    let timeline = orderTimelines.get(orderId);
    if (!timeline) {
      throw new Error(`Order #${orderId} timeline not found`);
    }

    timeline.status = newStatus;
    timeline.updatedAt = new Date().toISOString();

    // Auto-assign rider if status is PACKED or RIDER_ASSIGNED
    if (newStatus === "PACKED" && !timeline.rider) {
      const assignedRider = AVAILABLE_RIDERS[Math.floor(Math.random() * AVAILABLE_RIDERS.length)];
      timeline.rider = assignedRider;
      timeline.status = "RIDER_ASSIGNED";

      // Trigger Merchant SMS Notification
      if (merchantPhone) {
        await this.atService.notifyMerchantRiderAssigned(
          merchantPhone,
          orderId,
          assignedRider.name,
          assignedRider.phone
        );
      }
    }

    timeline.history.push({
      status: timeline.status,
      timestamp: new Date().toISOString(),
      note: note || `Order updated to ${timeline.status}`,
    });

    // Notify customer via SMS
    if (timeline.deliveryAddress.recipientPhone) {
      await this.atService.notifyCustomerOrderStatus(
        timeline.deliveryAddress.recipientPhone,
        orderId,
        timeline.status,
        timeline.rider ? `Rider: ${timeline.rider.name} (${timeline.rider.motorbikePlate})` : undefined
      );
    }

    orderTimelines.set(orderId, timeline);
    return timeline;
  }
}
