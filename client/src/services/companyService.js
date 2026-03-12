import API from "../api/axios";

export const getCompany = async () => {
  const res = await API.get("/company");
  return res.data;
};