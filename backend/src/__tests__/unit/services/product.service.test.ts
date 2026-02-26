/**
 * Unit tests for ProductService (no DB)
 */

const repoFindBySku = jest.fn();
const repoCreate = jest.fn();
const repoUpdateById = jest.fn();
const repoSoftDeleteById = jest.fn();
const repoHardDeleteById = jest.fn();
const repoFindById = jest.fn();
const repoListPublic = jest.fn();
const repoFindBySlug = jest.fn();

jest.mock("../../../repositories/product.repository", () => ({
  ProductRepository: jest.fn().mockImplementation(() => ({
    findBySku: repoFindBySku,
    create: repoCreate,
    updateById: repoUpdateById,
    softDeleteById: repoSoftDeleteById,
    hardDeleteById: repoHardDeleteById,
    findById: repoFindById,
    listPublic: repoListPublic,
    findBySlug: repoFindBySlug,
  })),
}));

const stockIn = jest.fn();
jest.mock("../../../services/inventory.service", () => ({
  InventoryService: jest.fn().mockImplementation(() => ({
    stockIn,
  })),
}));

const catFindOne = jest.fn();
jest.mock("../../../models/category.model", () => ({
  CategoryModel: {
    findOne: (...args: any[]) => catFindOne(...args),
  },
}));

// ProductModel mocks (chainable bits for find/filter/list)
const prodFindOne = jest.fn();
const prodFindById = jest.fn();
const prodCountDocuments = jest.fn();
const prodFind = jest.fn();

jest.mock("../../../models/product.model", () => ({
  ProductModel: {
    findOne: (...args: any[]) => prodFindOne(...args),
    findById: (...args: any[]) => prodFindById(...args),
    countDocuments: (...args: any[]) => prodCountDocuments(...args),
    find: (...args: any[]) => prodFind(...args),
  },
}));

const toSlug = jest.fn();
jest.mock("../../../utils/slug", () => ({
  toSlug: (...args: any[]) => toSlug(...args),
}));

import { ProductService } from "../../../services/product.service";

describe("ProductService unit", () => {
  let service: ProductService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ProductService();
  });

  const mockMulterFiles = (names: string[] = []) =>
    names.map((n) => ({ filename: n } as any));

  describe("create()", () => {
    it("throws 409 if SKU already exists", async () => {
      repoFindBySku.mockResolvedValue({ _id: "p1" });

      await expect(
        service.create({ sku: "abc", name: "X", categoryId: "c1", price: 10 }, [])
      ).rejects.toMatchObject({ statusCode: 409 });
    });

    it("throws 400 if category is invalid", async () => {
      repoFindBySku.mockResolvedValue(null);
      catFindOne.mockResolvedValue(null);

      await expect(
        service.create({ sku: "abc", name: "X", categoryId: "bad", price: 10 }, [])
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it("creates product, generates unique slug, and stocks in when initialStock > 0", async () => {
      repoFindBySku.mockResolvedValue(null);

      // valid category (no .lean() here in create)
      catFindOne.mockResolvedValue({ _id: "c1" });

      toSlug.mockReturnValue("my-product");

      // slug loop: first slug taken, second free
      prodFindOne
        .mockResolvedValueOnce({ _id: "existing" }) // slug exists
        .mockResolvedValueOnce(null); // slug free

      repoCreate.mockResolvedValue({ _id: "newProdId" });

      // return fresh product at end: ProductModel.findById(...).lean()
      prodFindById.mockReturnValue({
        lean: jest.fn().mockResolvedValue({ _id: "newProdId", stock: 5 }),
      });

      const res = await service.create(
        {
          sku: " ab-1 ",
          name: "My Product",
          categoryId: "c1",
          price: 100,
          discountPrice: 80,
          stock: 5,
          status: "active",
        },
        mockMulterFiles(["a.jpg", "b.jpg"])
      );

      // SKU normalized to uppercase + trimmed
      expect(repoFindBySku).toHaveBeenCalledWith("AB-1");

      expect(repoCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "My Product",
          slug: "my-product-1",
          sku: "AB-1",
          stock: 0, // created with stock 0
          images: ["a.jpg", "b.jpg"],
          category: "c1",
        })
      );

      // initial stock triggers stockIn
      expect(stockIn).toHaveBeenCalledWith(
        expect.objectContaining({
          productId: "newProdId",
          qty: 5,
        })
      );

      expect(res).toEqual({ _id: "newProdId", stock: 5 });
    });

    it("does not stockIn if initialStock is 0 or missing", async () => {
      repoFindBySku.mockResolvedValue(null);
      catFindOne.mockResolvedValue({ _id: "c1" });
      toSlug.mockReturnValue("p");
      prodFindOne.mockResolvedValue(null);
      repoCreate.mockResolvedValue({ _id: "p2" });
      prodFindById.mockReturnValue({
        lean: jest.fn().mockResolvedValue({ _id: "p2", stock: 0 }),
      });

      await service.create(
        { sku: "x", name: "P", categoryId: "c1", price: 10, stock: 0 },
        []
      );

      expect(stockIn).not.toHaveBeenCalled();
    });
  });

  describe("listAdmin()", () => {
    it("returns paginated list with meta and applies search filter", async () => {
      prodCountDocuments.mockResolvedValue(12);

      // chain for ProductModel.find(...).sort().skip().limit().populate().lean()
      prodFind.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([{ _id: "p1" }]),
      });

      const res = await service.listAdmin({ page: 2, limit: 5, search: "abc" });

      expect(res.meta).toMatchObject({
        total: 12,
        page: 2,
        limit: 5,
        totalPages: 3,
        hasNextPage: true,
        hasPrevPage: true,
      });

      expect(Array.isArray(res.data)).toBe(true);
    });

    it("clamps page >=1 and limit between 1..50", async () => {
      prodCountDocuments.mockResolvedValue(0);

      prodFind.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });

      const res = await service.listAdmin({ page: 0, limit: 999 });

      expect(res.meta.page).toBe(1);
      expect(res.meta.limit).toBe(50);
    });
  });

  describe("update()", () => {
    it("throws 404 if product not found", async () => {
      prodFindOne.mockResolvedValue(null);

      await expect(service.update("p1", { name: "X" }, [])).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it("throws 409 if SKU already exists on another product", async () => {
      prodFindOne.mockResolvedValue({ _id: "p1", images: [] }); // existing product

      // SKU check: ProductModel.findOne({ sku, _id: {$ne:id} })
      prodFindOne.mockResolvedValueOnce({ _id: "p1", images: [] }) // existing
        .mockResolvedValueOnce({ _id: "other" }); // sku exists

      await expect(
        service.update("p1", { sku: "abc" }, [])
      ).rejects.toMatchObject({ statusCode: 409 });
    });

    it("updates slug uniquely when name changes", async () => {
      // existing product
      prodFindOne.mockResolvedValueOnce({ _id: "p1", images: ["old.jpg"] });

      toSlug.mockReturnValue("new-name");

      // slug check loop: first time slug found but same id -> allow
      prodFindOne.mockResolvedValueOnce({ _id: "p1" });

      repoUpdateById.mockResolvedValue({ _id: "p1", slug: "new-name" });

      const res = await service.update("p1", { name: "New Name" }, []);

      expect(repoUpdateById).toHaveBeenCalledWith(
        "p1",
        expect.objectContaining({ slug: "new-name" })
      );
      expect(res).toEqual({ _id: "p1", slug: "new-name" });
    });

    it("validates categoryId and appends images", async () => {
      // existing product
      prodFindOne.mockResolvedValueOnce({ _id: "p1", images: ["old.jpg"] });

      // categoryId validation
      catFindOne.mockResolvedValue({ _id: "c1" });

      repoUpdateById.mockResolvedValue({ _id: "p1" });

      await service.update(
        "p1",
        { categoryId: "c1" },
        mockMulterFiles(["n1.jpg", "n2.jpg"])
      );

      expect(repoUpdateById).toHaveBeenCalledWith(
        "p1",
        expect.objectContaining({
          category: "c1",
          images: ["old.jpg", "n1.jpg", "n2.jpg"],
        })
      );
    });

    it("throws 400 if stock is negative", async () => {
      prodFindOne.mockResolvedValueOnce({ _id: "p1", images: [] });

      await expect(service.update("p1", { stock: -1 }, [])).rejects.toMatchObject({
        statusCode: 400,
      });
    });
  });

  describe("softDelete / hardDelete", () => {
    it("softDelete throws 404 if missing", async () => {
      repoSoftDeleteById.mockResolvedValue(null);

      await expect(service.softDelete("p1")).rejects.toMatchObject({ statusCode: 404 });
    });

    it("hardDelete throws 404 if missing", async () => {
      repoHardDeleteById.mockResolvedValue(null);

      await expect(service.hardDelete("p1")).rejects.toMatchObject({ statusCode: 404 });
    });

    it("softDelete returns updated doc", async () => {
      repoSoftDeleteById.mockResolvedValue({ _id: "p1" });
      const res = await service.softDelete("p1");
      expect(res).toEqual({ _id: "p1" });
    });
  });

  describe("listPublic()", () => {
    it("when categorySlug not found returns empty with meta", async () => {
      catFindOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      const res = await service.listPublic({ categorySlug: "nope", limit: 12 });

      expect(res.data).toEqual([]);
      expect(res.meta.total).toBe(0);
      expect(res.meta.totalPages).toBe(1);
    });

    it("when categorySlug found returns filtered products with sort price_asc", async () => {
      catFindOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue({ _id: "c1" }),
      });

      prodCountDocuments.mockResolvedValue(2);

      prodFind.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([{ _id: "p1" }, { _id: "p2" }]),
      });

      const res = await service.listPublic({
        categorySlug: "cat",
        page: 1,
        limit: 12,
        sort: "price_asc",
      });

      expect(res.meta.total).toBe(2);
      expect(res.data.length).toBe(2);
    });

    it("falls back to repo.listPublic when no categorySlug", async () => {
      repoListPublic.mockResolvedValue({ data: [{ _id: "x" }], meta: {} });

      const res = await service.listPublic({ page: 1 });

      expect(repoListPublic).toHaveBeenCalled();
      expect(res.data[0]._id).toBe("x");
    });
  });

  describe("getById/getPublicBySlug()", () => {
    it("getById proxies repo.findById", async () => {
      repoFindById.mockResolvedValue({ _id: "p1" });
      const res = await service.getById("p1");
      expect(res).toEqual({ _id: "p1" });
    });

    it("getPublicBySlug proxies repo.findBySlug", async () => {
      repoFindBySlug.mockResolvedValue({ slug: "a" });
      const res = await service.getPublicBySlug("a");
      expect(res).toEqual({ slug: "a" });
    });
  });
});