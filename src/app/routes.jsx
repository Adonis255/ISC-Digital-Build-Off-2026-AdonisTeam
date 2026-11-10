import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import DashboardLayout from '../components/layout/DashboardLayout.jsx'
import Landing from '../modules/authentication/pages/Landing.jsx'
import Login from '../modules/authentication/pages/Login.jsx'
import Register from '../modules/authentication/pages/Register.jsx'
import StudentDashboard from '../modules/student/pages/StudentDashboard.jsx'
import AdminDashboard from '../modules/administration/pages/AdminDashboard.jsx'
import LecturerDashboard from '../modules/lecturer/pages/LecturerDashboard.jsx'
import WorkerDashboard from '../modules/worker/pages/WorkerDashboard.jsx'
import UserManagement from '../modules/administration/pages/UserManagement.jsx'
import DepartmentManagement from '../modules/administration/pages/DepartmentManagement.jsx'
import OfficeManagement from '../modules/administration/pages/OfficeManagement.jsx'
import CourseManagement from '../modules/administration/pages/CourseManagement.jsx'
import EnrollmentManagement from '../modules/administration/pages/EnrollmentManagement.jsx'
import LostFoundPage from '../modules/lost-and-found/pages/LostFoundPage.jsx'
import MaintenancePage from '../modules/maintenance/pages/MaintenancePage.jsx'
import AnnouncementsPage from '../modules/announcements/pages/AnnouncementsPage.jsx'
import NotificationsPage from '../modules/notifications/pages/NotificationsPage.jsx'
import AssignedTasks from '../modules/worker/pages/AssignedTasks.jsx'
import CounsellingPage from '../modules/counselling/pages/CounsellingPage.jsx'
import MyClasses from '../modules/lecturer/pages/MyClasses.jsx'
import LiveLecture from '../modules/lecturer/pages/LiveLecture.jsx'
import StudentAttendance from '../modules/student/pages/StudentAttendance.jsx'
import CourseCatalog from '../modules/student/pages/CourseCatalog.jsx'
import ProfilePage from '../modules/student/pages/ProfilePage.jsx'
import FinancePage from '../modules/finance/pages/FinancePage.jsx'
import ComplaintsPage from '../modules/complaints/pages/ComplaintsPage.jsx'
import InternshipsPage from '../modules/internships/pages/InternshipsPage.jsx'
import ScholarshipsPage from '../modules/scholarships/pages/ScholarshipsPage.jsx'
import DirectoryPage from '../modules/directory/pages/DirectoryPage.jsx'
import ExaminationsPage from '../modules/examinations/pages/ExaminationsPage.jsx'
import CommunityPage from '../modules/community/pages/CommunityPage.jsx'
import NoticeBoardPage from '../modules/community/pages/NoticeBoardPage.jsx'
import GroupsPage from '../modules/student/pages/GroupsPage.jsx'
import EventsPage from '../modules/student/pages/EventsPage.jsx'
import SystemSettingsPage from '../modules/administration/pages/SystemSettingsPage.jsx'
import { ROLE_HOME } from '../utils/constants.js'

export default function AppRoutes() {
  const { user, role, loading, signOut } = useAuth()
  
  if (loading) return <div className="h-screen grid place-items-center text-slate-500">Loading...</div>
  if (user && !role) return <div className="h-screen grid place-items-center bg-slate-100 p-4"><div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md"><h2 className="text-xl font-bold text-red-600 mb-2">Profile Not Found</h2><button onClick={signOut} className="bg-slate-800 text-white px-4 py-2 rounded-lg w-full">Sign Out</button></div></div>

  return (
    <Routes>
      <Route path="/" element={!user ? <Landing /> : <Navigate to={ROLE_HOME[role] || '/login'} />} />
      <Route path="/login" element={!user ? <Login /> : <Navigate to={ROLE_HOME[role] || '/login'} />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to={ROLE_HOME[role] || '/login'} />} />

      <Route element={<DashboardLayout allowedRoles={['student']} />}>
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/student/notice-board" element={<NoticeBoardPage />} />
        <Route path="/student/catalog" element={<CourseCatalog />} />
        <Route path="/student/attendance" element={<StudentAttendance />} />
        <Route path="/student/exams" element={<ExaminationsPage />} />
        <Route path="/student/community" element={<CommunityPage />} />
        <Route path="/student/groups" element={<GroupsPage />} />
        <Route path="/student/events" element={<EventsPage />} />
        <Route path="/student/announcements" element={<AnnouncementsPage />} />
        <Route path="/student/lost-found" element={<LostFoundPage />} />
        <Route path="/student/maintenance" element={<MaintenancePage />} />
        <Route path="/student/finance" element={<FinancePage />} />
        <Route path="/student/counselling" element={<CounsellingPage />} />
        <Route path="/student/directory" element={<DirectoryPage />} />
        <Route path="/student/internships" element={<InternshipsPage />} />
        <Route path="/student/scholarships" element={<ScholarshipsPage />} />
        <Route path="/student/complaints" element={<ComplaintsPage />} />
        <Route path="/student/profile" element={<ProfilePage />} />
        <Route path="/student/notifications" element={<NotificationsPage />} />
      </Route>

      <Route element={<DashboardLayout allowedRoles={['admin']} />}>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/notice-board" element={<NoticeBoardPage />} />
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/admin/departments" element={<DepartmentManagement />} />
        <Route path="/admin/offices" element={<OfficeManagement />} />
        <Route path="/admin/courses" element={<CourseManagement />} />
        <Route path="/admin/enrollments" element={<EnrollmentManagement />} />
        <Route path="/admin/exams" element={<ExaminationsPage />} />
        <Route path="/admin/community" element={<CommunityPage />} />
        <Route path="/admin/groups" element={<GroupsPage />} />
        <Route path="/admin/events" element={<EventsPage />} />
        <Route path="/admin/internships" element={<InternshipsPage />} />
        <Route path="/admin/scholarships" element={<ScholarshipsPage />} />
        <Route path="/admin/finance" element={<FinancePage />} />
        <Route path="/admin/complaints" element={<ComplaintsPage />} />
        <Route path="/admin/lost-found" element={<LostFoundPage />} />
        <Route path="/admin/maintenance" element={<MaintenancePage />} />
        <Route path="/admin/counselling" element={<CounsellingPage />} />
        <Route path="/admin/announcements" element={<AnnouncementsPage />} />
        <Route path="/admin/settings" element={<SystemSettingsPage />} />
        <Route path="/admin/profile" element={<ProfilePage />} />
        <Route path="/admin/notifications" element={<NotificationsPage />} />
      </Route>

      <Route element={<DashboardLayout allowedRoles={['lecturer']} />}>
        <Route path="/lecturer/dashboard" element={<LecturerDashboard />} />
        <Route path="/lecturer/notice-board" element={<NoticeBoardPage />} />
        <Route path="/lecturer/classes" element={<MyClasses />} />
        <Route path="/lecturer/live-lecture" element={<LiveLecture />} />
        <Route path="/lecturer/exams" element={<ExaminationsPage />} />
        <Route path="/lecturer/announcements" element={<AnnouncementsPage />} />
        <Route path="/lecturer/profile" element={<ProfilePage />} />
        <Route path="/lecturer/notifications" element={<NotificationsPage />} />
      </Route>

      <Route element={<DashboardLayout allowedRoles={['worker']} />}>
        <Route path="/worker/dashboard" element={<WorkerDashboard />} />
        <Route path="/worker/notice-board" element={<NoticeBoardPage />} />
        <Route path="/worker/tasks" element={<AssignedTasks />} />
        <Route path="/worker/profile" element={<ProfilePage />} />
        <Route path="/worker/notifications" element={<NotificationsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}