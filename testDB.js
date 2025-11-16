import sequelize from "./db.js";

(async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Connection to PostgreSQL verified successfully!");
  } catch (error) {
    console.error("❌ Unable to connect:", error);
  } finally {
    await sequelize.close();
  }
})();
