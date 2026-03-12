import API from "../api/axios";

export const getTeams = async () => {
  const res = await API.get("/team/all");
  return res.data;
};

export const createTeam = async (data) => {
  const res = await API.post("/team/create", data);
  return res.data;
};