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
    options?: string[];
    unit?: string;
}
export interface Product {
    id: string;
    seller_id: string;
    category_id: string;
    title: string;
    slug: string;
    base_price: number;
    attributes: Record<string, any>;
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
    variant_options: Record<string, any>;
}
export type NairobiDeliveryZone = "CBD Core" | "Upper Hill" | "Westlands" | "Kilimani" | "Ngara";
export interface Landmark {
    id: string;
    name: string;
    zone: NairobiDeliveryZone;
    description: string;
}
export declare const NAIROBI_LANDMARKS: Record<NairobiDeliveryZone, string[]>;
export interface DeliveryAddress {
    zone: NairobiDeliveryZone;
    landmark: string;
    buildingName: string;
    shopOrFloorNumber: string;
    recipientPhone: string;
    specialInstructions?: string;
}
export type OrderFulfillmentStatus = "PENDING" | "PACKED" | "RIDER_ASSIGNED" | "IN_TRANSIT" | "DELIVERED" | "CANCELLED";
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
export interface SmsNotificationPayload {
    to: string;
    message: string;
}
export interface MpesaStkPushRequest {
    phoneNumber: string;
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
