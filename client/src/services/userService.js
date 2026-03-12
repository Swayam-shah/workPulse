import API from "../api/axios";

export const getUsers = async () => {
  const res = await API.get("/users");
  return res.data;
};