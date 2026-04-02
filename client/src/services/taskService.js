import API from "../api/axios";

const appendFiles = (formData, attachments = []) => {
  attachments.forEach((file) => {
    formData.append("attachments", file);
  });
};

export const getTasks = async () => {
  const res = await API.get("/task/all");
  return res.data;
};

export const createTask = async (data) => {
  const formData = new FormData();
  formData.append("title", data.title);
  formData.append("description", data.description || "");
  formData.append("team", data.team);
  formData.append("assignedTo", data.assignedTo);
  if (data.deadline) formData.append("deadline", data.deadline);
  appendFiles(formData, data.attachments || []);

  const res = await API.post("/task/create", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return res.data;
};

export const updateTaskProgress = async (taskId, percentage) => {
  const res = await API.put(`/task/update-progress/${taskId}`, { percentage });
  return res.data;
};

export const editTask = async (taskId, payload) => {
  const formData = new FormData();
  formData.append("title", payload.title);
  formData.append("description", payload.description || "");
  formData.append("team", payload.team);
  formData.append("assignedTo", payload.assignedTo);
  if (payload.deadline) formData.append("deadline", payload.deadline);
  else formData.append("deadline", "");
  formData.append("removedAttachments", JSON.stringify(payload.removedAttachments || []));
  appendFiles(formData, payload.attachments || []);

  const res = await API.put(`/task/edit/${taskId}`, formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return res.data;
};

export const deleteTask = async (taskId) => {
  const res = await API.delete(`/task/delete/${taskId}`);
  return res.data;
};
