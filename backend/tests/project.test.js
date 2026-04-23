const request = require("supertest");
const app = require("../src/app");

describe("Project API", () => {
  const timestamp = Date.now();
  const vendor = {
    username: `vendor_${timestamp}`,
    email: `vendor_${timestamp}@example.com`,
    password: "123456",
    role: "vendor"
  };

  let token = "";

  beforeAll(async () => {
    await request(app).post("/api/auth/register").send(vendor);

    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: vendor.email,
        password: vendor.password
      });

    token = loginRes.body.token;
  });

  test("should create project successfully", async () => {
    const res = await request(app)
      .post("/api/projects")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Automated Test Project",
        description: "Created by Jest + Supertest",
        budget: 5000
      });

    expect([200, 201]).toContain(res.statusCode);
    expect(res.body).toHaveProperty("message");
  });

  test("should get my projects successfully", async () => {
    const res = await request(app)
      .get("/api/projects/my-projects")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("projects");
    expect(Array.isArray(res.body.projects)).toBe(true);
  });
});