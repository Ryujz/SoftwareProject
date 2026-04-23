const request = require("supertest");
const app = require("../src/app");

describe("ThaiID Mock API", () => {
  test("should create account successfully with mock ThaiID code", async () => {
    const res = await request(app)
      .post("/api/verify/thaiid")
      .send({
        code: "mock-thaiid-success",
        user_type: "vendor"
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("message");
    expect(res.body).toHaveProperty("access_token");
    expect(res.body).toHaveProperty("user_profile");
  });

  test("should fail with invalid ThaiID mock code", async () => {
    const res = await request(app)
      .post("/api/verify/thaiid")
      .send({
        code: "wrong-code",
        user_type: "vendor"
      });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error");
  });
});