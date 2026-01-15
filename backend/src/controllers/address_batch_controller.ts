import { Request, Response } from "express";
import AddressBatch, { IAddressBatch } from "../models/address_batch.model";
import { asyncHandler } from "../middleware/async.middleware";

/**
 * @desc    Create a new address batch
 * @route   POST /api/batches
 * @access  Private
 */
export const createAddressBatch = asyncHandler(
  async (req: Request, res: Response) => {
    const { Address, status } = req.body as {
      Address: string;
      status?: IAddressBatch["status"];
    };

    if (!Address || typeof Address !== "string") {
      return res.status(400).json({
        success: false,
        message: "Address field is required",
      });
    }

    // Save to DB as batchName
    const batch = await AddressBatch.create({
      batchName: Address.trim(),
      status,
    });

    // Map batchName → Address in response
    const response = {
      Address: batch.batchName,
      status: batch.status,
      _id: batch._id,
      createdAt: batch.createdAt,
    };

    res.status(201).json({
      success: true,
      data: response,
    });
  }
);


/**
 * @desc    Get all address batches
 * @route   GET /api/batches
 * @access  Private
 */
export const getAllAddressBatches = asyncHandler(
  async (_req: Request, res: Response) => {
    const batches = await AddressBatch.find();

    // Map each batchName → Address
    const response = batches.map((b) => ({
      Address: b.batchName,
      status: b.status,
      _id: b._id,
      createdAt: b.createdAt,
    }));

    res.status(200).json({
      success: true,
      count: response.length,
      data: response,
    });
  }
);

/**
 * @desc    Get address batch by ID
 * @route   GET /api/batches/:id
 * @access  Private
 */
export const getAddressBatchById = asyncHandler(
  async (req: Request, res: Response) => {
    const batch = await AddressBatch.findById(req.params.id);

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found",
      });
    }

    const response = {
      Address: batch.batchName,
      status: batch.status,
      _id: batch._id,
      createdAt: batch.createdAt,
    };

    res.status(200).json({
      success: true,
      data: response,
    });
  }
);

/**
 * @desc    Update address batch by ID
 * @route   PUT /api/batches/:id
 * @access  Private
 */
export const updateAddressBatch = asyncHandler(
  async (req: Request, res: Response) => {
    const { Address, status } = req.body as Partial<{
      Address: string;
      status: IAddressBatch["status"];
    }>;

    // Map Address → batchName for DB update
    const updateData: Partial<IAddressBatch> = {};
    if (Address) updateData.batchName = Address;
    if (status) updateData.status = status;

    const batch = await AddressBatch.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found",
      });
    }

    const response = {
      Address: batch.batchName,
      status: batch.status,
      _id: batch._id,
      createdAt: batch.createdAt,
    };

    res.status(200).json({
      success: true,
      data: response,
    });
  }
);
