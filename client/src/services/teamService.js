import API from "../api/axios";

export const getTeams = async () => {
  const res = await API.get("/team/all");
  return res.data;
};

export const createTeam = async (data) => {
  const res = await API.post("/team/create", data);
  return res.data;
};

export const joinTeam = async (joinCode) => {
  const res = await API.post("/team/join", { joinCode });
  return res.data;
};

export const deleteTeam = async (teamId) => {
  const res = await API.delete(`/team/delete/${teamId}`);
  return res.data;
};
