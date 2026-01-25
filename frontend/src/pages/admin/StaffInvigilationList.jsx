import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/StaffInvigilationList.css";

function StaffInvigilationList() {
  const navigate = useNavigate();
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:5001/api/staff-duties/stats")
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch staff stats:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="loading">Loading staff directory...</div>;

  return (
    <div className="staff-page">
      <div className="page-header">
        <button className="back-button" onClick={() => navigate("/admin-home")}>← Back</button>
        <h2>Staff Invigilation Registry</h2>
      </div>

      <div className="staff-grid">
        {stats.map((staff, index) => (
          <div
            key={index}
            className="staff-card"
            onClick={() => navigate(`/staff-report/${staff.empId}`)}
          >
            <div className="staff-header-info">
              <h3>{staff.staffName}</h3>
              <p className="staff-meta">{staff.designation} | {staff.department}</p>
              <p className="staff-id-badge">ID: {staff.empId}</p>
            </div>
            
            <div className="stats-container">
              <div className="stat-box">
                <span className="stat-num">{staff.totalDuties}</span>
                <span className="stat-desc">Total Duties</span>
              </div>
              <div className="stat-box">
                <span className="stat-num">{staff.totalHours.toFixed(1)}</span>
                <span className="stat-desc">Total Hours</span>
              </div>
              <div className="stat-box upcoming">
                <span className="stat-num">{staff.upcomingDuties}</span>
                <span className="stat-desc">Upcoming</span>
              </div>
            </div>
            
            <div className="card-action">
              View History & Schedule →
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default StaffInvigilationList;
