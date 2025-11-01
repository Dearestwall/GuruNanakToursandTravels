/**
 * Handle customer review submission
 */
async function submitTestimonial(formData) {
  try {
    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        access_key: 'ad236cf0-3ad7-45a1-b50c-f410840cf9dd',
        subject: 'New Customer Review Submitted',
        from_name: formData.name,
        name: formData.name,
        email: formData.email,
        location: formData.location,
        rating: formData.rating,
        comment: formData.comment,
        tour_package: formData.tour_package,
        travel_date: formData.travel_date,
        message: `New review from ${formData.name} (${formData.rating} stars) for ${formData.tour_package}`
      })
    });

    if (response.ok) {
      showToast('✅ Thank you for your review!', 'success');
      document.getElementById('reviewForm')?.reset();
      return true;
    } else {
      throw new Error('Submission failed');
    }
  } catch (error) {
    console.error('Review submission error:', error);
    showToast('❌ Failed to submit review. Please try again.', 'error');
    return false;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const reviewForm = document.getElementById('reviewForm');
  if (reviewForm) {
    reviewForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(reviewForm);
      const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        location: formData.get('location'),
        rating: formData.get('rating'),
        comment: formData.get('comment'),
        tour_package: formData.get('tour_package'),
        travel_date: formData.get('travel_date')
      };
      await submitTestimonial(data);
    });
  }
});
