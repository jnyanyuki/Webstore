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
exports.CustomProductVariant = void 0;
const typeorm_1 = require("typeorm");
const medusa_1 = require("@medusajs/medusa");
let CustomProductVariant = class CustomProductVariant {
    beforeInsert() {
        this.id = (0, medusa_1.generateEntityId)(this.id, "cvar");
    }
};
exports.CustomProductVariant = CustomProductVariant;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], CustomProductVariant.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid" }),
    __metadata("design:type", String)
], CustomProductVariant.prototype, "custom_product_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 255, unique: true }),
    __metadata("design:type", String)
], CustomProductVariant.prototype, "medusa_variant_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 100, unique: true }),
    __metadata("design:type", String)
], CustomProductVariant.prototype, "sku", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", default: 0 }),
    __metadata("design:type", Number)
], CustomProductVariant.prototype, "stock_available", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", default: 0 }),
    __metadata("design:type", Number)
], CustomProductVariant.prototype, "stock_reserved", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "jsonb", default: {} }),
    __metadata("design:type", Object)
], CustomProductVariant.prototype, "variant_options", void 0);
__decorate([
    (0, typeorm_1.BeforeInsert)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CustomProductVariant.prototype, "beforeInsert", null);
exports.CustomProductVariant = CustomProductVariant = __decorate([
    (0, typeorm_1.Entity)("custom_product_variant")
], CustomProductVariant);
