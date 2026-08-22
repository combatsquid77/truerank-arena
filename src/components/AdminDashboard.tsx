import React, { useState, useEffect } from 'react';
import { 
  Users, Swords, Shield, Trash2, Edit3, Save, X, Calendar, 
  MapPin, CheckCircle, Trophy, UserCheck, AlertTriangle, PlusCircle 
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  onboarded: boolean;
  promoterOrg: string;
  createdAt: string;
}

interface Fighter {
  id: string;
  userId: string;
  gym: string;
  location: string;
  age: number;
  gender: string;
  weightClass: string;
  bjjBelt: string;
  mmaWins: number;
  mmaLosses: number;
  mmaDraws: number;
  mmaElo: number;
  bjjWins: number;
  bjjLosses: number;
  bjjDraws: number;
  bjjElo: number;
  mtWins: number;
  mtLosses: number;
  mtDraws: number;
  mtElo: number;
  boxingWins: number;
  boxingLosses: number;
  boxingDraws: number;
  boxingElo: number;
  user: {
    name: string;
    email: string;
  };
}

interface Event {
  id: string;
  name: string;
  date: string;
  location: string;
  published: boolean;
  started: boolean;
  promoterId: string;
  promoter: {
    name: string;
    email: string;
  };
}

interface AdminDashboardProps {
  onRefreshData: () => void;
}

export default function AdminDashboard({ onRefreshData }: AdminDashboardProps) {
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'fighters' | 'events'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [fighters, setFighters] = useState<Fighter[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Search filters
  const [searchQuery, setSearchQuery] = useState('');

  // Editing Modals
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingFighter, setEditingFighter] = useState<Fighter | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  // Creation Modals
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAddFighterModal, setShowAddFighterModal] = useState(false);
  const [showAddEventModal, setShowAddEventModal] = useState(false);

  // Creation States: User
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('password');
  const [newUserRole, setNewUserRole] = useState('PENDING');
  const [newUserOnboarded, setNewUserOnboarded] = useState(false);
  const [newUserPromoterOrg, setNewUserPromoterOrg] = useState('');

  // Creation States: Fighter
  const [newFighterName, setNewFighterName] = useState('');
  const [newFighterEmail, setNewFighterEmail] = useState('');
  const [newFighterPassword, setNewFighterPassword] = useState('password');
  const [newFighterGym, setNewFighterGym] = useState('');
  const [newFighterLocation, setNewFighterLocation] = useState('');
  const [newFighterAge, setNewFighterAge] = useState(25);
  const [newFighterGender, setNewFighterGender] = useState('MALE');
  const [newFighterWeight, setNewFighterWeight] = useState('-73kg');
  const [newFighterBelt, setNewFighterBelt] = useState('WHITE');

  // Creation States: Event
  const [newEventName, setNewEventName] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventLocation, setNewEventLocation] = useState('');
  const [newEventPromoterId, setNewEventPromoterId] = useState('');

  const token = localStorage.getItem('truerank_auth_token') || '';

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const headers = { 'Authorization': token };
      
      const [usersRes, fightersRes, eventsRes] = await Promise.all([
        fetch('/api/admin/users', { headers }),
        fetch('/api/admin/fighters', { headers }),
        fetch('/api/admin/events', { headers })
      ]);

      if (!usersRes.ok || !fightersRes.ok || !eventsRes.ok) {
        throw new Error('Failed to fetch admin resources');
      }

      const [usersData, fightersData, eventsData] = await Promise.all([
        usersRes.json(),
        fightersRes.json(),
        eventsRes.json()
      ]);

      setUsers(usersData);
      setFighters(fightersData);
      setEvents(eventsData);
      
      // Default choice for event promoter dropdown
      const promoters = usersData.filter((u: User) => u.role === 'PROMOTER');
      if (promoters.length > 0) {
        setNewEventPromoterId(promoters[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Error loading administrative records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const triggerSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 4000);
  };

  // --- USER API ACTIONS ---
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({
          name: newUserName,
          email: newUserEmail,
          password: newUserPassword,
          role: newUserRole,
          onboarded: newUserOnboarded,
          promoterOrg: newUserPromoterOrg
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create user account');
      
      triggerSuccess('User account registered successfully!');
      setShowAddUserModal(false);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('password');
      setNewUserRole('PENDING');
      setNewUserOnboarded(false);
      setNewUserPromoterOrg('');
      
      await loadData();
      onRefreshData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({
          name: editingUser.name,
          role: editingUser.role,
          onboarded: editingUser.onboarded
        })
      });
      if (!res.ok) throw new Error('Failed to update user account');
      triggerSuccess('User account updated successfully!');
      setEditingUser(null);
      await loadData();
      onRefreshData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this user account? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': token }
      });
      if (!res.ok) throw new Error('Failed to delete user account');
      triggerSuccess('User account deleted.');
      await loadData();
      onRefreshData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // --- FIGHTER API ACTIONS ---
  const handleCreateFighter = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/fighters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({
          name: newFighterName,
          email: newFighterEmail,
          password: newFighterPassword,
          gym: newFighterGym,
          location: newFighterLocation,
          age: Number(newFighterAge),
          gender: newFighterGender,
          weightClass: newFighterWeight,
          bjjBelt: newFighterBelt
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create fighter passport');
      
      triggerSuccess('Fighter passport created successfully!');
      setShowAddFighterModal(false);
      setNewFighterName('');
      setNewFighterEmail('');
      setNewFighterPassword('password');
      setNewFighterGym('');
      setNewFighterLocation('');
      setNewFighterAge(25);
      
      await loadData();
      onRefreshData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSaveFighter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFighter) return;
    try {
      const res = await fetch(`/api/admin/fighters/${editingFighter.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify(editingFighter)
      });
      if (!res.ok) throw new Error('Failed to update fighter passport');
      triggerSuccess('Fighter passport updated successfully!');
      setEditingFighter(null);
      await loadData();
      onRefreshData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteFighter = async (id: string) => {
    if (!window.confirm('Are you sure you want to unlink and delete this fighter profile? The associated user account will remain.')) return;
    try {
      const res = await fetch(`/api/admin/fighters/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': token }
      });
      if (!res.ok) throw new Error('Failed to delete fighter profile');
      triggerSuccess('Fighter profile deleted.');
      await loadData();
      onRefreshData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // --- EVENT API ACTIONS ---
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({
          name: newEventName,
          date: newEventDate,
          location: newEventLocation,
          promoterId: newEventPromoterId
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create event card');
      
      triggerSuccess('Event card generated successfully!');
      setShowAddEventModal(false);
      setNewEventName('');
      setNewEventDate('');
      setNewEventLocation('');
      
      await loadData();
      onRefreshData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;
    try {
      const res = await fetch(`/api/admin/events/${editingEvent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({
          name: editingEvent.name,
          date: editingEvent.date,
          location: editingEvent.location,
          published: editingEvent.published,
          started: editingEvent.started
        })
      });
      if (!res.ok) throw new Error('Failed to update event card');
      triggerSuccess('Event details updated successfully!');
      setEditingEvent(null);
      await loadData();
      onRefreshData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel and delete this event? This clears all scheduled matches.')) return;
    try {
      const res = await fetch(`/api/admin/events/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': token }
      });
      if (!res.ok) throw new Error('Failed to delete event card');
      triggerSuccess('Event card deleted.');
      await loadData();
      onRefreshData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const promotersList = users.filter(u => u.role === 'PROMOTER');

  // Filtering lists based on search bar
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFighters = fighters.filter(f => 
    f.user?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.user?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.gym.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredEvents = events.filter(e => 
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.promoter?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-mono tracking-widest uppercase">Fetching admin resources...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8" id="admin-dashboard-container">
      
      {/* Alert Messaging */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-200 text-xs px-4 py-3 rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-xs px-4 py-3 rounded-xl flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Dashboard Sub-Header Header Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/40 p-4 rounded-2xl border border-slate-900">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { setActiveSubTab('users'); setSearchQuery(''); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'users' ? 'bg-purple-600 text-white shadow-md' : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-850'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Accounts Control ({users.length})</span>
          </button>
          <button
            onClick={() => { setActiveSubTab('fighters'); setSearchQuery(''); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'fighters' ? 'bg-purple-600 text-white shadow-md' : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-850'
            }`}
          >
            <Swords className="w-3.5 h-3.5" />
            <span>Fighter Passport Registry ({fighters.length})</span>
          </button>
          <button
            onClick={() => { setActiveSubTab('events'); setSearchQuery(''); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'events' ? 'bg-purple-600 text-white shadow-md' : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-850'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Tournament Cards ({events.length})</span>
          </button>
        </div>

        {/* Action button + Search Bar */}
        <div className="flex w-full md:w-auto items-center gap-3">
          {activeSubTab === 'users' && (
            <button
              onClick={() => setShowAddUserModal(true)}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md transition flex items-center gap-1 cursor-pointer shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Account</span>
            </button>
          )}
          {activeSubTab === 'fighters' && (
            <button
              onClick={() => setShowAddFighterModal(true)}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md transition flex items-center gap-1 cursor-pointer shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Fighter</span>
            </button>
          )}
          {activeSubTab === 'events' && (
            <button
              onClick={() => setShowAddEventModal(true)}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md transition flex items-center gap-1 cursor-pointer shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Event</span>
            </button>
          )}

          <div className="w-full md:w-48">
            <input
              type="text"
              placeholder={`Search ${activeSubTab}...`}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 focus:border-purple-600 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-600 outline-none transition"
            />
          </div>
        </div>
      </div>

      {/* --- PANEL 1: ACCOUNTS CONTROL --- */}
      {activeSubTab === 'users' && (
        <div className="bg-slate-900/30 border border-slate-900 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-900 bg-slate-900/50">
                  <th className="p-4 text-[10px] font-mono uppercase tracking-wider text-slate-400">User Account</th>
                  <th className="p-4 text-[10px] font-mono uppercase tracking-wider text-slate-400">Assigned Role</th>
                  <th className="p-4 text-[10px] font-mono uppercase tracking-wider text-slate-400">Status</th>
                  <th className="p-4 text-[10px] font-mono uppercase tracking-wider text-slate-400">Promoter Metadata</th>
                  <th className="p-4 text-[10px] font-mono uppercase tracking-wider text-slate-400">Registered</th>
                  <th className="p-4 text-right text-[10px] font-mono uppercase tracking-wider text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60">
                {filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-slate-900/10 transition">
                    <td className="p-4">
                      <div className="font-bold text-xs text-slate-100">{u.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{u.email}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold tracking-wider ${
                        u.role === 'ADMIN' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                        u.role === 'PROMOTER' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                        u.role === 'JUDGE' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        u.role === 'FIGHTER' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                        'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4 text-xs">
                      {u.onboarded ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Onboarded</span>
                        </span>
                      ) : (
                        <span className="text-slate-500 font-mono italic">Pending Profile</span>
                      )}
                    </td>
                    <td className="p-4 text-xs text-slate-400">
                      {u.promoterOrg ? (
                        <div className="font-semibold text-slate-200">{u.promoterOrg}</div>
                      ) : (
                        <span className="text-slate-600 font-mono">-</span>
                      )}
                    </td>
                    <td className="p-4 text-[10px] text-slate-500 font-mono">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => setEditingUser(u)}
                          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-purple-400 hover:border-purple-900/30 transition cursor-pointer"
                          title="Edit User Role"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-red-400 hover:border-red-950 transition cursor-pointer"
                          title="Delete User"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-xs text-slate-500 font-mono">
                      No accounts matching query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- PANEL 2: FIGHTERS REGISTRY --- */}
      {activeSubTab === 'fighters' && (
        <div className="bg-slate-900/30 border border-slate-900 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-900 bg-slate-900/50">
                  <th className="p-4 text-[10px] font-mono uppercase tracking-wider text-slate-400">Fighter Passport</th>
                  <th className="p-4 text-[10px] font-mono uppercase tracking-wider text-slate-400">Details</th>
                  <th className="p-4 text-[10px] font-mono uppercase tracking-wider text-slate-400">Belt rank</th>
                  <th className="p-4 text-[10px] font-mono uppercase tracking-wider text-slate-400">MMA Record & ELO</th>
                  <th className="p-4 text-[10px] font-mono uppercase tracking-wider text-slate-400">BJJ ELO</th>
                  <th className="p-4 text-[10px] font-mono uppercase tracking-wider text-slate-400">Muay Thai ELO</th>
                  <th className="p-4 text-right text-[10px] font-mono uppercase tracking-wider text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60">
                {filteredFighters.map(f => (
                  <tr key={f.id} className="hover:bg-slate-900/10 transition">
                    <td className="p-4">
                      <div className="font-bold text-xs text-slate-100">{f.user?.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{f.user?.email}</div>
                    </td>
                    <td className="p-4 text-xs">
                      <div className="font-semibold text-slate-200">{f.gym}</div>
                      <div className="text-[10px] text-slate-500">{f.location} | Age: {f.age} | {f.gender}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold tracking-wider ${
                        f.bjjBelt === 'BLACK' ? 'bg-black text-slate-100 border border-slate-800' :
                        f.bjjBelt === 'BROWN' ? 'bg-amber-950 text-amber-100 border border-amber-900' :
                        f.bjjBelt === 'PURPLE' ? 'bg-purple-900/20 text-purple-400 border border-purple-800/30' :
                        f.bjjBelt === 'BLUE' ? 'bg-blue-900/20 text-blue-400 border border-blue-800/30' :
                        'bg-slate-800 text-slate-300'
                      }`}>
                        {f.bjjBelt}
                      </span>
                    </td>
                    <td className="p-4 text-xs">
                      <div className="font-mono text-slate-200">
                        Record: <span className="text-emerald-400">{f.mmaWins}W</span> - <span className="text-red-400">{f.mmaLosses}L</span> - <span className="text-slate-400">{f.mmaDraws}D</span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                        <Trophy className="w-3 h-3 text-purple-500" />
                        <span>MMA ELO: <b className="text-purple-400">{f.mmaElo}</b></span>
                      </div>
                    </td>
                    <td className="p-4 text-xs font-mono">
                      <div className="text-slate-200">{f.bjjWins}W - {f.bjjLosses}L</div>
                      <div className="text-[10px] text-slate-400">BJJ ELO: <b className="text-blue-400">{f.bjjElo}</b></div>
                    </td>
                    <td className="p-4 text-xs font-mono">
                      <div className="text-slate-200">{f.mtWins}W - {f.mtLosses}L</div>
                      <div className="text-[10px] text-slate-400">MT ELO: <b className="text-amber-400">{f.mtElo}</b></div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => setEditingFighter(f)}
                          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-purple-400 hover:border-purple-900/30 transition cursor-pointer"
                          title="Edit Records & ELO"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteFighter(f.id)}
                          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-red-400 hover:border-red-950 transition cursor-pointer"
                          title="Delete Profile"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredFighters.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-xs text-slate-500 font-mono">
                      No fighter passports matching query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- PANEL 3: TOURNAMENT CARDS --- */}
      {activeSubTab === 'events' && (
        <div className="bg-slate-900/30 border border-slate-900 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-900 bg-slate-900/50">
                  <th className="p-4 text-[10px] font-mono uppercase tracking-wider text-slate-400">Event Details</th>
                  <th className="p-4 text-[10px] font-mono uppercase tracking-wider text-slate-400">Date & Location</th>
                  <th className="p-4 text-[10px] font-mono uppercase tracking-wider text-slate-400">Promoter Organization</th>
                  <th className="p-4 text-[10px] font-mono uppercase tracking-wider text-slate-400">State</th>
                  <th className="p-4 text-right text-[10px] font-mono uppercase tracking-wider text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60">
                {filteredEvents.map(e => (
                  <tr key={e.id} className="hover:bg-slate-900/10 transition">
                    <td className="p-4">
                      <div className="font-bold text-xs text-slate-100">{e.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">ID: {e.id}</div>
                    </td>
                    <td className="p-4 text-xs">
                      <div className="flex items-center gap-1 text-slate-300">
                        <Calendar className="w-3.5 h-3.5 text-purple-500" />
                        <span>{new Date(e.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-500 text-[10px]">
                        <MapPin className="w-3 h-3" />
                        <span>{e.location}</span>
                      </div>
                    </td>
                    <td className="p-4 text-xs text-slate-300">
                      <div className="font-semibold text-slate-200">{e.promoter?.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{e.promoter?.email}</div>
                    </td>
                    <td className="p-4 text-xs">
                      <div className="flex gap-2">
                        {e.published ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/20">
                            Published
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-500 border border-slate-700/50">
                            Draft
                          </span>
                        )}
                        {e.started ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/20 animate-pulse">
                            Live
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-500 border border-slate-700/50">
                            Scheduled
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => setEditingEvent(e)}
                          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-purple-400 hover:border-purple-900/30 transition cursor-pointer"
                          title="Modify Event"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(e.id)}
                          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-red-400 hover:border-red-950 transition cursor-pointer"
                          title="Cancel Event"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredEvents.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-xs text-slate-500 font-mono">
                      No event cards matching query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- CREATION MODAL 1: ADD ACCOUNT --- */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <button onClick={() => setShowAddUserModal(false)} className="absolute top-4 right-4 text-slate-500 hover:text-slate-350 transition cursor-pointer">
              <X className="w-4 h-4" />
            </button>
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-white mb-6">Create New Account</h3>
            
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Full Name</label>
                <input type="text" required value={newUserName} onChange={e => setNewUserName(e.target.value)} placeholder="e.g. John Doe" className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2 px-3 text-xs text-white outline-none"/>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Email Address</label>
                <input type="email" required value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} placeholder="name@domain.com" className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2 px-3 text-xs text-white outline-none"/>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Password</label>
                <input type="password" required value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} placeholder="Minimum 6 characters" className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2 px-3 text-xs text-white outline-none"/>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Assigned Role</label>
                <select value={newUserRole} onChange={e => setNewUserRole(e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2 px-3 text-xs text-white outline-none">
                  <option value="PENDING">PENDING</option>
                  <option value="FIGHTER">FIGHTER</option>
                  <option value="PROMOTER">PROMOTER</option>
                  <option value="JUDGE">JUDGE</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
              
              {newUserRole === 'PROMOTER' && (
                <div className="space-y-1.5 animate-fadeIn">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Promoter Organization Name</label>
                  <input type="text" value={newUserPromoterOrg} onChange={e => setNewUserPromoterOrg(e.target.value)} placeholder="e.g. Apex Combat Championships" className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2 px-3 text-xs text-white outline-none"/>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" id="add-onboarded-checkbox" checked={newUserOnboarded} onChange={e => setNewUserOnboarded(e.target.checked)} className="rounded border-slate-800 text-purple-600 focus:ring-0 bg-slate-950 w-4 h-4"/>
                <label htmlFor="add-onboarded-checkbox" className="text-xs text-slate-300 select-none">Mark profile as fully onboarded</label>
              </div>

              <button type="submit" className="w-full mt-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-lg transition flex items-center justify-center gap-1.5 cursor-pointer">
                <PlusCircle className="w-4 h-4" />
                <span>Register Account</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- CREATION MODAL 2: ADD FIGHTER --- */}
      {showAddFighterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl my-8">
            <button onClick={() => setShowAddFighterModal(false)} className="absolute top-4 right-4 text-slate-500 hover:text-slate-350 transition cursor-pointer">
              <X className="w-4 h-4" />
            </button>
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-white mb-6">Create Fighter Passport</h3>
            
            <form onSubmit={handleCreateFighter} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Fighter Name</label>
                  <input type="text" required value={newFighterName} onChange={e => setNewFighterName(e.target.value)} placeholder="e.g. Khabib Nurmag" className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2 px-3 text-xs text-white outline-none"/>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Email Address</label>
                  <input type="email" required value={newFighterEmail} onChange={e => setNewFighterEmail(e.target.value)} placeholder="khabib@aka.com" className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2 px-3 text-xs text-white outline-none"/>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Password</label>
                  <input type="password" required value={newFighterPassword} onChange={e => setNewFighterPassword(e.target.value)} placeholder="password" className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2 px-3 text-xs text-white outline-none"/>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Gym</label>
                  <input type="text" required value={newFighterGym} onChange={e => setNewFighterGym(e.target.value)} placeholder="e.g. AKA Academy" className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2 px-3 text-xs text-white outline-none"/>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Location</label>
                  <input type="text" required value={newFighterLocation} onChange={e => setNewFighterLocation(e.target.value)} placeholder="e.g. Dagestan, RU" className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2 px-3 text-xs text-white outline-none"/>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Age</label>
                  <input type="number" required value={newFighterAge} onChange={e => setNewFighterAge(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2 px-3 text-xs text-white outline-none"/>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Gender</label>
                  <select value={newFighterGender} onChange={e => setNewFighterGender(e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2 px-3 text-xs text-white outline-none">
                    <option value="MALE">MALE</option>
                    <option value="FEMALE">FEMALE</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Weight Class</label>
                  <select value={newFighterWeight} onChange={e => setNewFighterWeight(e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2 px-3 text-xs text-white outline-none">
                    <option value="-63kg">-63kg</option>
                    <option value="-68kg">-68kg</option>
                    <option value="-73kg">-73kg</option>
                    <option value="-78kg">-78kg</option>
                    <option value="-85kg">-85kg</option>
                    <option value="-91kg">-91kg</option>
                    <option value="100kg+">100kg+</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Belt Rank</label>
                  <select value={newFighterBelt} onChange={e => setNewFighterBelt(e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2 px-3 text-xs text-white outline-none">
                    <option value="WHITE">WHITE</option>
                    <option value="BLUE">BLUE</option>
                    <option value="PURPLE">PURPLE</option>
                    <option value="BROWN">BROWN</option>
                    <option value="BLACK">BLACK</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="w-full mt-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-lg transition flex items-center justify-center gap-1.5 cursor-pointer">
                <PlusCircle className="w-4 h-4" />
                <span>Create Fighter Profile</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- CREATION MODAL 3: ADD EVENT --- */}
      {showAddEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <button onClick={() => setShowAddEventModal(false)} className="absolute top-4 right-4 text-slate-500 hover:text-slate-350 transition cursor-pointer">
              <X className="w-4 h-4" />
            </button>
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-white mb-6">Create Tournament Event</h3>
            
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Event Title</label>
                <input type="text" required value={newEventName} onChange={e => setNewEventName(e.target.value)} placeholder="e.g. TrueRank Arena: Collision" className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2 px-3 text-xs text-white outline-none"/>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Location / Gym</label>
                <input type="text" required value={newEventLocation} onChange={e => setNewEventLocation(e.target.value)} placeholder="e.g. London, UK" className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2 px-3 text-xs text-white outline-none"/>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Date & Time</label>
                <input type="datetime-local" required value={newEventDate} onChange={e => setNewEventDate(e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2 px-3 text-xs text-white outline-none"/>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Event Promoter (Owner)</label>
                <select value={newEventPromoterId} onChange={e => setNewEventPromoterId(e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2 px-3 text-xs text-white outline-none">
                  {promotersList.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.promoterOrg})</option>
                  ))}
                  {promotersList.length === 0 && (
                    <option value="">No promoters found. Add a Promoter user first!</option>
                  )}
                </select>
              </div>

              <button type="submit" className="w-full mt-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-lg transition flex items-center justify-center gap-1.5 cursor-pointer">
                <PlusCircle className="w-4 h-4" />
                <span>Generate Event Card</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT MODAL 1: EDIT USER --- */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <button
              onClick={() => setEditingUser(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-350 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-white mb-6">Modify User Account</h3>
            
            <form onSubmit={handleSaveUser} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Full Name</label>
                <input
                  type="text"
                  required
                  value={editingUser.name}
                  onChange={e => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2 px-3 text-xs text-white outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Assigned Role</label>
                <select
                  value={editingUser.role}
                  onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2 px-3 text-xs text-white outline-none"
                >
                  <option value="PENDING">PENDING</option>
                  <option value="FIGHTER">FIGHTER</option>
                  <option value="PROMOTER">PROMOTER</option>
                  <option value="JUDGE">JUDGE</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="onboarded-checkbox"
                  checked={editingUser.onboarded}
                  onChange={e => setEditingUser({ ...editingUser, onboarded: e.target.checked })}
                  className="rounded border-slate-800 text-purple-600 focus:ring-0 bg-slate-950 w-4 h-4"
                />
                <label htmlFor="onboarded-checkbox" className="text-xs text-slate-300 select-none">Onboarding Completed</label>
              </div>

              <button
                type="submit"
                className="w-full mt-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT MODAL 2: EDIT FIGHTER PASSPORT --- */}
      {editingFighter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl my-8">
            <button
              onClick={() => setEditingFighter(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-350 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-white mb-6">Modify Fighter Passport ({editingFighter.user?.name})</h3>
            
            <form onSubmit={handleSaveFighter} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Gym</label>
                  <input
                    type="text"
                    required
                    value={editingFighter.gym}
                    onChange={e => setEditingFighter({ ...editingFighter, gym: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2 px-3 text-xs text-white outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Location</label>
                  <input
                    type="text"
                    required
                    value={editingFighter.location}
                    onChange={e => setEditingFighter({ ...editingFighter, location: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2 px-3 text-xs text-white outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Age</label>
                  <input
                    type="number"
                    required
                    value={editingFighter.age}
                    onChange={e => setEditingFighter({ ...editingFighter, age: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2 px-3 text-xs text-white outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Belt Rank</label>
                  <select
                    value={editingFighter.bjjBelt}
                    onChange={e => setEditingFighter({ ...editingFighter, bjjBelt: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2 px-3 text-xs text-white outline-none"
                  >
                    <option value="WHITE">WHITE</option>
                    <option value="BLUE">BLUE</option>
                    <option value="PURPLE">PURPLE</option>
                    <option value="BROWN">BROWN</option>
                    <option value="BLACK">BLACK</option>
                  </select>
                </div>
              </div>

              {/* Multi-Sport Records */}
              <div className="border-t border-slate-850 pt-4 space-y-4">
                <h4 className="text-xs font-mono uppercase tracking-wider text-purple-400">Multi-Sport Fight Records & ELO</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* MMA */}
                  <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-850/60 space-y-3">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-slate-300 font-bold">Mixed Martial Arts (MMA)</div>
                    <div className="flex gap-2">
                      <input type="number" placeholder="W" value={editingFighter.mmaWins} onChange={e => setEditingFighter({...editingFighter, mmaWins: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-850 rounded-lg p-1.5 text-center text-xs text-white"/>
                      <input type="number" placeholder="L" value={editingFighter.mmaLosses} onChange={e => setEditingFighter({...editingFighter, mmaLosses: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-850 rounded-lg p-1.5 text-center text-xs text-white"/>
                      <input type="number" placeholder="D" value={editingFighter.mmaDraws} onChange={e => setEditingFighter({...editingFighter, mmaDraws: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-850 rounded-lg p-1.5 text-center text-xs text-white"/>
                    </div>
                    <input type="number" placeholder="MMA ELO" value={editingFighter.mmaElo} onChange={e => setEditingFighter({...editingFighter, mmaElo: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-850 rounded-lg p-1.5 text-center text-xs text-white"/>
                  </div>

                  {/* BJJ */}
                  <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-850/60 space-y-3">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-slate-300 font-bold">Brazilian Jiu-Jitsu (BJJ)</div>
                    <div className="flex gap-2">
                      <input type="number" placeholder="W" value={editingFighter.bjjWins} onChange={e => setEditingFighter({...editingFighter, bjjWins: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-850 rounded-lg p-1.5 text-center text-xs text-white"/>
                      <input type="number" placeholder="L" value={editingFighter.bjjLosses} onChange={e => setEditingFighter({...editingFighter, bjjLosses: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-850 rounded-lg p-1.5 text-center text-xs text-white"/>
                      <input type="number" placeholder="D" value={editingFighter.bjjDraws} onChange={e => setEditingFighter({...editingFighter, bjjDraws: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-850 rounded-lg p-1.5 text-center text-xs text-white"/>
                    </div>
                    <input type="number" placeholder="BJJ ELO" value={editingFighter.bjjElo} onChange={e => setEditingFighter({...editingFighter, bjjElo: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-850 rounded-lg p-1.5 text-center text-xs text-white"/>
                  </div>

                  {/* Muay Thai */}
                  <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-850/60 space-y-3">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-slate-300 font-bold">Muay Thai (MT)</div>
                    <div className="flex gap-2">
                      <input type="number" placeholder="W" value={editingFighter.mtWins} onChange={e => setEditingFighter({...editingFighter, mtWins: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-850 rounded-lg p-1.5 text-center text-xs text-white"/>
                      <input type="number" placeholder="L" value={editingFighter.mtLosses} onChange={e => setEditingFighter({...editingFighter, mtLosses: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-850 rounded-lg p-1.5 text-center text-xs text-white"/>
                      <input type="number" placeholder="D" value={editingFighter.mtDraws} onChange={e => setEditingFighter({...editingFighter, mtDraws: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-850 rounded-lg p-1.5 text-center text-xs text-white"/>
                    </div>
                    <input type="number" placeholder="MT ELO" value={editingFighter.mtElo} onChange={e => setEditingFighter({...editingFighter, mtElo: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-850 rounded-lg p-1.5 text-center text-xs text-white"/>
                  </div>

                  {/* Boxing */}
                  <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-850/60 space-y-3">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-slate-300 font-bold">Boxing</div>
                    <div className="flex gap-2">
                      <input type="number" placeholder="W" value={editingFighter.boxingWins} onChange={e => setEditingFighter({...editingFighter, boxingWins: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-850 rounded-lg p-1.5 text-center text-xs text-white"/>
                      <input type="number" placeholder="L" value={editingFighter.boxingLosses} onChange={e => setEditingFighter({...editingFighter, boxingLosses: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-850 rounded-lg p-1.5 text-center text-xs text-white"/>
                      <input type="number" placeholder="D" value={editingFighter.boxingDraws} onChange={e => setEditingFighter({...editingFighter, boxingDraws: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-850 rounded-lg p-1.5 text-center text-xs text-white"/>
                    </div>
                    <input type="number" placeholder="Boxing ELO" value={editingFighter.boxingElo} onChange={e => setEditingFighter({...editingFighter, boxingElo: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-850 rounded-lg p-1.5 text-center text-xs text-white"/>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Fighter Passport</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT MODAL 3: EDIT EVENT --- */}
      {editingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <button
              onClick={() => setEditingEvent(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-350 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-white mb-6">Modify Event Card</h3>
            
            <form onSubmit={handleSaveEvent} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Event Title</label>
                <input
                  type="text"
                  required
                  value={editingEvent.name}
                  onChange={e => setEditingEvent({ ...editingEvent, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2 px-3 text-xs text-white outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Location</label>
                <input
                  type="text"
                  required
                  value={editingEvent.location}
                  onChange={e => setEditingEvent({ ...editingEvent, location: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2 px-3 text-xs text-white outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Date (ISO)</label>
                <input
                  type="datetime-local"
                  required
                  value={editingEvent.date.slice(0, 16)}
                  onChange={e => setEditingEvent({ ...editingEvent, date: new Date(e.target.value).toISOString() })}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2 px-3 text-xs text-white outline-none"
                />
              </div>

              <div className="flex gap-4 pt-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="published-checkbox"
                    checked={editingEvent.published}
                    onChange={e => setEditingEvent({ ...editingEvent, published: e.target.checked })}
                    className="rounded border-slate-800 text-purple-600 focus:ring-0 bg-slate-950 w-4 h-4"
                  />
                  <label htmlFor="published-checkbox" className="text-xs text-slate-300 select-none">Published</label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="started-checkbox"
                    checked={editingEvent.started}
                    onChange={e => setEditingEvent({ ...editingEvent, started: e.target.checked })}
                    className="rounded border-slate-850 text-purple-600 focus:ring-0 bg-slate-950 w-4 h-4"
                  />
                  <label htmlFor="started-checkbox" className="text-xs text-slate-300 select-none">Live (started)</label>
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
