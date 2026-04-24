import "./style.css";

declare global {
  interface Window {
    showToast: (message: string, duration?: number) => void;
    checkProfileCompletion: () => Promise<void>;
  }
}

declare const google: any;

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// --- Helpers ---

window.showToast = (message: string, duration = 7000) => {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  toast.style.pointerEvents = 'auto';
  
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, duration);
};

window.checkProfileCompletion = async () => {
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const res = await fetch(`${API_BASE_URL}/api/profile/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await res.json();

    if (res.ok && !data.is_complete) {
      window.showToast("Please update your profile");
    }
  } catch (error) {
    console.error("Error checking profile status:", error);
  }
};

const appDiv = document.querySelector<HTMLDivElement>("#app");
if (appDiv) {
  appDiv.innerHTML = `
<header class="site-header" id="header">
  <div class="container nav-wrap">
    <a href="#home" class="brand">Planorae</a>
    
    <button class="menu-btn" id="menuBtn" aria-expanded="false" aria-label="Open menu">
      <span></span>
      <span></span>
      <span></span>
    </button>

    <nav class="site-nav" id="siteNav">
      <div class="nav-links">
        <a href="#about">About</a>
        <a href="#travel">Travel</a>
        <a href="#events">Events</a>
        <a href="#why">Why Us</a>
        <a href="#contact">Contact</a>
      </div>

      <div class="nav-actions">
        <div id="authLinks" class="auth-group">
          <button id="loginBtn" class="btn-link">Login</button>
          <button id="signupBtn" class="btn-link">Signup</button>
        </div>
        
        <div id="userMenu" class="user-group" style="display: none;">
          <span id="userNameDisplay" class="user-name"></span>
          <button id="profileBtn" class="btn-link">Profile</button>
          <button id="logoutBtn" class="btn-link">Logout</button>
        </div>

        <div id="contactActions" style="display: none;">
          <a class="cta-small whatsapp-btn" href="#" id="whatsappAction">Book on WhatsApp</a>
        </div>
      </div>
    </nav>
  </div>
</header>

<section class="hero" id="home">
  <div class="container hero-stage">
    <div class="hero-shell">
      <div class="hero-content-wrap">
        <p class="eyebrow">Premium travel and event planning</p>
        <h1 class="hero-brand-word">PLANORAE</h1>
        <h2 class="hero-tagline">Curated journeys and memorable celebrations, crafted with precision.</h2>



        <div class="hero-bottom-row">
          <p>300+ curated experiences delivered with direct support.</p>
          <p>Travel planning, events, stays, activities, and full coordination.</p>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="about section poster-coral" id="about">
  <div class="container">
    <p class="section-label">About Planorae</p>
    <h2>We manage the complexity. You enjoy the experience.</h2>
    <div class="grid three">
      <article class="card">
        <h3>Smart Group Travel</h3>
        <p>We create balanced groups and build itineraries around comfort, interests, and budget.</p>
      </article>
      <article class="card">
        <h3>Event Specialists</h3>
        <p>From private celebrations to milestone events, we handle planning, coordination, and flow.</p>
      </article>
      <article class="card">
        <h3>Direct Human Support</h3>
        <p>No bots. No ticket loops. Speak directly to planners via WhatsApp or phone call.</p>
      </article>
    </div>
  </div>
</section>

<section class="travel section poster-teal" id="travel">
  <div class="container">
    <p class="section-label">Popular Destinations</p>
    <h2>Designed for comfort, adventure, and seamless coordination.</h2>
    <div class="grid three travel-grid">
      <article class="travel-card goa"><h3>Goa</h3><p>Beach | Leisure | Nightlife</p><span>Starting ₹8,999</span><button class="join-group-btn" data-dest="Goa">Join Smart Group</button></article>
      <article class="travel-card manali"><h3>Manali</h3><p>Snow | Adventure | Nature</p><span>Starting ₹10,499</span><button class="join-group-btn" data-dest="Manali">Join Smart Group</button></article>
      <article class="travel-card andaman"><h3>Andaman</h3><p>Diving | Island Trails | Premium Stay</p><span>Starting ₹14,999</span><button class="join-group-btn" data-dest="Andaman">Join Smart Group</button></article>
      <article class="travel-card rajasthan"><h3>Rajasthan</h3><p>Culture | Heritage | Luxury</p><span>Starting ₹12,499</span><button class="join-group-btn" data-dest="Rajasthan">Join Smart Group</button></article>
      <article class="travel-card kerala"><h3>Kerala</h3><p>Backwaters | Wellness | Slow Travel</p><span>Starting ₹9,999</span><button class="join-group-btn" data-dest="Kerala">Join Smart Group</button></article>
      <article class="travel-card coorg"><h3>Coorg</h3><p>Nature | Retreat | Coffee Trails</p><span>Starting ₹8,499</span><button class="join-group-btn" data-dest="Coorg">Join Smart Group</button></article>
    </div>
  </div>
</section>

<section class="events section poster-coral" id="events">
  <div class="container">
    <p class="section-label">Events We Plan</p>
    <h2>Elegant planning for celebrations of every scale.</h2>
    <div class="grid five">
      <article class="event-card"><h3>Birthday Celebrations</h3><p>Theme, venue, experience flow, and on-ground support.</p></article>
      <article class="event-card"><h3>Wedding Functions</h3><p>Structured planning for ceremonies, guest experience, and logistics.</p></article>
      <article class="event-card"><h3>Bachelor Weekends</h3><p>Stylish, high-energy, and smoothly coordinated group experiences.</p></article>
      <article class="event-card"><h3>Campus Events</h3><p>Freshers and farewell formats built for engagement and memories.</p></article>
      <article class="event-card"><h3>Custom Events</h3><p>Tailored concepts designed around your audience and objective.</p></article>
    </div>
  </div>
</section>

<section class="why section poster-teal" id="why">
  <div class="container">
    <p class="section-label">Why Choose Planorae</p>
    <h2>Reliable planning, measurable results, exceptional experiences.</h2>
    <div class="grid four stats">
      <article class="stat"><strong data-count="50">0</strong><span>Destinations</span></article>
      <article class="stat"><strong data-count="500">0</strong><span>Happy Travelers</span></article>
      <article class="stat"><strong data-count="200">0</strong><span>Events Delivered</span></article>
      <article class="stat"><strong data-count="4.9">0</strong><span>Average Rating</span></article>
    </div>
  </div>
</section>

<section class="contact section" id="contact">
  <div class="container contact-wrap">
    <div>
      <p class="section-label">Book Now</p>
      <h2>Ready to plan a polished, stress-free travel or event experience?</h2>
      <p>Connect with our team and we will create a custom plan for your dates, budget, and goals.</p>
    </div>
    <div class="contact-actions" id="contactActions">
      <a class="btn btn-secondary" href="tel:+919876543210">Call +91 98765 43210</a>
    </div>
  </div>
</section>

<footer class="site-footer">
  <div class="container footer-wrap">
    <div>
      <a href="#home" class="brand footer-brand">Planorae</a>
      <p>Travel Together. Live Better.</p>
    </div>
    <p>© 2025 Planorae. All rights reserved.</p>
  </div>
</footer>

<div id="toastContainer" style="position: fixed; bottom: 2rem; right: 2rem; z-index: 2000; pointer-events: none;"></div>

<div id="authModal" class="modal">
  <div class="modal-content">
    <span class="close-auth-modal">&times;</span>
    <div id="loginFormSection">
      <h2>Login</h2>
      <form id="loginForm">
        <div class="form-group">
          <label>Email</label>
          <input type="email" id="loginEmail" required>
        </div>
        <div class="form-group">
          <label>Password</label>
          <input type="password" id="loginPassword" placeholder="Password" required>
        </div>
        <div id="loginError" class="error-message" style="display: none; margin-bottom: 1rem;"></div>
        <button type="submit" class="btn btn-primary">Login</button>
      </form>
      <div style="text-align: center; margin-top: 1rem;">
        <a href="#" id="forgotPasswordLink" style="color: var(--crimson); font-size: 0.9rem;">Forgot Password?</a>
      </div>
      <div class="or-divider">OR</div>
      <div id="googleLoginBtn"></div>
      <div id="googleLoginError" class="error-message" style="display: none; margin-top: 1rem;"></div>
    </div>
    <div id="signupFormSection" style="display: none;">
      <h2>Signup</h2>
      <form id="signupForm">
        <div class="form-group">
          <label>Username</label>
          <input type="text" id="signupUsername" required>
        </div>
        <div class="form-group">
          <label>Email</label>
          <input type="email" id="signupEmail" required>
        </div>
        <div class="form-group">
          <label>Password</label>
          <input type="password" id="signupPassword" placeholder="8+ chars, Up/Low, Num, Special" required>
        </div>
        <div id="passwordRequirements" style="margin-top: 0.5rem; font-size: 0.85rem;">
          <div class="req-item" id="req-length"><span class="req-checkbox">☐</span> At least 8 characters</div>
          <div class="req-item" id="req-lowercase"><span class="req-checkbox">☐</span> Contains lowercase letter</div>
          <div class="req-item" id="req-uppercase"><span class="req-checkbox">☐</span> Contains uppercase letter</div>
          <div class="req-item" id="req-number"><span class="req-checkbox">☐</span> Contains a number</div>
          <div class="req-item" id="req-special"><span class="req-checkbox">☐</span> Contains special character (_@$!%*#?&)</div>
        </div>
        <div id="signupError" class="error-message" style="display: none; margin-top: 1rem;"></div>
        <button type="submit" class="btn btn-primary">Signup</button>
      </form>
    </div>
    <div id="otpSection" style="display: none;">
      <h2 style="margin-bottom: 1.5rem; text-align: center;">Verify OTP</h2>
      <p style="text-align: center; margin-bottom: 1rem;">Check your email for the verification code.</p>
      <form id="otpForm">
        <input type="text" id="otpValue" placeholder="Enter 6-digit OTP" required style="width: 100%; padding: 0.8rem; margin-bottom: 1rem; border: 1px solid #ddd; border-radius: 8px;">
        <button type="submit" class="btn btn-primary">Verify OTP</button>
      </form>
    </div>

    <div id="forgotPasswordSection" style="display: none;">
      <h2 style="margin-bottom: 1.5rem; text-align: center;">Reset Password</h2>
      <p style="text-align: center; margin-bottom: 1rem;">Enter your email to receive a reset code.</p>
      <form id="forgotPasswordForm">
        <input type="email" id="resetEmail" placeholder="Email" required style="width: 100%; padding: 0.8rem; margin-bottom: 1rem; border: 1px solid #ddd; border-radius: 8px;">
        <div id="forgotError" class="error-message" style="display: none; margin-bottom: 1rem;"></div>
        <button type="submit" class="btn btn-primary">Send Reset OTP</button>
      </form>
      <div style="text-align: center; margin-top: 1rem;">
        <a href="#" class="back-to-login" style="color: #666; font-size: 0.9rem;">Back to Login</a>
      </div>
    </div>

    <div id="resetPasswordSection" style="display: none;">
      <h2 style="margin-bottom: 1.5rem; text-align: center;">New Password</h2>
      <form id="resetPasswordForm">
        <input type="text" id="resetOtpValue" placeholder="OTP from Email" required style="width: 100%; padding: 0.8rem; margin-bottom: 1rem; border: 1px solid #ddd; border-radius: 8px;">
        <input type="password" id="newPassword" placeholder="New Password" required style="width: 100%; padding: 0.8rem; margin-bottom: 1rem; border: 1px solid #ddd; border-radius: 8px;">
        <div id="newPasswordRequirements" style="margin-top: 0.5rem; font-size: 0.85rem;">
          <div class="req-item" id="new-req-length"><span class="req-checkbox">☐</span> At least 8 characters</div>
          <div class="req-item" id="new-req-lowercase"><span class="req-checkbox">☐</span> Contains lowercase letter</div>
          <div class="req-item" id="new-req-uppercase"><span class="req-checkbox">☐</span> Contains uppercase letter</div>
          <div class="req-item" id="new-req-number"><span class="req-checkbox">☐</span> Contains a number</div>
          <div class="req-item" id="new-req-special"><span class="req-checkbox">☐</span> Contains special character (_@$!%*#?&)</div>
        </div>
        <div id="resetError" class="error-message" style="display: none; margin-top: 1rem;"></div>
        <button type="submit" class="btn btn-primary">Reset Password</button>
      </form>
    </div>
  </div>
</div>
`;

const header = document.getElementById("header") as HTMLElement;
const menuBtn = document.getElementById("menuBtn") as HTMLButtonElement;
const siteNav = document.getElementById("siteNav") as HTMLElement;

// --- Auth Elements ---
const authModal = document.getElementById("authModal");
const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");
const logoutBtn = document.getElementById("logoutBtn");
const profileBtn = document.getElementById("profileBtn");
const closeAuthModal = document.querySelector(".close-auth-modal") as HTMLElement;
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const loginFormSection = document.getElementById("loginFormSection");
const signupFormSection = document.getElementById("signupFormSection");
const otpForm = document.getElementById("otpForm");
const authLinks = document.getElementById("authLinks");
const userMenu = document.getElementById("userMenu");
const userNameDisplay = document.getElementById("userNameDisplay");
const contactActions = document.getElementById("contactActions");
const whatsappAction = document.getElementById("whatsappAction") as HTMLAnchorElement;


let signupEmail = "";
let inactivityTimer: any;

// --- Helpers ---

const validateEmail = (email: string) => {
  return String(email)
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
};

const validatePassword = (password: string) => {
  if (password.length < 8) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  if (!/[_@$!%*#?&]/.test(password)) return false;
  return true;
};

const updatePasswordRequirements = (password: string, prefix: string) => {
  const requirements = [
    { id: `${prefix}-length`, met: password.length >= 8 },
    { id: `${prefix}-lowercase`, met: /[a-z]/.test(password) },
    { id: `${prefix}-uppercase`, met: /[A-Z]/.test(password) },
    { id: `${prefix}-number`, met: /[0-9]/.test(password) },
    { id: `${prefix}-special`, met: /[_@$!%*#?&]/.test(password) }
  ];
  
  requirements.forEach(req => {
    const el = document.getElementById(req.id);
    if (el) {
      const checkbox = el.querySelector('.req-checkbox');
      if (checkbox) {
        checkbox.textContent = req.met ? '☑' : '☐';
      }
      el.style.color = req.met ? 'green' : '#666';
    }
  });
};

const signupPasswordInput = document.getElementById("signupPassword") as HTMLInputElement;
if (signupPasswordInput) {
  signupPasswordInput.addEventListener("input", (e) => {
    const target = e.target as HTMLInputElement;
    updatePasswordRequirements(target.value, "req");
  });
}

const newPasswordInput = document.getElementById("newPassword") as HTMLInputElement;
if (newPasswordInput) {
  newPasswordInput.addEventListener("input", (e) => {
    const target = e.target as HTMLInputElement;
    updatePasswordRequirements(target.value, "new-req");
  });
}

// --- Inactivity Timer ---
const resetInactivityTimer = () => {
  clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(() => {
    handleLogout();
    window.showToast("Logged out due to inactivity.");
  }, 15 * 60 * 1000); // 15 minutes
};

['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(name => {
  document.addEventListener(name, resetInactivityTimer, true);
});

// --- Auth Functions ---
const updateUI = () => {
  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username');
  if (token && username) {
    if (authLinks) authLinks.style.display = 'none';
    if (userMenu) userMenu.style.display = 'flex';
    if (userNameDisplay) userNameDisplay.textContent = `Hi, ${username}`;
    if (contactActions) contactActions.style.display = 'flex'; // Show phone number when logged in
    if (whatsappAction) {
      whatsappAction.href = "https://wa.me/919876543210?text=Hi%20Planorae%2C%20I%20am%20logged%20in%20and%20ready%20to%20plan!";
      whatsappAction.onclick = null; // Remove click handler if logged in
    }
    if (authModal) authModal.style.display = "none"; // Hide modal if logged in
    window.checkProfileCompletion(); // Check profile completion on UI update
  } else {
    if (authLinks) authLinks.style.display = 'flex';
    if (userMenu) userMenu.style.display = 'none';
    if (userNameDisplay) userNameDisplay.textContent = ''; // Clear username display
    if (contactActions) contactActions.style.display = 'none'; // Hide phone number when not logged in
    if (whatsappAction) {
      whatsappAction.href = "#"; // Set href to # when not logged in
      whatsappAction.onclick = (e) => {
        e.preventDefault();
        window.showToast("Please login to contact us on WhatsApp.");
        if (authModal) authModal.style.display = "flex";
      };
    }
  }
};

const handleLogout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  updateUI();
};

updateUI();

// Initialize Google Login
const initGoogleLogin = () => {
  const googleBtn = document.getElementById("googleLoginBtn");
  if (!googleBtn) return; // Skip if element doesn't exist (e.g. on profile page)

  if (typeof google === 'undefined') {
    setTimeout(initGoogleLogin, 500);
    return;
  }
  
  google.accounts.id.initialize({
    client_id: "211759704949-joi9k2u9l18dhpn54i55kn39qt4rodub.apps.googleusercontent.com",
    callback: handleGoogleCallback
  });
  
  google.accounts.id.renderButton(
    googleBtn,
    { theme: "outline", size: "large", width: "100%" }
  );
};

const handleGoogleCallback = async (response: any) => {
  const googleLoginErrorDiv = document.getElementById('googleLoginError') as HTMLElement;
  if (googleLoginErrorDiv) googleLoginErrorDiv.style.display = 'none';
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: response.credential })
    });
    
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('username', data.username);
      if (authModal) authModal.style.display = "none";
      updateUI();
      window.showToast(`Welcome back, ${data.username}!`);
    } else {
      if (googleLoginErrorDiv) {
        googleLoginErrorDiv.textContent = data.message || "Google login failed";
        googleLoginErrorDiv.style.display = 'block';
      }
    }
  } catch (error) {
    console.error("Google login error:", error);
    if (googleLoginErrorDiv) {
      googleLoginErrorDiv.textContent = "Could not connect to the server.";
      googleLoginErrorDiv.style.display = 'block';
    }
  }
};

initGoogleLogin();

if (loginBtn) {
  loginBtn.onclick = () => {
    if (authModal) authModal.style.display = "flex";
    if (loginFormSection) loginFormSection.style.display = "block";
    if (signupFormSection) signupFormSection.style.display = "none";
    const otpSection = document.getElementById("otpSection");
    if (otpSection) otpSection.style.display = "none";
  };
}

const openLogin = () => {
  authModal.style.display = "flex";
  loginFormSection.style.display = "block";
  signupFormSection.style.display = "none";
  document.getElementById("otpSection")!.style.display = "none";
};

const openSignup = () => {
  authModal.style.display = "flex";
  loginFormSection.style.display = "none";
  signupFormSection.style.display = "block";
  document.getElementById("otpSection")!.style.display = "none";
};

window.addEventListener('hashchange', () => {
  if (window.location.hash === '#login') {
    openLogin();
    history.replaceState(null, "", window.location.pathname + window.location.search);
  }
  if (window.location.hash === '#signup') {
    openSignup();
    history.replaceState(null, "", window.location.pathname + window.location.search);
  }
});

if (window.location.hash === '#login') {
  openLogin();
  history.replaceState(null, "", window.location.pathname + window.location.search);
}
if (window.location.hash === '#signup') {
  openSignup();
  history.replaceState(null, "", window.location.pathname + window.location.search);
}

signupBtn.onclick = () => {
  authModal.style.display = "flex";
  loginFormSection.style.display = "none";
  signupFormSection.style.display = "block";
  document.getElementById("otpSection")!.style.display = "none";
};

profileBtn.onclick = () => {
  window.location.href = 'src/profile.html';
};

logoutBtn.onclick = handleLogout;
closeAuthModal.onclick = () => {
  authModal.style.display = "none";
};

signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  console.log("Signup form submitted");
  const submitBtn = signupForm.querySelector('button[type="submit"]') as HTMLButtonElement;
  const originalBtnText = submitBtn.textContent;
  const errorDiv = document.getElementById('signupError') as HTMLElement;
  
  try {
    submitBtn.disabled = true;
    submitBtn.textContent = "Signing up...";
    errorDiv.style.display = 'none';
    
    const username = (document.getElementById("signupUsername") as HTMLInputElement).value;
    const email = (document.getElementById("signupEmail") as HTMLInputElement).value;
    const password = (document.getElementById("signupPassword") as HTMLInputElement).value;

    if (!validateEmail(email)) {
      errorDiv.textContent = "Please enter a valid email address.";
      errorDiv.style.display = 'block';
      return;
    }

    if (!validatePassword(password)) {
      errorDiv.textContent = "Password does not meet all requirements. Please check the boxes below.";
      errorDiv.style.display = 'block';
      return;
    }

    signupEmail = email;

    console.log("Sending signup request to backend...");
    const res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    
    const data = await res.json();
    console.log("Signup response:", data);
    
    if (res.ok) {
      errorDiv.textContent = data.message;
      errorDiv.style.display = 'block';
      errorDiv.style.color = 'green';
      signupFormSection.style.display = "none";
      document.getElementById("otpSection")!.style.display = "block";
    } else {
      errorDiv.textContent = data.message || "Signup failed";
      errorDiv.style.display = 'block';
    }
  } catch (error) {
    console.error("Signup error:", error);
    errorDiv.textContent = "Could not connect to the server. Please ensure the backend is running.";
    errorDiv.style.display = 'block';
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalBtnText;
  }
});

otpForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const submitBtn = otpForm.querySelector('button[type="submit"]') as HTMLButtonElement;
  const originalBtnText = submitBtn.textContent;
  const otpErrorDiv = document.getElementById('otpError') as HTMLElement;
  if (!otpErrorDiv) {
    const newErrorDiv = document.createElement('div');
    newErrorDiv.id = 'otpError';
    newErrorDiv.className = 'error-message';
    newErrorDiv.style.display = 'none';
    newErrorDiv.style.marginTop = '1rem';
    otpForm.appendChild(newErrorDiv);
  }
  
  try {
    submitBtn.disabled = true;
    submitBtn.textContent = "Verifying...";
    otpErrorDiv.style.display = 'none';
    
    const otp = (document.getElementById("otpValue") as HTMLInputElement).value;
    const res = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: signupEmail, otp })
    });
    
    const data = await res.json();
    if (res.ok) {
      otpErrorDiv.textContent = data.message;
      otpErrorDiv.style.color = 'green';
      otpErrorDiv.style.display = 'block';
      document.getElementById("otpSection")!.style.display = "none";
      document.getElementById("loginFormSection")!.style.display = "block";
    } else {
      otpErrorDiv.textContent = data.message || "Verification failed";
      otpErrorDiv.style.display = 'block';
    }
  } catch (error) {
    console.error("OTP error:", error);
    otpErrorDiv.textContent = "Could not connect to the server.";
    otpErrorDiv.style.display = 'block';
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalBtnText;
  }
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const submitBtn = loginForm.querySelector('button[type="submit"]') as HTMLButtonElement;
  const originalBtnText = submitBtn.textContent;
  const errorDiv = document.getElementById('loginError') as HTMLElement;
  
  try {
    submitBtn.disabled = true;
    submitBtn.textContent = "Logging in...";
    errorDiv.style.display = 'none';
    
    const email = (document.getElementById("loginEmail") as HTMLInputElement).value;
    const password = (document.getElementById("loginPassword") as HTMLInputElement).value;

    if (!validateEmail(email)) {
      errorDiv.textContent = "Please enter a valid email address.";
      errorDiv.style.display = 'block';
      return;
    }

    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('username', data.username);
      updateUI();
      authModal.style.display = "none";
      
      // Check profile completion status after login
      await window.checkProfileCompletion();
    } else {
      errorDiv.textContent = data.message || "Login failed";
      errorDiv.style.display = 'block';
    }
  } catch (error) {
    console.error("Login error:", error);
    errorDiv.textContent = "Could not connect to the server.";
    errorDiv.style.display = 'block';
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalBtnText;
  }
});

const forgotPasswordForm = document.getElementById("forgotPasswordForm") as HTMLFormElement;
const resetPasswordForm = document.getElementById("resetPasswordForm") as HTMLFormElement;
const forgotPasswordLink = document.getElementById("forgotPasswordLink") as HTMLElement;

let resetEmail = "";

forgotPasswordLink.onclick = (e) => {
  e.preventDefault();
  loginFormSection.style.display = "none";
  document.getElementById("forgotPasswordSection")!.style.display = "block";
};

document.querySelectorAll(".back-to-login").forEach(btn => {
  (btn as HTMLElement).onclick = (e) => {
    e.preventDefault();
    document.getElementById("forgotPasswordSection")!.style.display = "none";
    loginFormSection.style.display = "block";
  };
});

forgotPasswordForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const submitBtn = forgotPasswordForm.querySelector('button[type="submit"]') as HTMLButtonElement;
  const originalBtnText = submitBtn.textContent;
  const errorDiv = document.getElementById('forgotError') as HTMLElement;
  
  try {
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending...";
    errorDiv.style.display = 'none';
    
    resetEmail = (document.getElementById("resetEmail") as HTMLInputElement).value;

    if (!validateEmail(resetEmail)) {
      errorDiv.textContent = "Please enter a valid email address.";
      errorDiv.style.display = 'block';
      return;
    }

    const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: resetEmail })
    });
    
    const data = await res.json();
    if (res.ok) {
      errorDiv.textContent = data.message;
      errorDiv.style.color = 'green';
      errorDiv.style.display = 'block';
      document.getElementById("forgotPasswordSection")!.style.display = "none";
      document.getElementById("resetPasswordSection")!.style.display = "block";
    } else {
      errorDiv.textContent = data.message || "Failed to send reset OTP";
      errorDiv.style.display = 'block';
    }
  } catch (error) {
    console.error("Forgot password error:", error);
    errorDiv.textContent = "Could not connect to the server.";
    errorDiv.style.display = 'block';
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalBtnText;
  }
});

resetPasswordForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const submitBtn = resetPasswordForm.querySelector('button[type="submit"]') as HTMLButtonElement;
  const originalBtnText = submitBtn.textContent;
  const errorDiv = document.getElementById('resetError') as HTMLElement;
  
  try {
    submitBtn.disabled = true;
    submitBtn.textContent = "Resetting...";
    errorDiv.style.display = 'none';
    
    const otp = (document.getElementById("resetOtpValue") as HTMLInputElement).value;
    const password = (document.getElementById("newPassword") as HTMLInputElement).value;

    if (!validatePassword(password)) {
      errorDiv.textContent = "Password does not meet all requirements. Please check the boxes below.";
      errorDiv.style.display = 'block';
      return;
    }

    const res = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: resetEmail, otp, password })
    });
    
    const data = await res.json();
    if (res.ok) {
      errorDiv.textContent = data.message;
      errorDiv.style.color = 'green';
      errorDiv.style.display = 'block';
      document.getElementById("resetPasswordSection")!.style.display = "none";
      loginFormSection.style.display = "block";
    } else {
      errorDiv.textContent = data.message || "Reset failed";
      errorDiv.style.display = 'block';
    }
  } catch (error) {
    console.error("Reset password error:", error);
    errorDiv.textContent = "Could not connect to the server.";
    errorDiv.style.display = 'block';
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalBtnText;
  }
});





menuBtn.addEventListener("click", () => {
  const isOpen = document.body.classList.toggle("menu-open");
  menuBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
});

siteNav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    document.body.classList.remove("menu-open");
    menuBtn.setAttribute("aria-expanded", "false");
  });
});

window.addEventListener("scroll", () => {
  header.classList.toggle("scrolled", window.scrollY > 12);
});

const statEls = document.querySelectorAll<HTMLElement>("[data-count]");
const statObserver = new IntersectionObserver(
  (entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const targetEl = entry.target as HTMLElement;
      const raw = targetEl.dataset.count ?? "0";
      const target = Number(raw);
      const decimal = raw.includes(".");
      const totalSteps = 42;
      const stepMs = 28;
      let step = 0;
      const timer = setInterval(() => {
        step += 1;
        const value = (target / totalSteps) * step;
        if (step >= totalSteps) {
          targetEl.textContent = decimal ? target.toFixed(1) : `${Math.round(target)}+`;
          clearInterval(timer);
          return;
        }
        targetEl.textContent = decimal ? value.toFixed(1) : `${Math.floor(value)}+`;
      }, stepMs);
      obs.unobserve(targetEl);
    });
  },
  { threshold: 0.45 }
);

statEls.forEach((el) => { statObserver.observe(el); });
} // End if (appDiv)

