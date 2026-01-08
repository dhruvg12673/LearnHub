import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Home from './pages/Home';
import RoadmapView from './pages/RoadmapView';
import InterviewMode from './pages/InterviewMode';
import Library from './pages/Library';
import EducationNews from './pages/EducationNews';
import InProgressCourses from './pages/InProgressCourses';
import CompletedCourses from './pages/CompletedCourses';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return null;
  
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route 
            path="/" 
            element={
              <PrivateRoute>
                <Home />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/roadmap/:id" 
            element={
              <PrivateRoute>
                <RoadmapView />
              </PrivateRoute>
            }
          />
          <Route 
            path="/courses/inprogress" 
            element={
              <PrivateRoute>
                <InProgressCourses />
              </PrivateRoute>
            }
          />
          <Route 
            path="/courses/completed" 
            element={
              <PrivateRoute>
                <CompletedCourses />
              </PrivateRoute>
            }
          />
          <Route path="/interview" element={<InterviewMode />} />
          <Route path="/library" element={<Library />} />
          <Route path="/news" element={<EducationNews />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;