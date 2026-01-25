import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../../styles/StaffInvigilationList.css";

function StaffInvigilationReport() {
  const { id } = useParams(); // Using ID as the param now
  const navigate = useNavigate();
  const [duties, setDuties] = useState([]);
  const [filteredDuties, setFilteredDuties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [staffInfo, setStaffInfo] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    semester: "",
    cat: "",
    dateFrom: "",
    dateTo: ""
  });

  useEffect(() => {
    fetch(`http://localhost:5001/api/staff-duties/staff/${id}`)
      .then((res) => res.json())
      .then((data) => {
        const sorted = Array.isArray(data) ? data : [];
        setDuties(sorted);
        setFilteredDuties(sorted);
        if (sorted.length > 0) {
          setStaffInfo({
            name: sorted[0].staffName,
            empId: sorted[0].staffId,
            designation: sorted[0].designation || "Assistant Professor",
            department: sorted[0].department || "AI"
          });
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch duties:", err);
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    let result = [...duties];

    if (filters.semester) {
      result = result.filter(d => d.semester === filters.semester);
    }
    if (filters.cat) {
      result = result.filter(d => d.catNumber === filters.cat);
    }
    if (filters.dateFrom) {
      result = result.filter(d => new Date(d.examDate) >= new Date(filters.dateFrom));
    }
    if (filters.dateTo) {
      result = result.filter(d => new Date(d.examDate) <= new Date(filters.dateTo));
    }

    setFilteredDuties(result);
  }, [filters, duties]);

  const totalHours = filteredDuties.reduce((acc, duty) => acc + (duty.dutyHours || 0), 0);
  const totalDuties = filteredDuties.length;

  if (loading) return <div className="loading">Generating report...</div>;

  return (
    <div className="report-container">
      <div className="page-header">
        <button className="back-button" onClick={() => navigate("/staff-list")}>← Back to Registry</button>
        <h2>Detailed Staff Report</h2>
      </div>

      {/* Summary Card */}
      <div className="summary-section">
        <div className="summary-card main-summary">
          <div className="staff-header-report">
            <h3>{staffInfo?.name || "Staff Member"}</h3>
            <p className="staff-meta-report">{staffInfo?.designation} | {staffInfo?.department}</p>
            <p className="staff-id-report">Employee ID: {id}</p>
          </div>
          <div className="summary-stats">
            <div className="summary-item">
              <span className="label">Total Duties</span>
              <span className="value">{totalDuties}</span>
            </div>
            <div className="summary-item">
              <span className="label">Total Hours</span>
              <span className="value">{totalHours.toFixed(1)} hrs</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Semester</label>
          <select value={filters.semester} onChange={(e) => setFilters({...filters, semester: e.target.value})}>
            <option value="">All Semesters</option>
            {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={String(s)}>Semester {s}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label>CAT</label>
          <select value={filters.cat} onChange={(e) => setFilters({...filters, cat: e.target.value})}>
            <option value="">All CATs</option>
            <option value="1">CAT 1</option>
            <option value="2">CAT 2</option>
            <option value="3">CAT 3</option>
          </select>
        </div>
        <div className="filter-group">
          <label>From Date</label>
          <input type="date" value={filters.dateFrom} onChange={(e) => setFilters({...filters, dateFrom: e.target.value})} />
        </div>
        <div className="filter-group">
          <label>To Date</label>
          <input type="date" value={filters.dateTo} onChange={(e) => setFilters({...filters, dateTo: e.target.value})} />
        </div>
        <button className="reset-filters" onClick={() => setFilters({semester: "", cat: "", dateFrom: "", dateTo: ""})}>Reset</button>
      </div>

      <h3 className="section-subtitle">Duty History</h3>
      
      {filteredDuties.length === 0 ? (
        <div className="no-data">No duties found matching the filters.</div>
      ) : (
        <div className="duty-history-grid">
          {filteredDuties.map((duty, index) => (
            <div key={index} className="duty-detail-card">
              <div className="card-top">
                <span className="exam-type">{duty.catNumber ? `CAT ${duty.catNumber}` : "Special Exam"}</span>
                <span className="duty-date">{new Date(duty.examDate).toLocaleDateString()}</span>
              </div>
              <div className="card-main">
                <h4 className="subject-name">{duty.subjectName || "N/A"}</h4>
                <div className="detail-row">
                  <span><strong>Hall:</strong> {duty.hallNumber}</span>
                  <span><strong>Session:</strong> {duty.session}</span>
                </div>
                <div className="detail-row">
                  <span><strong>Year:</strong> {duty.year}</span>
                  <span><strong>Sem:</strong> {duty.semester || "N/A"}</span>
                </div>
                <div className="time-info">
                  <span className="time-range">{duty.dutyStartTime} - {duty.dutyEndTime}</span>
                  <span className="duration">({duty.dutyHours} hrs)</span>
                </div>
              </div>
              <div className="card-footer">
                <span className="created-at">Allocated on: {new Date(duty.allocationCreatedDate).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default StaffInvigilationReport;
