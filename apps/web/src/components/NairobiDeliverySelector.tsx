"use client";

import React, { useState, useEffect } from "react";
import { NAIROBI_LANDMARKS, NairobiDeliveryZone, DeliveryAddress } from "@webstore/types";

interface Props {
  initialAddress?: DeliveryAddress;
  onAddressChange: (address: DeliveryAddress) => void;
}

const PRESET_DESTINATIONS: { label: string; zone: NairobiDeliveryZone; landmark: string; building: string }[] = [
  { label: "CBD • Imenti House", zone: "CBD Core", landmark: "Imenti House", building: "Imenti House" },
  { label: "CBD • Kencom Stage", zone: "CBD Core", landmark: "Kencom Bus Stage", building: "Kencom House" },
  { label: "Westlands • Sarit", zone: "Westlands", landmark: "Sarit Centre", building: "Sarit Centre" },
  { label: "Upper Hill • Britam", zone: "Upper Hill", landmark: "Britam Tower", building: "Britam Tower" },
  { label: "Kilimani • Yaya", zone: "Kilimani", landmark: "Yaya Centre", building: "Yaya Centre" },
];

export default function NairobiDeliverySelector({ initialAddress, onAddressChange }: Props) {
  const [zone, setZone] = useState<NairobiDeliveryZone>(initialAddress?.zone || "CBD Core");
  const [landmark, setLandmark] = useState<string>(
    initialAddress?.landmark || NAIROBI_LANDMARKS["CBD Core"][0]
  );
  const [buildingName, setBuildingName] = useState(initialAddress?.buildingName || "Imenti House");
  const [shopOrFloorNumber, setShopOrFloorNumber] = useState(initialAddress?.shopOrFloorNumber || "Stall G14");
  const [recipientPhone, setRecipientPhone] = useState(initialAddress?.recipientPhone || "254712345678");

  useEffect(() => {
    if (initialAddress) {
      if (initialAddress.zone) setZone(initialAddress.zone);
      if (initialAddress.landmark) setLandmark(initialAddress.landmark);
      if (initialAddress.buildingName !== undefined) setBuildingName(initialAddress.buildingName);
      if (initialAddress.shopOrFloorNumber !== undefined) setShopOrFloorNumber(initialAddress.shopOrFloorNumber);
      if (initialAddress.recipientPhone !== undefined) setRecipientPhone(initialAddress.recipientPhone);
    }
  }, [initialAddress]);

  const updateAddress = (updated: Partial<DeliveryAddress>) => {
    const fullAddress: DeliveryAddress = {
      zone: updated.zone || zone,
      landmark: updated.landmark || landmark,
      buildingName: updated.buildingName !== undefined ? updated.buildingName : buildingName,
      shopOrFloorNumber: updated.shopOrFloorNumber !== undefined ? updated.shopOrFloorNumber : shopOrFloorNumber,
      recipientPhone: updated.recipientPhone !== undefined ? updated.recipientPhone : recipientPhone,
    };
    onAddressChange(fullAddress);
  };

  const handleZoneChange = (newZone: NairobiDeliveryZone) => {
    setZone(newZone);
    const firstLandmark = NAIROBI_LANDMARKS[newZone][0];
    setLandmark(firstLandmark);
    updateAddress({ zone: newZone, landmark: firstLandmark });
  };

  const handleSelectPreset = (p: typeof PRESET_DESTINATIONS[0]) => {
    setZone(p.zone);
    setLandmark(p.landmark);
    setBuildingName(p.building);
    updateAddress({ zone: p.zone, landmark: p.landmark, buildingName: p.building });
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs space-y-3.5">
      <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#004f98]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Delivery Destination
        </h3>
        <span className="text-[11px] font-bold text-[#004f98] bg-blue-50 px-2 py-0.5 rounded-full">
          Instant Boda Dispatch
        </span>
      </div>

      {/* Quick 1-Tap Preset Hubs */}
      <div>
        <label className="block text-[11px] font-extrabold text-gray-400 uppercase tracking-wider mb-1.5">
          Quick Hubs:
        </label>
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
          {PRESET_DESTINATIONS.map((p) => {
            const isSelected = zone === p.zone && landmark === p.landmark;
            return (
              <button
                key={p.label}
                type="button"
                onClick={() => handleSelectPreset(p)}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#004f98] text-white border-[#004f98] shadow-2xs"
                    : "bg-gray-50 text-gray-700 border-gray-200 hover:border-[#004f98] hover:text-[#004f98]"
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3 text-xs">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Zone</label>
            <select
              value={zone}
              onChange={(e) => handleZoneChange(e.target.value as NairobiDeliveryZone)}
              className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004f98] focus:border-[#004f98] outline-none text-xs bg-white font-medium cursor-pointer"
            >
              {Object.keys(NAIROBI_LANDMARKS).map((z) => (
                <option key={z} value={z}>{z}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Nearest Landmark</label>
            <select
              value={landmark}
              onChange={(e) => {
                setLandmark(e.target.value);
                updateAddress({ landmark: e.target.value });
              }}
              className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004f98] focus:border-[#004f98] outline-none text-xs bg-white font-medium cursor-pointer"
            >
              {NAIROBI_LANDMARKS[zone].map((lm) => (
                <option key={lm} value={lm}>{lm}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Building / Court</label>
            <input
              type="text"
              placeholder="e.g. Imenti House"
              value={buildingName}
              onChange={(e) => {
                setBuildingName(e.target.value);
                updateAddress({ buildingName: e.target.value });
              }}
              className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004f98] outline-none text-xs font-medium"
            />
          </div>
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Shop / Floor / House</label>
            <input
              type="text"
              placeholder="e.g. Stall G14"
              value={shopOrFloorNumber}
              onChange={(e) => {
                setShopOrFloorNumber(e.target.value);
                updateAddress({ shopOrFloorNumber: e.target.value });
              }}
              className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004f98] outline-none text-xs font-medium"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-gray-700 mb-1">Rider Contact Phone (M-Pesa)</label>
          <input
            type="text"
            placeholder="2547XXXXXXXX"
            value={recipientPhone}
            onChange={(e) => {
              setRecipientPhone(e.target.value);
              updateAddress({ recipientPhone: e.target.value });
            }}
            className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004f98] outline-none text-xs font-medium"
          />
        </div>
      </div>
    </div>
  );
}
