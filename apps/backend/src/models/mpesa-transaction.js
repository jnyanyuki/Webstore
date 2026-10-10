"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MpesaTransaction = void 0;
const typeorm_1 = require("typeorm");
const medusa_1 = require("@medusajs/medusa");
let MpesaTransaction = class MpesaTransaction {
    beforeInsert() {
        this.id = (0, medusa_1.generateEntityId)(this.id, "mptxn");
    }
};
exports.MpesaTransaction = MpesaTransaction;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], MpesaTransaction.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 255 }),
    __metadata("design:type", String)
], MpesaTransaction.prototype, "medusa_order_id", void 0);
__decorate([
    (0, typeorm_1.Index)("idx_mpesa_transaction_checkout_id"),
    (0, typeorm_1.Column)({ type: "varchar", length: 255, unique: true }),
    __metadata("design:type", String)
], MpesaTransaction.prototype, "checkout_request_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 100, unique: true, nullable: true }),
    __metadata("design:type", Object)
], MpesaTransaction.prototype, "mpesa_receipt_number", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "decimal", precision: 12, scale: 2 }),
    __metadata("design:type", Number)
], MpesaTransaction.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 15 }),
    __metadata("design:type", String)
], MpesaTransaction.prototype, "phone_number", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 50, default: "PENDING" }),
    __metadata("design:type", String)
], MpesaTransaction.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", Object)
], MpesaTransaction.prototype, "failure_reason", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: "timestamptz" }),
    __metadata("design:type", Date)
], MpesaTransaction.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: "timestamptz" }),
    __metadata("design:type", Date)
], MpesaTransaction.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.BeforeInsert)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MpesaTransaction.prototype, "beforeInsert", null);
exports.MpesaTransaction = MpesaTransaction = __decorate([
    (0, typeorm_1.Entity)("mpesa_transaction")
], MpesaTransaction);
