const { MongoClient } = require("mongodb");
require("dotenv").config();

async function testDB() {
  const client = new MongoClient(process.env.MONGO_URI);
  try {
    await client.connect();
    const db = client.db("scavengerGame");
    const collections = await db.collections();
    console.log("Collections:", collections.map(c => c.collectionName));
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

testDB();
