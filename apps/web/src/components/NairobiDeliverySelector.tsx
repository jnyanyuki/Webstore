"use client";

import React, { useState } from "react";
import { NAIROBI_LANDMARKS, NairobiDeliveryZone, DeliveryAddress } from "@webstore/types";

interface Props {
  onAddressChange: (address: DeliveryAddress) => void;
}

export default function NairobiDeliverySelector({ onAddressChange }: Props) {
  const [zone, setZone] = useState<NairobiDeliveryZone>("CBD Core");
  const [landmark, setLandmark] = useState<string>(NAIROBI_LANDMARKS["CBD Core"][0]);
  const [buildingName, setBuildingName] = useState("");
  const [shopOrFloorNumber, setShopOrFloorNumber] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("254");
  const [instructions, setInstructions] = useState("");

  const updateAddress = (updated: Partial<DeliveryAddress>) => {
    const fullAddress: DeliveryAddress = {
      zone: updated.zone || zone,
      landmark: updated.landmark || landmark,
      buildingName: updated.buildingName !== undefined ? updated.buildingName : buildingName,
      shopOrFloorNumber: updated.shopOrFloorNumber !== undefined ? updated.shopOrFloorNumber : shopOrFloorNumber,
      recipientPhone: updated.recipientPhone !== undefined ? updated.recipientPhone : recipientPhone,
      specialInstructions: updated.specialInstructions !== undefined ? updated.specialInstructions : instructions,
    };
    onAddressChange(fullAddress);
  };

  const handleZoneChange = (newZone: NairobiDeliveryZone) => {
    setZone(newZone);
    const firstLandmark = NAIROBI_LANDMARKS[newZone][0];
    setLandmark(firstLandmark);
    updateAddress({ zone: newZone, landmark: firstLandmark });
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-200 mb-4">
      <h3 className="text-md font-bold text-gray-900 mb-3 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Nairobi Landmark Delivery Location
      </h3>

      <div className="space-y-4 text-sm">
        <div>
          <label className="block font-medium text-gray-700 mb-1">Delivery Zone</label>
          <select
            value={zone}
            onChange={(e) => handleZoneChange(e.target.value as NairobiDeliveryZone)}
            className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
          >
            {Object.keys(NAIROBI_LANDMARKS).map((z) => (
              <option key={z} value={z}>{z}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-medium text-gray-700 mb-1">Nearest Landmark / Stage</label>
          <select
            value={landmark}
            onChange={(e) => {
              setLandmark(e.target.value);
              updateAddress({ landmark: e.target.value });
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
          >
            {NAIROBI_LANDMARKS[zone].map((lm) => (
              <option key={lm} value={lm}>{lm}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-medium text-gray-700 mb-1">Building Name</label>
            <input
              type="text"
              placeholder="e.g. Imenti House"
              value={buildingName}
              onChange={(e) => {
                setBuildingName(e.target.value);
                updateAddress({ buildingName: e.target.value });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>
          <div>
            <label className="block font-medium text-gray-700 mb-1">Shop / Floor #</label>
            <input
              type="text"
              placeholder="e.g. Shop G12"
              value={shopOrFloorNumber}
              onChange={(e) => {
                setShopOrFloorNumber(e.target.value);
                updateAddress({ shopOrFloorNumber: e.target.value });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block font-medium text-gray-700 mb-1">Delivery Contact Phone</label>
          <input
            type="text"
            placeholder="2547XXXXXXXX"
            value={recipientPhone}
            onChange={(e) => {
              setRecipientPhone(e.target.value);
              updateAddress({ recipientPhone: e.target.value });
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
          />
        </div>
      </div>
    </div>
  );
}
