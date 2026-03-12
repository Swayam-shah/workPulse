import API from "../api/axios";

export const getTasks = async () => {
  const res = await API.get("/task/all");
  return res.data;
};

export const createTask = async (data) => {
  const res = await API.post("/task/create", data);
  return res.data;
};

export const updateTaskStatus = async (taskId, status) => {
  const res = await API.patch(`/task/status/${taskId}`, { status });
  return res.data;
};