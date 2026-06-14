import { useEffect, useMemo, useState } from 'react';
import './App.css';
import jobs from './data/jobs.json';

const STORAGE_KEY = 'jobseeker-app-state';

const initialProfile = {
  fullName: '',
  email: '',
  title: '',
  location: '',
  experience: '',
  skills: '',
  bio: '',
  cvName: '',
};

const initialOfferDraft = {
  title: '',
  company: '',
  location: '',
  type: 'Full-time',
  salary: '',
  description: '',
};

function App() {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [type, setType] = useState('All');
  const [selectedJobId, setSelectedJobId] = useState(jobs[0]?.id ?? '');
  const [view, setView] = useState('browse');
  const [dashboardRole, setDashboardRole] = useState('candidate');
  const [candidateProfile, setCandidateProfile] = useState(initialProfile);
  const [offers, setOffers] = useState(jobs);
  const [offerDraft, setOfferDraft] = useState(initialOfferDraft);
  const [applications, setApplications] = useState([]);
  const [feedback, setFeedback] = useState('');
  const [authMode, setAuthMode] = useState('candidate');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerCompany, setRegisterCompany] = useState('');
  const [registeredUsers, setRegisteredUsers] = useState([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved);
      if (parsed.candidateProfile) setCandidateProfile(parsed.candidateProfile);
      if (parsed.offers) setOffers(parsed.offers);
      if (parsed.applications) setApplications(parsed.applications);
      if (parsed.registeredUsers) setRegisteredUsers(parsed.registeredUsers);
    } catch (error) {
      console.error('Unable to restore saved job seeker data', error);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ candidateProfile, offers, applications, registeredUsers })
    );
  }, [candidateProfile, offers, applications, registeredUsers]);

  const categories = useMemo(() => ['All', ...new Set(offers.map((job) => job.category))], [offers]);

  const filteredJobs = useMemo(() => {
    return offers.filter((job) => {
      const searchText = `${job.title} ${job.company} ${job.description}`.toLowerCase();
      const matchesQuery = !query || searchText.includes(query.toLowerCase());
      const matchesLocation = !location || job.location.toLowerCase().includes(location.toLowerCase());
      const matchesType = type === 'All' || job.type === type;

      return matchesQuery && matchesLocation && matchesType;
    });
  }, [offers, query, location, type]);

  useEffect(() => {
    if (filteredJobs.length === 0) {
      setSelectedJobId('');
      return;
    }

    if (!filteredJobs.some((job) => job.id === selectedJobId)) {
      setSelectedJobId(filteredJobs[0].id);
    }
  }, [filteredJobs, selectedJobId]);

  const selectedJob = filteredJobs.find((job) => job.id === selectedJobId) || filteredJobs[0] || null;

  const handleProfileSubmit = (event) => {
    event.preventDefault();
    setFeedback('Profile saved. Employers can now see the latest version of your CV and experience.');
  };

  const handleCVUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCandidateProfile((prev) => ({ ...prev, cvName: file.name }));
    setFeedback(`CV uploaded: ${file.name}`);
  };

  const handleApply = () => {
    if (!selectedJob) return;

    if (!candidateProfile.fullName || !candidateProfile.email) {
      setFeedback('Complete your candidate profile first so your application can be sent.');
      return;
    }

    const application = {
      id: `application-${Date.now()}`,
      jobId: selectedJob.id,
      jobTitle: selectedJob.title,
      company: selectedJob.company,
      applicantName: candidateProfile.fullName,
      applicantEmail: candidateProfile.email,
      cvName: candidateProfile.cvName || 'No CV uploaded',
      createdAt: new Date().toLocaleString(),
    };

    setApplications((prev) => [application, ...prev]);
    setFeedback(`Application sent for ${selectedJob.title}. An employer notification was created.`);
  };

  const handleOfferSubmit = (event) => {
    event.preventDefault();

    if (!offerDraft.title || !offerDraft.company || !offerDraft.description) {
      setFeedback('Publish an offer by filling in the title, company, and description.');
      return;
    }

    const newOffer = {
      id: `offer-${Date.now()}`,
      title: offerDraft.title,
      company: offerDraft.company,
      location: offerDraft.location || 'Remote',
      type: offerDraft.type,
      salary: offerDraft.salary || 'Negotiable',
      experience: 'Flexible',
      category: 'New',
      postedAt: 'Just now',
      description: offerDraft.description,
    };

    setOffers((prev) => [newOffer, ...prev]);
    setOfferDraft(initialOfferDraft);
    setFeedback('Offer published. It now shows in the job board and employer notifications.');
  };

  const handleLogin = (event) => {
    event.preventDefault();

    if (!loginEmail || !loginPassword) {
      setFeedback('Enter an email and password to continue.');
      return;
    }

    const existingUser = registeredUsers.find(
      (user) => user.email === loginEmail && user.password === loginPassword && user.role === authMode
    );

    if (!existingUser) {
      setFeedback(`No ${authMode} account was found with that email and password.`);
      return;
    }

    if (authMode === 'candidate') {
      setDashboardRole('candidate');
      setView('dashboard');
      setIsLoggedIn(true);
      setFeedback(`Candidate login successful. Welcome, ${existingUser.name}.`);
      return;
    }

    setDashboardRole('employer');
    setView('dashboard');
    setIsLoggedIn(true);
    setFeedback(`Employer login successful. Welcome, ${existingUser.name}.`);
  };

  const handleRegister = (event) => {
    event.preventDefault();

    if (!registerName || !registerEmail || !registerPassword) {
      setFeedback('Please fill in your name, email, and password.');
      return;
    }

    if (registeredUsers.some((user) => user.email === registerEmail)) {
      setFeedback('An account already exists for that email. Please log in instead.');
      return;
    }

    const newUser = {
      id: `user-${Date.now()}`,
      name: registerName,
      email: registerEmail,
      password: registerPassword,
      role: authMode,
      company: authMode === 'employer' ? registerCompany : '',
    };

    setRegisteredUsers((prev) => [newUser, ...prev]);
    setRegisterName('');
    setRegisterEmail('');
    setRegisterPassword('');
    setRegisterCompany('');
    setIsRegistering(false);
    setFeedback(`Registration successful. You can now log in as a ${authMode}.`);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setView('browse');
    setLoginEmail('');
    setLoginPassword('');
    setFeedback('You have been logged out.');
  };

  return (
    <main className="page-shell">
      <header className="topbar">
        <div>
          <p className="brand">JobSeeker</p>
          <span className="brand-sub">Find work that fits your life</span>
        </div>
        <div className="topbar-actions">
          <button
            type="button"
            className={`nav-btn ${view === 'browse' ? 'active' : ''}`}
            onClick={() => setView('browse')}
          >
            Browse jobs
          </button>
          <button
            type="button"
            className={`nav-btn ${view === 'dashboard' ? 'active' : ''}`}
            onClick={() => setView('dashboard')}
          >
            Dashboard
          </button>
          {isLoggedIn ? (
            <button type="button" className="nav-btn" onClick={handleLogout}>
              Logout
            </button>
          ) : null}
        </div>
      </header>

      {feedback ? <p className="feedback">{feedback}</p> : null}

      {!isLoggedIn && view === 'dashboard' ? (
        <section className="login-card">
          <div className="login-card-head">
            <div>
              <p className="eyebrow">Secure access</p>
              <h2>Choose your account</h2>
            </div>
            <p className="login-tip">Sign in to unlock your dashboard experience.</p>
          </div>
          <div className="login-toggle">
            <button
              type="button"
              className={`nav-btn ${authMode === 'candidate' ? 'active' : ''}`}
              onClick={() => setAuthMode('candidate')}
            >
              Candidate login
            </button>
            <button
              type="button"
              className={`nav-btn ${authMode === 'employer' ? 'active' : ''}`}
              onClick={() => setAuthMode('employer')}
            >
              Employer login
            </button>
          </div>
          {!isRegistering ? (
            <form className="login-form" onSubmit={handleLogin}>
              <label>
                Email
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(event) => setLoginEmail(event.target.value)}
                  placeholder="you@example.com"
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(event) => setLoginPassword(event.target.value)}
                  placeholder="••••••••"
                />
              </label>
              <button type="submit" className="apply-btn">Login</button>
            </form>
          ) : (
            <form className="login-form" onSubmit={handleRegister}>
              <label>
                Your name
                <input
                  value={registerName}
                  onChange={(event) => setRegisterName(event.target.value)}
                  placeholder="Alex Morgan"
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={registerEmail}
                  onChange={(event) => setRegisterEmail(event.target.value)}
                  placeholder="you@example.com"
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  value={registerPassword}
                  onChange={(event) => setRegisterPassword(event.target.value)}
                  placeholder="Create a password"
                />
              </label>
              {authMode === 'employer' ? (
                <label>
                  Company name
                  <input
                    value={registerCompany}
                    onChange={(event) => setRegisterCompany(event.target.value)}
                    placeholder="Northstar Labs"
                  />
                </label>
              ) : null}
              <button type="submit" className="apply-btn">Create account</button>
            </form>
          )}

          <button type="button" className="text-btn" onClick={() => setIsRegistering((prev) => !prev)}>
            {isRegistering ? 'Already have an account? Login' : 'Need an account? Register'}
          </button>
        </section>
      ) : null}

      {view === 'browse' ? (
        <>
          <section className="hero">
            <div className="hero-copy">
              <p className="eyebrow">Your next opportunity starts here</p>
              <h1>Discover jobs that match your ambition.</h1>
              <p className="hero-text">
                Search through curated opportunities and discover the right company for your next move.
              </p>
            </div>

            <form className="search-card">
              <label>
                <span>What</span>
                <input
                  type="text"
                  placeholder="Job title or keyword"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>

              <label>
                <span>Where</span>
                <input
                  type="text"
                  placeholder="City or remote"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                />
              </label>

              <label>
                <span>Type</span>
                <select value={type} onChange={(event) => setType(event.target.value)}>
                  <option value="All">All</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                </select>
              </label>
            </form>
          </section>

          <section className="results-shell">
            <div className="jobs-column">
              <div className="results-header">
                <div>
                  <h2>Recommended roles</h2>
                  <p>{filteredJobs.length} opportunities available right now</p>
                </div>
                <div className="pill-row">
                  {categories.map((category) => (
                    <span key={category} className="pill">
                      {category}
                    </span>
                  ))}
                </div>
              </div>

              <section className="job-list">
                {filteredJobs.length === 0 ? (
                  <div className="empty-state">
                    <h3>No matches yet</h3>
                    <p>Try a broader keyword or remove one of the filters.</p>
                  </div>
                ) : (
                  filteredJobs.map((job) => (
                    <button
                      key={job.id}
                      type="button"
                      className={`job-card ${selectedJob?.id === job.id ? 'active' : ''}`}
                      onClick={() => setSelectedJobId(job.id)}
                    >
                      <div className="job-meta">
                        <span className="job-company">{job.company}</span>
                        <span className="job-badge">{job.category}</span>
                      </div>
                      <h3>{job.title}</h3>
                      <p className="job-location">{job.location}</p>
                      <p className="job-summary">{job.description}</p>
                      <div className="job-footer">
                        <span>{job.type}</span>
                        <span>{job.salary}</span>
                        <span>{job.postedAt}</span>
                      </div>
                    </button>
                  ))
                )}
              </section>
            </div>

            <aside className="detail-panel">
              {selectedJob ? (
                <>
                  <div className="detail-head">
                    <p className="eyebrow">Featured role</p>
                    <h2>{selectedJob.title}</h2>
                    <p className="job-location">{selectedJob.company} • {selectedJob.location}</p>
                  </div>
                  <div className="chip-row">
                    <span>{selectedJob.type}</span>
                    <span>{selectedJob.salary}</span>
                    <span>{selectedJob.experience}</span>
                  </div>
                  <p className="detail-description">{selectedJob.description}</p>
                  <div className="detail-section">
                    <h3>Why this role stands out</h3>
                    <ul>
                      <li>Built for fast-moving teams and modern product work.</li>
                      <li>Open to remote, hybrid, and on-site candidates.</li>
                      <li>Backed by a strong culture and clear growth path.</li>
                    </ul>
                  </div>
                  <div className="detail-actions">
                    <button type="button" className="apply-btn" onClick={handleApply}>
                      Apply now
                    </button>
                    <span className="salary-pill">{selectedJob.salary}</span>
                  </div>
                </>
              ) : (
                <div className="empty-state">
                  <h3>No role selected</h3>
                  <p>Choose a listing to view the full opportunity.</p>
                </div>
              )}
            </aside>
          </section>
        </>
      ) : (
        isLoggedIn ? (
          <section className="dashboard-shell">
          <div className="dashboard-toggle">
            <button
              type="button"
              className={`nav-btn ${dashboardRole === 'candidate' ? 'active' : ''}`}
              onClick={() => setDashboardRole('candidate')}
            >
              Candidate dashboard
            </button>
            <button
              type="button"
              className={`nav-btn ${dashboardRole === 'employer' ? 'active' : ''}`}
              onClick={() => setDashboardRole('employer')}
            >
              Employer dashboard
            </button>
          </div>

          {dashboardRole === 'candidate' ? (
            <div className="dashboard-grid">
              <form className="dashboard-card" onSubmit={handleProfileSubmit}>
                <h2>Build your candidate profile</h2>
                <label>
                  Full name
                  <input
                    value={candidateProfile.fullName}
                    onChange={(event) =>
                      setCandidateProfile((prev) => ({ ...prev, fullName: event.target.value }))
                    }
                    placeholder="Alex Morgan"
                  />
                </label>
                <label>
                  Email
                  <input
                    type="email"
                    value={candidateProfile.email}
                    onChange={(event) =>
                      setCandidateProfile((prev) => ({ ...prev, email: event.target.value }))
                    }
                    placeholder="alex@email.com"
                  />
                </label>
                <label>
                  Target role
                  <input
                    value={candidateProfile.title}
                    onChange={(event) =>
                      setCandidateProfile((prev) => ({ ...prev, title: event.target.value }))
                    }
                    placeholder="Product Designer"
                  />
                </label>
                <label>
                  Location
                  <input
                    value={candidateProfile.location}
                    onChange={(event) =>
                      setCandidateProfile((prev) => ({ ...prev, location: event.target.value }))
                    }
                    placeholder="London, UK"
                  />
                </label>
                <label>
                  Experience
                  <input
                    value={candidateProfile.experience}
                    onChange={(event) =>
                      setCandidateProfile((prev) => ({ ...prev, experience: event.target.value }))
                    }
                    placeholder="4 years"
                  />
                </label>
                <label>
                  Skills
                  <input
                    value={candidateProfile.skills}
                    onChange={(event) =>
                      setCandidateProfile((prev) => ({ ...prev, skills: event.target.value }))
                    }
                    placeholder="React, Figma, UX"
                  />
                </label>
                <label>
                  Short bio
                  <textarea
                    rows="3"
                    value={candidateProfile.bio}
                    onChange={(event) =>
                      setCandidateProfile((prev) => ({ ...prev, bio: event.target.value }))
                    }
                    placeholder="Tell employers what you want to build next"
                  />
                </label>
                <label>
                  Upload CV
                  <input type="file" accept=".pdf,.doc,.docx" onChange={handleCVUpload} />
                </label>
                <button type="submit" className="apply-btn">Save profile</button>
              </form>

              <div className="dashboard-card profile-preview">
                <h3>Candidate snapshot</h3>
                <p><strong>Name:</strong> {candidateProfile.fullName || 'Add your name'}</p>
                <p><strong>Role:</strong> {candidateProfile.title || 'Add your target role'}</p>
                <p><strong>Location:</strong> {candidateProfile.location || 'Add your city'}</p>
                <p><strong>Experience:</strong> {candidateProfile.experience || 'Add experience'}</p>
                <p><strong>Skills:</strong> {candidateProfile.skills || 'List your strengths'}</p>
                <p><strong>CV:</strong> {candidateProfile.cvName || 'No CV uploaded yet'}</p>
                <p className="muted">{candidateProfile.bio || 'Share a short bio to stand out.'}</p>
              </div>
            </div>
          ) : (
            <div className="dashboard-grid">
              <form className="dashboard-card" onSubmit={handleOfferSubmit}>
                <h2>Post a new offer</h2>
                <label>
                  Job title
                  <input
                    value={offerDraft.title}
                    onChange={(event) => setOfferDraft((prev) => ({ ...prev, title: event.target.value }))}
                    placeholder="Senior Frontend Engineer"
                  />
                </label>
                <label>
                  Company
                  <input
                    value={offerDraft.company}
                    onChange={(event) => setOfferDraft((prev) => ({ ...prev, company: event.target.value }))}
                    placeholder="Northstar Labs"
                  />
                </label>
                <label>
                  Location
                  <input
                    value={offerDraft.location}
                    onChange={(event) => setOfferDraft((prev) => ({ ...prev, location: event.target.value }))}
                    placeholder="Remote"
                  />
                </label>
                <label>
                  Type
                  <select
                    value={offerDraft.type}
                    onChange={(event) => setOfferDraft((prev) => ({ ...prev, type: event.target.value }))}
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                  </select>
                </label>
                <label>
                  Salary
                  <input
                    value={offerDraft.salary}
                    onChange={(event) => setOfferDraft((prev) => ({ ...prev, salary: event.target.value }))}
                    placeholder="$120k"
                  />
                </label>
                <label>
                  Description
                  <textarea
                    rows="4"
                    value={offerDraft.description}
                    onChange={(event) => setOfferDraft((prev) => ({ ...prev, description: event.target.value }))}
                    placeholder="Describe the role, stack, and what makes the team special"
                  />
                </label>
                <button type="submit" className="apply-btn">Publish offer</button>
              </form>

              <div className="dashboard-card">
                <h3>Applied notifications</h3>
                {applications.length === 0 ? (
                  <p className="muted">Applications will appear here as soon as candidates apply.</p>
                ) : (
                  applications.map((application) => (
                    <div key={application.id} className="notification-card">
                      <strong>{application.jobTitle}</strong>
                      <p>{application.company}</p>
                      <p>{application.applicantName} • {application.applicantEmail}</p>
                      <p>CV: {application.cvName}</p>
                      <span>{application.createdAt}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
          </section>
        ) : (
          <section className="login-card">
            <div className="login-card-head">
              <div>
                <p className="eyebrow">Access required</p>
                <h2>Please sign in first</h2>
              </div>
              <p className="login-tip">Dashboards remain hidden until authentication is completed.</p>
            </div>
            <button type="button" className="apply-btn" onClick={() => setView('dashboard')}>
              Go to login
            </button>
          </section>
        )
      )}
    </main>
  );
}

export default App;
