import { Routes, Route } from 'react-router-dom';
import Nav from './components/Nav.jsx';
import MobileTabBar from './components/MobileTabBar.jsx';
import Landing from './pages/Landing.jsx';
import Feed from './pages/Feed.jsx';
import Directory from './pages/Directory.jsx';
import BusinessProfile from './pages/BusinessProfile.jsx';
import PostDetail from './pages/PostDetail.jsx';
import Network from './pages/Network.jsx';
import Leaderboard from './pages/Leaderboard.jsx';
import Messages from './pages/Messages.jsx';
import Dashboard from './pages/Dashboard.jsx';
import EditProfile from './pages/EditProfile.jsx';
import NewPost from './pages/NewPost.jsx';
import Membership from './pages/Membership.jsx';
import Search from './pages/Search.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Admin from './pages/Admin.jsx';

export default function App() {
    return (
        <div className="page page-with-tab-bar">
            <Nav />
            <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/feed" element={<Feed />} />
                <Route path="/directory" element={<Directory />} />
                <Route path="/business/:slug" element={<BusinessProfile />} />
                <Route path="/post/:id" element={<PostDetail />} />
                <Route path="/network" element={<Network />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/dashboard/edit-profile" element={<EditProfile />} />
                <Route path="/dashboard/new-post" element={<NewPost />} />
                <Route path="/membership" element={<Membership />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/search" element={<Search />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
            </Routes>
            <MobileTabBar />
        </div>
    );
}
