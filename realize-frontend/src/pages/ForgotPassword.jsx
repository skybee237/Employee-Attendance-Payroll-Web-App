import { useState } from "react";
import API from "../api";
import { toast } from "react-toastify";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleRequest = async () => {
    try {
      await API.post("/auth/forgot-password", { email });
      toast.success("Password request sent to the admin.");
      setMessage(""); // Clear any previous message
    } catch (err) {
      console.error(err);
      const errorMessage = err.response?.data?.error || "Failed to send request.";
      toast.error(errorMessage);
      setMessage(errorMessage);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Forgot Password</h2>
      <input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full p-2 border rounded mb-4"
      />
      <button
        onClick={handleRequest}
        className="w-full bg-blue-500 text-white p-2 rounded"
      >
        Request New Password
      </button>
      {message && <p className="mt-4 text-green-600">{message}</p>}
    </div>
  );
};

export default ForgotPassword;
