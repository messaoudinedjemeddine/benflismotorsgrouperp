import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const VnDashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/dashboard/vn/orders", { replace: true });
  }, [navigate]);

  return null;
};

export default VnDashboard;
