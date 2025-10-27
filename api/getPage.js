import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGO_URI);

export default async function handler(req, res) {
  try {
    await client.connect();
    const db = client.db("scavengerGame");
    const pages = db.collection("pages");

    const count = await pages.countDocuments();
    const randomIndex = Math.floor(Math.random() * count);
    const page = await pages.find().limit(1).skip(randomIndex).next();

    res.status(200).json({ html: page.html, keys: page.keys, difficulty: page.difficulty });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await client.close();
  }
}
