import { revalidatePath } from "next/cache";
import { requireUser } from "@/modules/core/auth";
import { handle, HttpError } from "@/modules/core/http";
import { createRoute, MAX_GPX_BYTES, parseRouteInput } from "@/modules/routes/routes";

// POST /api/routes  multipart/form-data: gpx (file), name, description, difficulty, surface, district
// The server stores the GPX itself, so clients never write to Storage.
export function POST(req: Request) {
  return handle(async () => {
    const user = await requireUser(req);
    const form = await req.formData().catch(() => null);
    if (!form) throw new HttpError(400, "ข้อมูลไม่ถูกต้อง");
    const file = form.get("gpx");
    if (!(file instanceof File) || file.size === 0) throw new HttpError(400, "กรุณาเลือกไฟล์ GPX");
    if (file.size > MAX_GPX_BYTES) throw new HttpError(400, "ไฟล์ GPX ต้องไม่เกิน 5 MB");
    const route = await createRoute(user, parseRouteInput(form), await file.text());
    revalidatePath("/routes");
    return route;
  });
}
