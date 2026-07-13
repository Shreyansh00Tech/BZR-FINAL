/* ==========================================================================
   BZR HOMES — MAIN JAVASCRIPT WITH LIVE WEB3FORMS NOTIFICATION
   ========================================================================== */
'use strict';

// Web3Forms Access Key Linked Successfully
const WEB3FORMS_ACCESS_KEY = "3eae7367-7a3d-4220-a1f2-fa63970c84bd";

/* ---- SCROLL PROGRESS ---- */
const scrollProgress = document.querySelector('.scroll-progress');
function updateScrollProgress() {
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = docHeight > 0 ? window.scrollY / docHeight : 0;
  if (scrollProgress) scrollProgress.style.width = `${progress * 100}%`;
}

/* ---- INTERACTIVE ACCORDION FAQ ---- */
document.querySelectorAll('.accordion-trigger').forEach(trigger => {
  trigger.addEventListener('click', () => {
    const parent = trigger.parentElement;
    const isOpen = parent.classList.contains('open-state');
    
    // Close all other accordions
    document.querySelectorAll('.accordion-item').forEach(item => {
      item.classList.remove('open-state');
      const icon = item.querySelector('.fa-minus');
      if (icon) {
        icon.classList.replace('fa-minus', 'fa-plus');
      }
    });

    if (!isOpen) {
      parent.classList.add('open-state');
      const icon = trigger.querySelector('.fa-plus');
      if (icon) icon.classList.replace('fa-plus', 'fa-minus');
    }
  });
});

/* ---- SMOOTH ANCHOR SCROLLING ---- */
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', (e) => {
    const id = link.getAttribute('href');
    if (id === '#') return;
    const target = document.querySelector(id);
    if (target) {
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});

/* ---- LIVE SERVERLESS FORM INTEGRATION ---- */
const enquiryForm = document.getElementById('enquiryForm');

if (enquiryForm) {
  enquiryForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = enquiryForm.querySelector('.submit-btn');
    const originalTxt = submitBtn.innerHTML;
    
    // Activate loading state spinner grid
    submitBtn.innerHTML = 'Transmitting...';
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.7';

    // Map input selectors correctly
    const name = document.getElementById('name')?.value.trim();
    const phone = document.getElementById('phone')?.value.trim();
    const email = document.getElementById('email')?.value.trim();
    const property = document.getElementById('property')?.value;
    const message = document.getElementById('message')?.value.trim();
    const appointmentDate = document.getElementById('date')?.value;
    const appointmentTime = document.getElementById('time')?.value;

    // Structure raw multi-part payload for direct processing
    const formData = new FormData();
    formData.append("access_key", WEB3FORMS_ACCESS_KEY);
    formData.append("subject", "🔥 New Luxury Suite Lead - Blue Zone Residency");
    formData.append("from_name", "BZR Lead Engine");
    formData.append("Name", name);
    formData.append("Phone Number", phone);
    formData.append("Email ID", email);
    formData.append("Selected Configuration", property);
    formData.append("Preferred Date", appointmentDate);
    formData.append("Preferred Time", appointmentTime);
    formData.append("Custom Request Note", message);

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        document.getElementById('successModal').classList.add('display-state');
        enquiryForm.reset();
      } else {
        throw new Error(result.message || 'Transmission registry failed');
      }
    } catch (error) {
      console.error('API Webhook Error:', error);
      document.getElementById('errorModal').classList.add('display-state');
    } finally {
      // Revert submit control matrix parameters
      submitBtn.innerHTML = originalTxt;
      submitBtn.disabled = false;
      submitBtn.style.opacity = '1';
    }
  });
}

/* ---- MODAL CLOSE MANAGEMENT ---- */
window.closeModal = function(modalId) {
  document.getElementById(modalId).classList.remove('display-state');
};

/* ---- UTILITY SCROLL EVENTS THROTTLING ---- */
let ticking = false;
window.addEventListener('scroll', () => {
  if (!ticking) {
    window.requestAnimationFrame(() => {
      updateScrollProgress();
      
      // Toggle top anchor arrow node visibility state
      const scrollTopBtn = document.getElementById('scrollTopBtn');
      if (scrollTopBtn) {
        scrollTopBtn.classList.toggle('active-state', window.scrollY > 400);
      }
      ticking = false;
    });
    ticking = true;
  }
}, { passive: true });

// Top anchor click handler
const scrollTopBtn = document.getElementById('scrollTopBtn');
if (scrollTopBtn) {
  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}