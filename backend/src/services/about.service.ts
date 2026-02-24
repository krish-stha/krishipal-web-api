import { AboutModel } from "../models/about.model";
import { HttpError } from "../errors/http-error";

export class AboutService {
  async getOrCreate() {
    let doc = await AboutModel.findOne({}).lean();
    if (!doc) doc = (await AboutModel.create({})).toObject();
    return doc;
  }

  async update(payload: any) {
    const data: any = {};

    const str = (v: any) => String(v ?? "").trim();

    if (payload.heroTitle !== undefined) data.heroTitle = str(payload.heroTitle);
    if (payload.heroDescription !== undefined) data.heroDescription = str(payload.heroDescription);

    if (payload.missionTitle !== undefined) data.missionTitle = str(payload.missionTitle);
    if (payload.missionBody !== undefined) data.missionBody = str(payload.missionBody);

    if (payload.visionTitle !== undefined) data.visionTitle = str(payload.visionTitle);
    if (payload.visionBody !== undefined) data.visionBody = str(payload.visionBody);

    if (payload.missionImage !== undefined) data.missionImage = str(payload.missionImage);
    if (payload.visionImage !== undefined) data.visionImage = str(payload.visionImage);

    if (payload.published !== undefined) data.published = Boolean(payload.published);

    if (payload.socials !== undefined) {
      if (!Array.isArray(payload.socials)) throw new HttpError(400, "socials must be an array");
      data.socials = payload.socials
        .map((s: any) => ({
          label: str(s?.label),
          url: str(s?.url),
        }))
        .filter((s: any) => s.label || s.url);
    }

    const existing = await AboutModel.findOne({});
    if (!existing) {
      const created = await AboutModel.create(data);
      return created.toObject();
    }

    const updated = await AboutModel.findByIdAndUpdate(existing._id, { $set: data }, { new: true }).lean();
    return updated;
  }

  async getPublic() {
    const doc = await this.getOrCreate();
    // You can hide when not published if you want:
    // if (!doc.published) return null;
    return doc;
  }
}