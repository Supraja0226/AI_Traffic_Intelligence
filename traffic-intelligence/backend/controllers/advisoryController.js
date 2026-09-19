const Recommendation = require('../models/Recommendation');
const Incident = require('../models/Incident');

exports.getAdvisories = async (req, res) => {
  try {
    const advisories = await Recommendation.find();
    return res.json(advisories);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.updateAdvisoryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['PROPOSED', 'ACCEPTED', 'REJECTED', 'SUPERSEDED'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    await Recommendation.updateOne({ recommendationId: id }, { status });
    return res.json({ message: `Advisory ${id} status updated to ${status}.` });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.getAuditReport = async (req, res) => {
  try {
    const recommendations = await Recommendation.find();
    const incidents = await Incident.find();

    return res.json({
      timestamp: new Date().toISOString(),
      platform: 'AI Traffic Intelligence & Road Network Optimization',
      disclaimer: 'SOFTWARE SIMULATION / DECISION SUPPORT ONLY. NOT A LIVE TRAFFIC CONTROL SYSTEM.',
      incidentEvidenceSummary: {
        totalVerifiedIncidents: incidents.length,
        items: incidents.map(i => ({
          id: i.incidentId,
          type: i.incidentType,
          confidence: i.confidenceScore,
          evidence: i.supportingEvidence
        }))
      },
      advisoryImpactSummary: {
        totalAdvisories: recommendations.length,
        items: recommendations.map(r => ({
          id: r.recommendationId,
          title: r.title,
          action: r.recommendedAction,
          impact: r.estimatedImpact,
          evidence: r.supportingEvidence
        }))
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
