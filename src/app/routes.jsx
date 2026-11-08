import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import DashboardLayout from '../components/layout/DashboardLayout.jsx'
import Login from '../modules/authentication/pages/Login.jsx'
import Register from '../modules/authentication/pages/Register.jsx'
import StudentDashboard from '../modules/student/pages/StudentDashboard.jsx'
import AdminDashboard from '../modules/administration/pages/AdminDashboard.jsx'
import LecturerDashboard from '../modules/lecturer/pages/LecturerDashboard.jsx'
import WorkerDashboard from '../modules/worker/pages/WorkerDashboard.jsx'
import UserManagement from '../modules/administration/pages/UserManagement.jsx'
import CourseManagement from '../modules/administration/pages/CourseManagement.jsx'
import LostFoundPage from '../modules/lost-and-found/pages/LostFoundPage.jsx'
import MaintenancePage from '../modules/maintenance/pages/MaintenancePage.jsx'
import AnnouncementsPage from '../modules/announcements/pages/AnnouncementsPage.jsx'
import CommunityPage from '../modules/community/pages/CommunityPage.jsx'
import NotificationsPage from '../modules/notifications/pages/NotificationsPage.jsx'
import AssignedTasks from '../modules/worker/pages/AssignedTasks.jsx'
import GroupsPage from '../modules/student/pages/GroupsPage.jsx'
import EventsPage from '../modules/student/pages/EventsPage.jsx'
import CounsellingPage from '../modules/counselling/pages/CounsellingPage.jsx'
import MyClasses from '../modules/lecturer/pages/MyClasses.jsx'
import { ROLE_HOME } from '../utils/constants.js'

export default function AppRoutes() {
  const { user, role, loading, signOut } = useAuth()
  
  if (loading) return <div className="h-screen grid place-items-center text-slate-500">Loading...</div>
  if (user && !role) return <div className="h-screen grid place-items-center bg-slate-100 p-4"><div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md"><h2 className="text-xl font-bold text-red-600 mb-2">Profile Not Found</h2><button onClick={signOut} className="bg-slate-800 text-white px-4 py-2 rounded-lg w-full">Sign Out</button></div></div>

  return (
    <Routes>
      <Route path="/" element={!user ? <Navigate to="/login" /> : <Navigate to={ROLE_HOME[role] || '/login'} />} />
      <Route path="/login" element={!user ? <Login /> : <Navigate to={ROLE_HOME[role] || '/login'} />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to={ROLE_HOME[role] || '/login'} />} />

      <Route element={<DashboardLayout allowedRoles={['student']} />}>
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/student/community" element={<CommunityPage />} />
        <Route path="/student/groups" element={<GroupsPage />} />
        <Route path="/student/events" element={<EventsPage />} />
        <Route path="/student/lost-found" element={<LostFoundPage />} />
        <Route path="/student/maintenance" element={<MaintenancePage />} />
        <Route path="/student/counselling" element={<CounsellingPage />} />
        <Route path="/student/announcements" element={<AnnouncementsPage />} />
        <Route path="/student/notifications" element={<NotificationsPage />} />
      </Route>

      <Route element={<DashboardLayout allowedRoles={['admin']} />}>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/admin/courses" element={<CourseManagement />} />
        <Route path="/admin/lost-found" element={<LostFoundPage />} />
        <Route path="/admin/maintenance" element={<MaintenancePage />} />
        <Route path="/admin/counselling" element={<CounsellingPage />} />
        <Route path="/admin/announcements" element={<AnnouncementsPage />} />
        <Route path="/admin/notifications" element={<NotificationsPage />} />
      </Route>

      <Route element={<DashboardLayout allowedRoles={['lecturer']} />}>
        <Route path="/lecturer/dashboard" element={<LecturerDashboard />} />
        <Route path="/lecturer/classes" element={<MyClasses />} />
        <Route path="/lecturer/announcements" element={<AnnouncementsPage />} />
        <Route path="/lecturer/notifications" element={<NotificationsPage />} />
      </Route>

      <Route element={<DashboardLayout allowedRoles={['worker']} />}>
        <Route path="/worker/dashboard" element={<WorkerDashboard />} />
        <Route path="/worker/tasks" element={<AssignedTasks />} />
        <Route path="/worker/notifications" element={<NotificationsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}