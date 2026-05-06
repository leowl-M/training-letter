require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Resend } = require("resend");

const app = express();
const resend = new Resend(process.env.RESEND_API_KEY);

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

  try {
    const { data, error } = await resend.emails.send({
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
    });

    if (error) {
      console.error("Resend API error:", error);
      return res.status(500).json({ error: error.message });
    }

    console.log("Email inviata, id:", data.id);
    res.json({ ok: true });
  } catch (err) {
    console.error("Resend exception:", err);
    res.status(500).json({ error: "Invio fallito. Riprova più tardi." });
  }
});

app.listen(PORT, () => {
  console.log(`Server avviato su porta ${PORT}`);
  console.log(`CORS origin: ${ALLOWED_ORIGIN}`);
});
