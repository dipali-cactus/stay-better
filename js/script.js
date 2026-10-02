// Stay Better Interactive JavaScript
document.addEventListener('DOMContentLoaded', () => {
  // Section 1 Waitlist Form Logic
  const waitlistForm = document.getElementById('waitlistForm');
  const emailInput = document.getElementById('emailInput');
  const submitBtn = document.getElementById('submitBtn');
  const toast = document.getElementById('toastNotification');
  const navWaitlistBtn = document.getElementById('navWaitlistBtn');

  if (waitlistForm) {
    waitlistForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const email = emailInput.value.trim();
      if (!validateEmail(email)) {
        showToast('Please enter a valid email address.', 'error');
        emailInput.focus();
        return;
      }

      // Button loading state
      const originalText = submitBtn.innerText;
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Joining...`;

      // Use FormData to send POST request
      const formData = new FormData();
      formData.append('email', email);

      fetch('api/subscribe.php', {
        method: 'POST',
        body: formData
      })
      .then(async response => {
        try {
          const data = await response.json();
          return { status: response.status, body: data };
        } catch (e) {
          // If response is not JSON (e.g. raw PHP code or HTML error page)
          const text = await response.text();
          console.error("Server returned non-JSON response:", text);
          throw new Error('Invalid server response format. Check console for details.');
        }
      })
      .then(({ status, body }) => {
        submitBtn.disabled = false;
        if (status === 200) {
          submitBtn.innerHTML = `✓ You're on the list!`;
          submitBtn.style.backgroundColor = '#22c55e';
          submitBtn.style.color = '#ffffff';

          showToast(`🎉 Thanks! We'll notify ${email} at launch.`);
          emailInput.value = '';

          setTimeout(() => {
            submitBtn.innerHTML = originalText;
            submitBtn.style.backgroundColor = '';
            submitBtn.style.color = '';
          }, 4000);
        } else {
          // Handle error (duplicate, validation, etc)
          submitBtn.innerHTML = originalText;
          showToast(body.message || 'An error occurred. Please try again.', 'error');
        }
      })
      .catch(error => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        if (error.message.includes('Invalid server response format')) {
           showToast('Server configuration error. Please try again later.', 'error');
        } else {
           showToast('A network error occurred. Please try again later.', 'error');
        }
      });
    });
  }

  if (navWaitlistBtn) {
    navWaitlistBtn.addEventListener('click', (e) => {
      e.preventDefault();
      emailInput.focus();
      emailInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  function showToast(message, type = 'success') {
    if (!toast) return;

    toast.innerText = message;
    toast.style.borderColor = type === 'error' ? '#ef4444' : '#cff034';
    toast.style.display = 'block';

    setTimeout(() => {
      toast.style.display = 'none';
    }, 4500);
  }

  // ==========================================================================
  // SECTION 2: THE FORMULA - HOVER 150px X 150px IMAGE POPUP LOGIC
  // ==========================================================================
  const nutrientItems = document.querySelectorAll('.sb-nutrient-item');
  const popupContainer = document.getElementById('hoverPopupContainer');
  const popupImage = document.getElementById('popupImage');
  const wrapper = document.querySelector('.sb-formula-content-wrapper');

  if (nutrientItems.length && popupContainer && popupImage && wrapper) {
    function setActiveItem(item) {
      // Remove active state from all items
      nutrientItems.forEach(el => el.classList.remove('active'));
      item.classList.add('active');

      // Get image from data-image attribute
      const imgSrc = item.getAttribute('data-image');
      if (imgSrc) {
        popupImage.src = imgSrc;
      }

      // Position the 150px x 150px popup image on desktop screens only
      if (window.innerWidth > 767) {
        const itemRect = item.getBoundingClientRect();
        const wrapperRect = wrapper.getBoundingClientRect();
        const relativeTop = (itemRect.top - wrapperRect.top) + (itemRect.height - 150) / 2;
        popupContainer.style.transform = `translateY(${relativeTop}px)`;
        popupContainer.classList.add('active');
      } else {
        popupContainer.style.transform = 'none';
        popupContainer.classList.remove('active');
      }
    }

    nutrientItems.forEach(item => {
      item.addEventListener('mouseenter', () => {
        setActiveItem(item);
      });
    });

    // Set initial default active item (e.g. Magnesium - index 2)
    const defaultActiveIndex = 2;
    if (nutrientItems[defaultActiveIndex]) {
      // Initial positioning after DOM layout settles
      setTimeout(() => {
        setActiveItem(nutrientItems[defaultActiveIndex]);
      }, 100);
    }

    // Reposition on window resize
    window.addEventListener('resize', () => {
      const currentActive = document.querySelector('.sb-nutrient-item.active') || nutrientItems[0];
      if (currentActive) {
        setActiveItem(currentActive);
      }
    });
  }

  // ==========================================================================
  // SECTION 5: FAQ ACCORDION INTERACTION LOGIC
  // ==========================================================================
  const faqItems = document.querySelectorAll('.sb-faq-item');
  faqItems.forEach(item => {
    const header = item.querySelector('.sb-faq-header');
    const icon = item.querySelector('.sb-faq-toggle-icon');

    if (header) {
      header.addEventListener('click', () => {
        const isActive = item.classList.contains('active');

        // Close other items
        faqItems.forEach(otherItem => {
          if (otherItem !== item) {
            otherItem.classList.remove('active');
            const otherIcon = otherItem.querySelector('.sb-faq-toggle-icon');
            if (otherIcon) otherIcon.innerText = '+';
          }
        });

        // Toggle clicked item
        if (isActive) {
          item.classList.remove('active');
          if (icon) icon.innerText = '+';
        } else {
          item.classList.add('active');
          if (icon) icon.innerText = '−';
        }
      });
    }
  });

  // ==========================================================================
  // SECTION 3: GALLERY SCROLL FADE ANIMATION & 3D INTERACTIVE TILT
  // ==========================================================================
  const galleryCards = document.querySelectorAll('.sb-gallery-card');
  if (galleryCards.length) {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -20px 0px'
    };

    const galleryObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const card = entry.target;
          const isRight = card.getAttribute('data-reveal') === 'right';
          const delay = isRight ? 160 : 0;

          setTimeout(() => {
            card.classList.add('revealed');
          }, delay);

          observer.unobserve(card);
        }
      });
    }, observerOptions);

    galleryCards.forEach(card => {
      // Check if already visible in viewport on page load
      const rect = card.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        const isRight = card.getAttribute('data-reveal') === 'right';
        setTimeout(() => {
          card.classList.add('revealed');
        }, isRight ? 160 : 0);
      } else {
        galleryObserver.observe(card);
      }

      // Interactive subtle 3D tilt on mouse hover
      card.addEventListener('mousemove', (e) => {
        if (!card.classList.contains('revealed')) return;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -5;
        const rotateY = ((x - centerX) / centerX) * 5;

        card.style.transform = `translateY(-8px) scale(1.02) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      });

      card.addEventListener('mouseleave', () => {
        if (card.classList.contains('revealed')) {
          card.style.transform = '';
        }
      });
    });
  }

  // ==========================================================================
  // SECTION 4: FOUR PILLARS HOVER & CLICK LOGIC
  // ==========================================================================
  const pillarCards = document.querySelectorAll('.sb-pillar-card');
  if (pillarCards.length) {
    pillarCards.forEach(card => {
      card.addEventListener('mouseenter', () => {
        pillarCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
      });
      card.addEventListener('mouseleave', () => {
        card.classList.remove('active');
      });
      card.addEventListener('click', () => {
        const isActive = card.classList.contains('active');
        pillarCards.forEach(c => c.classList.remove('active'));
        if (!isActive) {
          card.classList.add('active');
        }
      });
    });
  }
});

