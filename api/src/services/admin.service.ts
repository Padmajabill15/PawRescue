import { Ngo } from "../models/Ngo";
import { RescueRequest } from "../models/RescueRequest";
import { User } from "../models/User";

export async function getAdminStats() {
  const [users, ngoGroups, requests, openRequests] = await Promise.all([
    User.countDocuments({ role: "user" }),
    Ngo.aggregate<{ _id: string; count: number }>([
      { $group: { _id: "$verificationStatus", count: { $sum: 1 } } },
    ]),
    RescueRequest.countDocuments(),
    RescueRequest.countDocuments({ status: { $nin: ["recovered", "closed"] } }),
  ]);
  const ngos = Object.fromEntries(ngoGroups.map((g) => [g._id, g.count]));
  return {
    users,
    ngos: { pending: ngos.pending ?? 0, approved: ngos.approved ?? 0, rejected: ngos.rejected ?? 0 },
    requests,
    openRequests,
  };
}
