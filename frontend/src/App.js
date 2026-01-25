// App.js
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import HomePage from './pages/common/HomePage';
import StudentLogin from './pages/student/StudentLogin';
import AdminAuth from './pages/admin/AdminAuth';
import Dashboard from './pages/admin/Dashboard';
import AdminHomePage from './pages/admin/AdminHomePage';
import StudentDashboard from './pages/student/StudentDashboard';
import CatOptionsPage from './pages/common/CatOptionsPage';
import SpecialTestOptions from './pages/common/SpecialTestOptions';
import LabAllocator from './pages/admin/LabAllocator';
import ManageAllocations from './pages/admin/ManageAllocations';
import RoomAllocator from './pages/admin/RoomAllocator';
import StudentManager from './pages/student/StudentManager';
import RoomManager from './pages/admin/RoomManager';
import ClassExamAllocator from './pages/common/ClassExamAllocator';
import SelectAllocation from './pages/common/SelectAllocation';
import DownloadFormats from './pages/admin/DownloadFormats';
import StaffInvigilationList from './pages/admin/StaffInvigilationList';
import StaffInvigilationReport from './pages/admin/StaffInvigilationReport';
import './styles.css';

function StudentDashboardWrapper() {
  const location = useLocation();
  const { rollno } = location.state || {};
  return <StudentDashboard rollno={rollno} />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/student-login" element={<StudentLogin />} />
        <Route path="/student-dashboard" element={<StudentDashboardWrapper />} />
        <Route path="/admin-login" element={<AdminAuth />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin-home" element={<AdminHomePage />} />
        <Route path="/CatOptionsPage" element={<CatOptionsPage />} />
        <Route path="/SpecialTestOptions" element={<SpecialTestOptions />} />
        <Route path="/LabAllocator" element={<LabAllocator />} />
        <Route path="/manage-allotments" element={<ManageAllocations />} />
        <Route path="/RoomAllocator" element={<RoomAllocator />} />
        <Route path="/StudentManage" element={<StudentManager />} />
        <Route path="/RoomManage" element={<RoomManager />} />
        <Route path="/class" element={<ClassExamAllocator />} />
        <Route path="/select" element={<SelectAllocation />} />
        <Route path="/download" element={<DownloadFormats />} />
        <Route path="/staff-list" element={<StaffInvigilationList />} />
        <Route path="/staff-report/:id" element={<StaffInvigilationReport />} />

       
      </Routes>
    </Router>
  );
}

export default App;
