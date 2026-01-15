import AddressBatch, {
  IAddressBatch,
} from "../models/address_batch.model";

export class AddressBatchRepository {
  create(data: Partial<IAddressBatch>) {
    return AddressBatch.create(data);
  }

  findAll() {
    return AddressBatch.find();
  }

  findById(id: string) {
    return AddressBatch.findById(id);
  }

  updateById(id: string, data: Partial<IAddressBatch>) {
    return AddressBatch.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
  }
}
