require("dotenv").config();
global.WebSocket = global.WebSocket || require("ws");
const express = require("express");
const cors = require("cors");
const { Resend } = require("resend");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "http://localhost:8080";
const PORT = process.env.PORT || 3000;

const corsOptions = { origin: ALLOWED_ORIGIN };
app.options("*", cors(corsOptions));
app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

app.post("/send-email", async (req, res) => {
  const { email, image } = req.body;

  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ error: "Email non valida." });
  }

  if (!image || !image.startsWith("data:image/png;base64,")) {
    return res.status(400).json({ error: "Immagine non valida." });
  }

  const base64Data = image.replace("data:image/png;base64,", "");
  const imageBuffer = Buffer.from(base64Data, "base64");
  const filename = `${Date.now()}.png`;

  const [emailResult] = await Promise.allSettled([
    resend.emails.send({
      from: "Training Letter <noreply@thewavestudio.it>",
      to: email,
      subject: "Il tuo artwork da Training Letter",
      html: "<p>Ecco il tuo artwork!</p>",
      attachments: [
        {
          filename: "artwork.png",
          content: base64Data,
          content_type: "image/png",
        },
      ],
    }),
    supabase.storage
      .from("artworks")
      .upload(filename, imageBuffer, { contentType: "image/png" }),
  ]);

  if (emailResult.status === "rejected") {
    console.error("Resend error:", emailResult.reason);
    return res.status(500).json({ error: "Invio fallito. Riprova più tardi." });
  }

  const { data: emailData, error: emailError } = emailResult.value;
  if (emailError) {
    console.error("Resend API error:", emailError);
    return res.status(500).json({ error: emailError.message });
  }

  console.log("Email inviata, id:", emailData.id, "| artwork:", filename);
  res.json({ ok: true });
});

app.get("/artworks", async (req, res) => {
  const { data: files, error } = await supabase.storage
    .from("artworks")
    .list("", { sortBy: { column: "name", order: "desc" } });

  if (error) {
    console.error("Supabase list error:", error);
    return res.status(500).json({ error: "Impossibile caricare le immagini." });
  }

  const urls = files
    .filter((f) => f.name.endsWith(".png"))
    .map(
      (f) =>
        supabase.storage.from("artworks").getPublicUrl(f.name).data.publicUrl
    );

  res.json({ urls });
});

app.listen(PORT, () => {
  console.log(`Server avviato su porta ${PORT}`);
  console.log(`CORS origin: ${ALLOWED_ORIGIN}`);
});
