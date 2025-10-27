import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGO_URI);

export default async function handler(req, res) {
  try {
    await client.connect();
    const db = client.db("scavengerGame");
    const users = db.collection("users");

    const topUsers = await users.find().sort({ points: -1 }).limit(10).toArray();
    res.status(200).json(topUsers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await client.close();
  }
}
