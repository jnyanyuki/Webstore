import {
  MpesaStkPushRequest,
  MpesaStkPushResponse,
  DeliveryAddress,
  OrderStatusTimeline,
  OrderFulfillmentStatus,
} from "@webstore/types";

export class MarketplaceApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = "http://localhost:9000") {
    this.baseUrl = baseUrl;
  }

  /**
   * Initiate M-Pesa STK Push payment
   */
  async initiateMpesaStkPush(payload: MpesaStkPushRequest): Promise<MpesaStkPushResponse> {
    const response = await fetch(`${this.baseUrl}/api/payments/mpesa/stk-push`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`M-Pesa STK Push failed with status ${response.status}`);
    }

    const json = await response.json();
    return json.data;
  }

  /**
   * Perform faceted catalog search
   */
  async searchCatalog(query: string, filters: Record<string, string> = {}) {
    const params = new URLSearchParams({ q: query, ...filters });
    const response = await fetch(`${this.baseUrl}/api/catalog/search?${params.toString()}`);
    if (!response.ok) throw new Error("Search request failed");
    return response.json();
  }

  /**
   * Fetch Nairobi delivery zones and landmarks
   */
  async getDeliveryZones() {
    const response = await fetch(`${this.baseUrl}/api/logistics/zones`);
    if (!response.ok) throw new Error("Failed to fetch delivery zones");
    return response.json();
  }

  /**
   * Dispatch Boda Rider or update order fulfillment status
   */
  async updateDispatchStatus(
    orderId: string,
    status: OrderFulfillmentStatus,
    merchantPhone?: string
  ): Promise<OrderStatusTimeline> {
    const response = await fetch(`${this.baseUrl}/api/logistics/dispatch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update",
        orderId,
        status,
        merchantPhone,
      }),
    });

    if (!response.ok) throw new Error("Failed to update dispatch status");
    const json = await response.json();
    return json.timeline;
  }
}
