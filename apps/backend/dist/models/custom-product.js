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
exports.CustomProduct = void 0;
const typeorm_1 = require("typeorm");
const medusa_1 = require("@medusajs/medusa");
let CustomProduct = class CustomProduct {
    beforeInsert() {
        this.id = (0, medusa_1.generateEntityId)(this.id, "cprod");
    }
};
exports.CustomProduct = CustomProduct;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], CustomProduct.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 255, unique: true }),
    __metadata("design:type", String)
], CustomProduct.prototype, "medusa_product_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid" }),
    __metadata("design:type", String)
], CustomProduct.prototype, "seller_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid", nullable: true }),
    __metadata("design:type", String)
], CustomProduct.prototype, "category_id", void 0);
__decorate([
    (0, typeorm_1.Index)("idx_custom_product_attributes", { synchronize: false }),
    (0, typeorm_1.Column)({ type: "jsonb", default: {} }),
    __metadata("design:type", Object)
], CustomProduct.prototype, "attributes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: "timestamptz" }),
    __metadata("design:type", Date)
], CustomProduct.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: "timestamptz" }),
    __metadata("design:type", Date)
], CustomProduct.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.BeforeInsert)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CustomProduct.prototype, "beforeInsert", null);
exports.CustomProduct = CustomProduct = __decorate([
    (0, typeorm_1.Entity)("custom_product")
], CustomProduct);
