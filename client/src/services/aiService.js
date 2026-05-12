import API from "../api/axios";

export const summarizeDocument = async (fileBlob, filename) => {
    const formData = new FormData();
    formData.append("document", fileBlob, filename);
    const res = await API.post("/ai/summarize-document", formData, {
        headers: {
            "Content-Type": "multipart/form-data"
        }
    });
    return res.data.summary;
};

export const getEmployeeReview = async (userId) => {
    const res = await API.get(`/ai/employee-review/${userId}`);
    return res.data.review;
};
