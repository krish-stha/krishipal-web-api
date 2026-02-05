import request from "supertest";
import app from "../../app"; // adjust if your app export path is different

describe("Auth (integration)", () => {
  it("GET / should respond (smoke)", async () => {
    const res = await request(app).get("/");
    expect([200, 404]).toContain(res.status); 
  });
});
