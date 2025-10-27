import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGO_URI);

export default async function handler(req, res) {
  const { userId, pageId, submittedKeys } = req.body;

  try {
    await client.connect();
    const db = client.db("scavengerGame");
    const pages = db.collection("pages");
    const users = db.collection("users");

    const page = await pages.findOne({ _id: pageId });
    if (!page) return res.status(404).json({ error: "Page not found" });

    // Count correct keys
    const correctKeys = page.keys.filter(k => submittedKeys.includes(k));
    const score = correctKeys.length;

    // Update user score
    await users.updateOne(
      { _id: userId },
      { $inc: { points: score } },
      { upsert: true }
    );

    res.status(200).json({ score, correctKeys });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await client.close();
  }
}
