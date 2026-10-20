import { RescueRequest } from "../models/RescueRequest";
import { adminIds, notify } from "./notification.service";
import { emitToAdmins } from "./realtime";
import { findMatchingNgos } from "./request.service";

const STEP_MIN = 10; // minutes without an NGO before each escalation level
const SOS_STEP_MIN = 5; // emergencies escalate twice as fast
const WIDER_KM = 30; // level 1: alert approved NGOs within this distance, even outside their radius

/** Requests nobody accepted get escalated: first to a wider ring of NGOs, then to admins. */
export async function runEscalation() {
  const now = Date.now();
  const stale = await RescueRequest.find({
    status: "submitted",
    assignedNgo: null,
    duplicateOf: null,
    isDemo: { $ne: true },
    escalationLevel: { $not: { $gte: 2 } }, // also matches older docs without the field
    createdAt: { $lte: new Date(now - SOS_STEP_MIN * 60_000) },
  })
    .limit(50)
    .select("species severity isEmergency location createdAt escalationLevel address description");

  for (const r of stale) {
    const ageMin = (now - r.createdAt.getTime()) / 60_000;
    const level = r.escalationLevel ?? 0;
    const due = (level + 1) * (r.isEmergency ? SOS_STEP_MIN : STEP_MIN);
    if (ageMin < due) continue;

    const id = r._id.toString();
    if (level === 0) {
      const [lng, lat] = r.location.coordinates;
      const wider = await findMatchingNgos(lng, lat, WIDER_KM, true);
      await notify(wider.map((n) => n.owner), {
        type: "request_escalated",
        title: `⏰ Unattended ${r.species} rescue within ${WIDER_KM} km`,
        body: "No nearby NGO has accepted yet. Can your team help?",
        link: `/dashboard/ngo/cases/${id}`,
      });
    }
    await notify(await adminIds(), {
      type: "request_escalated",
      title: `${r.isEmergency ? "🚨 SOS" : "Request"} unattended for ${Math.round(ageMin)} min (${r.species})`,
      body: r.address ?? r.description ?? undefined,
      link: `/dashboard/admin/requests/${id}`,
    });
    r.escalationLevel = level + 1;
    r.escalatedAt = new Date();
    await r.save();
    emitToAdmins("request:updated", { id, escalationLevel: r.escalationLevel });
  }
}

export function startEscalationJob(everyMs = 60_000) {
  const tick = () => runEscalation().catch((e) => console.error("escalation job failed", e));
  setTimeout(tick, 5_000);
  const timer = setInterval(tick, everyMs);
  timer.unref();
  return timer;
}
