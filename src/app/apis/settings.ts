import axios from "axios";

// Fetch user data (using HTTP-only cookie automatically)
export const fetchUser = async () => {
  const res = await axios.get("/api/auth/user", {
    withCredentials: true,
  });
  return res.data.user;
};

// Update user info
export const updateUser = async (updates: any) => {
  const res = await axios.patch("/api/update-profile", updates, {
    withCredentials: true,
  });
  return res.data.user;
};

// Logout
export const logoutUser = async () => {
  const res = await axios.post("/api/logout", null, {
    withCredentials: true,
  });
  return res.data;
};

export const uploadProfileImage = async (file: File) => {
  const formData = new FormData();
  formData.append("avatar", file); // must match the backend: upload.single("avatar")

  const res = await fetch("/api/upload-avatar", {
    method: "PATCH", // use PATCH to match your backend route
    credentials: "include", // send cookies
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data.avatarUrl; // must match the backend response key
};

// Change password
export const changePassword = async (
  currentPassword: string,
  newPassword: string
) => {
  const res = await fetch("/api/change-password", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to change password");
  return data.message;
};
