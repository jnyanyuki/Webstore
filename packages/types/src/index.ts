// Base DTOs for the Nairobi CBD Marketplace

export interface Category {
  id: string;
  parent_id?: string;
  name: string;
  slug: string;
  attribute_schema: Record<string, AttributeDefinition>;
  created_at: Date;
}

export type AttributeType = "select" | "text" | "number" | "multiselect";

export interface AttributeDefinition {
  label: string;
  type: AttributeType;
  required: boolean;
  options?: string[]; // For select/multiselect (e.g. ['S', 'M', 'L', 'XL'] or ['4GB', '8GB', '16GB'])
  unit?: string;     // e.g. 'GB', 'inches', 'W'
}

export interface Product {
  id: string;
  seller_id: string;
  category_id: string;
  title: string;
  slug: string;
  base_price: number;
  attributes: Record<string, any>; // Dynamic JSONB Data based on category schema
  is_active: boolean;
  created_at: Date;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  price: number;
  stock_available: number;
  stock_reserved: number;
  variant_options: Record<string, any>; // e.g. { size: 'M', color: 'red' }
}

// Hyper-Local Nairobi Logistics & Landmark Types
export type NairobiDeliveryZone =
  | "CBD Core"
  | "Upper Hill"
  | "Westlands"
  | "Kilimani"
  | "Ngara";

export interface Landmark {
  id: string;
  name: string;
  zone: NairobiDeliveryZone;
  description: string;
}

export const NAIROBI_LANDMARKS: Record<NairobiDeliveryZone, string[]> = {
  "CBD Core": [
    "Imenti House",
    "Kencom Bus Stage",
    "Afya Centre",
    "Ronald Ngala Street (Tuskys/OTC Stage)",
    "Nation Centre",
    "Kenya National Archives",
    "Gill House",
    "Jamia Plaza / Mall",
    "Commercial Stage (Moi Avenue)",
    "Farmer's Choice / City Hall Way",
  ],
  "Upper Hill": [
    "KNH Complex / Doctors Plaza",
    "Britam Tower",
    "UAP Old Mutual Tower",
    "Mara Road / Equity Centre",
  ],
  "Westlands": [
    "Sarit Centre",
    "Westgate Shopping Mall",
    "Mwanzi Road / Electric Avenue",
    "Sankara Hotel",
  ],
  "Kilimani": [
    "Yaya Centre",
    "Adlife Plaza",
    "Prestige Plaza (Ngong Rd)",
    "Dennis Pritt / Kilimani Ring Rd",
  ],
  "Ngara": [
    "Fig Tree Market",
    "Ngara Shopping Centre",
    "KIE / Desai Road Stage",
  ],
};

export interface DeliveryAddress {
  zone: NairobiDeliveryZone;
  landmark: string;
  buildingName: string;
  shopOrFloorNumber: string;
  recipientPhone: string;
  specialInstructions?: string;
}

// Boda Dispatch & Fulfillment Timeline
export type OrderFulfillmentStatus =
  | "PENDING"
  | "PACKED"
  | "RIDER_ASSIGNED"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "CANCELLED";

export interface RiderInfo {
  id: string;
  name: string;
  phone: string;
  motorbikePlate: string;
  currentStage: string;
}

export interface OrderStatusTimeline {
  orderId: string;
  status: OrderFulfillmentStatus;
  updatedAt: string;
  rider?: RiderInfo;
  deliveryAddress: DeliveryAddress;
  history: Array<{
    status: OrderFulfillmentStatus;
    timestamp: string;
    note?: string;
  }>;
}

// SMS / Notification Types (Africa's Talking API)
export interface SmsNotificationPayload {
  to: string; // E.164 phone format: +2547XXXXXXXX
  message: string;
}

// M-Pesa Daraja Types
export interface MpesaStkPushRequest {
  phoneNumber: string; // Format: 2547XXXXXXXX
  amount: number;
  accountReference: string;
  transactionDesc: string;
}

export interface MpesaStkPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

export interface MpesaCallbackData {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: Array<{
          Name: string;
          Value: string | number;
        }>;
      };
    };
  };
}

