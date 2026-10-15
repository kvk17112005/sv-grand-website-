import { withTransaction } from "../db.js";
import { getHotelContext, getPublicCatalog } from "./catalog.js";

export async function updateHotelSettings({ input }) {
  const { hotel } = await getHotelContext();
  await withTransaction(async (client) => {
    await client.query(
      `UPDATE hotels
          SET name = coalesce($2, name),
              tagline = coalesce($3, tagline),
              address = coalesce($4, address),
              city = coalesce($5, city),
              state = coalesce($6, state),
              pincode = coalesce($7, pincode),
              phone = coalesce($8, phone),
              email = coalesce($9, email),
              updated_at = now()
        WHERE id = $1`,
      [
        hotel.id,
        input.name ? String(input.name).trim() : null,
        input.tagline !== undefined ? String(input.tagline).trim() || null : null,
        input.address !== undefined ? String(input.address).trim() || null : null,
        input.city !== undefined ? String(input.city).trim() || null : null,
        input.state !== undefined ? String(input.state).trim() || null : null,
        input.pincode !== undefined ? String(input.pincode).trim() || null : null,
        input.phone !== undefined ? String(input.phone).trim() || null : null,
        input.email !== undefined ? String(input.email).trim().toLowerCase() || null : null,
      ]
    );

    await client.query(
      `UPDATE hotel_settings
          SET check_in_time = coalesce($2, check_in_time),
              check_out_time = coalesce($3, check_out_time),
              tax_percentage = coalesce($4, tax_percentage),
              gst_number = coalesce($5, gst_number),
              wizard_discount_percentage = coalesce($6, wizard_discount_percentage),
              policy_text = coalesce($7, policy_text),
              updated_at = now()
        WHERE hotel_id = $1`,
      [
        hotel.id,
        input.checkInTime ? String(input.checkInTime).trim() : null,
        input.checkOutTime ? String(input.checkOutTime).trim() : null,
        input.taxPercentage ?? null,
        input.gstNumber !== undefined ? String(input.gstNumber).trim() || null : null,
        input.wizardDiscountPercentage ?? null,
        input.policyText !== undefined ? String(input.policyText).trim() || null : null,
      ]
    );
  });

  return getPublicCatalog();
}
