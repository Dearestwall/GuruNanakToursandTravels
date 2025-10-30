/* ============================================
   GNTT Forms JavaScript
   Validation & Submission Handler
   ============================================ */

window.AppForms = (() => {
  'use strict';

  // ==========================================
  // Set error message for input
  // ==========================================
  function setError(input, message) {
    const formRow = input.closest('.form-row');
    if (!formRow) return;
    
    const errorEl = formRow.querySelector(`.error[data-for="${input.id}"]`);
    
    if (errorEl) {
      errorEl.textContent = message || '';
    }
    
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
    
    if (message) {
      input.classList.add('invalid');
    } else {
      input.classList.remove('invalid');
    }
  }

  // ==========================================
  // Validate form
  // ==========================================
  function validate(form) {
    let isValid = true;

    // Required fields
    form.querySelectorAll('[required]').forEach(input => {
      const value = input.value.trim();
      
      if (!value) {
        setError(input, 'This field is required');
        isValid = false;
      } else {
        setError(input, '');
      }
    });

    // Email validation
    const emailInput = form.querySelector('input[type="email"]');
    if (emailInput && emailInput.value) {
      const emailRegex = /^\S+@\S+\.\S+$/;
      if (!emailRegex.test(emailInput.value)) {
        setError(emailInput, 'Please enter a valid email address');
        isValid = false;
      }
    }

    // Phone validation
    const phoneInput = form.querySelector('#phone');
    if (phoneInput && phoneInput.value) {
      const phoneRegex = /^[0-9]{10,15}$/;
      if (!phoneRegex.test(phoneInput.value.replace(/[\s\-()]/g, ''))) {
        setError(phoneInput, 'Please enter 10-15 digits only');
        isValid = false;
      }
    }

    // Date logic validation
    const startDate = form.querySelector('#startDate');
    const endDate = form.querySelector('#endDate');
    
    if (startDate && endDate && startDate.value && endDate.value) {
      if (new Date(endDate.value) < new Date(startDate.value)) {
        setError(endDate, 'End date must be after start date');
        isValid = false;
      }
    }

    // Number validation
    const paxInput = form.querySelector('#pax');
    if (paxInput && paxInput.value) {
      const pax = parseInt(paxInput.value, 10);
      if (isNaN(pax) || pax < 1) {
        setError(paxInput, 'Please enter at least 1 passenger');
        isValid = false;
      }
    }

    return isValid;
  }

  // ==========================================
  // Serialize form data
  // ==========================================
  function serialize(form) {
    const formData = new FormData(form);
    const data = {};
    
    for (const [key, value] of formData.entries()) {
      data[key] = value;
    }
    
    return data;
  }

  // ==========================================
  // Fake submission (demo)
  // ==========================================
  async function fakeSubmit(payload) {
    console.log('📤 Form submission payload:', payload);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate success
    return { success: true, message: 'Form submitted successfully' };
  }

  // ==========================================
  // Show toast message
  // ==========================================
  function showToast(form, message, type = 'success') {
    const toast = form.querySelector('.toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.hidden = false;
    
    if (type === 'error') {
      toast.style.background = '#fee2e2';
      toast.style.color = '#b91c1c';
      toast.style.borderColor = '#fecaca';
    } else {
      toast.style.background = '#ecfdf5';
      toast.style.color = '#065f46';
      toast.style.borderColor = '#d1fae5';
    }
    
    setTimeout(() => {
      toast.hidden = true;
    }, 3000);
  }

  // ==========================================
  // Wire up booking form if present
  // ==========================================
  document.addEventListener('DOMContentLoaded', () => {
    const bookingForm = document.getElementById('bookingForm');
    
    if (bookingForm) {
      bookingForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Validate
        if (!validate(bookingForm)) {
          showToast(bookingForm, 'Please fix the errors above', 'error');
          return;
        }
        
        // Serialize
        const payload = serialize(bookingForm);
        
        // Submit
        try {
          const result = await fakeSubmit(payload);
          showToast(bookingForm, 'Thank you! We will contact you soon.', 'success');
          bookingForm.reset();
        } catch (error) {
          showToast(bookingForm, 'Something went wrong. Please try again.', 'error');
        }
      });
    }
  });

  // ==========================================
  // Public API
  // ==========================================
  return {
    validate,
    serialize,
    fakeSubmit,
    showToast
  };

})();
