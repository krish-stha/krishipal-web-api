import { AddressBatchRepository } from "../repositories/address_batch.repository";
import { HttpError } from "../errors/http-error";
import { IAddressBatch } from "../models/address_batch.model";

const repo = new AddressBatchRepository();

export class AddressBatchService {
  async create(data: Pick<IAddressBatch, "batchName" | "status">) {
    return repo.create(data);
  }

  async findAll() {
    return repo.findAll();
  }

  async findById(id: string) {
    const batch = await repo.findById(id);
    if (!batch) {
      throw new HttpError(404, "Batch not found");
    }
    return batch;
  }

  async update(
    id: string,
    data: Partial<Pick<IAddressBatch, "batchName" | "status">>
  ) {
    const batch = await repo.updateById(id, data);
    if (!batch) {
      throw new HttpError(404, "Batch not found");
    }
    return batch;
  }
}
