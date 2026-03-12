import API from "../api/axios";

export const getStats = async () => {
  const res = await API.get("/dashboard/stats");
  return res.data;
};