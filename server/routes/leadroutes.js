const express = require("express");
const router = express.Router();
const { analyzeLead } = require("../services/aiAgent");

let leads = require("../data/leads");

// GET all leads
router.get("/", (req, res) => {
  res.json(leads);
});

// GET one lead
router.get("/:id", (req, res) => {
  const lead = leads.find(
    (item) => item.id === Number(req.params.id)
  );

  if (!lead) {
    return res.status(404).json({
      message: "Lead not found"
    });
  }

  res.json(lead);
});
// MARK LEAD AS CONTACTED
router.patch("/:id/contacted", (req, res) => {
  const lead = leads.find(
    (item) => item.id === Number(req.params.id)
  );

  if (!lead) {
    return res.status(404).json({
      message: "Lead not found"
    });
  }

  lead.contacted =
    typeof req.body?.contacted === "boolean" ? req.body.contacted : true;

  res.json({
    message: lead.contacted
      ? "Lead marked as contacted"
      : "Lead marked as not contacted",
    lead
  });
});

// ADD new lead
router.post("/", (req, res) => {
  const { name, company, source } = req.body;

  if (!name || !company || !source) {
    return res.status(400).json({
      message: "Name, company and source are required"
    });
  }

  const newLead = {
    id: leads.length + 1,
    name,
    company,
    source,
    score: 50,
    status: "Cold"
  };

  leads.push(newLead);

  res.status(201).json(newLead);
});

// existing routes...


router.post("/ai/analyze", async (req, res) => {
  try {
    const lead = req.body;

    if (!lead.name || !lead.company) {
      return res.status(400).json({
        error: "Customer name and company are required.",
      });
    }

    const analysis = await analyzeLead(lead);

    res.json({
      success: true,
      analysis,
    });
  } catch (error) {
    const message = error?.message || "Unknown error";
    let apiMessage = "AI analysis failed.";

    try {
      const parsed = JSON.parse(message);
      if (parsed?.error?.message) {
        apiMessage = parsed.error.message;
      }
    } catch (parseError) {
      if (message.includes("UNAVAILABLE") || message.includes("RESOURCE_EXHAUSTED") || message.includes("quota")) {
        apiMessage = "AI service is temporarily unavailable or quota is exhausted. Please retry in a moment.";
      }
    }

    console.error("AI analysis error:", message);

    res.status(500).json({
      success: false,
      error: apiMessage,
    });
  }
});


module.exports = router;