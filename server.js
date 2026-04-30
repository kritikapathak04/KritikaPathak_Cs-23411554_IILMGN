const { HfInference } = require("@huggingface/inference");

const hf = new HfInference("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");

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// MongoDB connection (temporary local)

mongoose.connect("mongodb+srv://shubham4uh_db_user:azino123%40kritika@cluster0.0kq5spr.mongodb.net/eduquery?retryWrites=true&w=majority")
.then(() => console.log("✅ Connected to MongoDB"))
.catch(err => console.log("❌ MongoDB error:", err));

// Models
const User = mongoose.model("User", {
  fname: String,
  lname: String,
  email: String,
  role: String,
  password: String,
});

const Suggestion = mongoose.model("Suggestion", {
  category: String,
  text: String,
  rating: Number,
  name: String,
});

// Register
app.post("/register", async (req, res) => {
  const exists = await User.findOne({ email: req.body.email });
  if (exists) return res.json({ error: "User already exists" });

  const user = new User(req.body);
  await user.save();

  res.json({ success: true });
});

// Login
app.post("/login", async (req, res) => {
  const user = await User.findOne({
    email: req.body.email,
    password: req.body.password,
  });

  if (!user) return res.json({ error: "Invalid credentials" });

  res.json({ success: true, user });
});

// Chatbot

app.post("/chat", async (req, res) => {
  try {
    const msg = (req.body.message || "").toLowerCase();
    const role = req.body.role || "student";

    // 🔹 PREDEFINED RESPONSES
    const data = {
      student: {
        admission: "Admission opens in June. Apply online.",
        fee: "Fees range from ₹55,000 to ₹85,000.",
        exam: "Exams are conducted in November.",
        scholarship: "Up to 50% scholarship available.",
        result: "Results declared after 4–6 weeks of exam."
      },
      faculty: {
        calendar: "Academic year starts in July.",
        research: "Research grants up to ₹2 lakhs available.",
        leave: "Casual leave: 12 days/year.",
        portal: "Use staff portal with employee ID.",
        hod: "Contact HoD via department email."
      },
      parent: {
        fee: "Fees can be paid online or via bank.",
        hostel: "Hostel includes WiFi, mess, and security.",
        attendance: "Not yet updated by faculty. SMS alerts are sent for below 75% attendance.",
        ward: "Track progress via parent portal.",
        transport: "Bus service covers 25+ routes."
      },
      visitor: {
        tour: "Campus tours available Mon–Sat.",
        visiting: "Visiting hours: 9 AM–5 PM.",
        event: "Events open to visitors.",
        location: "Near Knowledge Park 2 metro.",
        contact: "Call +91-11-2345-6789."
      }
    };

    // 🔹 KEYWORDS
    const keywords = {
      admission: ["admission", "apply", "process"],
      fee: ["fee", "fees", "payment", "structure"],
      exam: ["exam", "test", "schedule"],
      scholarship: ["scholarship", "info"],
      result: ["result", "marks","enquiry"],

      calendar: ["academic calendar", "schedule"],
      research: ["research", "grants"],
      leave: ["leave", "policy"],
      portal: ["portal", "staff"],
      hod: ["hod", "contact"],

      hostel: ["hostel", "info"],
      attendance: ["attendance", "update"],
      ward: ["ward", "progress"],
      transport: ["transport", "bus"],

      tour: ["tour", "campus"],
      visiting: ["visiting", "hours"],
      event: ["events", "event"],
      location: ["location", "&", "map"],
      contact: ["contact", "us"]
    };

    const roleData = data[role];

    // 🔹 CHECK PREDEFINED ANSWERS FIRST
    for (const key in keywords) {
      if (keywords[key].some(k => msg.includes(k))) {
        if (roleData[key]) {
          return res.json({ reply: roleData[key] });
        }
      }
    }

    // 🤖 AI FALLBACK (ONLY IF NOT MATCHED)
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer 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",  
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a helpful and smart enquiry assistant for a college. Give clear and short answers.`
          },
          {
            role: "user",
            content: msg
          }
        ]
      })
    });

    const aiData = await response.json();

console.log("STATUS:", response.status);
console.log("FULL AI RESPONSE:", JSON.stringify(aiData, null, 2));

    const reply =
      aiData.choices?.[0]?.message?.content ||
      "🤖 Sorry, I couldn't understand that.";

    res.json({ reply });

  } catch (err) {
    console.log("AI ERROR:", err);
    res.json({ reply: "⚠ AI server error" });
  }
});                                                        

// Suggestion
app.post("/suggestion", async (req, res) => {
  const s = new Suggestion(req.body);
  await s.save();
  res.json({ success: true });
});

app.listen(5000, () => console.log("Server running on port 5000"));
