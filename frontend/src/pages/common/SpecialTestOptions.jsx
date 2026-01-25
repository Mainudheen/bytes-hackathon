import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/SpecialTestOptions.css'
// Assuming you have a CollegeHeader component

function SpecialTestOptions() {
  const navigate = useNavigate();

  return (
    <div className="cat-options-container">
      <h2>CAT Test Options</h2>
      <div className="cat-options-buttons">
        <div className="cat-option-card" onClick={() => navigate('/LabAllocator')}>
          <span>INVIGILATORS HISTORY</span>
        </div>
        
      </div>
    </div>
  );
}

export default SpecialTestOptions;