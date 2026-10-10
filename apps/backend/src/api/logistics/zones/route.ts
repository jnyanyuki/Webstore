import { NAIROBI_LANDMARKS } from "@webstore/types";

export async function GET(req: any, res: any) {
  try {
    return res.status(200).json({
      success: true,
      zones: Object.keys(NAIROBI_LANDMARKS),
      landmarks: NAIROBI_LANDMARKS,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Failed to fetch delivery zones" });
  }
}
