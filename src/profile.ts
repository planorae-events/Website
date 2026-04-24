declare global {
  interface Window {
    showToast: (message: string, duration?: number) => void;
    checkProfileCompletion: () => Promise<void>;
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const profileForm = document.getElementById("profileForm") as HTMLFormElement;
  const profilePageTitle = document.getElementById('profilePageTitle') as HTMLElement;
  const profilePageSubtitle = document.getElementById('profilePageSubtitle') as HTMLElement;

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const fields = [
    'interests', 
    'travelStyle', 
    'budget', 
    'hobbies', 
    'gender', 
    'drinkingPreference', 
    'smokingPreference'
  ];

  // --- Auth UI Sync for Profile Page ---
  const updateProfileUI = () => {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    const authLinks = document.getElementById('authLinks');
    const userMenu = document.getElementById('userMenu');
    const userNameDisplay = document.getElementById('userNameDisplay');
    const contactActions = document.getElementById('contactActions');
    const whatsappAction = document.getElementById('whatsappAction') as HTMLAnchorElement;

    if (token && username && authLinks && userMenu && userNameDisplay && contactActions && whatsappAction) {
      authLinks.style.display = 'none';
      userMenu.style.display = 'flex';
      userNameDisplay.textContent = `Hi, ${username}`;
      contactActions.style.display = 'flex';
      whatsappAction.href = "https://wa.me/919876543210?text=Hi%20Planorae%2C%20I%20am%20logged%20in%20and%20ready%20to%20plan!";
    } else if (authLinks && userMenu && contactActions && whatsappAction) {
      authLinks.style.display = 'flex';
      userMenu.style.display = 'none';
      contactActions.style.display = 'none';
      whatsappAction.href = "#";
      whatsappAction.onclick = (e) => {
        e.preventDefault();
        window.showToast("Please login to contact us on WhatsApp.");
        window.location.href = '/#login';
      };
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    window.location.href = '/';
  };

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.onclick = handleLogout;
  }

  updateProfileUI();

  // --- Header Scroll Logic ---
  const header = document.getElementById("header") as HTMLElement;
  if (header) {
    window.addEventListener("scroll", () => {
      header.classList.toggle("scrolled", window.scrollY > 12);
    });
  }

  // --- Menu Toggle for Profile Page ---
  const menuBtn = document.getElementById("menuBtn") as HTMLButtonElement;
  if (menuBtn) {
    menuBtn.addEventListener("click", () => {
      const isOpen = document.body.classList.toggle("menu-open");
      menuBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
  }

  const updateStrengthMeter = () => {
    const profileData: any = {
      interests: (document.getElementById("interests") as HTMLInputElement)?.value,
      travel_style: (document.getElementById("travelStyle") as HTMLSelectElement)?.value,
      budget_range: (document.getElementById("budget") as HTMLInputElement)?.value,
      hobbies: (document.getElementById("hobbies") as HTMLInputElement)?.value,
      gender: (document.getElementById("gender") as HTMLSelectElement)?.value,
      drinking_preference: (document.getElementById("drinkingPreference") as HTMLSelectElement)?.value,
      smoking_preference: (document.getElementById("smokingPreference") as HTMLSelectElement)?.value,
    };

    const keys = Object.keys(profileData);
    const completedFields = keys.filter(f => profileData[f] && profileData[f].trim().length > 0).length;
    const percentage = Math.round((completedFields / keys.length) * 100);
    
    const meterFill = document.querySelector('.meter-fill') as HTMLElement;
    const strengthText = document.querySelector('.strength-meter p') as HTMLElement;
    
    if (meterFill && strengthText) {
      meterFill.style.width = `${percentage}%`;
      if (percentage === 0) strengthText.textContent = 'Not Started';
      else if (percentage < 30) strengthText.textContent = 'Beginner';
      else if (percentage < 70) strengthText.textContent = 'Intermediate';
      else if (percentage < 100) strengthText.textContent = 'Advanced';
      else strengthText.textContent = 'All Star';
    }
  };

  // Add real-time listeners for strength meter
  fields.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', updateStrengthMeter);
      el.addEventListener('change', updateStrengthMeter);
    }
  });

  const loadProfileData = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.showToast("Please login first.");
      window.location.href = '/';
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        cache: 'no-store'
      });

      if (res.ok) {
        const data = await res.json();
        console.log("Loaded profile data:", data);
        
        const hasData = Object.values(data).some(v => v && String(v).trim().length > 0);

        if (hasData) {
          profilePageTitle.textContent = 'Update Your Travel Profile';
          profilePageSubtitle.textContent = 'Modify your details anytime to keep your profile up to date.';
        } else {
          profilePageTitle.textContent = 'Create Your Travel Profile';
          profilePageSubtitle.textContent = 'Fill in your details to help us find the perfect travel group for you.';
        }

        if (document.getElementById("interests")) (document.getElementById("interests") as HTMLInputElement).value = data.interests || '';
        if (document.getElementById("travelStyle")) (document.getElementById("travelStyle") as HTMLSelectElement).value = data.travel_style || '';
        if (document.getElementById("budget")) (document.getElementById("budget") as HTMLInputElement).value = data.budget_range || '';
        if (document.getElementById("hobbies")) (document.getElementById("hobbies") as HTMLInputElement).value = data.hobbies || '';
        if (document.getElementById("gender")) (document.getElementById("gender") as HTMLSelectElement).value = data.gender || '';
        if (document.getElementById("drinkingPreference")) (document.getElementById("drinkingPreference") as HTMLSelectElement).value = data.drinking_preference || '';
        if (document.getElementById("smokingPreference")) (document.getElementById("smokingPreference") as HTMLSelectElement).value = data.smoking_preference || '';
        
        updateStrengthMeter();
      } else if (res.status === 401) {
        window.showToast("Session expired. Please login again.");
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        window.location.href = '/';
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  profileForm.onsubmit = async (e) => {
    e.preventDefault();

    const profileData = {
      interests: (document.getElementById("interests") as HTMLInputElement).value,
      travel_style: (document.getElementById("travelStyle") as HTMLSelectElement).value,
      budget_range: (document.getElementById("budget") as HTMLInputElement).value,
      hobbies: (document.getElementById("hobbies") as HTMLInputElement).value,
      gender: (document.getElementById("gender") as HTMLSelectElement).value,
      drinking_preference: (document.getElementById("drinkingPreference") as HTMLSelectElement).value,
      smoking_preference: (document.getElementById("smokingPreference") as HTMLSelectElement).value,
    };

    const token = localStorage.getItem('token');
    if (!token) {
      window.showToast("Please login first.");
      window.location.href = '/';
      return;
    }

    try {
      const profileRes = await fetch(`${API_BASE_URL}/api/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });

      if (!profileRes.ok) {
        const errorData = await profileRes.json();
        window.showToast(errorData.message || "Failed to update profile.");
        return;
      }

      window.showToast("Profile saved successfully!");
      
      // Update UI state without redirecting
      profilePageTitle.textContent = 'Update Your Travel Profile';
      profilePageSubtitle.textContent = 'Modify your details anytime to keep your profile up to date.';
      
      if (window.checkProfileCompletion) {
        await window.checkProfileCompletion();
      }
      
      updateStrengthMeter();

    } catch (error) {
      console.error("Error:", error);
      window.showToast("Connection error. Is the server running?");
    }
  };

  // Initial load
  await loadProfileData();
});